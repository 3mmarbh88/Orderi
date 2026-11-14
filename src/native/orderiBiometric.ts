import { registerPlugin } from '@capacitor/core';

export interface BiometricAvailabilityResult {
  available: boolean;
  hasEnrolledBiometrics: boolean;
  hardwarePresent: boolean;
  statusCode?: number;
  reasonCode?: string;
  reason?: string;
}

export interface BiometricAuthenticateOptions {
  title?: string;
  subtitle?: string;
  description?: string;
  negativeButtonText?: string;
}

export interface BiometricAuthenticateResult {
  verified: boolean;
  cancelled?: boolean;
  authenticationType?: number;
  errorCode?: number;
  reasonCode?: string;
  error?: string;
}

export interface OrderiBiometricPlugin {
  checkAvailability(): Promise<BiometricAvailabilityResult>;
  authenticate(options?: BiometricAuthenticateOptions): Promise<BiometricAuthenticateResult>;
}

const OrderiBiometric = registerPlugin<OrderiBiometricPlugin>('OrderiBiometric', {
  web: async () => ({
    async checkAvailability(): Promise<BiometricAvailabilityResult> {
      return {
        available: false,
        hasEnrolledBiometrics: false,
        hardwarePresent: false,
        reasonCode: 'web_runtime',
        reason: 'استخدم WebAuthn على المتصفح أو تطبيق أندرويد للتحقق بالبصمة',
      };
    },
    async authenticate(): Promise<BiometricAuthenticateResult> {
      return {
        verified: false,
        cancelled: false,
        reasonCode: 'web_runtime',
        error: 'المصادقة البيومترية عبر Android BiometricPrompt غير متاحة على الويب',
      };
    },
  }),
});

export default OrderiBiometric;
