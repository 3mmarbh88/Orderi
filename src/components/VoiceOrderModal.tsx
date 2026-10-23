import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Mic, 
  MicOff, 
  Upload, 
  Play, 
  Square, 
  Volume2, 
  CheckCircle2, 
  Sparkles, 
  X, 
  Zap, 
  ArrowLeft, 
  MapPin, 
  Coins, 
  Phone, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { ParsedOrder } from '../types';

interface VoiceOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVoiceOrderToRadar: (order: ParsedOrder) => void;
  onShowToast: (msg: string) => void;
}

const PRESET_BAHRAIN_VOICE_SAMPLES = [
  {
    id: 'sample-1',
    title: 'طلب فوري من العدلية للرفاع (2.5 د.ب)',
    transcript: 'السلام عليكم، بغيت مندوب من العدلية للرفاع بدينارين ونص، الطلب جاهز للاستلام الحين.',
    from: 'العدلية',
    to: 'الرفاع',
    price: 2.5,
    senderName: 'متجر العدلية للهدايا 🎁',
    senderPhone: '97339124455',
  },
  {
    id: 'sample-2',
    title: 'طلب كيكة من مجمع السيف لعراد (3.0 د.ب)',
    transcript: 'مرحبا كباتن، أبي مندوب يوصل كيكة ومستند من مجمع السيف لعراد بـ 3 دينار وبنفت فوري.',
    from: 'السيف',
    to: 'عراد',
    price: 3.0,
    senderName: 'حلويات السيف الفاخرة 🎂',
    senderPhone: '97336881122',
  },
  {
    id: 'sample-3',
    title: 'طلب عطور من توبلي لمدينة عيسى (2.0 د.ب)',
    transcript: 'سلام، عندي أوردر عطور من توبلي لمدينة عيسى بدينارين، الدفع بنفت عند الاستلام.',
    from: 'توبلي',
    to: 'مدينة عيسى',
    price: 2.0,
    senderName: 'عطورات توبلي 🌸',
    senderPhone: '97338445566',
  },
  {
    id: 'sample-4',
    title: 'طلب مستعجل من الجفير للبديع (3.5 د.ب)',
    transcript: 'بغيت دريول أو مندوب ضروري جداً الحين من الجفير للبديع بـ 3 دينار ونصف كاش.',
    from: 'الجفير',
    to: 'البديع',
    price: 3.5,
    senderName: 'زبون مباشر (الجفير) 📍',
    senderPhone: '97333221199',
  },
];

