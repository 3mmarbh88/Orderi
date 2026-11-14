import assert from 'node:assert/strict';
import {
  authenticateWithBiometrics,
  checkRealFingerprintAvailability,
  getBiometricBinding,
  saveBiometricBinding,
  clearBiometricBinding,
  logout,
  setCurrentUser,
  verifyWebAuthnGetResponse,
  BiometricRuntimeDeps,
} from '../src/utils/authManager';

const memoryStore = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => memoryStore.get(k) ?? null,
  setItem: (k: string, v: string) => {
    memoryStore.set(k, String(v));
  },
  removeItem: (k: string) => {
    memoryStore.delete(k);
  },
  clear: () => {
    memoryStore.clear();
  },
};

(globalThis as any).window = {
  localStorage: (globalThis as any).localStorage,
  location: {
    origin: 'https://orderi.app',
    hostname: 'orderi.app',
  },
};

function toBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function makeAuthData(flagsByte: number): ArrayBuffer {
  const buf = new Uint8Array(37);
  buf[32] = flagsByte;
  return buf.buffer;
}

function makeClientData(type: string, challenge: Uint8Array, origin: string): ArrayBuffer {
  return new TextEncoder().encode(
    JSON.stringify({
      type,
      challenge: toBase64Url(challenge),
      origin,
    }),
  ).buffer as ArrayBuffer;
}

console.log('🧪 Starting Real Fingerprint Biometric Auth Test Suite');

// 1. Fails closed when no user has ever signed in on device
memoryStore.clear();
setCurrentUser(null);
const noUserRes = await authenticateWithBiometrics('fingerprint', {
  isNativePlatform: () => true,
  nativeCheckAvailability: async () => ({ available: true, hasEnrolledBiometrics: true }),
  nativeAuthenticate: async () => ({ verified: true }),
});
assert.equal(noUserRes.success, false);
console.log('✅ PASS: Rejects fingerprint login when no account is bound to the device');

// 2. Native Android: rejects when no fingerprint is enrolled on OS
setCurrentUser({
  id: 'u-1',
  name: 'كابتن علي',
  phone: '33112233',
  vehicleType: 'car',
  isActivated: true,
  biometricsEnabled: true,
  createdAt: new Date().toISOString(),
});

const noEnrolledAndroid = await authenticateWithBiometrics('fingerprint', {
  isNativePlatform: () => true,
  nativeCheckAvailability: async () => ({
    available: false,
    hasEnrolledBiometrics: false,
    reasonCode: 'none_enrolled',
    reason: 'لم يتم تسجيل أي بصمة إصبع في إعدادات الهاتف.',
  }),
  nativeAuthenticate: async () => {
    throw new Error('should not invoke authenticate when unavailable');
  },
});
assert.equal(noEnrolledAndroid.success, false);
console.log('✅ PASS: Native Android fails closed when OS reports none_enrolled');

// 3. Native Android: rejects when user cancels or sensor fails (NEVER bypasses!)
const cancelledAndroid = await authenticateWithBiometrics('fingerprint', {
  isNativePlatform: () => true,
  nativeCheckAvailability: async () => ({ available: true, hasEnrolledBiometrics: true }),
  nativeAuthenticate: async () => ({
    verified: false,
    cancelled: true,
    error: 'تم إلغاء التحقق من بصمة الإصبع.',
  }),
});
assert.equal(cancelledAndroid.success, false);
assert.equal(cancelledAndroid.cancelled, true);

const errorAndroid = await authenticateWithBiometrics('fingerprint', {
  isNativePlatform: () => true,
  nativeCheckAvailability: async () => ({ available: true, hasEnrolledBiometrics: true }),
  nativeAuthenticate: async () => {
    throw new Error('sensor crash');
  },
});
assert.equal(errorAndroid.success, false);
console.log('✅ PASS: Native Android fails closed on cancel or hardware error (no bypass)');

// 4. Native Android: succeeds ONLY when BiometricPrompt returns verified=true
const okAndroid = await authenticateWithBiometrics('fingerprint', {
  isNativePlatform: () => true,
  nativeCheckAvailability: async () => ({ available: true, hasEnrolledBiometrics: true }),
  nativeAuthenticate: async () => ({ verified: true }),
});
assert.equal(okAndroid.success, true);
assert.equal(okAndroid.user?.phone, '33112233');
assert.equal(getBiometricBinding()?.platform, 'android-biometric-prompt');
console.log('✅ PASS: Native Android succeeds strictly after hardware BiometricPrompt verification');

// 5. WebAuthn: fails closed when platform authenticator is NOT available
clearBiometricBinding();
const webUnavailable = await checkRealFingerprintAvailability({
  isNativePlatform: () => false,
  credentialsGet: async () => null,
  isPlatformAuthenticatorAvailable: async () => false,
});
assert.equal(webUnavailable.available, false);

const webUnavailableAuth = await authenticateWithBiometrics('fingerprint', {
  isNativePlatform: () => false,
  credentialsGet: async () => null,
  isPlatformAuthenticatorAvailable: async () => false,
});
assert.equal(webUnavailableAuth.success, false);
console.log('✅ PASS: Web browser fails closed when no real platform biometric authenticator exists');

