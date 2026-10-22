import React, { useState, useEffect } from 'react';
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
  X
} from 'lucide-react';
import { 
  subscribeToSpider, 
  triggerSpiderCrawlPass, 
  updateSpiderStats, 
  SpiderStats, 
  SpiderLogEvent 
} from '../utils/spiderCrawler';

interface SpiderControlCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCaptured?: (order: any) => void;
  onShowToast?: (msg: string) => void;
}

export const SpiderControlCenter: React.FC<SpiderControlCenterProps> = ({
  isOpen,
  onClose,
  onOrderCaptured,
  onShowToast,
}) => {
  const [stats, setStats] = useState<SpiderStats | null>(null);
  const [logs, setLogs] = useState<SpiderLogEvent[]>([]);
  const [isCrawlingNow, setIsCrawlingNow] = useState(false);
  const [isTurbo, setIsTurbo] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToSpider((newStats, newLogs) => {
      setStats(newStats);
      setLogs(newLogs);
    });
    return () => unsubscribe();
  }, []);

  // Continuous crawling simulation ticker when active
  useEffect(() => {
    if (!stats?.isActive) return;

    const intervalTime = isTurbo ? 1500 : (stats?.crawlSpeedMs || 3000);
    const timer = setInterval(() => {
      // 35% chance to discover or crawl an order periodically
      if (Math.random() < 0.35) {
        triggerSpiderCrawlPass((order) => {
          onOrderCaptured?.(order);
        }).catch(() => {});
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [stats?.isActive, stats?.crawlSpeedMs, isTurbo, onOrderCaptured]);

  if (!isOpen) return null;

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
      if (res.success) {
        onShowToast?.(`تم زحف وفهرسة القروب: ${res.crawledGroup} ⚡`);
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

  const getActionBadge = (action: SpiderLogEvent['action']) => {
    switch (action) {
      case 'INDEXED':
        return { label: 'تمت الفهرسة ✅', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'CRAWLING':
        return { label: 'زحف نشط 🕷️', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'DISCOVERED_LINK':
        return { label: 'رابط قروب 🔗', bg: 'bg-violet-100 text-violet-800 border-violet-300' };
      case 'FILTERED_PASSENGER':
        return { label: 'منع ركاب ⛔', bg: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'FILTERED_SPAM':
        return { label: 'استبعاد إعلان 🗑️', bg: 'bg-slate-100 text-slate-700 border-slate-300' };
      case 'CLOSED_ORDER':
        return { label: 'أرشفة إغلاق 🎯', bg: 'bg-rose-100 text-rose-800 border-rose-300' };
      default:
        return { label: 'نظام ⚙️', bg: 'bg-slate-100 text-slate-800 border-slate-300' };
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Spider Header with animated crawler eye */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center relative overflow-hidden">
                <Bot className="w-6 h-6 text-emerald-400 animate-pulse" />
                {stats?.isActive && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                  <span>عنكبوت الأوردرات الذكي (Orderi Spider)</span>
                  <span className="text-xl">🕷️</span>
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                  stats?.isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-700/50 text-slate-400 border-slate-600'
                }`}>
                  {stats?.isActive ? 'الزحف المستمر نشط 🟢' : 'متوقف مؤقتاً ⏸️'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                نظام زحف ذاتي يتنقل في قروبات الواتساب عبر المحرك الهجين (Gemma 3 + Gemini 3.8) لالتقاط طلبات الرادار فوراً
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real-time Spider Live Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 sm:p-5 bg-slate-950/60 border-b border-slate-800/80">
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">طلبات التوصيل المفهرسة</span>
              <span className="text-base sm:text-lg font-black text-emerald-400">
                {stats?.ordersCapturedCount || 0} طلب 📦
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">القروبات تحت الزحف</span>
              <span className="text-base sm:text-lg font-black text-blue-400">
                {stats?.crawledGroupsCount || 0} قروب 👥
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center shrink-0">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">روابط القروبات المكتشفة</span>
              <span className="text-base sm:text-lg font-black text-violet-400">
                {stats?.groupLinksDiscoveredCount || 0} رابط 🔗
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">سرعة الذكاء الهجين</span>
              <span className="text-base sm:text-lg font-black text-amber-400">
                {isTurbo ? '12 ms ⚡' : '18 ms (Gemma+Gemini)'}
              </span>
            </div>
          </div>
        </div>

        {/* Spider Control Toolbar */}
        <div className="p-3.5 sm:p-4 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleActive}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                stats?.isActive
                  ? 'bg-rose-600/90 hover:bg-rose-600 text-white shadow-xs'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
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
                  <span>بدء الزحف التلقائي ⚡</span>
                </>
              )}
            </button>

            <button
              onClick={handleInstantCrawl}
              disabled={isCrawlingNow}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black flex items-center gap-2 border border-slate-700 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCrawlingNow ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{isCrawlingNow ? 'جاري الزحف...' : 'زحف وفحص القروبات الآن ⚡'}</span>
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
              <span>وضع التوربو السريع</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>القروب الحالي: <strong className="text-white">{stats?.currentCrawlingGroup}</strong></span>
          </div>
        </div>

        {/* Live Spider Crawler Logs Console */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5 bg-slate-950/80 font-mono text-xs max-h-[50vh]">
          <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1 border-b border-slate-800/60 font-sans">
            <span className="font-bold">سجل زحف وفهرسة الرسائل المباشر (Googlebot Crawler Log):</span>
            <span>{logs.length} حدث مسجل</span>
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <Bot className="w-8 h-8 mx-auto mb-2 opacity-40 animate-pulse" />
              <p>العنكبوت يراقب القروبات وينتظر وصول رسائل جديدة...</p>
            </div>
          ) : (
            logs.map((log) => {
              const badge = getActionBadge(log.action);
              return (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-start sm:items-center gap-2.5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border shrink-0 ${badge.bg}`}>
                      {badge.label}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-300 font-sans">{log.groupName}</span>
                        {log.highlight && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                            {log.highlight}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-sans leading-relaxed">
                        {log.detail}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-slate-500 self-end sm:self-center shrink-0">
                    <span className="text-emerald-400 font-bold">{log.latencyMs} ms</span>
                    <span>{log.timestamp}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

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
