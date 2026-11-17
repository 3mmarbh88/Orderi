import fs from 'fs/promises';
import path from 'path';
import { decryptBridgePayload, encryptBridgePayload } from './whatsappBridgeCrypto';

export interface EncryptedAuthAdapters {
  initAuthCreds: () => any;
  BufferJSON: {
    replacer: (key: string, value: any) => any;
    reviver: (key: string, value: any) => any;
  };
  fromAppStateSyncKeyObject?: (val: any) => any;
}

const mutexQueues = new Map<string, Promise<unknown>>();

function runExclusive<T>(lockKey: string, task: () => Promise<T>): Promise<T> {
  const prev = mutexQueues.get(lockKey) || Promise.resolve();
  const next = prev.then(task, task);
  const cleanup = next.finally(() => {
    if (mutexQueues.get(lockKey) === cleanup) {
      mutexQueues.delete(lockKey);
    }
  });
  mutexQueues.set(lockKey, cleanup);
  return next;
}

/**
 * Runs work while no Baileys auth read/write/clear operation can mutate this
 * session's auth directory. State backup uses this to capture a consistent set
 * of auth files rather than a mixture of files from different write moments.
 */
export function withEncryptedAuthStateLock<T>(
  sessionDir: string,
  task: () => Promise<T>
): Promise<T> {
  return runExclusive(path.join(sessionDir, 'auth'), task);
}

function fixFileName(name: string): string {
  return `${name.replace(/\//g, '__').replace(/:/g, '-')}.enc`;
}

/**
 * Custom AES-256-GCM encrypted AuthenticationState adapter for Baileys.
 * Replaces plaintext multi-file auth JSON dumps with per-user encrypted envelopes.
 */
export async function useEncryptedAuthState(
  sessionDir: string,
  masterSecret: string,
  adapters: EncryptedAuthAdapters
): Promise<{
  state: {
    creds: any;
    keys: {
      get: (type: string, ids: string[]) => Promise<Record<string, any>>;
      set: (data: Record<string, Record<string, any>>) => Promise<void>;
      clear: () => Promise<void>;
    };
  };
  saveCreds: () => Promise<void>;
  clearAll: () => Promise<void>;
}> {
  const authFolder = path.join(sessionDir, 'auth');
  await fs.mkdir(authFolder, { recursive: true, mode: 0o700 });

  const writeEncryptedData = async (data: any, fileKey: string): Promise<void> => {
    const filePath = path.join(authFolder, fixFileName(fileKey));
    await withEncryptedAuthStateLock(sessionDir, () =>
      runExclusive(filePath, async () => {
        const serialized = JSON.stringify(data, adapters.BufferJSON.replacer);
        const encrypted = encryptBridgePayload(serialized, masterSecret, 'baileys-auth');
        const tmpPath = `${filePath}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
        try {
          await fs.writeFile(tmpPath, encrypted, { encoding: 'utf8', mode: 0o600 });
          await fs.rename(tmpPath, filePath);
        } finally {
          await fs.unlink(tmpPath).catch(() => {});
        }
      })
    );
  };

  const readEncryptedData = async (fileKey: string): Promise<any | null> => {
    const filePath = path.join(authFolder, fixFileName(fileKey));
    return withEncryptedAuthStateLock(sessionDir, () =>
      runExclusive(filePath, async () => {
        let envelope: string;
        try {
          envelope = await fs.readFile(filePath, { encoding: 'utf8' });
        } catch (error: any) {
          if (error?.code === 'ENOENT') return null;
          throw new Error(`Unable to read encrypted Baileys auth file ${path.basename(filePath)}: ${error?.code || 'READ_ERROR'}`);
        }

        try {
          const json = decryptBridgePayload(envelope, masterSecret, 'baileys-auth');
          return JSON.parse(json, adapters.BufferJSON.reviver);
        } catch {
          // Never silently replace an existing but unreadable credential/key file.
          throw new Error(`Unable to decrypt or parse encrypted Baileys auth file ${path.basename(filePath)}; preserved the existing session data.`);
        }
      })
    );
  };

  const removeEncryptedData = async (fileKey: string): Promise<void> => {
    const filePath = path.join(authFolder, fixFileName(fileKey));
    await withEncryptedAuthStateLock(sessionDir, () =>
      runExclusive(filePath, async () => {
        try {
          await fs.unlink(filePath);
        } catch (error: any) {
          if (error?.code !== 'ENOENT') throw error;
        }
      })
    );
  };

  const clearAll = async (): Promise<void> => {
    await withEncryptedAuthStateLock(sessionDir, async () => {
      await fs.rm(authFolder, { recursive: true, force: true });
      await fs.mkdir(authFolder, { recursive: true, mode: 0o700 });
    });
  };

  // Missing creds is a first-time session. Existing unreadable creds now fail
  // closed instead of generating a fresh identity over the preserved files.
  const storedCreds = await readEncryptedData('creds');
  const creds = storedCreds ?? adapters.initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type: string, ids: string[]) => {
          const data: Record<string, any> = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readEncryptedData(`${type}-${id}`);
              if (type === 'app-state-sync-key' && value && adapters.fromAppStateSyncKeyObject) {
                value = adapters.fromAppStateSyncKeyObject(value);
              }
              data[id] = value;
            })
          );
          return data;
        },
        set: async (data: Record<string, Record<string, any>>) => {
          const tasks: Promise<void>[] = [];
          for (const category of Object.keys(data)) {
            const entries = data[category];
            if (!entries) continue;
            for (const id of Object.keys(entries)) {
              const value = entries[id];
              const fileKey = `${category}-${id}`;
              tasks.push(value ? writeEncryptedData(value, fileKey) : removeEncryptedData(fileKey));
            }
          }
          await Promise.all(tasks);
        },
        clear: async () => {
          await clearAll();
        },
      },
    },
    saveCreds: async () => {
      await writeEncryptedData(creds, 'creds');
    },
    clearAll,
  };
}
