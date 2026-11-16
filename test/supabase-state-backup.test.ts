import test from 'node:test';
import assert from 'node:assert/strict';
import { storageAuthHeaders, supabaseApiHeaders } from '../src/server/bridge/supabaseStateBackup';

const secretKey = 'sb_secret_test-key';
const serviceRoleJwt = 'eyJhbGci.eyJzdWIi.signature';

test('Storage uses opaque secret key as apikey and legacy service role JWT as Bearer', () => {
  assert.deepEqual(storageAuthHeaders(secretKey, serviceRoleJwt), {
    apikey: secretKey,
    Authorization: `Bearer ${serviceRoleJwt}`,
  });
});

test('Storage rejects opaque secret key without a legacy JWT', () => {
  assert.throws(
    () => storageAuthHeaders(secretKey),
    /SUPABASE_SERVICE_ROLE_KEY must be a legacy service_role JWT/
  );
});

test('Data API requests do not send opaque secret keys as Bearer JWTs', () => {
  assert.deepEqual(supabaseApiHeaders(secretKey), { apikey: secretKey });
});

test('Legacy JWT keys remain supported for Storage and Data API', () => {
  assert.deepEqual(supabaseApiHeaders(serviceRoleJwt), {
    apikey: serviceRoleJwt,
    Authorization: `Bearer ${serviceRoleJwt}`,
  });
  assert.deepEqual(storageAuthHeaders(serviceRoleJwt), {
    apikey: serviceRoleJwt,
    Authorization: `Bearer ${serviceRoleJwt}`,
  });
});
