package com.orderi.radar;

import android.content.Context;
import androidx.annotation.NonNull;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.concurrent.Executor;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Native Android BiometricPrompt / Fingerprint authentication plugin for Orderi.
 * Never bypasses hardware biometric verification.
 */
@CapacitorPlugin(name = "OrderiBiometric")
public class OrderiBiometricPlugin extends Plugin {
    private static final int ALLOWED_BIOMETRIC_AUTHENTICATORS =
            BiometricManager.Authenticators.BIOMETRIC_STRONG
                    | BiometricManager.Authenticators.BIOMETRIC_WEAK;

    private JSObject buildAvailabilityPayload(Context context) {
        JSObject ret = new JSObject();
        if (context == null) {
            ret.put("available", false);
            ret.put("hasEnrolledBiometrics", false);
            ret.put("hardwarePresent", false);
            ret.put("statusCode", -1);
            ret.put("reasonCode", "context_unavailable");
            ret.put("reason", "تعذر الوصول إلى سياق نظام أندرويد للتحقق من مستشعر البصمة.");
            return ret;
        }

        BiometricManager biometricManager = BiometricManager.from(context);
        int status = biometricManager.canAuthenticate(ALLOWED_BIOMETRIC_AUTHENTICATORS);

        boolean available = status == BiometricManager.BIOMETRIC_SUCCESS;
        boolean hardwarePresent =
                status != BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE
                        && status != BiometricManager.BIOMETRIC_ERROR_UNSUPPORTED;

        String reasonCode;
        String reason;
        switch (status) {
            case BiometricManager.BIOMETRIC_SUCCESS:
                reasonCode = "ok";
                reason = "مستشعر بصمة الإصبع جاهز ومتاح للتحقق";
                break;
            case BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED:
                reasonCode = "none_enrolled";
                reason = "لم يتم تسجيل أي بصمة إصبع في إعدادات الهاتف. يرجى إضافة بصمة في إعدادات الجهاز أو الدخول بكلمة المرور.";
                break;
            case BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE:
                reasonCode = "no_hardware";
                reason = "هذا الجهاز لا يحتوي على مستشعر بصمة إصبع.";
                break;
            case BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE:
                reasonCode = "hw_unavailable";
                reason = "مستشعر البصمة غير متاح حالياً. حاول مرة أخرى أو استخدم كلمة المرور.";
                break;
            case BiometricManager.BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED:
                reasonCode = "security_update_required";
                reason = "يتطلب مستشعر البصمة تحديثاً أمنياً للنظام قبل الاستخدام.";
                break;
            case BiometricManager.BIOMETRIC_ERROR_UNSUPPORTED:
                reasonCode = "unsupported";
                reason = "المصادقة البيومترية غير مدعومة على هذا الإصدار.";
                break;
            default:
                reasonCode = "unknown";
                reason = "مستشعر البصمة غير متاح حالياً.";
                break;
        }

        ret.put("available", available);
        ret.put("hasEnrolledBiometrics", available);
        ret.put("hardwarePresent", hardwarePresent);
        ret.put("statusCode", status);
        ret.put("reasonCode", reasonCode);
        ret.put("reason", reason);
        return ret;
    }

    @PluginMethod
    public void checkAvailability(PluginCall call) {
        call.resolve(buildAvailabilityPayload(getContext()));
    }

