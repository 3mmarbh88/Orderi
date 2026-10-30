import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bot, 
  Play, 
  Pause, 
  RefreshCw, 
  Zap, 
  Globe, 
  ShieldCheck, 
  Link as LinkIcon, 
  Radio, 
  CheckCircle2, 
  FilterX, 
  Compass, 
  Sparkles,
  ChevronRight,
  Activity,
  Layers,
  Cpu,
  ArrowUpRight,
  X,
  RotateCcw,
  History,
  AlertTriangle,
  CheckCircle,
  Ban,
  FileSearch,
  EyeOff,
  Lock,
  ShieldAlert,
  Users,
  MessageSquareOff,
  Bell,
  BellOff,
  Sliders,
  Search,
  Check,
  Smartphone,
  Volume2,
  Vibrate,
  UserX,
  Car
} from 'lucide-react';
import { 
  subscribeToSpider, 
  triggerSpiderCrawlPass, 
  updateSpiderStats, 
  SpiderStats, 
  SpiderLogEvent 
} from '../utils/spiderCrawler';
import { 
  runSpiderCatchupRecovery, 
  CatchupRecoveryReport, 
  CatchupCandidateMessage 
} from '../utils/spiderCatchupRecovery';
import { 
  getAmbiguousSourceDiagnostics, 
  getExcludedPrivateChatsCount,
  clearAmbiguousSourceDiagnostics,
  AmbiguousSourceDiagnostic
} from '../utils/conversationSourceDiscriminator';
import { isNativeAndroid, OrderiNotificationListener } from '../native/orderiNotificationListener';
import { OrderFilter, ParsedOrder } from '../types';

interface SpiderControlCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCaptured?: (order: any) => void;
  onRecoverOrders?: (recoveredOrders: any[]) => void;
  activeOrders?: any[];
  onShowToast?: (msg: string) => void;
  filter?: OrderFilter;
  onUpdateFilter?: (filter: OrderFilter) => void;
}

