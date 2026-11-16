import test from 'node:test';
import assert from 'node:assert/strict';
import { storageAuthHeaders, supabaseApiHeaders } from '../src/server/bridge/supabaseStateBackup';

test('Storage requests include Authorization for opaque secret keys and apikey', () => {
  const key = 'sb_secret_test-key';
  assert.deepEqual(storageAuthHeaders(key), {
    apikey: key,
    Authorization: `Bearer ${key}`,
  });
});

test('Data API requests do not send opaque secret keys as Bearer JWTs', () => {
  const key = 'sb_secret_test-key';
  assert.deepEqual(supabaseApiHeaders(key), { apikey: key });
});

test('Legacy JWT keys retain Authorization for Storage and Data API', () => {
  const key = 'eyJhbGci.eyJzdWIi.signature';
  assert.deepEqual(supabaseApiHeaders(key), {
    apikey: key,
    Authorization: `Bearer ${key}`,
  });
  assert.deepEqual(storageAuthHeaders(key), {
    apikey: key,
    Authorization: `Bearer ${key}`,
  });
});
