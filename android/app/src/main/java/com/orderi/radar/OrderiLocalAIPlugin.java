package com.orderi.radar;

import android.content.Context;
import android.os.SystemClock;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.google.ai.edge.litertlm.Backend;
import com.google.ai.edge.litertlm.Contents;
import com.google.ai.edge.litertlm.Conversation;
import com.google.ai.edge.litertlm.ConversationConfig;
import com.google.ai.edge.litertlm.Engine;
import com.google.ai.edge.litertlm.EngineConfig;

import org.json.JSONObject;

import java.io.File;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@CapacitorPlugin(name = "OrderiLocalAI")
public class OrderiLocalAIPlugin extends Plugin {
    private static final String TAG = "OrderiLocalAI";
    private static final String MODEL_FILENAME = "gemma3-1b-it-int4.litertlm";
    private static final String SYSTEM_INSTRUCTION = "أنت محلل طلبات توصيل في البحرين. استخرج فقط المعلومات الموجودة صراحة في رسالة واتساب. لا تخترع منطقة أو سعراً أو رقماً. أعد JSON صالحاً فقط بالحقول from وto وprice وphone وnotes وconfidence. إذا لم تعرف قيمة نصية أعد نصاً فارغاً، وإذا لم يذكر السعر أعد 0، واجعل confidence رقماً من 0 إلى 100.";

    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final Object modelLock = new Object();
    private boolean isModelLoaded = false;
    private boolean modelInitializationAttempted = false;
    private File modelFile = null;
    private Engine modelEngine = null;
    private Conversation modelConversation = null;

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
                // Model-file presence and initialized inference runtime are separate states.
                isModelLoaded = modelConversation != null && modelEngine != null && modelEngine.isInitialized();
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
            JSObject ret = new JSObject();
            try {
                modelInitializationAttempted = false;
                if (initializeModel()) {
                    ret.put("success", true);
                    ret.put("status", "loaded");
                    ret.put("modelPath", modelFile.getAbsolutePath());
                } else {
                    ret.put("success", false);
                    ret.put("status", "model_file_missing");
                    ret.put("message", "Model file gemma3-1b-it-int4.litertlm not found in app model directories.");
                }
            } catch (Exception e) {
                isModelLoaded = false;
                ret.put("success", false);
                ret.put("status", "load_failed");
                ret.put("message", e.getMessage() == null ? "LiteRT-LM initialization failed" : e.getMessage());
                Log.e(TAG, "Unable to initialize on-device model", e);
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

            boolean modelUsed = false;
            int confidence = 68;
            String notes = "استخراج محلي بالقواعد والأنماط؛ نموذج Gemma غير متاح على هذا الجهاز";
            try {
                if (initializeModel()) {
                    String prompt = "حلل رسالة واتساب التالية كطلب محتمل في البحرين. استخرج نقطة الاستلام from والوجهة to والسعر الصريح بالدينار price ورقم الهاتف الظاهر phone وملاحظات البضاعة notes. لا تخلط عدد الأشخاص أو الدوارات مع السعر. لا تستنتج سعراً غير مذكور. أعد JSON فقط.\n<WHATSAPP_MESSAGE>\n" + text + "\n</WHATSAPP_MESSAGE>";
                    String modelOutput = modelConversation.sendMessage(prompt).toString();
                    JSONObject parsed = extractJsonObject(modelOutput);
                    String modelFrom = parsed.optString("from", "").trim();
                    String modelTo = parsed.optString("to", "").trim();
                    if (!isUnknown(modelFrom)) fromArea = modelFrom;
                    if (!isUnknown(modelTo)) toArea = modelTo;
                    double modelPrice = parsed.optDouble("price", 0.0);
                    if (modelPrice > 0 && modelPrice <= 100) price = (float) modelPrice;
                    String modelPhone = parsed.optString("phone", "").replaceAll("[^0-9]", "");
                    if (modelPhone.length() >= 8) {
                        phone = modelPhone.startsWith("973") ? modelPhone : "973" + modelPhone;
                    }
                    String modelNotes = parsed.optString("notes", "").trim();
                    if (!isUnknown(modelNotes)) notes = modelNotes;
                    confidence = Math.max(0, Math.min(100, parsed.optInt("confidence", 75)));
                    modelUsed = true;
                    notes = (notes.isEmpty() ? "" : notes + " · ") + "تم التحليل فعلياً على الهاتف باستخدام Gemma / LiteRT-LM";
                }
            } catch (Exception e) {
                Log.w(TAG, "On-device inference failed; returning local rule-based extraction", e);
            }

            long elapsedMs = SystemClock.elapsedRealtime() - startMs;
            JSObject ret = new JSObject();
            ret.put("success", !fromArea.isEmpty() || !toArea.isEmpty() || price > 0);
            ret.put("from", fromArea);
            ret.put("to", toArea);
            ret.put("price", price);
            ret.put("phone", phone);
            ret.put("notes", notes);
            ret.put("modelLoaded", modelUsed && isModelLoaded);
            ret.put("confidence", confidence);
            ret.put("inferenceTimeMs", elapsedMs);
            call.resolve(ret);
        });
    }

    private boolean initializeModel() throws Exception {
        synchronized (modelLock) {
            if (modelConversation != null && modelEngine != null && modelEngine.isInitialized()) {
                isModelLoaded = true;
                return true;
            }
            checkAndLocateModel();
            if (modelFile == null || !modelFile.exists()) return false;
            if (modelInitializationAttempted) return false;
            modelInitializationAttempted = true;

            Engine candidate = new Engine(new EngineConfig(modelFile.getAbsolutePath(), new Backend.CPU(null, null)));
            try {
                candidate.initialize();
                Conversation candidateConversation = candidate.createConversation(
                        new ConversationConfig(Contents.Companion.of(SYSTEM_INSTRUCTION)));
                modelEngine = candidate;
                modelConversation = candidateConversation;
                isModelLoaded = true;
                Log.i(TAG, "LiteRT-LM model initialized for on-device order extraction.");
                return true;
            } catch (Exception e) {
                try { candidate.close(); } catch (Exception ignored) {}
                isModelLoaded = false;
                throw e;
            }
        }
    }

    private JSONObject extractJsonObject(String output) throws Exception {
        if (output == null) throw new IllegalArgumentException("Empty model response");
        int start = output.indexOf('{');
        int end = output.lastIndexOf('}');
        if (start < 0 || end <= start) throw new IllegalArgumentException("Model did not return valid JSON");
        return new JSONObject(output.substring(start, end + 1));
    }

    private boolean isUnknown(String value) {
        if (value == null) return true;
        String normalized = value.trim().toLowerCase();
        return normalized.isEmpty() || normalized.equals("null") || normalized.equals("unknown")
                || normalized.equals("غير محدد") || normalized.equals("غير معروف") || normalized.equals("لا يوجد");
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("initialized", modelEngine != null && modelEngine.isInitialized());
        ret.put("modelLoaded", isModelLoaded);
        ret.put("modelName", "Gemma 3 1B LiteRT (" + MODEL_FILENAME + ")");
        call.resolve(ret);
    }

    @Override
    protected void handleOnDestroy() {
        synchronized (modelLock) {
            try { if (modelConversation != null) modelConversation.close(); } catch (Exception ignored) {}
            try { if (modelEngine != null) modelEngine.close(); } catch (Exception ignored) {}
            modelConversation = null;
            modelEngine = null;
            isModelLoaded = false;
        }
        executor.shutdown();
        super.handleOnDestroy();
    }
}
