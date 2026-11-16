import fs from 'fs/promises';
import path from 'path';
import { decryptBridgePayload, encryptBridgePayload } from './whatsappBridgeCrypto';

interface BridgeStateSnapshot {
  version: 1;
  savedAt: string;
  files: Record<string, string>;
}

const SNAPSHOT_CONTEXT = 'bridge-state-backup';
const SNAPSHOT_OBJECT = 'bridge-state-v1.enc';

function storageBaseUrl(supabaseUrl: string): string {
  return `${supabaseUrl.replace(/\/+$/, '')}/storage/v1`;
}

/**
 * Supabase publishable/secret API keys are not JWTs and must not be sent as
 * Authorization Bearer tokens. Legacy service_role keys are JWTs and still
 * require the Authorization header for Storage requests.
 */
export function storageAuthHeaders(apiKey: string): Record<string, string> {
  const headers: Record<string, string> = { apikey: apiKey };
  if (/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(apiKey)) {
    headers.Authorization = `Bearer ${apiKey}`;
  }
  return headers;
}

function safeRelativePath(value: string): boolean {
  if (!value || path.isAbsolute(value)) return false;
  const normalized = path.posix.normalize(value.replace(/\\/g, '/'));
  return normalized !== '..' && !normalized.startsWith('../') && !normalized.includes('/../');
}

async function collectFiles(root: string): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  const visit = async (directory: string): Promise<void> => {
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
        await visit(absolute);
      } else if (entry.isFile() && !entry.name.endsWith('.tmp')) {
        const data = await fs.readFile(absolute);
        files[relative] = data.toString('base64');
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
  // Check first: an existing private bucket should not be recreated on every startup.
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
  encryptionSecret: string;
  bucket?: string;
}): Promise<{ restored: boolean; fileCount: number }> {
  const bucket = options.bucket || 'orderi-bridge-state';
  const baseUrl = storageBaseUrl(options.supabaseUrl);
  const headers = storageAuthHeaders(options.supabaseSecretKey);
  await fs.mkdir(options.stateDir, { recursive: true, mode: 0o700 });
  await ensurePrivateBucket(baseUrl, headers, bucket);

  const localFiles = await collectFiles(options.stateDir);
  if (Object.keys(localFiles).length > 0) return { restored: false, fileCount: 0 };

  const response = await fetch(
    `${baseUrl}/object/authenticated/${encodeURIComponent(bucket)}/${SNAPSHOT_OBJECT}`,
    { headers }
  );
  if (response.status === 404) return { restored: false, fileCount: 0 };
  if (!response.ok) {
    throw new Error(`Supabase Bridge state restore failed (HTTP ${response.status}).`);
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
  encryptionSecret: string;
  bucket?: string;
  intervalMs?: number;
}): () => Promise<void> {
  const bucket = options.bucket || 'orderi-bridge-state';
  const baseUrl = storageBaseUrl(options.supabaseUrl);
  const headers = storageAuthHeaders(options.supabaseSecretKey);
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
      const response = await fetch(
        `${baseUrl}/object/${encodeURIComponent(bucket)}/${SNAPSHOT_OBJECT}`,
        {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'text/plain',
            'x-upsert': 'true',
          },
          body: envelope,
        }
      );
      if (!response.ok) {
        throw new Error(`Supabase Bridge state backup failed (HTTP ${response.status}).`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown backup error';
      console.error('[Orderi Bridge] Encrypted state backup failed:', message);
    } finally {
      running = false;
    }
  };

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