    @PluginMethod
    public void authenticate(PluginCall call) {
        Context context = getContext();
        JSObject availability = buildAvailabilityPayload(context);
        if (!availability.optBoolean("available", false)) {
            JSObject fail = new JSObject();
            fail.put("verified", false);
            fail.put("cancelled", false);
            fail.put("errorCode", availability.optInt("statusCode", -1));
            fail.put("reasonCode", availability.optString("reasonCode", "not_available"));
            fail.put("error", availability.optString("reason", "مستشعر البصمة غير متاح."));
            call.resolve(fail);
            return;
        }

        if (!(getActivity() instanceof FragmentActivity)) {
            JSObject fail = new JSObject();
            fail.put("verified", false);
            fail.put("cancelled", false);
            fail.put("errorCode", -1);
            fail.put("reasonCode", "activity_unavailable");
            fail.put("error", "تعذر فتح نافذة التحقق من البصمة في الشاشة الحالية.");
            call.resolve(fail);
            return;
        }

        final FragmentActivity activity = (FragmentActivity) getActivity();
        final String title = call.getString("title", "التحقق ببصمة الإصبع — Orderi");
        final String subtitle = call.getString("subtitle", "ضع إصبعك على المستشعر لتأكيد الهوية");
        final String description = call.getString("description", "لن يتم فتح الحساب إلا بعد تطابق بصمتك المسجلة على الهاتف.");
        final String negativeButtonText = call.getString("negativeButtonText", "إلغاء");

        final AtomicBoolean resolved = new AtomicBoolean(false);

        activity.runOnUiThread(() -> {
            try {
                Executor executor = ContextCompat.getMainExecutor(activity);
                BiometricPrompt biometricPrompt = new BiometricPrompt(
                        activity,
                        executor,
                        new BiometricPrompt.AuthenticationCallback() {
                            @Override
                            public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                                super.onAuthenticationSucceeded(result);
                                if (resolved.compareAndSet(false, true)) {
                                    JSObject res = new JSObject();
                                    res.put("verified", true);
                                    res.put("cancelled", false);
                                    res.put("authenticationType", result.getAuthenticationType());
                                    res.put("errorCode", 0);
                                    res.put("reasonCode", "ok");
                                    call.resolve(res);
                                }
                            }

                            @Override
                            public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                                super.onAuthenticationError(errorCode, errString);
                                if (resolved.compareAndSet(false, true)) {
                                    boolean cancelled =
                                            errorCode == BiometricPrompt.ERROR_USER_CANCELED
                                                    || errorCode == BiometricPrompt.ERROR_NEGATIVE_BUTTON
                                                    || errorCode == BiometricPrompt.ERROR_CANCELED;
                                    String msg;
                                    if (cancelled) {
                                        msg = "تم إلغاء التحقق من بصمة الإصبع.";
                                    } else if (errorCode == BiometricPrompt.ERROR_LOCKOUT
                                            || errorCode == BiometricPrompt.ERROR_LOCKOUT_PERMANENT) {
                                        msg = "تم قفل مستشعر البصمة مؤقتاً لكثرة المحاولات الخاطئة. استخدم كلمة المرور أو أعد المحاولة لاحقاً.";
                                    } else if (errorCode == BiometricPrompt.ERROR_NO_BIOMETRICS) {
                                        msg = "لا توجد بصمة إصبع مسجلة في إعدادات هذا الهاتف.";
                                    } else {
                                        msg = "فشل التحقق من بصمة الإصبع: " + errString;
                                    }

                                    JSObject fail = new JSObject();
                                    fail.put("verified", false);
                                    fail.put("cancelled", cancelled);
                                    fail.put("errorCode", errorCode);
                                    fail.put("reasonCode", cancelled ? "user_cancelled" : "biometric_error");
                                    fail.put("error", msg);
                                    call.resolve(fail);
                                }
                            }

                            @Override
                            public void onAuthenticationFailed() {
                                super.onAuthenticationFailed();
                                // Intentionally keep prompt active for system-managed retry; never resolve verified=true here.
                            }
                        }
                );

                BiometricPrompt.PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
                        .setTitle(title)
                        .setSubtitle(subtitle)
                        .setDescription(description)
                        .setNegativeButtonText(negativeButtonText)
                        .setConfirmationRequired(true)
                        .setAllowedAuthenticators(ALLOWED_BIOMETRIC_AUTHENTICATORS)
                        .build();

                biometricPrompt.authenticate(promptInfo);
            } catch (Exception ex) {
                if (resolved.compareAndSet(false, true)) {
                    JSObject fail = new JSObject();
                    fail.put("verified", false);
                    fail.put("cancelled", false);
                    fail.put("errorCode", -1);
                    fail.put("reasonCode", "prompt_exception");
                    fail.put("error", "تعذر تشغيل نافذة بصمة الإصبع في الجهاز: " + ex.getMessage());
                    call.resolve(fail);
                }
            }
        });
    }
}
