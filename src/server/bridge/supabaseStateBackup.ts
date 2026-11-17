import fs from 'fs/promises';
import path from 'path';
import { decryptBridgePayload, encryptBridgePayload } from './whatsappBridgeCrypto';
import { withEncryptedAuthStateLock } from './encryptedAuthState';

interface BridgeStateSnapshot {
  version: 1;
  savedAt: string;
  files: Record<string, string>;
}

const SNAPSHOT_CONTEXT = 'bridge-state-backup';
const SNAPSHOT_OBJECT = 'bridge-state-v1.enc';

function storageBaseUrl(supabaseUrl: string): string {
  return supabaseUrl.replace(/\/+$/, '') + '/storage/v1';
}

/**
 * API/Data endpoints use the API key in apikey. Legacy JWT keys also need
 * their Bearer token; opaque sb_secret keys must not be treated as JWTs here.
 */
export function supabaseApiHeaders(apiKey: string): Record<string, string> {
  const headers: Record<string, string> = { apikey: apiKey };
  if (/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(apiKey)) {
    headers.Authorization = `Bearer ${apiKey}`;
  }
  return headers;
}

/**
 * Supabase Storage's backend StorageClient contract requires Authorization
 * as well as apikey. For opaque secret keys Storage accepts the same key in
 * this header; this mirrors the official @supabase/storage-js backend setup.
 */
/**
 * Storage validates Authorization as a JWT. New sb_secret keys are opaque API
 * keys, so pair them with the project's legacy service_role JWT for this header.
 * Older deployments that still use a legacy JWT as the API key remain supported.
 */
export function storageAuthHeaders(apiKey: string, serviceRoleJwt?: string): Record<string, string> {
  const bearerToken = serviceRoleJwt || (
    /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(apiKey) ? apiKey : ''
  );
  if (!/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(bearerToken)) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY must be a legacy service_role JWT when SUPABASE_SECRET_KEY is an sb_secret key.'
    );
  }
  return {
    apikey: apiKey,
    Authorization: `Bearer ${bearerToken}`,
  };
}

function safeRelativePath(value: string): boolean {
  if (!value || path.isAbsolute(value)) return false;
  const normalized = path.posix.normalize(value.replace(/\\/g, '/'));
  return normalized !== '..' && !normalized.startsWith('../') && !normalized.includes('/../');
}

async function collectFiles(root: string): Promise<Record<string, string>> {
  const files: Record<string, string> = {};

  // Auth writes are serialized against this lock. Capturing an auth directory
  // under the same lock prevents Supabase backups from mixing old and new
  // creds/key files while Baileys is updating its multi-file state.
  const visit = async (directory: string, insideAuthDirectory = false): Promise<void> => {
    let entries;
    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch (error: any) {
      if (error?.code === 'ENOENT') return;
      throw error;
    }

    for (const entry of entries) {
      const absolute = path.join(directory, entry.name);
      const relative = path.relative(root, absolute).split(path.sep).join('/');
      if (entry.isDirectory()) {
        if (entry.name === 'auth' && !insideAuthDirectory) {
          await withEncryptedAuthStateLock(path.dirname(absolute), () => visit(absolute, true));
        } else {
          await visit(absolute, insideAuthDirectory);
        }
      } else if (entry.isFile() && !entry.name.endsWith('.tmp')) {
        try {
          const data = await fs.readFile(absolute);
          files[relative] = data.toString('base64');
        } catch (error: any) {
          // Files can disappear during unrelated non-auth cleanup. Auth
          // directories are locked, so any auth read failure must abort rather
          // than upload a partial session snapshot.
          if (insideAuthDirectory || error?.code !== 'ENOENT') throw error;
        }
      }
    }
  };

  await visit(root);
  return files;
}

function safeStorageError(message: string): string {
  return message
    .replace(/Bearer\s+[^\s"'\x60]+/gi, 'Bearer [REDACTED]')
    .replace(/\b(?:sb_secret_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\b/g, '[REDACTED]')
    .slice(0, 1000);
}

async function ensurePrivateBucket(baseUrl: string, headers: Record<string, string>, bucket: string): Promise<void> {
  const check = await fetch(`${baseUrl}/bucket/${encodeURIComponent(bucket)}`, { headers });
  if (check.ok) return;
  if (check.status !== 404) {
    const message = safeStorageError(await check.text().catch(() => ''));
    throw new Error(
      `Supabase Storage bucket check failed (HTTP ${check.status})${message ? `: ${message}` : '.'}`
    );
  }

  const create = await fetch(`${baseUrl}/bucket`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: bucket, name: bucket, public: false }),
  });
  if (create.ok || create.status === 409) return;
  const message = safeStorageError(await create.text().catch(() => ''));
  if (/already exists|duplicate/i.test(message)) return;
  throw new Error(
    `Supabase Storage bucket creation failed (HTTP ${create.status})${message ? `: ${message}` : '.'}`
  );
}

/**
 * Encrypted off-instance backup for Render Free, whose local filesystem is ephemeral.
 * All files are encrypted as one AES-256-GCM envelope before leaving the service.
 */
