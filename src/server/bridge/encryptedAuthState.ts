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
    await runExclusive(filePath, async () => {
      const serialized = JSON.stringify(data, adapters.BufferJSON.replacer);
      const encrypted = encryptBridgePayload(serialized, masterSecret, 'baileys-auth');
      const tmpPath = `${filePath}.${Date.now()}.tmp`;
      await fs.writeFile(tmpPath, encrypted, { encoding: 'utf8', mode: 0o600 });
      await fs.rename(tmpPath, filePath);
    });
  };

  const readEncryptedData = async (fileKey: string): Promise<any | null> => {
    const filePath = path.join(authFolder, fixFileName(fileKey));
    return runExclusive(filePath, async () => {
      try {
        const envelope = await fs.readFile(filePath, { encoding: 'utf8' });
        const json = decryptBridgePayload(envelope, masterSecret, 'baileys-auth');
        return JSON.parse(json, adapters.BufferJSON.reviver);
      } catch {
        return null;
      }
    });
  };

  const removeEncryptedData = async (fileKey: string): Promise<void> => {
    const filePath = path.join(authFolder, fixFileName(fileKey));
    await runExclusive(filePath, async () => {
      try {
        await fs.unlink(filePath);
      } catch {
        // Ignore if file already absent
      }
    });
  };

  const clearAll = async (): Promise<void> => {
    await runExclusive(authFolder, async () => {
      try {
        await fs.rm(authFolder, { recursive: true, force: true });
        await fs.mkdir(authFolder, { recursive: true, mode: 0o700 });
      } catch {
        // Best-effort wipe
      }
    });
  };

  const creds = (await readEncryptedData('creds')) || adapters.initAuthCreds();

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