export const SpiderControlCenter: React.FC<SpiderControlCenterProps> = ({
  isOpen,
  onClose,
  onOrderCaptured,
  onRecoverOrders,
  activeOrders = [],
  onShowToast,
  filter,
  onUpdateFilter,
}) => {
  const [stats, setStats] = useState<SpiderStats | null>(null);
  const [logs, setLogs] = useState<SpiderLogEvent[]>([]);
  const [isCrawlingNow, setIsCrawlingNow] = useState(false);
  const [isTurbo, setIsTurbo] = useState(false);
  const [activeTab, setActiveTab] = useState<'crawler' | 'catchup' | 'privacy' | 'blocking'>('crawler');
  const [isCatchingUp, setIsCatchingUp] = useState(false);
  const [lastCatchupReport, setLastCatchupReport] = useState<CatchupRecoveryReport | null>(null);
  const [excludedPrivateCount, setExcludedPrivateCount] = useState<number>(0);
  const [ambiguousDiagnostics, setAmbiguousDiagnostics] = useState<AmbiguousSourceDiagnostic[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>('all');

  useEffect(() => {
    try {
      setExcludedPrivateCount(getExcludedPrivateChatsCount());
      setAmbiguousDiagnostics(getAmbiguousSourceDiagnostics());
    } catch (e) {
      console.warn('[Spider] Error reading counts/diagnostics:', e);
    }
    const unsubscribe = subscribeToSpider((newStats, newLogs) => {
      setStats(newStats || null);
      setLogs(Array.isArray(newLogs) ? newLogs : []);
    });
    return () => unsubscribe();
  }, []);

  // Filter logs by search query and action safely
  const filteredLogs = useMemo(() => {
    if (!Array.isArray(logs)) return [];
    return logs.filter((log) => {
      if (!log) return false;
      if (selectedActionFilter !== 'all' && log.action !== selectedActionFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        (log.groupName || '').toLowerCase().includes(q) ||
        (log.detail || '').toLowerCase().includes(q) ||
        (log.highlight || '').toLowerCase().includes(q)
      );
    });
  }, [logs, searchQuery, selectedActionFilter]);

  const handleToggleActive = () => {
    if (!stats) return;
    const next = !stats.isActive;
    updateSpiderStats({ isActive: next });
    try {
      fetch('/api/spider/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: next }),
      }).catch(() => {});
    } catch {}
    onShowToast?.(next ? 'تم تفعيل زحف عنكبوت الواتساب 🕷️' : 'تم إيقاف الزحف مؤقتاً ⏸️');
  };

  const handleInstantCrawl = async () => {
    if (isCrawlingNow) return;
    setIsCrawlingNow(true);
    try {
      const res = await triggerSpiderCrawlPass((order) => {
        onOrderCaptured?.(order);
        onShowToast?.(`🕷️ تم التقاط طلب جديد للرادار: ${order.from} ➔ ${order.to}`);
      });
      if (res.success && res.crawledGroup) {
        onShowToast?.(`تم فحص وفهرسة القروب: ${res.crawledGroup} ⚡`);
      } else {
        onShowToast?.('العنكبوت يراقب إشعارات الواتساب الحية في الخلفية 🕷️');
      }
    } catch {
      onShowToast?.('تعذر إكمال دورة الزحف الآن');
    } finally {
      setTimeout(() => setIsCrawlingNow(false), 500);
    }
  };

  const handleToggleTurbo = () => {
    setIsTurbo(!isTurbo);
    onShowToast?.(!isTurbo ? 'تم تفعيل وضع الزحف التوربو السريع ⚡⚡' : 'العودة للسرعة الاعتيادية');
  };

  const handleTriggerCatchupRecovery = async () => {
    if (isCatchingUp) return;
    setIsCatchingUp(true);
    onShowToast?.('⚡ جاري فحص واستعادة الطلبات الفائتة مع استبعاد المحجوز والمنتهي بدقة...');

    try {
      const candidates: CatchupCandidateMessage[] = [];

      // 1. فحص طابور أحداث أندرويد المعلقة غير المفهرسة (Native Notification Queue)
      if (isNativeAndroid()) {
        try {
          const pending = await OrderiNotificationListener.getPending();
          if (pending?.events && Array.isArray(pending.events)) {
            pending.events.forEach((ev: any) => {
              const raw = (ev.rawText || ev.bigText || ev.text || ev.title || '').trim();
              if (raw) {
                candidates.push({
                  id: ev.id ? `native-catchup-${ev.id}` : `catchup-${Date.now()}-${Math.random()}`,
                  rawText: raw,
                  groupName: ev.groupName || ev.conversationTitle || 'قروب واتساب',
                  senderName: ev.senderName || ev.title || 'معلن بالقروب',
                  senderPhone: (ev.senderName || '').replace(/[^\d+]/g, ''),
                  timestamp: ev.receivedAt || Date.now(),
                });
              }
            });
          }
        } catch (e) {
          console.warn('[Spider] Error reading native pending queue for catchup:', e);
        }
      }

      // 2. فحص أحدث رسائل القروبات المؤقتة في الذاكرة المحلية
      try {
        const storedLogs = localStorage.getItem('orderi_recent_whatsapp_logs');
        if (storedLogs) {
          const parsed = JSON.parse(storedLogs);
          if (Array.isArray(parsed)) {
            parsed.forEach((item: any) => {
              if (item?.rawText && !candidates.some((c) => c.rawText === item.rawText)) {
                candidates.push({
                  id: item.id || `hist-${Date.now()}-${Math.random()}`,
                  rawText: item.rawText,
                  groupName: item.groupName || 'قروبات الواتساب',
                  senderName: item.senderName || 'معلن واتساب',
                  senderPhone: item.senderPhone || '',
                  timestamp: item.timestamp || Date.now() - 15 * 60 * 1000,
                  rawQuotedText: item.rawQuotedText,
                  stickerData: item.stickerData,
                });
              }
            });
          }
        }
      } catch {}

      // تشغيل محرك استعادة الطلبات الفائتة الصارم
      const report = await runSpiderCatchupRecovery(candidates, activeOrders, {
        logDiagnostics: true,
        maxRecoveryLimit: 25,
      });

      setLastCatchupReport(report);
      setActiveTab('catchup');

      if (report.recoveredOrders.length > 0) {
        onRecoverOrders?.(report.recoveredOrders);
        onShowToast?.(`🎯 استعاد Catch-up بنجاح ${report.recoveredOrders.length} طلب متاح مؤكد، واستبعد ${report.excludedClosedCount} طلب محجوز/منتهي!`);
      } else if (report.excludedClosedCount > 0) {
        onShowToast?.(`🛡️ تم فحص الطلبات الفائتة: استبعاد ${report.excludedClosedCount} طلب ثبت حجزها مسبقاً.`);
      } else {
        onShowToast?.('جميع طلبات القروبات محدثة ومطابقة بالكامل في الرادار ✅');
      }
    } catch (err) {
      console.error('[Spider Catch-up Error]', err);
      onShowToast?.('تعذر إكمال فحص الاستعادة الفائتة');
    } finally {
      setIsCatchingUp(false);
    }
  };

  const getActionBadge = (action: SpiderLogEvent['action']) => {
    switch (action) {
      case 'INDEXED':
        return { label: 'تمت الفهرسة ✅', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'CRAWLING':
        return { label: 'زحف نشط 🕷️', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
      case 'DISCOVERED_LINK':
        return { label: 'رابط قروب 🔗', bg: 'bg-violet-500/20 text-violet-300 border-violet-500/30' };
      case 'FILTERED_PASSENGER':
        return { label: 'منع ركاب ⛔', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'FILTERED_SPAM':
        return { label: 'استبعاد إعلان 🗑️', bg: 'bg-slate-700/50 text-slate-300 border-slate-600' };
      case 'CLOSED_ORDER':
        return { label: 'أرشفة إغلاق 🎯', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
      default:
        return { label: 'نظام ⚙️', bg: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  // Toggle helper for filters
  const handleUpdateFilterKey = <K extends keyof OrderFilter>(key: K, value: OrderFilter[K]) => {
    if (!filter || !onUpdateFilter) return;
    const updated = { ...filter, [key]: value };
    onUpdateFilter(updated);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl max-h-[94vh] flex flex-col bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-700/80 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Modern Cyber-Cockpit Header */}
        <div className="relative p-4 sm:p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/90 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-400 p-0.5 shadow-lg shadow-emerald-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center relative overflow-hidden">
                <Bot className="w-6 h-6 text-emerald-400 animate-pulse" />
                {stats?.isActive && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                  <span>عنكبوت الأوردرات الذكي (Orderi Spider)</span>
                  <span className="text-xl">🕷️</span>
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 ${
                  stats?.isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-700/50 text-slate-400 border-slate-600'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${stats?.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                  {stats?.isActive ? 'الزحف المستمر نشط 🟢' : 'متوقف مؤقتاً ⏸️'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                  Gemma 3 1B + Gemini 3.8 ⚡
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                محرك هجين فائق السرعة يراقب قروبات واتساب بالخلفية، يلتقط الطلبات المتاحة، ويعزل المحادثات الخاصة لحماية الخصوصية.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="إغلاق النافذة"
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real-time Spider Live Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 sm:p-4 bg-slate-950/70 border-b border-slate-800/80">
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 font-bold block truncate">طلبات الرادار المفهرسة</span>
              <span className="text-base sm:text-lg font-black text-emerald-400">
                {stats?.ordersCapturedCount || 0} طلب 📦
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 font-bold block truncate">القروبات تحت المراقبة</span>
              <span className="text-base sm:text-lg font-black text-blue-400">
                {stats?.crawledGroupsCount || 0} قروب 👥
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 font-bold block truncate">شاتات خاصة مستبعدة</span>
              <span className="text-base sm:text-lg font-black text-rose-400">
                {excludedPrivateCount} شات 👤
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 font-bold block truncate">سرعة المعالجة الفورية</span>
              <span className="text-base sm:text-lg font-black text-amber-400">
                {isTurbo ? '12 ms ⚡' : '16 ms (فوري)'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="p-3 sm:p-4 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleToggleActive}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
                stats?.isActive
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
              }`}
            >
              {stats?.isActive ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>إيقاف مؤقت للزحف</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>بدء الزحف الذكي ⚡</span>
                </>
              )}
            </button>

            <button
              onClick={handleInstantCrawl}
              disabled={isCrawlingNow}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-2 border border-slate-700 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCrawlingNow ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{isCrawlingNow ? 'جاري الزحف...' : 'زحف وفحص القروبات ⚡'}</span>
            </button>

            <button
              onClick={handleTriggerCatchupRecovery}
              disabled={isCatchingUp}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white text-xs font-black flex items-center gap-2 shadow-md shadow-indigo-900/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isCatchingUp ? 'animate-spin text-amber-300' : 'text-emerald-300'}`} />
              <span>{isCatchingUp ? 'جاري الفحص الدقيق...' : 'استعادة الفائت (Catch-up) 🔄'}</span>
            </button>

            <button
              onClick={handleToggleTurbo}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isTurbo
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5 inline ml-1 text-amber-400" />
              <span>وضع التوربو ⚡</span>
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab('crawler')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'crawler'
                  ? 'bg-slate-800 text-emerald-400 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🕷️ سجل الزحف المباشر
            </button>
            <button
              onClick={() => setActiveTab('catchup')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'catchup'
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>⚡ استعادة الفائت</span>
              {lastCatchupReport && lastCatchupReport.eligibleAvailableCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black">
                  +{lastCatchupReport.eligibleAvailableCount}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setExcludedPrivateCount(getExcludedPrivateChatsCount());
                setAmbiguousDiagnostics(getAmbiguousSourceDiagnostics());
                setActiveTab('privacy');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'privacy'
                  ? 'bg-rose-600/30 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🛡️ درع الخصوصية</span>
              {excludedPrivateCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-black">
                  {excludedPrivateCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('blocking')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'blocking'
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>مصفوفة الحجب والتنبيهات ⚙️</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Live Spider Crawler Logs */}
        {activeTab === 'crawler' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-slate-950/85 text-xs max-h-[55vh]">
            {/* Search and Action Filter Strip */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-800">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث في رسائل القروبات، المناطق، أو الأسعار..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto">
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'INDEXED', label: 'مفهرسة ✅' },
                  { id: 'DISCOVERED_LINK', label: 'روابط قروبات 🔗' },
                  { id: 'FILTERED_PASSENGER', label: 'ركاب ممنوع 🚫' },
                  { id: 'CLOSED_ORDER', label: 'محجوز/مغلق 🎯' },
                ].map((btn) => (
                  <button
                    key={btn.id}
                    onClick={() => setSelectedActionFilter(btn.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                      selectedActionFilter === btn.id
                        ? 'bg-slate-800 text-white border border-slate-700'
                        : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-500 font-sans space-y-2">
                <Bot className="w-10 h-10 mx-auto opacity-40 animate-pulse text-emerald-400" />
                <p className="font-bold text-slate-400">
                  {searchQuery ? 'لا توجد نتائج مطابقة لبحثك في السجل' : 'العنكبوت يراقب القروبات وينتظر وصول رسائل جديدة...'}
                </p>
                <p className="text-[11px] text-slate-500">
                  الزحف يعمل تلقائياً مع كل رسالة جديدة بالقروبات أو عبر الضغط على "زحف وفحص القروبات ⚡".
                </p>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const badge = getActionBadge(log.action);
                return (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border shrink-0 ${badge.bg}`}>
                        {badge.label}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-200 text-xs">{log.groupName}</span>
                          {log.highlight && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                              {log.highlight}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          {log.detail}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-slate-500 self-end sm:self-center shrink-0">
                      <span className="text-emerald-400 font-mono font-bold">{log.latencyMs} ms</span>
                      <span>{log.timestamp}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Catch-up Recovery Active View */}
        {activeTab === 'catchup' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-950/90 text-xs max-h-[55vh]">
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-800/40 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                    <RotateCcw className="w-5 h-5 text-indigo-300" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-indigo-200">
                      آلية استعادة الطلبات الفائتة الذكية (Catch-up Recovery)
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      تستعيد أي طلبات توصيل غير مكررة لم يتم التقاطها بالرادار، مع استبعاد صارم لأي طلب حُجز أو أُخذ من مندوب.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleTriggerCatchupRecovery}
                  disabled={isCatchingUp}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md shadow-indigo-900/40 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {isCatchingUp ? 'جاري الفحص الدقيق...' : 'تشغيل فحص الاستعادة الآن ⚡'}
                </button>
              </div>

              {lastCatchupReport && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-900/50">
                    <span className="text-[10px] text-slate-400 block font-bold">طلبات متاحة مؤكدة</span>
                    <span className="text-base font-black text-emerald-400">
                      +{lastCatchupReport.eligibleAvailableCount} طلب 🎯
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-rose-900/50">
                    <span className="text-[10px] text-slate-400 block font-bold">طلبات محجوزة مستبعدة</span>
                    <span className="text-base font-black text-rose-400">
                      {lastCatchupReport.excludedClosedCount} طلب 🚫
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-900/50">
                    <span className="text-[10px] text-slate-400 block font-bold">حالات غير محسومة</span>
                    <span className="text-base font-black text-amber-400">
                      {lastCatchupReport.ambiguousCasesCount} حالة ⚠️
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-bold">المكررة المتخطاة</span>
                    <span className="text-base font-black text-slate-300">
                      {lastCatchupReport.duplicatesSkippedCount} طلب 🛡️
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Diagnostic Decisions Log */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold text-slate-400 block">
                سجل تشخيص القرارات واستبعاد الحجز والملصقات (Diagnostic Evidence):
              </span>

              {lastCatchupReport ? (
                <div className="space-y-2 font-mono text-[11px]">
                  {lastCatchupReport.diagnosticLogs.map((diag, idx) => (
                    <div 
                      key={idx}
                      className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 leading-relaxed font-sans"
                    >
                      {diag}
                    </div>
                  ))}

                  {/* Ambiguous Cases Details */}
                  {lastCatchupReport.ambiguousOrders.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/50 space-y-2">
                      <div className="flex items-center gap-2 text-amber-300 font-bold font-sans">
                        <AlertTriangle className="w-4 h-4" />
                        <span>حالات غير محسومة عولجت بحذر وسُجلت للتشخيص دون الزعم غير الموثق:</span>
                      </div>
                      {lastCatchupReport.ambiguousOrders.map((amb, aIdx) => (
                        <div key={aIdx} className="text-xs text-amber-200/90 bg-amber-900/20 p-2.5 rounded-lg font-sans">
                          • {amb.reason} (معرّف الرسالة: {amb.messageId})
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Excluded Closed Details */}
                  {lastCatchupReport.excludedClosed.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/40 space-y-2">
                      <div className="flex items-center gap-2 text-rose-300 font-bold font-sans">
                        <Ban className="w-4 h-4" />
                        <span>الطلبات التي استُبعدت لثبوت أخذها من مندوب أو حجزها لاحقاً:</span>
                      </div>
                      {lastCatchupReport.excludedClosed.map((cl, cIdx) => (
                        <div key={cIdx} className="text-xs text-rose-200/90 bg-rose-900/20 p-2 rounded-lg font-sans">
                          • {cl.reason}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-500 font-sans space-y-2">
                  <RotateCcw className="w-8 h-8 mx-auto opacity-40 animate-pulse text-indigo-400" />
                  <p>انقر على "تشغيل فحص الاستعادة" لفحص القروبات واسترجاع أي طلبات فائتة غير محجوزة.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Privacy Shield & Discrimination Active View */}
        {activeTab === 'privacy' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-950/90 text-xs max-h-[55vh]">
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border border-rose-800/40 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-rose-300">
                      درع الخصوصية والتمييز الصارم بين مصادر الرسائل
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      يضمن استبعاد المحادثات الفردية الشخصية (1-on-1) نهائياً وافتراضياً من الظهور كطلبات في الرادار، وحماية خصوصية أصدقائك ومعارفك.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    clearAmbiguousSourceDiagnostics();
                    setAmbiguousDiagnostics([]);
                    onShowToast?.('تم مسح سجل التشخيص الاحتياطي');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-all cursor-pointer shrink-0"
                >
                  مسح سجل التشخيص
                </button>
              </div>

              {/* Strict Privacy Statistics Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-rose-900/50 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">محادثات خاصة فردية مستبعدة</span>
                    <span className="text-base font-black text-rose-400">{excludedPrivateCount} محادثة 👤</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30">
                    محجوبة 100% 🔒
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-900/50 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">قروبات التوصيل المصرح بها</span>
                    <span className="text-base font-black text-emerald-400">{stats?.crawledGroupsCount || 0} قروب 👥</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    معتمدة بالرادار ✅
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-amber-900/50 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">حالات محجوبة لعدم ثبوت القروب</span>
                    <span className="text-base font-black text-amber-400">{ambiguousDiagnostics.length} حالة 🛡️</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    حماية احتياطية
                  </span>
                </div>
              </div>
            </div>

            {/* Rules explanation card */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 text-slate-300 text-[11px]">
              <span className="font-black text-white block">قواعد الحماية والتمييز الصارم المطبقة:</span>
              <ul className="space-y-1.5 list-disc list-inside text-slate-400 leading-relaxed">
                <li><strong className="text-slate-200">الاستبعاد الافتراضي التام:</strong> لا يُنشأ أي طلب في الرادار من محادثة شخصية فردية مهما كان نصها أو اسم مرسلها.</li>
                <li><strong className="text-slate-200">منع الاستدلال بالكلمات:</strong> لا تُعتبر كلمات مثل «مندوب»، «توصيل»، أو أسماء مناطق البحرين دليلاً على أن المحادثة تابعة لقروب توصيل.</li>
                <li><strong className="text-slate-200">الاعتماد على الهوية الرقمية:</strong> التحقق الصارم من معرّفات المحادثة (isGroupConversation, conversationTitle, @g.us).</li>
                <li><strong className="text-slate-200">عزل سجلات الإغلاق:</strong> رسالة الصديق في الخاص («تم»، «خلصت»، أو استيكر) لا تغلق ولا تؤثر على أي طلب بالرادار.</li>
                <li><strong className="text-slate-200">حماية الخصوصية:</strong> عدم إرسال أي محتوى خاص لخوادم خارجية أو نماذج ذكاء اصطناعي سحابية.</li>
              </ul>
            </div>

            {/* Diagnostic Logs (Zero text leak, metadata only) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span className="font-bold">سجل التشخيص المحلي للحالات المحجوبة (Diagnostic Events):</span>
                <span>{ambiguousDiagnostics.length} حالة مسجلة</span>
              </div>

              {ambiguousDiagnostics.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 text-center text-slate-500">
                  <Lock className="w-6 h-6 mx-auto mb-2 opacity-50 text-emerald-400" />
                  <p>لم تُسجل أي حالات غامضة. جميع المحادثات مفروزة بدقة بين قروبات التوصيل المعتمدة والشات الخاص.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {ambiguousDiagnostics.slice(0, 20).map((diag) => (
                    <div 
                      key={diag.id}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-[11px]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 text-[10px]">
                          {diag.diagnosticCode}
                        </span>
                        <span className="text-slate-300">{diag.reason}</span>
                      </div>
                      <span className="text-slate-500 font-mono text-[10px] shrink-0">{diag.timeDisplay}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Shield & Notification Matrix (مصفوفة الحجب والتنبيهات) */}
        {activeTab === 'blocking' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-950/90 text-xs max-h-[55vh]">
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/50 via-slate-900 to-slate-900 border border-amber-800/40 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-amber-200">
                    مصفوفة الحجب والتنبيهات وإشعارات الخلفية
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    تحكم دقيق في وصول الإشعارات والتنبيهات الصوتية حتى أثناء تشغيل البرنامج بالخلفية أو قفل الشاشة، مع توافق كامل مع خيارات الحجب.
                  </p>
                </div>
              </div>
            </div>

            {/* Matrix Switches Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Switch 1: Background Notifications */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-white text-xs block">إشعارات وتنبيهات الخلفية</span>
                      <span className="text-[10px] text-slate-400">تطبيق مصغر / شاشة مقفلة</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const curr = filter?.backgroundNotificationsEnabled ?? true;
                      handleUpdateFilterKey('backgroundNotificationsEnabled', !curr);
                      onShowToast?.(!curr ? 'تم تفعيل إشعارات الخلفية بنجاح 🔔' : 'تم إيقاف إشعارات الخلفية مؤقتاً 🔕');
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      (filter?.backgroundNotificationsEnabled ?? true) ? 'bg-emerald-600' : 'bg-slate-700'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                      (filter?.backgroundNotificationsEnabled ?? true) ? 'left-6.5' : 'left-0.5'
                    }`} />
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {(filter?.backgroundNotificationsEnabled ?? true)
                    ? '✅ مفعل: يصلك إشعار بالنظام وتنبيه صوتي بالطلب حتى والتطبيق في الخلفية، وبالضغط على الإشعار يفتح الطلب مباشرة بالرادار.'
                    : '⏸️ معطل: لا تصدر إشعارات نظام بالخلفية أثناء تصغير التطبيق.'}
                </p>
              </div>

              {/* Switch 2: Block Passenger Deliveries */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                      <Car className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-white text-xs block">حجب إعلانات نقل الركاب</span>
                      <span className="text-[10px] text-slate-400">توصيل ركاب وأشخاص 🚫</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const curr = filter?.blockPassengerDeliveries !== false;
                      handleUpdateFilterKey('blockPassengerDeliveries', !curr);
                      onShowToast?.(!curr ? 'تم تفعيل حجب إعلانات الركاب 🚫' : 'تم تعطيل حجب الركاب (مسموح) 👥');
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      (filter?.blockPassengerDeliveries !== false) ? 'bg-amber-600' : 'bg-slate-700'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                      (filter?.blockPassengerDeliveries !== false) ? 'left-6.5' : 'left-0.5'
                    }`} />
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {(filter?.blockPassengerDeliveries !== false)
                    ? '🚫 الحجب مفعل: تُحجب إعلانات نقل الركاب وتُمنع إشعاراتها بالخلفية لحمايتك من المخالفات.'
                    : '👥 الحجب معطل: يُسمح بوصول إشعارات وتنبيهات طلبات الركاب كطلبات عادية.'}
                </p>
              </div>

              {/* Switch 3: Ignore Non-Matching Orders */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                      <FilterX className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-white text-xs block">حجب الطلبات غير المطابقة</span>
                      <span className="text-[10px] text-slate-400">مطابقة أقل من 80%</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const curr = filter?.ignoreNonMatching ?? false;
                      handleUpdateFilterKey('ignoreNonMatching', !curr);
                      onShowToast?.(!curr ? 'تم تفعيل حجب الطلبات غير المطابقة 🚫' : 'تم استقبال جميع الطلبات (الحجب معطل) ⚡');
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      filter?.ignoreNonMatching ? 'bg-blue-600' : 'bg-slate-700'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                      filter?.ignoreNonMatching ? 'left-6.5' : 'left-0.5'
                    }`} />
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {filter?.ignoreNonMatching
                    ? '🚫 الحجب مفعل: تُحجب وتُستبعد الطلبات الأقل من 80% ولا ترسل إشعارات بالخلفية لمنع الإزعاج.'
                    : '⚡ الحجب معطل: تأتي إشعارات وتنبيهات لجميع الطلبات الواردة في القروبات دون استثناء.'}
                </p>
              </div>

              {/* Switch 4: Auto-block Blacklist Contacts */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                      <UserX className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-white text-xs block">حجب القائمة السوداء</span>
                      <span className="text-[10px] text-slate-400">الأرقام المزعجة المضافة</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const curr = filter?.autoBlockBlacklist !== false;
                      handleUpdateFilterKey('autoBlockBlacklist', !curr);
                      onShowToast?.(!curr ? 'تم تفعيل حجب القائمة السوداء 🚫' : 'تم تعطيل حجب القائمة السوداء');
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      (filter?.autoBlockBlacklist !== false) ? 'bg-rose-600' : 'bg-slate-700'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                      (filter?.autoBlockBlacklist !== false) ? 'left-6.5' : 'left-0.5'
                    }`} />
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {(filter?.autoBlockBlacklist !== false)
                    ? '🚫 الحجب مفعل: إعلانات جهات الاتصال في القائمة السوداء محجوبة تماماً ولن ترسل إشعاراً أو صوتاً.'
                    : '⚠️ الحجب معطل: لا يتم حظر أي أرقام حالياً.'}
                </p>
              </div>

              {/* Switch 5: Exclude Captain's Own Ads */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-white text-xs block">استبعاد إعلاناتي الشخصية</span>
                      <span className="text-[10px] text-slate-400">منع رصد منشوراتي كطلبات جديدة</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const curr = filter?.excludeMyOwnAds !== false;
                      handleUpdateFilterKey('excludeMyOwnAds', !curr);
                      onShowToast?.(!curr ? 'تم تفعيل استبعاد إعلاناتك الشخصية 🛡️' : 'تم السماح برصد إعلاناتك');
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      (filter?.excludeMyOwnAds !== false) ? 'bg-purple-600' : 'bg-slate-700'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                      (filter?.excludeMyOwnAds !== false) ? 'left-6.5' : 'left-0.5'
                    }`} />
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {(filter?.excludeMyOwnAds !== false)
                    ? '🛡️ الحجب مفعل: أي إعلان تنشره أنت في قروبات الواتساب يُستبعد تلقائياً من الرادار ولا يرسل إشعاراً لنفسك.'
                    : 'معطل: تظهر جميع الإعلانات حتى لو نُشرت من رقمك.'}
                </p>
              </div>
            </div>

            {/* Notification Click Behavior Notice */}
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-emerald-200/90 leading-relaxed">
                <strong className="text-white block font-bold mb-0.5">آلية فتح الطلب عند الضغط على الإشعار:</strong>
                عند النقر على أي إشعار طلب وارد بالنظام (أندرويد أو PWA أو المتصفح)، يتم جلب التطبيق للواجهة الأمامية فوراً وفتح نافذة تفاصيل ذلك الطلب على الرادار مع جهة الاستلام والتسليم والسعر وزر التواصل السريع عبر واتساب.
              </div>
            </div>
          </div>
        )}

        {/* Footer info banner */}
        <div className="p-3 px-5 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>حماية السائق مفعلة: الفلترة الذكية تمنع نقل الركاب وتستبعد الإعلانات المزعجة تلقائياً</span>
          </div>
          <span className="text-emerald-400 font-bold">المحرك الهجين: Gemma 3 1B + Gemini 3.8 + HERE WeGo</span>
        </div>
      </div>
    </div>
  );
};