export async function restoreBridgeStateFromSupabase(options: {
  stateDir: string;
  supabaseUrl: string;
  supabaseSecretKey: string;
  supabaseServiceRoleKey?: string;
  encryptionSecret: string;
  bucket?: string;
}): Promise<{ restored: boolean; fileCount: number }> {
  const bucket = options.bucket || 'orderi-bridge-state';
  const baseUrl = storageBaseUrl(options.supabaseUrl);
  const headers = storageAuthHeaders(options.supabaseSecretKey, options.supabaseServiceRoleKey);
  await fs.mkdir(options.stateDir, { recursive: true, mode: 0o700 });
  await ensurePrivateBucket(baseUrl, headers, bucket);

  const localFiles = await collectFiles(options.stateDir);
  if (Object.keys(localFiles).length > 0) return { restored: false, fileCount: 0 };

  const response = await fetch(
    `${baseUrl}/object/authenticated/${encodeURIComponent(bucket)}/${SNAPSHOT_OBJECT}`,
    { headers }
  );
  if (!response.ok) {
    const responseBody = await response.text().catch(() => '');
    let storageError: { code?: unknown; message?: unknown; statusCode?: unknown } | null = null;
    try {
      storageError = JSON.parse(responseBody) as {
        code?: unknown;
        message?: unknown;
        statusCode?: unknown;
      };
    } catch {
      // Non-JSON Storage errors are handled as genuine failures below.
    }

    const errorCode = typeof storageError?.code === 'string' ? storageError.code : '';
    const errorMessage = typeof storageError?.message === 'string' ? storageError.message : '';
    const errorStatus = String(storageError?.statusCode ?? '');
    const missingSnapshot =
      response.status === 404 ||
      errorCode === 'NoSuchKey' ||
      (errorStatus === '404' && /object not found/i.test(errorMessage));

    if (missingSnapshot) return { restored: false, fileCount: 0 };

    const message = safeStorageError(responseBody);
    throw new Error(
      `Supabase Bridge state restore failed (HTTP ${response.status})${message ? `: ${message}` : '.'}`
    );
  }

  const envelope = await response.text();
  const plaintext = decryptBridgePayload(envelope, options.encryptionSecret, SNAPSHOT_CONTEXT);
  const snapshot = JSON.parse(plaintext) as BridgeStateSnapshot;
  if (snapshot?.version !== 1 || !snapshot.files || typeof snapshot.files !== 'object') {
    throw new Error('Supabase Bridge state snapshot has an unsupported format.');
  }

  let restoredCount = 0;
  for (const [relative, encoded] of Object.entries(snapshot.files)) {
    if (!safeRelativePath(relative) || typeof encoded !== 'string') continue;
    const destination = path.resolve(options.stateDir, relative);
    const root = path.resolve(options.stateDir) + path.sep;
    if (!destination.startsWith(root)) continue;
    await fs.mkdir(path.dirname(destination), { recursive: true, mode: 0o700 });
    const temporary = `${destination}.restore.tmp`;
    await fs.writeFile(temporary, Buffer.from(encoded, 'base64'), { mode: 0o600 });
    await fs.rename(temporary, destination);
    restoredCount += 1;
  }
  return { restored: restoredCount > 0, fileCount: restoredCount };
}

export function startBridgeStateBackup(options: {
  stateDir: string;
  supabaseUrl: string;
  supabaseSecretKey: string;
  supabaseServiceRoleKey?: string;
  encryptionSecret: string;
  bucket?: string;
  intervalMs?: number;
}): () => Promise<void> {
  const bucket = options.bucket || 'orderi-bridge-state';
  const baseUrl = storageBaseUrl(options.supabaseUrl);
  const headers = storageAuthHeaders(options.supabaseSecretKey, options.supabaseServiceRoleKey);
  let running = false;
  let stopped = false;

  const backup = async (): Promise<void> => {
    if (running || stopped) return;
    running = true;
    try {
      const files = await collectFiles(options.stateDir);
      if (Object.keys(files).length === 0) return;
      const snapshot: BridgeStateSnapshot = {
        version: 1,
        savedAt: new Date().toISOString(),
        files,
      };
      const envelope = encryptBridgePayload(JSON.stringify(snapshot), options.encryptionSecret, SNAPSHOT_CONTEXT);
      const uploadUrl = `${baseUrl}/object/${encodeURIComponent(bucket)}/${SNAPSHOT_OBJECT}`;
      let uploaded = false;
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        let response: Response;
        try {
          response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
              ...headers,
              'Content-Type': 'text/plain',
              'x-upsert': 'true',
            },
            body: envelope,
            signal: AbortSignal.timeout(20_000),
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'network error';
          if (attempt === 3) {
            throw new Error(`Supabase Bridge state backup failed after 3 attempts: ${safeStorageError(message)}.`);
          }
          console.warn(`[Orderi Bridge] State backup network error; retry ${attempt + 1}/3.`);
          await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
          continue;
        }

        if (response.ok) {
          uploaded = true;
          break;
        }

        const retryable = response.status === 408 || response.status === 425 ||
          response.status === 429 || response.status >= 500;
        if (!retryable || attempt === 3) {
          throw new Error(`Supabase Bridge state backup failed (HTTP ${response.status}) after ${attempt} attempt(s).`);
        }
        console.warn(
          `[Orderi Bridge] State backup returned HTTP ${response.status}; retry ${attempt + 1}/3.`
        );
        await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
      }
      if (!uploaded) {
        throw new Error('Supabase Bridge state backup did not complete after retries.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown backup error';
      console.error('[Orderi Bridge] Encrypted state backup failed:', message);
    } finally {
      running = false;
    }
  };

  // Persist an initial snapshot immediately; subsequent updates use the interval.
  void backup();
  const timer = setInterval(() => void backup(), options.intervalMs || 15_000);
  timer.unref?.();

  return async () => {
    stopped = true;
    clearInterval(timer);
    while (running) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    stopped = false;
    await backup();
    stopped = true;
  };
}
