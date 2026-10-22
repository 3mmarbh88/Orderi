package com.orderi.radar;

import android.content.Context;
import android.os.SystemClock;
import android.util.Log;

import com.getcapacitor.ActivityCallback;
import com.getcapacitor.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@CapacitorPlugin(name = "OrderiLocalAI")
public class OrderiLocalAIPlugin extends Plugin {
    private static final String TAG = "OrderiLocalAI";
    private static final String MODEL_FILENAME = "gemma3-1b-it-int4.litertlm";

    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    // A model is ready only after LiteRT-LM initializes and completes real inference.
    private volatile boolean isModelLoaded = false;
    private volatile boolean inferenceReady = false;
    private volatile Object gemmaEngine = null;
    private File modelFile = null;

    @Override
    public void load() {
        super.load();
        checkAndLocateModel();
    }

    private void checkAndLocateModel() {
        Context ctx = getContext();
        if (ctx == null) return;

        // Candidate paths for on-device LiteRT-LM model
        File[] candidatePaths = new File[]{
                new File(ctx.getFilesDir(), "models/" + MODEL_FILENAME),
                new File(ctx.getFilesDir(), MODEL_FILENAME),
                new File(ctx.getExternalFilesDir(null), "models/" + MODEL_FILENAME),
                new File(ctx.getExternalFilesDir(null), MODEL_FILENAME)
        };

        for (File candidate : candidatePaths) {
            if (candidate.exists() && candidate.length() > 1024 * 1024) { // > 1MB
                modelFile = candidate;
                Log.i(TAG, "Located local AI model file: " + candidate.getAbsolutePath() + " (" + (candidate.length() / (1024 * 1024)) + " MB)");
                return;
            }
        }
        Log.i(TAG, "Local model file (" + MODEL_FILENAME + ") not found in app directories yet. Fast hybrid parser active.");
    }

