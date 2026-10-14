
package com.orderi.radar;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.util.Log;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.google.ai.edge.litertlm.Backend;
import com.google.ai.edge.litertlm.Content;
import com.google.ai.edge.litertlm.Contents;
import com.google.ai.edge.litertlm.Conversation;
import com.google.ai.edge.litertlm.ConversationConfig;
import com.google.ai.edge.litertlm.Engine;
import com.google.ai.edge.litertlm.EngineConfig;
import com.google.ai.edge.litertlm.Message;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "OrderiLocalAI")
public class OrderiLocalAIPlugin extends Plugin {

    private static final String TAG = "OrderiLocalAI";
    private static final long MODEL_BYTES = 584417280L;
    private static final String MODEL_FILE =
            "gemma3-1b-it-int4.litertlm";

    private final ExecutorService worker =
            Executors.newSingleThreadExecutor();

    private volatile Engine engine;

    private File modelFile() {
        File directory = new File(
                getContext().getFilesDir(),
                "models"
        );

        return new File(directory, MODEL_FILE);
    }

    private void ensureBundledModelAvailable() throws java.io.IOException {
        File target = modelFile();
        if (target.isFile() && target.length() == MODEL_BYTES) {
            return;
        }

        File directory = target.getParentFile();
        if (directory == null) {
            throw new java.io.IOException("Invalid model directory");
        }
        if (!directory.exists() && !directory.mkdirs()) {
            throw new java.io.IOException("Cannot create model directory");
        }

        File temp = new File(directory, MODEL_FILE + ".tmp");
        long total = 0;

        try (
            InputStream in = getContext().getAssets().open(MODEL_FILE);
            FileOutputStream out = new FileOutputStream(temp)
        ) {
            byte[] buffer = new byte[1024 * 1024];
            int count;
            while ((count = in.read(buffer)) != -1) {
                out.write(buffer, 0, count);
                total += count;
            }
            out.getFD().sync();
        } catch (java.io.IOException e) {
            temp.delete();
            throw e;
        }

        if (total != MODEL_BYTES) {
            temp.delete();
            throw new java.io.IOException("Bundled model size mismatch: " + total);
        }

        if (target.exists() && !target.delete()) {
            temp.delete();
            throw new java.io.IOException("Cannot replace incomplete model");
        }
        if (!temp.renameTo(target)) {
            temp.delete();
            throw new java.io.IOException("Cannot finalize model copy");
        }

        Log.i(TAG, "Bundled model copied; bytes=" + total);
    }
    @PluginMethod
    public void getStatus(PluginCall call) {
        File file = modelFile();

        boolean initialized =
                engine != null && engine.isInitialized();

        JSObject result = new JSObject();

        result.put("engine", "LiteRT-LM");
        result.put("model", MODEL_FILE);
        result.put(
                "modelPresent",
                file.isFile() && file.length() > 0
        );
        result.put("modelPath", file.getAbsolutePath());
        result.put("initialized", initialized);
        result.put(
                "ready",
                initialized && file.isFile() && file.length() > 0
        );

        call.resolve(result);
    }

    // فتح مستعرض الملفات لاختيار ملف النموذج.
    @PluginMethod
    public void importModel(PluginCall call) {
        Log.i(TAG, "importModel entered");

        try {
            Intent intent = new Intent(
                    Intent.ACTION_OPEN_DOCUMENT
            );

            intent.addCategory(Intent.CATEGORY_OPENABLE);
            intent.setType("*/*");

            Log.i(TAG, "Launching document picker");

            startActivityForResult(
                    call,
                    intent,
                    "modelImportResult"
            );

        } catch (Exception e) {
            Log.e(
                    TAG,
                    "Failed to launch document picker",
                    e
            );

            call.reject(
                    "تعذر فتح مستعرض الملفات: " + e.getMessage(),
                    e
            );
        }
    }

    // استقبال الملف الذي اختاره المستخدم ونسخه إلى مساحة التطبيق.
    @ActivityCallback
    private void modelImportResult(
            PluginCall call,
            ActivityResult result
    ) {
        Log.i(
                TAG,
                "modelImportResult entered; resultCode="
                        + result.getResultCode()
        );

        if (call == null) {
            Log.e(TAG, "PluginCall is null");
            return;
        }

        if (result.getResultCode() != Activity.RESULT_OK
                || result.getData() == null
                || result.getData().getData() == null) {

            Log.w(TAG, "Model selection cancelled");

            call.reject("تم إلغاء اختيار ملف النموذج.");
            return;
        }

        Uri uri = result.getData().getData();

        Log.i(TAG, "Selected model URI: " + uri);

        File target = modelFile();
        File directory = target.getParentFile();

        try {
            if (directory == null
                    || (!directory.exists()
                    && !directory.mkdirs())) {

                Log.e(TAG, "Cannot create model directory");

                call.reject("تعذر إنشاء مجلد النموذج.");
                return;
            }

            InputStream input =
                    getContext()
                            .getContentResolver()
                            .openInputStream(uri);

            if (input == null) {
                Log.e(TAG, "Cannot open selected file");

                call.reject("تعذر قراءة الملف المحدد.");
                return;
            }

            long total = 0;

            try (
                    InputStream in = input;
                    FileOutputStream out =
                            new FileOutputStream(target)
            ) {
                byte[] buffer = new byte[64 * 1024];
                int count;

                while ((count = in.read(buffer)) != -1) {
                    out.write(buffer, 0, count);
                    total += count;
                }

                out.getFD().sync();
            }

            Log.i(
                    TAG,
                    "Model copied; bytes=" + total
            );

            if (total == 0) {
                boolean deleted = target.delete();

                Log.e(
                        TAG,
                        "Selected model file is empty; deleted="
                                + deleted
                );

                call.reject("ملف النموذج المحدد فارغ.");
                return;
            }

            JSObject response = new JSObject();

            response.put("success", true);
            response.put("model", MODEL_FILE);
            response.put(
                    "modelPath",
                    target.getAbsolutePath()
            );
            response.put("bytes", total);

            Log.i(
                    TAG,
                    "Model import completed successfully"
            );

            call.resolve(response);

        } catch (Exception e) {
            Log.e(TAG, "Model import failed", e);

            call.reject(
                    "فشل استيراد النموذج: " + e.getMessage(),
                    e
            );
        }
    }