// 6. WebAuthn: first-time enrollment requires userVerification='required', refuses cancel, stores credentialId on real match
const fixedChallenge = new Uint8Array(32).fill(7);
const webBaseDeps: BiometricRuntimeDeps = {
  isNativePlatform: () => false,
  isPlatformAuthenticatorAvailable: async () => true,
  getRandomValues: (arr) => {
    arr.set(fixedChallenge);
    return arr;
  },
  origin: 'https://orderi.app',
  rpId: 'orderi.app',
  credentialsGet: async () => null,
  credentialsCreate: async () => {
    const err = new Error('User cancelled');
    err.name = 'NotAllowedError';
    throw err;
  },
};

const createCancelledRes = await authenticateWithBiometrics('fingerprint', webBaseDeps);
assert.equal(createCancelledRes.success, false);
assert.equal(getBiometricBinding()?.credentialId, undefined);

const createdCredId = toBase64Url(new Uint8Array([10, 20, 30, 40, 50, 60]));
const createSuccessRes = await authenticateWithBiometrics('fingerprint', {
  ...webBaseDeps,
  credentialsCreate: async (opts) => {
    assert.equal(opts.publicKey?.authenticatorSelection?.userVerification, 'required');
    assert.equal(opts.publicKey?.authenticatorSelection?.authenticatorAttachment, 'platform');
    return {
      id: createdCredId,
      response: {
        clientDataJSON: makeClientData('webauthn.create', fixedChallenge, 'https://orderi.app'),
        attestationObject: new Uint8Array([1, 2, 3]).buffer,
        getAuthenticatorData: () => makeAuthData(0x05), // UP + UV
      },
    };
  },
});
assert.equal(createSuccessRes.success, true);
assert.equal(getBiometricBinding()?.credentialId, createdCredId);
console.log('✅ PASS: WebAuthn enrollment rejects cancellation and records credentialId only on real UV verification');

// 7. WebAuthn: rejects missing UV flag (0x01 only without 0x04), wrong challenge, or wrong credentialId
const noUvAssertion = verifyWebAuthnGetResponse({
  credential: {
    id: createdCredId,
    response: {
      clientDataJSON: makeClientData('webauthn.get', fixedChallenge, 'https://orderi.app'),
      authenticatorData: makeAuthData(0x01), // UP without UV!
      signature: new Uint8Array([9, 9]).buffer,
    },
  },
  expectedCredentialId: createdCredId,
  expectedChallenge: fixedChallenge,
  expectedOrigin: 'https://orderi.app',
});
assert.equal(noUvAssertion.verified, false);

const badChallengeAssertion = verifyWebAuthnGetResponse({
  credential: {
    id: createdCredId,
    response: {
      clientDataJSON: makeClientData('webauthn.get', new Uint8Array(32).fill(99), 'https://orderi.app'),
      authenticatorData: makeAuthData(0x05),
      signature: new Uint8Array([9, 9]).buffer,
    },
  },
  expectedCredentialId: createdCredId,
  expectedChallenge: fixedChallenge,
  expectedOrigin: 'https://orderi.app',
});
assert.equal(badChallengeAssertion.verified, false);
console.log('✅ PASS: Rejects WebAuthn assertions missing UV flag or with mismatched challenge');

// 8. Logout clears session but retains biometric binding, and subsequent WebAuthn get requires real assertion
await logout();
assert.ok(getBiometricBinding()?.credentialId === createdCredId);

const blockedAfterLogout = await authenticateWithBiometrics('fingerprint', {
  ...webBaseDeps,
  credentialsGet: async () => {
    const err = new Error('Aborted');
    err.name = 'NotAllowedError';
    throw err;
  },
});
assert.equal(blockedAfterLogout.success, false);

const realGetAfterLogout = await authenticateWithBiometrics('fingerprint', {
  ...webBaseDeps,
  credentialsGet: async (opts) => {
    assert.equal(opts.publicKey?.userVerification, 'required');
    assert.equal(opts.publicKey?.allowCredentials?.length, 1);
    return {
      id: createdCredId,
      response: {
        clientDataJSON: makeClientData('webauthn.get', fixedChallenge, 'https://orderi.app'),
        authenticatorData: makeAuthData(0x05), // UP + UV
        signature: new Uint8Array([1, 2, 3, 4]).buffer,
      },
    };
  },
});
assert.equal(realGetAfterLogout.success, true);
assert.equal(realGetAfterLogout.user?.phone, '33112233');
console.log('✅ PASS: Logout preserves binding; re-login requires genuine WebAuthn UV assertion');

// 9. Disabled biometrics blocks login even when sensor succeeds
saveBiometricBinding({
  userId: 'u-1',
  name: 'كابتن علي',
  phone: '33112233',
  vehicleType: 'car',
  isActivated: false,
  platform: 'android-biometric-prompt',
  enrolledAt: new Date().toISOString(),
});
setCurrentUser({
  id: 'u-1',
  name: 'كابتن علي',
  phone: '33112233',
  vehicleType: 'car',
  isActivated: false,
  biometricsEnabled: false,
  createdAt: new Date().toISOString(),
});
const disabledRes = await authenticateWithBiometrics('fingerprint', {
  isNativePlatform: () => true,
  nativeCheckAvailability: async () => ({ available: true }),
  nativeAuthenticate: async () => ({ verified: true }),
});
assert.equal(disabledRes.success, false);
console.log('✅ PASS: Respects disabled biometrics preference');

console.log('🎉 All Real Fingerprint Biometric Auth tests passed!');
