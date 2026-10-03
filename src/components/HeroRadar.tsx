import { 
  Radar, 
  MapPin, 
  Sparkles, 
  TrendingUp, 
  Coins, 
  CheckCircle2, 
  SlidersHorizontal,
  Share2,
  Zap
} from 'lucide-react';
import { OrderFilter } from '../types';
import { MatcherLocation } from '../utils/matcher';

interface HeroRadarProps {
  filter: OrderFilter;
  driverLocation: MatcherLocation | null;
  totalMonitored: number;
  totalMatched: number;
  vipOrdersCount: number;
  todayEarnings: number;
  acceptedCount: number;
  liveRadarActive: boolean;
  onOpenSettings: () => void;
  onOpenBroadcast?: () => void;
  onOpenBackgroundModal?: () => void;
  onOpenAutoSyncModal?: () => void;
  isStreamConnected?: boolean;
  isWhatsAppWebConnected?: boolean;
  onToggleIgnoreNonMatching?: () => void;
}

export function HeroRadar({
  filter,
  driverLocation,
  totalMonitored,
  totalMatched,
  vipOrdersCount,
  todayEarnings,
  acceptedCount,
  liveRadarActive,
  onOpenSettings,
  onOpenBroadcast,
  onOpenBackgroundModal,
  onOpenAutoSyncModal,
  isStreamConnected = false,
  isWhatsAppWebConnected = false,
}: HeroRadarProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-slate-900 text-white p-4 sm:p-6 lg:p-7 shadow-xl shadow-slate-950/20 border border-slate-800">
      
      {/* Decorative ambient gradients */}
      <div className="absolute left-[-40px] top-[-40px] w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
      <div className="absolute right-[-40px] bottom-[-40px] w-80 h-80 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4 sm:space-y-6">
        
        {/* Top Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 sm:pb-5 border-b border-slate-800">
          
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative shrink-0">
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl shadow-emerald-500/25 border-2 border-emerald-400/40 bg-white p-0.5 flex items-center justify-center">
                <img 
                  src="/logo.png" 
                  alt="Ordari 3D Radar" 
                  className="w-full h-full object-cover rounded-[10px] sm:rounded-[12px]" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="absolute -bottom-0.5 -left-0.5 flex h-3 w-3 sm:h-3.5 sm:w-3.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${liveRadarActive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span className={`relative inline-flex rounded-full h-3 w-3 sm:h-3.5 sm:w-3.5 border-2 border-slate-900 ${liveRadarActive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-2xl font-black tracking-tight text-white">
                  Ordari
                </h1>
                <span className={`px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black border ${
                  liveRadarActive 
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}>
                  {liveRadarActive ? '● نشط' : '○ متوقف'}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] sm:text-xs text-slate-400 max-w-xl leading-relaxed line-clamp-2 sm:line-clamp-none">
                مراقبة فورية لطلبات التوصيل في قروبات الواتساب وتصفيتها تلقائياً وفق موقعك وشروطك المالية.
              </p>
            </div>
          </div>

          {/* Header Action Buttons - 2x2 grid on mobile, inline on desktop */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 w-full lg:w-auto">
            {/* Auto-Sync WhatsApp Webhook & QR Session */}
            {onOpenAutoSyncModal && (
              <button
                onClick={onOpenAutoSyncModal}
                className={`min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2.5 sm:px-4 rounded-xl font-black text-xs transition-all shadow-md active:scale-[0.98] ${
                  isWhatsAppWebConnected
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40 border border-emerald-400/50'
                    : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 shadow-emerald-950/30'
                }`}
                title="الربط التلقائي بواتساب (جلسة باركود + قراءة إشعارات الأندرويد)"
              >
                <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5 shrink-0">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isWhatsAppWebConnected || isStreamConnected ? 'bg-emerald-400 opacity-75' : 'bg-amber-400 opacity-75'}`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 ${isWhatsAppWebConnected || isStreamConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                </span>
                <span className="truncate">{isWhatsAppWebConnected ? 'واتساب متصل 🟢' : 'سحب واتساب ⚡'}</span>
              </button>
            )}

            {onOpenBroadcast && (
              <button
                onClick={onOpenBroadcast}
                className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2.5 sm:px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md shadow-blue-600/25 transition-all active:scale-[0.98]"
              >
                <Share2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">نشر بالقروبات</span>
              </button>
            )}

            {/* Background Mode Trigger */}
            {onOpenBackgroundModal && (
              <button
                onClick={onOpenBackgroundModal}
                className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2.5 sm:px-3.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-bold text-xs transition-all active:scale-[0.98]"
                title="إعدادات وتشغيل الرادار في الخلفية وتثبيت التطبيق"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">في الخلفية ⚡</span>
              </button>
            )}

            <button
              onClick={onOpenSettings}
              className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2.5 sm:px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all active:scale-[0.98]"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">ضبط الفلتر</span>
            </button>
          </div>

        </div>

        {/* 4 Primary Stats Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          
          <div className="rounded-xl sm:rounded-2xl bg-slate-800/60 border border-slate-700/60 p-3 sm:p-4 transition-colors hover:bg-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 text-[11px] sm:text-xs font-semibold">
              <span>الطلبات المرصودة</span>
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1">
              <span className="text-xl sm:text-3xl font-black text-white">{totalMonitored}</span>
              <span className="text-[10px] sm:text-xs text-slate-400">طلب</span>
            </div>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-slate-400 truncate">من قروبات الواتساب</p>
          </div>

          <div className="rounded-xl sm:rounded-2xl bg-slate-800/60 border border-slate-700/60 p-3 sm:p-4 transition-colors hover:bg-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 text-[11px] sm:text-xs font-semibold">
              <span>المطابقة (80%+)</span>
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1">
              <span className="text-xl sm:text-3xl font-black text-emerald-400">{totalMatched}</span>
              <span className="text-[10px] sm:text-xs text-slate-400">مطابق</span>
            </div>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-slate-400 truncate">توافق موقعك وسعرك</p>
          </div>

          <div className="rounded-xl sm:rounded-2xl bg-slate-800/60 border border-slate-700/60 p-3 sm:p-4 transition-colors hover:bg-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 text-[11px] sm:text-xs font-semibold">
              <span>ممتازة VIP (90%+)</span>
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1">
              <span className="text-xl sm:text-3xl font-black text-amber-400">{vipOrdersCount}</span>
              <span className="text-[10px] sm:text-xs text-slate-400">طلب</span>
            </div>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-slate-400 truncate">أعلى أولوية وأرباح</p>
          </div>

          <div className="rounded-xl sm:rounded-2xl bg-slate-800/60 border border-slate-700/60 p-3 sm:p-4 transition-colors hover:bg-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 text-[11px] sm:text-xs font-semibold">
              <span>أرباح اليوم</span>
              <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1">
              <span className="text-xl sm:text-3xl font-black text-white">{todayEarnings.toFixed(1)}</span>
              <span className="text-[10px] sm:text-xs text-emerald-400 font-bold">د.ب</span>
            </div>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-slate-400 truncate">{acceptedCount} طلبات مقبولة</p>
          </div>

        </div>

        {/* Filter Summary Tags */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1 text-[11px] sm:text-xs font-medium text-slate-300">
          <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-800/80 border border-slate-700/70">
            <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
            <span>موقعك: <strong className="text-white font-bold">{driverLocation ? driverLocation.areaName : 'غير محدد'}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-800/80 border border-slate-700/70">
            <span>التغطية: <strong className="text-white font-bold">{filter.coverageKm} كم</strong></span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-800/80 border border-slate-700/70">
            <span>الحد الأدنى: <strong className="text-white font-bold">{filter.minimumPrice.toFixed(1)} د.ب</strong></span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-800/80 border border-slate-700/70">
            <span>الانطلاق: <strong className="text-white font-bold">{filter.startAreas.length > 0 ? `${filter.startAreas.length} منطقة` : 'الكل'}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-800/80 border border-slate-700/70">
            <span>الوجهات: <strong className="text-white font-bold">{filter.destinations.length > 0 ? `${filter.destinations.length} وجهة` : 'الكل'}</strong></span>
          </div>
        </div>

      </div>
    </div>
  );
}

