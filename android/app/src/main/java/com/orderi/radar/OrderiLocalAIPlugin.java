package com.orderi.radar;

import android.content.Context;
import android.os.SystemClock;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
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
                isModelLoaded = true;
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
        // A file on disk alone cannot be used as evidence that model inference is ready.
        ret.put("available", false);
        ret.put("filePresent", filePresent);
        ret.put("inferenceReady", false);
        ret.put("status", filePresent ? "inference_not_integrated" : "model_file_missing");
        ret.put("modelPath", filePresent ? modelFile.getAbsolutePath() : "models/" + MODEL_FILENAME);
        ret.put("fileSizeMb", filePresent ? modelFile.length() / (1024 * 1024) : 0);
        call.resolve(ret);
    }

    @PluginMethod
    public void loadModel(PluginCall call) {
        executor.execute(() -> {
            checkAndLocateModel();
            JSObject ret = new JSObject();
            isModelLoaded = false;
            if (modelFile != null && modelFile.exists()) {
                ret.put("success", false);
                ret.put("status", "inference_not_integrated");
                ret.put("filePresent", true);
                ret.put("inferenceReady", false);
                ret.put("message", "The model file exists, but LiteRT-LM inference has not been integrated into this plugin.");
            } else {
                ret.put("success", false);
                ret.put("status", "model_file_missing");
                ret.put("filePresent", false);
                ret.put("inferenceReady", false);
                ret.put("message", "Model file gemma3-1b-it-int4.litertlm not found on device storage");
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

            // Extract using local semantic pattern matcher + LiteRT inference wrapper
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
        ret.put("modelLoaded", false);
        ret.put("inferenceReady", false);
        ret.put("modelName", "Gemma 3 1B LiteRT (inference not integrated)");
        ret.put("ramMb", 0);
        call.resolve(ret);
    }
}
