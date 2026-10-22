package com.orderi.radar;

import android.content.Context;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.SystemClock;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.ActivityResult;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.InputStream;
import java.io.FileOutputStream;
import org.json.JSONObject;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@CapacitorPlugin(name = "OrderiLocalAI")
public class OrderiLocalAIPlugin extends Plugin {
    private static final String TAG = "OrderiLocalAI";
    private static final String MODEL_FILENAME = "gemma3-1b-it-int4.litertlm";

    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    // Finding a model file is not the same as loading it into an inference runtime.
    // LiteRT-LM inference is not integrated in this plugin yet, so never report ready.
    private boolean isModelLoaded = false;
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
    public void isModelAvailable(PluginCall call) {
        checkAndLocateModel();
        JSObject ret = new JSObject();
        boolean filePresent = modelFile != null && modelFile.exists();
        boolean inferenceReady = filePresent && OrderiLiteRtRuntime.isLoaded(modelFile.getAbsolutePath());
        ret.put("available", inferenceReady);
        ret.put("filePresent", filePresent);
        ret.put("inferenceReady", inferenceReady);
        ret.put("status", inferenceReady ? "ready" : (filePresent ? "model_not_loaded" : "model_file_missing"));
        ret.put("modelPath", filePresent ? modelFile.getAbsolutePath() : "models/" + MODEL_FILENAME);
        ret.put("fileSizeMb", filePresent ? modelFile.length() / (1024 * 1024) : 0);
        call.resolve(ret);
    }

    @PluginMethod
    public void chooseModelFile(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("*/*");
        startActivityForResult(call, intent, "handleModelFileSelected");
    }