    // تهيئة نموذج Gemma محلياً على الجهاز.
    @PluginMethod
    public void initialize(PluginCall call) {
        worker.execute(() -> {
            try {
                ensureBundledModelAvailable();
                File file = modelFile();

                if (!file.isFile() || file.length() != MODEL_BYTES) {
                    call.reject(
                            "ملف Gemma غير موجود. استورد النموذج أولاً."
                    );
                    return;
                }

                if (engine == null || !engine.isInitialized()) {
                    Log.i(TAG, "Initializing LiteRT-LM engine");

                    Engine newEngine = new Engine(
                            new EngineConfig(
                                    file.getAbsolutePath(),
                                    new Backend.CPU()
                            )
                    );

                    newEngine.initialize();
                    engine = newEngine;

                    Log.i(TAG, "LiteRT-LM initialization completed");
                }

                JSObject result = new JSObject();

                result.put(
                        "ready",
                        engine.isInitialized()
                );
                result.put("model", MODEL_FILE);

                call.resolve(result);

            } catch (Exception e) {
                Log.e(TAG, "Gemma initialization failed", e);

                call.reject(
                        "فشلت تهيئة Gemma على الجهاز: "
                                + e.getMessage(),
                        e
                );
            }
        });
    }

    // تحليل إعلان توصيل باستخدام النموذج المحلي.
    @PluginMethod
    public void analyze(PluginCall call) {
        String input = call.getString("text");

        if (input == null || input.trim().isEmpty()) {
            call.reject("نص الإعلان مطلوب.");
            return;
        }

        worker.execute(() -> {
            try {
                Engine activeEngine = engine;

                if (activeEngine == null
                        || !activeEngine.isInitialized()) {

                    call.reject(
                            "الذكاء الاصطناعي غير مهيأ. نفّذ initialize أولاً."
                    );
                    return;
                }

                String prompt =
                        "أنت مصنف صارم لإعلانات طلبات التوصيل في البحرين. "
                        + "حدد هل الرسالة تطلب فعلياً توصيل غرض أو شحنة من نقطة استلام إلى نقطة تسليم داخل البحرين. "
                        + "اقبل أنواع التوصيل المختلفة مثل الطعام والحلويات والعطور والملابس والمستندات والطرود والأغراض والبضائع وقطع الغيار والأدوية المسموح بنقلها. "
                        + "is_order=true فقط عند وجود مهمة توصيل حقيقية، مع نقطة استلام ووجهة تسليم واضحتين. "
                        + "لا ترفض الإعلان لمجرد أنه يحتوي على قائمة أغراض؛ اقبل القائمة إذا كان سياقها يوضح أنها طلب توصيل، وارفض قوائم المخزون والإعلانات التجارية العامة التي لا تطلب توصيلاً. "
                        + "ارفض نقل الركاب والسفر إلى السعودية أو المدن الأخرى والذهاب والعودة وعروض الخدمات العامة وأرقام الهواتف وحدها وروابط القروبات. "
                        + "ذكر كلمة اوردرات أو قطع غيار أو أدوية وحدها لا يعني وجود طلب توصيل. "
                        + "لا تعتبر قائمة مناطق وحدها دليلاً كافياً، ولا تخترع مواقع غير مذكورة. "
                        + "إذا كان النص غامضاً أو لا يثبت وجود مهمة توصيل محددة، اجعل is_order=false. "
                        + "حلل الاختصارات واللهجة البحرينية، لكن لا تخترع منطقة أو تفاصيل غير موجودة. "
                        + "أعط confidence رقماً صحيحاً من 0 إلى 100 يعبر عن ثقتك في أن الرسالة طلب توصيل حقيقي وأن منطقتي الاستلام والتسليم مستخرجتان من النص. "
                        + "إذا كانت أي منطقة غير مؤكدة أو كانت الرسالة إعلان شركة/خدمة عامة، اجعل is_order=false وconfidence أقل من 80. "
                        + "أعد JSON صالحاً فقط بالمفاتيح: "
                        + "is_order, confidence, pickup_area, destination, "
                        + "price, distance_km, sender_name, "
                        + "sender_phone, notes. "
                        + "استخدم null للقيم غير الموجودة، ولا تخترع معلومات. "
                        + "افهم العربية واللهجات الخليجية.\\n"
                        + "نص الرسالة المراد تصنيفها:\n"
                        + input;

                StringBuilder output = new StringBuilder();

                try (
                        Conversation conversation =
                                activeEngine.createConversation(
                                        new ConversationConfig()
                                )
                ) {
                    Message response =
                            conversation.sendMessage(prompt);

                    Contents contents = response.getContents();

                    for (Content item : contents.getContents()) {
                        if (item instanceof Content.Text) {
                            output.append(
                                    ((Content.Text) item).getText()
                            );
                        }
                    }
                }

                JSObject result = new JSObject();

                result.put("text", output.toString());
                result.put("model", MODEL_FILE);
                result.put("local", true);

                call.resolve(result);

            } catch (Exception e) {
                Log.e(TAG, "Local order analysis failed", e);

                call.reject(
                        "فشل تحليل الإعلان محلياً: "
                                + e.getMessage(),
                        e
                );
            }
        });
    }
}