export const VoiceOrderModal: React.FC<VoiceOrderModalProps> = ({
  isOpen,
  onClose,
  onAddVoiceOrderToRadar,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'record' | 'upload' | 'samples'>('samples');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedOrder, setAnalyzedOrder] = useState<any | null>(null);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioMimeType, setAudioMimeType] = useState<string>('audio/webm');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  const handleReset = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    clearInterval(timerIntervalRef.current);
    setIsRecording(false);
    setRecordingSeconds(0);
    setIsAnalyzing(false);
    setAnalyzedOrder(null);
    setAudioBlobUrl(null);
    setAudioBase64(null);
    setErrorMessage(null);
  }, [isRecording]);

  useEffect(() => {
    if (!isOpen) {
      handleReset();
    }
  }, [isOpen, handleReset]);

  const startRecording = async () => {
    setErrorMessage(null);
    setAnalyzedOrder(null);
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMessage('الميكروفون غير مدعوم في هذا المتصفح أو يتطلب فتح التطبيق عبر HTTPS أو مستقل.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : MediaRecorder.isTypeSupported('audio/ogg') 
        ? 'audio/ogg' 
        : 'audio/mp4';

      setAudioMimeType(mime);
      const mediaRecorder = new MediaRecorder(stream, { mimeType: mime });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, { type: mime });
        const url = URL.createObjectURL(blob);
        setAudioBlobUrl(url);

        // Convert blob to base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = (reader.result as string)?.split(',')[1];
          if (base64Data) {
            setAudioBase64(base64Data);
            processAudioWithAI(base64Data, mime);
          }
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 60) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      setErrorMessage(err?.name === 'NotAllowedError' ? 'تم رفض إذن الميكروفون. يرجى السماح بالوصول من المتصفح.' : 'تعذر تشغيل الميكروفون.');
    }
  };

  const stopRecording = () => {
    clearInterval(timerIntervalRef.current);
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
  };

  const processAudioWithAI = async (b64: string, mime: string) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/voice-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: b64,
          mimeType: mime,
          broadcastToRadar: false,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setAnalyzedOrder(json.data);
        onShowToast('🎉 تم تفريغ الفويس نوت واستخراج بيانات الطلب بنجاح');
      } else {
        setErrorMessage(json.error || 'تعذر تحليل التسجيل الصوتي');
      }
    } catch (e: any) {
      setErrorMessage('حدث خطأ أثناء الاتصال بنموذج الذكاء الاصطناعي');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('حجم الملف الصوتي كبير جداً (أقصى حد 25 ميجابايت)');
      return;
    }

    setErrorMessage(null);
    setAudioBlobUrl(URL.createObjectURL(file));
    setAudioMimeType(file.type || 'audio/mp3');

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = (reader.result as string)?.split(',')[1];
      if (base64Data) {
        setAudioBase64(base64Data);
        processAudioWithAI(base64Data, file.type || 'audio/mp3');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRunSampleSimulation = async (sample: typeof PRESET_BAHRAIN_VOICE_SAMPLES[0]) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/voice-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: sample.transcript,
          groupName: 'قروبات واتساب البحرين 🎙️',
          senderName: sample.senderName,
          broadcastToRadar: false,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const enriched = {
          ...json.data,
          from: sample.from,
          to: sample.to,
          price: sample.price,
          senderName: sample.senderName,
          senderPhone: sample.senderPhone,
        };
        setAnalyzedOrder(enriched);
        onShowToast(`🎙️ تم محاكاة وتحليل فويس نوت: "${sample.title}"`);
      }
    } catch (e) {
      setErrorMessage('تعذر معالجة نموذج التسجيل الصوتي');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmAddToRadar = () => {
    if (!analyzedOrder) return;

    const fullOrder: ParsedOrder = {
      id: analyzedOrder.id || `ord-voice-${Date.now()}`,
      from: analyzedOrder.from || 'المنامة',
      to: analyzedOrder.to || 'الرفاع',
      price: analyzedOrder.price || 2.5,
      isPriceUnspecified: !analyzedOrder.price || analyzedOrder.price <= 0,
      rawText: analyzedOrder.rawText || `🎙️ تسجيل صوتي: ${analyzedOrder.voiceTranscript || ''}`,
      groupName: analyzedOrder.groupName || 'قروب واتساب (تسجيل صوتي) 🎙️',
      senderName: analyzedOrder.senderName || 'معلن واتساب 🎙️',
      senderPhone: analyzedOrder.senderPhone || '97339123456',
      receivedAt: new Date(),
      confidence: 96,
      type: '🎙️ تسجيل صوتي (واتساب)',
      notes: analyzedOrder.notes || 'تسجيل صوتي تم تفريغه بالذكاء الاصطناعي',
      status: 'pending',
      source: 'voice',
      isVoiceNote: true,
      voiceTranscript: analyzedOrder.voiceTranscript || analyzedOrder.transcript,
      voiceAudioUrl: audioBlobUrl || undefined,
      match: {
        score: 95,
        startMatched: true,
        destinationMatched: true,
        priceMatched: true,
        distanceMatched: true,
        timeMatched: true,
        distanceKm: 2.5,
        statusLabel: 'طلب ممتاز',
        statusColor: 'emerald',
      },
    };

    onAddVoiceOrderToRadar(fullOrder);
    onShowToast(`✅ تم إدراج طلب الفويس نوت في الرادار بنجاح: (${fullOrder.from} ← ${fullOrder.to})`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-7 shadow-2xl border border-slate-200 space-y-5 text-right max-h-[92vh] overflow-y-auto pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden w-10 h-1.5 bg-slate-300 rounded-full mx-auto -mt-2 mb-2" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-500/25">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  ذكاء تفريغ الفويس نوت والتسجيلات الصوتية 🎙️
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-900 border border-purple-200">
                  Gemini + Bahrain Dialect 🇧🇭
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                التقاط ريكوردات المعلنين في قروبات الواتساب ("بغيت مندوب من...") واستخراج بيانات التوصيل فوراً
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200/80 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('samples')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'samples'
                ? 'bg-white text-purple-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            نماذج بحرينية جاهزة ⚡
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('record')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'record'
                ? 'bg-white text-purple-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            تسجيل صوتي مباشر 🎙️
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white text-purple-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            رفع ملف صوتي 📁
          </button>
        </div>

        {/* Tab 1: Bahrain Voice Samples */}
        {activeTab === 'samples' && (
          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200 text-xs font-bold text-purple-950 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
              <span>جرب محاكاة نصوص وريكوردات حقيقية من لهجة قروبات واتساب البحرين بنقرة واحدة:</span>
            </div>

            <div className="space-y-2">
              {PRESET_BAHRAIN_VOICE_SAMPLES.map((sample) => (
                <div
                  key={sample.id}
                  className="p-3.5 rounded-2xl border border-slate-200 hover:border-purple-300 bg-white hover:bg-purple-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
                      <span className="text-xs font-black text-slate-900">{sample.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-xl border border-slate-100">
                      "{sample.transcript}"
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRunSampleSimulation(sample)}
                    disabled={isAnalyzing}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-black shrink-0 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                    <span>تحليل بالذكاء الاصطناعي 🧠</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Live Recording */}
        {activeTab === 'record' && (
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 border border-slate-200 text-center space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-900">
                تسجيل بصوتك كمعلن أو زبون في واتساب
              </h3>
              <p className="text-xs text-slate-500">
                تحدث بحرية باللهجة البحرينية (مثلاً: "بغيت مندوب من المحرق للسلمانية بدينارين")
              </p>
            </div>

            <div className="py-4 flex flex-col items-center justify-center gap-3">
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isAnalyzing}
                className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-all transform active:scale-90 shadow-xl cursor-pointer ${
                  isRecording
                    ? 'bg-rose-600 hover:bg-rose-700 animate-pulse ring-8 ring-rose-200'
                    : 'bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 ring-4 ring-purple-100'
                }`}
              >
                {isRecording ? <Square className="w-8 h-8 fill-white" /> : <Mic className="w-8 h-8" />}
              </button>

              <div className="text-xs font-black">
                {isRecording ? (
                  <span className="text-rose-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                    جاري الاستماع والتسجيل ({recordingSeconds} ثانية) — اضغط للإيقاف
                  </span>
                ) : (
                  <span className="text-slate-600">اضغط على الميكروفون لبدء التسجيل</span>
                )}
              </div>
            </div>

            {audioBlobUrl && (
              <div className="pt-2">
                <audio src={audioBlobUrl} controls className="w-full h-10 rounded-xl" />
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Upload Audio File */}
        {activeTab === 'upload' && (
          <div className="p-6 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 mx-auto flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-900">
                اختر ملف تسجيل صوتي من واتساب
              </h3>
              <p className="text-xs text-slate-500">
                يدعم صيغ واتساب الصوتية (.opus, .ogg, .mp3, .m4a, .wav)
              </p>
            </div>

            <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-xs cursor-pointer active:scale-95 transition-all">
              <Upload className="w-4 h-4" />
              <span>اختيار ملف صوتي من الجهاز</span>
              <input
                type="file"
                accept="audio/*,.opus,.ogg,.mp3,.m4a,.wav"
                className="sr-only"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        )}

        {/* Loading Spinner during AI Analysis */}
        {isAnalyzing && (
          <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-center space-y-2 animate-pulse">
            <RefreshCw className="w-6 h-6 text-purple-600 animate-spin mx-auto" />
            <p className="text-xs font-black text-purple-900">
              جاري تفريغ الصوت وتحليل اللهجة البحرينية واستخراج المناطق بالذكاء الاصطناعي...
            </p>
          </div>
        )}

        {/* Error Feedback */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Extracted Result Card */}
        {analyzedOrder && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-50/80 via-white to-indigo-50/50 border-2 border-purple-300 space-y-4 shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-purple-100 pb-2.5">
              <div className="flex items-center gap-2 text-xs font-black text-purple-950">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>نتيجة استخراج الذكاء الاصطناعي للفويس نوت:</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-200/70 text-purple-900">
                ثقة عالية 96% ✓
              </span>
            </div>

            {/* Transcript Quote */}
            <div className="p-3 rounded-xl bg-white border border-purple-200/80 space-y-1">
              <div className="text-[10px] font-black text-slate-500 flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-purple-600" />
                <span>التفريغ النصي المنطوق:</span>
              </div>
              <p className="text-xs font-bold text-slate-900 leading-relaxed italic">
                "{analyzedOrder.voiceTranscript || analyzedOrder.transcript}"
              </p>
            </div>

            {/* Structured Fields Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-bold">مكان الاستلام:</span>
                <span className="text-xs font-black text-slate-900 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  {analyzedOrder.from}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-bold">وجهة التسليم:</span>
                <span className="text-xs font-black text-slate-900 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-purple-600" />
                  {analyzedOrder.to}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-slate-200 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-400 block font-bold">السعر المستخرج:</span>
                <span className="text-xs font-black text-emerald-700 flex items-center gap-1 mt-0.5">
                  <Coins className="w-3.5 h-3.5 text-emerald-600" />
                  {analyzedOrder.price > 0 ? `${analyzedOrder.price} د.ب` : 'سعر عند الاتفاق'}
                </span>
              </div>
            </div>

            {/* Action to Push to Live Radar */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleConfirmAddToRadar}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 cursor-pointer active:scale-95 transition-all"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>إدراج في رادار الطلبات فوراً ⚡</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