    @ActivityCallback
    private void handleModelFileSelected(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) {
            call.reject("لم يتم اختيار ملف النموذج");
            return;
        }
        Uri sourceUri = result.getData().getData();
        executor.execute(() -> {
            File destination = new File(getContext().getFilesDir(), "models/" + MODEL_FILENAME);
            File parent = destination.getParentFile();
            if (parent != null && !parent.exists() && !parent.mkdirs()) {
                call.reject("تعذر إنشاء مجلد النموذج داخل التطبيق");
                return;
            }
            try (InputStream input = getContext().getContentResolver().openInputStream(sourceUri);
                 FileOutputStream output = new FileOutputStream(destination)) {
                if (input == null) throw new IllegalStateException("تعذر قراءة الملف المحدد");
                byte[] buffer = new byte[1024 * 1024];
                int read;
                while ((read = input.read(buffer)) != -1) output.write(buffer, 0, read);
                output.getFD().sync();
                if (destination.length() < 100L * 1024L * 1024L) {
                    destination.delete();
                    throw new IllegalArgumentException("الملف أصغر من حجم نموذج Gemma المتوقع؛ اختر ملف .litertlm الصحيح.");
                }
                modelFile = destination;
                isModelLoaded = false;
                retestModelFileAndResolve(call, destination);
            } catch (Throwable error) {
                Log.e(TAG, "Could not import local Gemma model", error);
                destination.delete();
                call.reject("فشل استيراد ملف النموذج: " + error.getMessage());
            }
        });
    }

    private void retestModelFileAndResolve(PluginCall call, File destination) {
        JSObject ret = new JSObject();
        ret.put("success", true);
        ret.put("filePresent", true);
        ret.put("inferenceReady", false);
        ret.put("modelPath", destination.getAbsolutePath());
        ret.put("fileSizeMb", destination.length() / (1024 * 1024));
        ret.put("message", "تم استيراد الملف. اضغط فحص الجاهزية لتحميل المحرك واختبار النموذج.");
        call.resolve(ret);
    }

    @PluginMethod
    public void loadModel(PluginCall call) {
        executor.execute(() -> {
            checkAndLocateModel();
            JSObject ret = new JSObject();
            isModelLoaded = false;
            if (modelFile != null && modelFile.exists()) {
                try {
                    isModelLoaded = OrderiLiteRtRuntime.initialize(getContext(), modelFile.getAbsolutePath());
                    ret.put("success", isModelLoaded);
                    ret.put("status", isModelLoaded ? "ready" : "model_load_failed");
                    ret.put("filePresent", true);
                    ret.put("inferenceReady", isModelLoaded);
                    ret.put("message", isModelLoaded ? "LiteRT-LM model initialized successfully." : "LiteRT-LM did not initialize.");
                } catch (Throwable error) {
                    Log.e(TAG, "LiteRT-LM model initialization failed", error);
                    ret.put("success", false);
                    ret.put("status", "model_load_failed");
                    ret.put("filePresent", true);
                    ret.put("inferenceReady", false);
                    ret.put("message", "Model file exists, but LiteRT-LM initialization failed: " + error.getMessage());
                }
            } else {
                ret.put("success", false);
                ret.put("status", "model_file_missing");
                ret.put("filePresent", false);
                ret.put("inferenceReady", false);
                ret.put("message", "Model file gemma3-1b-it-int4.litertlm not found. Obtain it under the Gemma terms and place it in app-private files/models.");
            }
            call.resolve(ret);
        });
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

            // Prefer real on-device LiteRT-LM inference when a licensed model is present.
            // Parsing always falls back to the local deterministic rules if inference fails.
            if (modelFile != null && modelFile.exists()) {
                try {
                    String prompt = "أنت محلل طلبات توصيل في البحرين. استخرج فقط JSON صالحاً بالمفاتيح from وto وprice وphone وnotes وconfidence. " +
                            "from وto أسماء مناطق بحرينية؛ price رقم بالدينار البحريني أو 0 إذا لم يذكر. لا تخمن المناطق غير المذكورة. " +
                            "إذا لم يكن النص طلب توصيل واضحاً أعد from وto فارغين. النص: " + text;
                    String generated = OrderiLiteRtRuntime.generate(getContext(), modelFile.getAbsolutePath(), prompt);
                    Matcher jsonMatcher = Pattern.compile("\\{[\\s\\S]*\\}").matcher(generated == null ? "" : generated);
                    if (jsonMatcher.find()) {
                        JSONObject parsed = new JSONObject(jsonMatcher.group());
                        String from = parsed.optString("from", "").trim();
                        String to = parsed.optString("to", "").trim();
                        if (!from.isEmpty() && !to.isEmpty() && !from.equals(to)) {
                            JSObject result = new JSObject();
                            result.put("success", true);
                            result.put("from", from);
                            result.put("to", to);
                            result.put("price", Math.max(0, parsed.optDouble("price", 0)));
                            result.put("phone", parsed.optString("phone", ""));
                            result.put("notes", parsed.optString("notes", "تحليل Gemma محلي"));
                            result.put("confidence", Math.max(0, Math.min(100, parsed.optDouble("confidence", 75))));
                            result.put("inferenceReady", true);
                            result.put("modelLoaded", true);
                            result.put("inferenceTimeMs", SystemClock.elapsedRealtime() - startMs);
                            call.resolve(result);
                            return;
                        }
                    }
                } catch (Throwable error) {
                    Log.w(TAG, "Real LiteRT-LM inference failed; using local rule parser", error);
                }
            }

            // Deterministic local rules are the fallback; never label them as model inference.
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
            ret.put("modelLoaded", false);
            ret.put("inferenceTimeMs", elapsedMs);
            call.resolve(ret);
        });
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("initialized", true);
        ret.put("modelFilePresent", modelFile != null && modelFile.exists());
        ret.put("modelLoaded", modelFile != null && modelFile.exists() && OrderiLiteRtRuntime.isLoaded(modelFile.getAbsolutePath()));
        ret.put("inferenceReady", modelFile != null && modelFile.exists() && OrderiLiteRtRuntime.isLoaded(modelFile.getAbsolutePath()));
        ret.put("modelName", "Gemma 3 1B LiteRT-LM");
        ret.put("ramMb", 0);
        call.resolve(ret);
    }
}
