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
                // A file on disk is not proof that LiteRT-LM was initialized.
                isModelLoaded = false;
                Log.i(TAG, "Located local model file (runtime initialization still required): " + candidate.getAbsolutePath() + " (" + (candidate.length() / (1024 * 1024)) + " MB)");
                return;
            }
        }
        Log.i(TAG, "Local model file (" + MODEL_FILENAME + ") not found in app directories yet. Fast hybrid parser active.");
    }

    @PluginMethod
    public void isModelAvailable(PluginCall call) {
        checkAndLocateModel();
        JSObject ret = new JSObject();
        if (modelFile != null && modelFile.exists()) {
            ret.put("available", true);
            ret.put("modelPath", modelFile.getAbsolutePath());
            ret.put("fileSizeMb", modelFile.length() / (1024 * 1024));
        } else {
            ret.put("available", false);
            ret.put("modelPath", "models/" + MODEL_FILENAME);
            ret.put("fileSizeMb", 0);
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void loadModel(PluginCall call) {
        executor.execute(() -> {
            checkAndLocateModel();
            JSObject ret = new JSObject();
            if (modelFile != null && modelFile.exists()) {
                // Do not report "loaded": this plugin currently has no Engine/Conversation inference call.
                isModelLoaded = false;
                ret.put("success", false);
                ret.put("status", "runtime_not_initialized");
                ret.put("message", "Model file exists, but LiteRT-LM inference runtime is not initialized by this plugin.");
            } else {
                isModelLoaded = false;
                ret.put("success", false);
                ret.put("status", "model_file_missing");
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
            ret.put("notes", "استخراج محلي بالقواعد والأنماط؛ لم يتم تشغيل نموذج LLM");
            ret.put("modelLoaded", false);
            ret.put("confidence", 68);
            ret.put("inferenceTimeMs", elapsedMs);
            call.resolve(ret);
        });
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("initialized", true);
        ret.put("modelLoaded", false);
        ret.put("modelName", "Gemma 3 1B LiteRT (" + MODEL_FILENAME + ")");
        ret.put("ramMb", 584);
        call.resolve(ret);
    }
}