    @PluginMethod
    public void importModel(PluginCall call) {
        android.content.Intent intent = new android.content.Intent(android.content.Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(android.content.Intent.CATEGORY_OPENABLE);
        intent.setType("*/*");
        startActivityForResult(call, intent, "handleModelImportResult");
    }

    @ActivityCallback
    private void handleModelImportResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result == null || result.getResultCode() != android.app.Activity.RESULT_OK
                || result.getData() == null || result.getData().getData() == null) {
            JSObject cancelled = new JSObject();
            cancelled.put("success", false);
            cancelled.put("cancelled", true);
            cancelled.put("message", "تم إلغاء اختيار الملف");
            call.resolve(cancelled);
            return;
        }
        Uri uri = result.getData().getData();
        executor.execute(() -> {
            File temp = null;
            try {
                String displayName = queryDisplayName(uri);
                if (displayName == null || !displayName.toLowerCase(java.util.Locale.ROOT).endsWith(".litertlm")) {
                    JSObject ret = new JSObject();
                    ret.put("success", false);
                    ret.put("message", "اختر ملف نموذج ينتهي امتداده بـ .litertlm");
                    call.resolve(ret);
                    return;
                }

                File modelsDir = new File(getContext().getFilesDir(), "models");
                if (!modelsDir.exists() && !modelsDir.mkdirs()) {
                    throw new java.io.IOException("Unable to create private model directory");
                }
                File target = new File(modelsDir, MODEL_FILENAME);
                temp = new File(modelsDir, MODEL_FILENAME + ".importing");
                long copied = 0L;
                try (InputStream input = getContext().getContentResolver().openInputStream(uri);
                     OutputStream output = new FileOutputStream(temp, false)) {
                    if (input == null) throw new java.io.IOException("Unable to open selected model file");
                    byte[] buffer = new byte[1024 * 1024];
                    int read;
                    while ((read = input.read(buffer)) != -1) {
                        copied += read;
                        if (copied > 2L * 1024L * 1024L * 1024L) {
                            throw new java.io.IOException("Model file exceeds 2 GB limit");
                        }
                        output.write(buffer, 0, read);
                    }
                    output.flush();
                }
                if (copied < 1024L * 1024L) throw new java.io.IOException("Selected model file is too small");
                if (target.exists() && !target.delete()) throw new java.io.IOException("Unable to replace existing model");
                if (!temp.renameTo(target)) throw new java.io.IOException("Unable to finalize imported model file");

                synchronized (this) {
                    if (gemmaEngine != null) {
                        try { gemmaEngine.getClass().getMethod("close").invoke(gemmaEngine); } catch (Exception ignored) {}
                    }
                    gemmaEngine = null;
                    isModelLoaded = false;
                    inferenceReady = false;
                    modelFile = target;
                }

                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("filePresent", true);
                ret.put("fileSizeMb", copied / (1024 * 1024));
                ret.put("modelPath", target.getAbsolutePath());
                ret.put("message", "تم استيراد ملف Gemma. اضغط «تحميل النموذج» لاختبار الاستدلال المحلي.");
                call.resolve(ret);
            } catch (Exception error) {
                if (temp != null && temp.exists()) temp.delete();
                Log.e(TAG, "Model import failed", error);
                JSObject ret = new JSObject();
                ret.put("success", false);
                ret.put("message", "فشل استيراد ملف النموذج: " + error.getMessage());
                call.resolve(ret);
            }
        });
    }

    private String queryDisplayName(Uri uri) {
        Cursor cursor = null;
        try {
            cursor = getContext().getContentResolver().query(uri,
                    new String[]{OpenableColumns.DISPLAY_NAME}, null, null, null);
            if (cursor != null && cursor.moveToFirst()) {
                int index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (index >= 0) return cursor.getString(index);
            }
        } catch (Exception error) {
            Log.w(TAG, "Could not read selected model filename", error);
        } finally {
            if (cursor != null) cursor.close();
        }
        return null;
    }

    @PluginMethod
    public void isModelAvailable(PluginCall call) {
        checkAndLocateModel();
        JSObject ret = new JSObject();
        boolean filePresent = modelFile != null && modelFile.exists();
        // A file on disk alone is not enough: the runtime must initialize successfully.
        ret.put("available", filePresent && inferenceReady && gemmaEngine != null);
        ret.put("filePresent", filePresent);
        ret.put("inferenceReady", inferenceReady && gemmaEngine != null);
        ret.put("status", !filePresent ? "model_file_missing" : (inferenceReady ? "ready" : (isModelLoaded ? "inference_not_verified" : "model_not_loaded")));
        ret.put("modelPath", filePresent ? modelFile.getAbsolutePath() : "models/" + MODEL_FILENAME);
        ret.put("fileSizeMb", filePresent ? modelFile.length() / (1024 * 1024) : 0);
        call.resolve(ret);
    }

    @PluginMethod
    public void loadModel(PluginCall call) {
        executor.execute(() -> {
            checkAndLocateModel();
            JSObject ret = new JSObject();
            boolean initialized = ensureGemmaEngine();
            boolean ready = initialized && runGemmaInference(
                    "اختبار جاهزية المحرك. أعد JSON فقط بالمفاتيح from وto وprice وphone وconfidence وpassengerRisk، واترك from وto فارغتين."
            ) != null;
            ret.put("success", ready);
            ret.put("status", ready ? "ready" : (modelFile == null ? "model_file_missing" : (initialized ? "inference_not_verified" : "runtime_initialization_failed")));
            ret.put("filePresent", modelFile != null && modelFile.exists());
            ret.put("inferenceReady", ready);
            ret.put("message", ready
                    ? "Gemma initialization and a real inference test succeeded."
                    : "Gemma is not ready. Confirm the imported model is compatible and inspect Android logs.");
            call.resolve(ret);
        });
    }

    /**
     * Initialize LiteRT-LM using reflection so this plugin can fail safely if a
     * device/runtime combination does not expose the expected API constructor.
     * The model path is user-provided app storage; no model is silently downloaded.
     */
    private synchronized boolean ensureGemmaEngine() {
        if (isModelLoaded && gemmaEngine != null) return true;
        checkAndLocateModel();
        if (modelFile == null || !modelFile.exists()) return false;
        Object engine = null;
        try {
            Class<?> configClass = Class.forName("com.google.ai.edge.litertlm.EngineConfig");
            Object config = createEngineConfig(configClass, modelFile.getAbsolutePath());
            if (config == null) throw new IllegalStateException("Unsupported LiteRT-LM EngineConfig constructor");

            Class<?> engineClass = Class.forName("com.google.ai.edge.litertlm.Engine");
            java.lang.reflect.Constructor<?> engineConstructor = null;
            for (java.lang.reflect.Constructor<?> candidate : engineClass.getConstructors()) {
                Class<?>[] params = candidate.getParameterTypes();
                if (params.length == 1 && params[0].isAssignableFrom(configClass)) {
                    engineConstructor = candidate;
                    break;
                }
            }
            if (engineConstructor == null) throw new IllegalStateException("LiteRT-LM Engine constructor not found");
            engine = engineConstructor.newInstance(config);
            engineClass.getMethod("initialize").invoke(engine);
            gemmaEngine = engine;
            isModelLoaded = true;
            Log.i(TAG, "Gemma/LiteRT-LM engine initialized successfully");
            return true;
        } catch (Throwable error) {
            isModelLoaded = false;
            gemmaEngine = null;
            if (engine != null) {
                try { engine.getClass().getMethod("close").invoke(engine); } catch (Exception ignored) {}
            }
            Log.e(TAG, "Gemma/LiteRT-LM initialization failed", error);
            return false;
        }
    }

    private Object createEngineConfig(Class<?> configClass, String path) throws Exception {
        try {
            return configClass.getConstructor(String.class).newInstance(path);
        } catch (NoSuchMethodException ignored) {
            for (java.lang.reflect.Constructor<?> candidate : configClass.getDeclaredConstructors()) {
                Class<?>[] params = candidate.getParameterTypes();
                if (params.length < 3 || params[0] != String.class
                        || !params[params.length - 1].getName().equals("kotlin.jvm.internal.DefaultConstructorMarker")
                        || params[params.length - 2] != int.class) continue;
                int originalCount = params.length - 2;
                Object[] args = new Object[params.length];
                args[0] = path;
                for (int i = 1; i < originalCount; i++) args[i] = defaultValue(params[i]);
                int defaultsMask = 0;
                for (int i = 1; i < originalCount && i < 32; i++) defaultsMask |= (1 << i);
                args[originalCount] = defaultsMask;
                args[originalCount + 1] = null;
                try {
                    candidate.setAccessible(true);
                    return candidate.newInstance(args);
                } catch (Exception error) {
                    Log.w(TAG, "Could not create LiteRT-LM config with Kotlin defaults", error);
                }
            }
            throw new NoSuchMethodException("No supported EngineConfig constructor");
        }
    }

    private Object defaultValue(Class<?> type) {
        if (!type.isPrimitive()) return null;
        if (type == boolean.class) return false;
        if (type == char.class) return (char) 0;
        if (type == byte.class) return (byte) 0;
        if (type == short.class) return (short) 0;
        if (type == int.class) return 0;
        if (type == long.class) return 0L;
        if (type == float.class) return 0f;
        if (type == double.class) return 0d;
        return null;
    }

    private JSONObject runGemmaInference(String rawText) {
        if (!ensureGemmaEngine()) return null;
        Object conversation = null;
        try {
            Object engine = gemmaEngine;
            conversation = engine.getClass().getMethod("createConversation").invoke(engine);
            String prompt = "أنت محلل رسائل طلبات التوصيل في البحرين. استخرج فقط JSON صالحاً دون Markdown بهذه المفاتيح: "
                    + "{\"from\":\"منطقة الاستلام\",\"to\":\"الوجهة\",\"price\":0,"
                    + "\"phone\":\"\",\"confidence\":0,\"passengerRisk\":\"goods_safe\"}. "
                    + "لا تخترع مناطق أو أسعاراً. إذا كانت المعلومة غير واضحة اتركها فارغة واجعل confidence منخفضاً. الرسالة: "
                    + rawText;
            Object response = conversation.getClass().getMethod("sendMessage", String.class).invoke(conversation, prompt);
            Object text = response.getClass().getMethod("getText").invoke(response);
            if (text == null) return null;
            String output = text.toString().trim().replaceAll("^\\x60{3}(?:json)?\\s*", "").replaceAll("\\s*\\x60{3}$", "");
            JSONObject parsed = new JSONObject(output);
            inferenceReady = true;
            parsed.put("inferenceReady", true);
            return parsed;
        } catch (Throwable error) {
            Log.e(TAG, "Gemma inference failed", error);
            return null;
        } finally {
            if (conversation != null) {
                try { conversation.getClass().getMethod("close").invoke(conversation); } catch (Exception ignored) {}
            }
        }
    }

    @PluginMethod
    public void parseOrder(PluginCall call) {
        String text = call.getString("text", "");
        if (text == null || text.trim().isEmpty()) {
            JSObject err = new JSObject();
            err.put("success", false);
            err.put("error", "Empty text");
            call.resolve(err);
            return;
        }

        executor.execute(() -> {
            long startMs = SystemClock.elapsedRealtime();

            // Prefer real on-device Gemma inference when the imported model can load.
            JSONObject gemma = runGemmaInference(text);
            if (gemma != null) {
                JSObject ret = new JSObject();
                String from = gemma.optString("from", "").trim();
                String to = gemma.optString("to", "").trim();
                float price = (float) gemma.optDouble("price", 0.0);
                float confidence = (float) gemma.optDouble("confidence", 0.0);
                ret.put("success", true);
                ret.put("inferenceReady", true);
                ret.put("from", from);
                ret.put("to", to);
                ret.put("price", Math.max(0.0f, price));
                ret.put("phone", gemma.optString("phone", ""));
                ret.put("confidence", Math.max(0.0f, Math.min(100.0f, confidence)));
                ret.put("passengerRisk", gemma.optString("passengerRisk", "goods_safe"));
                ret.put("notes", "تم التحليل باستدلال Gemma المحلي عبر LiteRT-LM");
                ret.put("inferenceTimeMs", SystemClock.elapsedRealtime() - startMs);
                call.resolve(ret);
                return;
            }

            // Runtime/model unavailable: use deterministic local rules and report that
            // no neural inference was performed.
            String fromArea = "";
            String toArea = "";
            float price = 0.0f;
            String phone = "";

            // 1. Phone extraction
            Pattern phonePattern = Pattern.compile("(?:\\+?973|00973)?[\\s-]*(3\\d{7}|6\\d{7}|17\\d{6})");
            Matcher phoneMatcher = phonePattern.matcher(text);
            if (phoneMatcher.find()) {
                phone = phoneMatcher.group(0).replaceAll("[^0-9]", "");
                if (phone.length() == 8) phone = "973" + phone;
            }

            // 2. Price extraction (BHD)
            Pattern pricePattern = Pattern.compile("(?i)(?:السعر|سعر|الأجر|الأجرة|المبلغ|الحساب)?\\s*[:=]?\\s*(?:بـ|ب)?\\s*(\\d+(?:\\.\\d+)?)\\s*(?:دينار|دنانير|د\\.ب|دب|bd|bhd)");
            Matcher priceMatcher = pricePattern.matcher(text);
            if (priceMatcher.find()) {
                try {
                    price = Float.parseFloat(priceMatcher.group(1));
                } catch (Exception ignored) {}
            }

            // 3. Location & Landmark extraction for Bahrain (including HERE WeGo places)
            String[][] landmarkMappings = new String[][]{
                    {"سيتي سنتر", "السيف"},
                    {"الافنيوز", "المنامة"},
                    {"الأفنيوز", "المنامة"},
                    {"مراسي جاليريا", "ديار المحرق"},
                    {"مراسي", "ديار المحرق"},
                    {"مجمع السيف", "السيف"},
                    {"سيف مول", "السيف"},
                    {"مودا مول", "المنامة"},
                    {"الليوان", "الهملة"},
                    {"مجمع الانماء", "الرفاع الشرقي"},
                    {"مجمع الإنماء", "الرفاع الشرقي"},
                    {"مجمع الرملي", "عالي"},
                    {"مجمع الدانة", "السنابس"},
                    {"مارينا مول", "المنامة"},
                    {"سار مول", "سار"},
                    {"مجمع سار", "سار"},
                    {"لولو الحد", "الحد"},
                    {"لولو الرفاع", "الرفاع الشرقي"},
                    {"لولو الدانة", "السنابس"},
                    {"لولو الزنج", "الزنج"},
                    {"رامز توبلي", "توبلي"},
                    {"رامز الرفاع", "الرفاع الشرقي"},
                    {"رامز المنامة", "المنامة"},
                    {"انصار جاليري", "توبلي"},
                    {"أنصار جاليري", "توبلي"},
                    {"سوق واقف", "مدينة حمد"},
                    {"سوق المنامة", "المنامة"},
                    {"سوق المحرق", "المحرق"},
                    {"سوق جدحفص", "جدحفص"},
                    {"باب البحرين", "المنامة"},
                    {"السلمانية", "السلمانية"},
                    {"مستشفى السلمانية", "السلمانية"},
                    {"المستشفى العسكري", "الرفاع الغربي"},
                    {"مستشفى الملك حمد", "البسيتين"},
                    {"جامعة البحرين", "الصخير"},
                    {"بوليتكنك", "مدينة عيسى"},
                    {"مطار البحرين", "المحرق"},
                    {"جسر الملك فهد", "الجسرة"},
                    {"حلبة البحرين", "الصخير"},
                    {"درة البحرين", "درة البحرين"},
                    {"جزر امواج", "جزر أمواج"},
                    {"امواج", "جزر أمواج"},
                    {"ديار المحرق", "ديار المحرق"},
                    {"شارع المطاعم سند", "سند"},
                    {"بوكوارة", "الرفاع الشرقي"}
            };

            for (String[] mapping : landmarkMappings) {
                if (text.contains(mapping[0])) {
                    if (fromArea.isEmpty()) {
                        fromArea = mapping[1];
                    } else if (toArea.isEmpty() && !mapping[1].equals(fromArea)) {
                        toArea = mapping[1];
                        break;
                    }
                }
            }

            String[] knownAreas = new String[]{
                    "المنامة", "المحرق", "الرفاع الشرقي", "الرفاع الغربي", "الرفاع", "مدينة عيسى", "مدينة حمد",
                    "سار", "البسيتين", "الحد", "الجفير", "أم الحصم",
                    "السيف", "السلمانية", "العدلية", "سند", "توبلي",
                    "عالي", "سترة", "جدعلي", "الدير", "قلالي",
                    "عراد", "الزنج", "بوري", "كرانة", "جنوسان",
                    "باربار", "الدراز", "بني جمرة", "البديع", "الجسرة",
                    "الهملة", "دمستان", "كرزكان", "المالكية", "صدد",
                    "شهركان", "دار كليب", "الزلاق", "جو", "عسكر",
                    "درة البحرين", "أمواج", "ديار المحرق", "مدينة سلمان",
                    "اللوزي", "وادي السيل", "الحنينية", "الساية"
            };

            for (String area : knownAreas) {
                if (text.contains(area)) {
                    if (fromArea.isEmpty()) {
                        fromArea = area;
                    } else if (toArea.isEmpty() && !area.equals(fromArea)) {
                        toArea = area;
                        break;
                    }
                }
            }

            long elapsedMs = SystemClock.elapsedRealtime() - startMs;

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("from", fromArea);
            ret.put("to", toArea);
            ret.put("price", price);
            ret.put("phone", phone);
            ret.put("notes", "استخراج محلي بالقواعد فقط؛ استدلال Gemma غير مفعّل");
            // Conservative rule-based confidence only; this is not model confidence.
            float ruleConfidence = (!fromArea.isEmpty() && !toArea.isEmpty() && !fromArea.equals(toArea)) ? 65.0f : 20.0f;
            ret.put("confidence", ruleConfidence);
            ret.put("inferenceReady", false);
            ret.put("inferenceTimeMs", elapsedMs);
            call.resolve(ret);
        });
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("initialized", true);
        ret.put("modelFilePresent", modelFile != null && modelFile.exists());
        ret.put("modelLoaded", isModelLoaded && gemmaEngine != null);
        ret.put("inferenceReady", inferenceReady && gemmaEngine != null);
        ret.put("modelName", "Gemma 3 1B INT4 / LiteRT-LM");
        ret.put("ramMb", 0);
        call.resolve(ret);
    }
}
