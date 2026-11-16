import { useState, useEffect } from 'react';
import { 
  Radar, 
  Wifi, 
  MapPin, 
  Volume2, 
  VolumeX, 
  Bell, 
  Sliders, 
  FileSpreadsheet, 
  FilterX, 
  Share2, 
  Zap, 
  QrCode, 
  Smartphone,
  Plus,
  Map,
  Sun,
  Moon,
  Send,
  Link as LinkIcon,
  Fingerprint,
  User,
  KeyRound,
  ShieldCheck,
  LogOut,
  Car,
  Navigation,
  X,
  CalendarDays,
  Clock,
  CheckCheck,
  RefreshCw,
  Scan,
  Camera,
  Bot
} from 'lucide-react';
import { MatcherLocation } from '../utils/matcher';
import { CaptainUser } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { DeviceTrialStatus } from '../utils/deviceTrialManager';

interface HeaderProps {
  driverLocation: MatcherLocation | null;
  liveRadarActive: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  ignoreNonMatching: boolean;
  keepScreenAwake?: boolean;
  activeTab: 'radar' | 'settings' | 'ledger' | 'broadcast' | 'map' | 'bridge';
  acceptedCount: number;
  todayEarnings: number;
  currentUser?: CaptainUser | null;
  onOpenAuthModal?: (tab?: 'login' | 'register' | 'activate') => void;
  onLogout?: () => void;
  onToggleRadar: () => void;
  onToggleSound: () => void;
  onToggleIgnoreNonMatching: () => void;
  onToggleKeepScreenAwake?: () => void;
  onTabChange: (tab: 'radar' | 'settings' | 'ledger' | 'broadcast' | 'map' | 'bridge') => void;
  isBridgeConnected?: boolean;
  onOpenVoiceModal?: () => void;
  onOpenBackgroundModal?: () => void;
  onOpenAutoSyncModal?: () => void;
  onOpenDiscoveredGroupsModal?: () => void;
  onOpenCommitments?: () => void;
  commitmentsCount?: number;
  onOpenAPKModal?: () => void;
  newDiscoveredGroupsCount?: number;
  isStreamConnected?: boolean;
  isWhatsAppConnected?: boolean;
  onRequestGps: () => void;
  isGpsLoading: boolean;
  isCarTrackingActive?: boolean;
  onToggleCarTracking?: () => void;
  carSpeedKmh?: number;
  trialStatus?: DeviceTrialStatus | null;
  onOpenTrialModal?: () => void;
  onMarkAllWhatsAppAsRead?: () => void;
  onOpenFaceLogin?: () => void;
  onShowSplash?: () => void;
  onOpenSpider?: () => void;
}

export function Header({
  driverLocation,
  liveRadarActive,
  soundEnabled,
  ignoreNonMatching,
  keepScreenAwake = false,
  activeTab,
  acceptedCount,
  currentUser,
  onOpenAuthModal,
  onLogout,
  todayEarnings,
  onToggleRadar,
  onToggleSound,
  onToggleIgnoreNonMatching,
  onToggleKeepScreenAwake,
  onTabChange,
  onOpenBackgroundModal,
  onOpenAutoSyncModal,
  onOpenDiscoveredGroupsModal,
  onOpenCommitments,
  commitmentsCount = 0,
  onOpenAPKModal,
  newDiscoveredGroupsCount = 0,
  isStreamConnected = false,
  isWhatsAppConnected = false,
  onRequestGps,
  isGpsLoading,
  isCarTrackingActive = true,
  onToggleCarTracking,
  carSpeedKmh = 0,
  trialStatus,
  onOpenTrialModal,
  onMarkAllWhatsAppAsRead,
  onOpenFaceLogin,
  onShowSplash,
  onOpenSpider,
  isBridgeConnected = false,
}: HeaderProps) {
  const [timeStr, setTimeStr] = useState('');
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
  const [isMarkingInternal, setIsMarkingInternal] = useState(false);
  const [justMarked, setJustMarked] = useState(false);

  const handleMarkReadClick = async () => {
    if (isMarkingInternal || !onMarkAllWhatsAppAsRead) return;
    setIsMarkingInternal(true);
    try {
      await onMarkAllWhatsAppAsRead();
      setJustMarked(true);
      setTimeout(() => setJustMarked(false), 3000);
    } catch {
    } finally {
      setIsMarkingInternal(false);
    }
  };

  const handleExitApp = () => {
    setIsExitConfirmOpen(false);
    onLogout?.();
    try {
      const capApp = (window as any)?.Capacitor?.Plugins?.App;
      if (capApp?.exitApp) {
        capApp.exitApp();
        return;
      }
    } catch {}
    try {
      window.close();
    } catch {}
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('ar-BH', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header 
        className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs w-full max-w-full"
        style={{ paddingTop: 'max(0px, env(safe-area-inset-top))' }}
      >
        <div className="max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-5">
          <div className="flex items-center justify-between h-14 sm:h-18 gap-1.5 sm:gap-2 w-full max-w-full">
            
            {/* Logo & Identity */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 min-w-0">
              <div className="relative">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-2xl overflow-hidden shadow-md shadow-emerald-600/20 ring-2 ring-emerald-500/30 bg-white p-0.5 flex items-center justify-center">
                  <img 
                    src="/logo.png" 
                    alt="Ordari Bahrain Radar" 
                    className="w-full h-full object-cover rounded-[7px] sm:rounded-[12px]" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="absolute -bottom-0.5 -left-0.5 flex h-2 w-2 sm:h-3.5 sm:w-3.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${liveRadarActive ? 'bg-emerald-400 opacity-75' : 'bg-amber-400 opacity-75'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 sm:h-3.5 sm:w-3.5 border-2 border-white ${liveRadarActive ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <span className="text-base sm:text-xl font-black tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">Ordari</span>
                  <span className="text-[8px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/60 shadow-2xs">
                    🇧🇭
                  </span>

                  {/* 7-Day Device Trial Badge (Compact on mobile) */}
                  {trialStatus && onOpenTrialModal && (
                    <button
                      type="button"
                      onClick={onOpenTrialModal}
                      title="تفاصيل الفترة التجريبية وترخيص هذا الهاتف"
                      className={`h-6 sm:h-7 flex items-center gap-1 px-1.5 sm:px-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black transition-all border shrink-0 cursor-pointer active:scale-95 shadow-2xs ${
                        trialStatus.isActivated
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : trialStatus.isExpired
                          ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                          : 'bg-gradient-to-r from-amber-50 to-emerald-50 text-emerald-950 border-emerald-300/80 hover:bg-emerald-100'
                      }`}
                    >
                      {trialStatus.isActivated ? (
                        <>
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span className="hidden xl:inline">مفعّل</span>
                        </>
                      ) : trialStatus.isExpired ? (
                        <>
                          <Clock className="w-3 h-3 text-rose-600" />
                          <span>انتهت</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 text-amber-600 animate-spin-slow" />
                          <span>{trialStatus.daysRemaining > 0 ? `${trialStatus.daysRemaining}ي` : `${trialStatus.hoursRemaining}س`} ⏳</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <p className="hidden 2xl:block text-[11px] text-slate-500 font-medium whitespace-nowrap">رادار طلبات التوصيل الذكي</p>
              </div>
            </div>

            {/* Center Navigation Tabs (Desktop & Tablet) */}
            <nav className="hidden md:flex items-center gap-0.5 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/70 shrink min-w-0 overflow-x-auto no-scrollbar">
              <button
                onClick={() => onTabChange('radar')}
                className={`flex items-center gap-1 px-2 2xl:px-3 py-1.5 rounded-xl text-xs 2xl:text-[13px] font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'radar'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Radar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>الرادار</span>
              </button>

              <button
                onClick={() => onTabChange('map')}
                className={`flex items-center gap-1 px-2 2xl:px-3 py-1.5 rounded-xl text-xs 2xl:text-[13px] font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'map'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Map className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>الخريطة</span>
              </button>

              <button
                onClick={() => onTabChange('ledger')}
                className={`flex items-center gap-1 px-2 2xl:px-3 py-1.5 rounded-xl text-xs 2xl:text-[13px] font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'ledger'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>المقبولة</span>
                {acceptedCount > 0 && (
                  <span className="px-1.5 py-0.2 text-[11px] rounded-full bg-emerald-500 text-white font-black">
                    {acceptedCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => onTabChange('broadcast')}
                className={`flex items-center gap-1 px-2 2xl:px-3 py-1.5 rounded-xl text-xs 2xl:text-[13px] font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'broadcast'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>نشر طلب</span>
              </button>

              {onOpenCommitments && (
                <button
                  onClick={onOpenCommitments}
                  className="flex items-center gap-1 px-2 2xl:px-3 py-1.5 rounded-xl text-xs 2xl:text-[13px] font-bold transition-all whitespace-nowrap shrink-0 text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50/70 cursor-pointer"
                >
                  <CalendarDays className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>الالتزامات</span>
                  {commitmentsCount > 0 && (
                    <span className="px-1.5 py-0.2 text-[11px] rounded-full bg-indigo-600 text-white font-black">
                      {commitmentsCount}
                    </span>
                  )}
                </button>
              )}

              <button
                onClick={() => onTabChange('settings')}
                className={`flex items-center gap-1 px-2 2xl:px-3 py-1.5 rounded-xl text-xs 2xl:text-[13px] font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>الفلتر</span>
              </button>

              <button
                onClick={() => onTabChange('bridge')}
                title="WhatsApp Web Bridge (Pairing Code)"
                aria-label="WhatsApp Bridge"
                className={`flex items-center gap-1 px-2 2xl:px-3 py-1.5 rounded-xl text-xs 2xl:text-[13px] font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'bridge'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Bridge</span>
                {isBridgeConnected && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                )}
              </button>
            </nav>

            {/* Desktop Quick Action Controls (Hidden on mobile, visible on tablet/desktop) */}
            <div className="hidden md:flex items-center gap-1 sm:gap-1.5 shrink-0">
              
              {/* GPS Location & Live Vehicle Tracking Button */}
              <div className="flex items-center gap-1">
                <button
                  onClick={onRequestGps}
                  title={isCarTrackingActive ? "تتبع حركة السيارة نشط: انقر لتحديث موقعك الآن عبر GPS" : "تحديد وتحديث موقعك الحالي عبر GPS"}
                  className={`h-9 sm:h-10 flex items-center justify-center gap-1.5 px-2 sm:px-3 rounded-xl text-xs font-bold border transition-all active:scale-95 cursor-pointer ${
                    isCarTrackingActive
                      ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-950 border-emerald-300 hover:bg-emerald-100 shadow-2xs'
                      : driverLocation
                      ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  {isCarTrackingActive ? (
                    <Car className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 animate-pulse shrink-0" />
                  ) : (
                    <MapPin className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isGpsLoading ? 'animate-bounce text-amber-600' : 'text-emerald-600'}`} />
                  )}
                  <span className="text-[10px] sm:text-xs max-w-[65px] sm:max-w-[130px] truncate">
                    {isGpsLoading ? '...' : (carSpeedKmh > 10 ? `${carSpeedKmh} كم/س` : driverLocation?.areaName || 'موقعي')}
                  </span>
                  {isCarTrackingActive && (
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </button>

                {onToggleCarTracking && (
                  <button
                    onClick={onToggleCarTracking}
                    title={isCarTrackingActive ? "إيقاف تتبع حركة السيارة" : "تشغيل تتبع حركة السيارة (يتغير موقعك تلقائياً كلما تحركت)"}
                    className={`h-9 w-8 sm:h-10 sm:w-9 hidden md:flex items-center justify-center rounded-xl border text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                      isCarTrackingActive
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                        : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <Navigation className={`w-3.5 h-3.5 ${isCarTrackingActive ? 'rotate-45 text-white' : 'text-slate-400'}`} />
                  </button>
                )}
              </div>

              {/* WhatsApp Auto-Sync & Webhook Hub Button */}
              {onOpenAutoSyncModal && (
                <button
                  onClick={onOpenAutoSyncModal}
                  className={`h-9 sm:h-10 flex items-center justify-center gap-1 px-2 sm:px-3 rounded-xl text-xs font-black transition-all shadow-2xs border active:scale-95 ${
                    isWhatsAppConnected
                      ? 'bg-emerald-500/25 hover:bg-emerald-500/35 text-emerald-950 border-emerald-400/60 shadow-emerald-500/10 backdrop-blur-sm'
                      : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-950 border-emerald-400/50 backdrop-blur-sm'
                  }`}
                  title="ربط WhatsApp العادي بالباركود وقراءة الإشعارات"
                >
                  <QrCode className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isWhatsAppConnected ? 'text-white' : 'text-emerald-600'}`} />
                  <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isWhatsAppConnected || isStreamConnected ? 'bg-emerald-400 opacity-75' : 'bg-amber-400 opacity-75'}`} />
                    <span className={`relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 ${isWhatsAppConnected || isStreamConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  </span>
                  <span className="text-xs">{isWhatsAppConnected ? 'متصل' : 'ربط'}</span>
                </button>
              )}

              {/* Mark All WhatsApp Groups as Read Button */}
              {onMarkAllWhatsAppAsRead && (
                <button
                  type="button"
                  onClick={handleMarkReadClick}
                  disabled={isMarkingInternal}
                  className={`h-9 sm:h-10 flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 rounded-xl text-xs font-black transition-all shadow-2xs border cursor-pointer active:scale-95 ${
                    justMarked
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30 ring-2 ring-emerald-400/50'
                      : isMarkingInternal
                      ? 'bg-teal-100 text-teal-800 border-teal-300 opacity-90 cursor-wait'
                      : 'bg-teal-50 hover:bg-teal-100 text-teal-950 border-teal-300/90 hover:border-teal-400'
                  }`}
                  title="تحديد الكل و(Mark as Read) لجميع قروبات الواتساب لتصفير عداد الرسائل"
                >
                  {isMarkingInternal ? (
                    <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-700 animate-spin shrink-0" />
                  ) : justMarked ? (
                    <CheckCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white shrink-0" />
                  ) : (
                    <CheckCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-700 shrink-0" />
                  )}
                  <span className="text-[10px] sm:text-[11px] font-black shrink-0 whitespace-nowrap">
                    {isMarkingInternal ? 'جاري...' : justMarked ? 'مقروءة ✓✓' : 'قراءة الكل'}
                  </span>
                </button>
              )}

              {/* Sound Toggle */}
              <button
                onClick={onToggleSound}
                title={soundEnabled ? 'كتم التنبيهات الصوتية' : 'تفعيل التنبيهات الصوتية'}
                className={`h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-xl border transition-all active:scale-95 cursor-pointer ${
                  soundEnabled
                    ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                    : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Screen Wake Lock Switch */}
              {onToggleKeepScreenAwake && (
                <button
                  onClick={onToggleKeepScreenAwake}
                  title={keepScreenAwake ? 'إبقاء الشاشة مضاءة: مفعّل ☀️' : 'إبقاء الشاشة مضاءة: معطّل 🌙'}
                  className={`hidden 2xl:flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border transition-all active:scale-95 cursor-pointer ${
                    keepScreenAwake
                      ? 'bg-amber-50 text-amber-600 border-amber-300'
                      : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {keepScreenAwake ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              )}

              {/* Discovered WhatsApp Group Links Sniffer Button */}
              {onOpenDiscoveredGroupsModal && (
                <button
                  onClick={onOpenDiscoveredGroupsModal}
                  title="صائد روابط قروبات التوصيل المنشورة في الواتساب"
                  className={`h-9 sm:h-10 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-xl text-xs font-black transition-all shadow-xs border active:scale-95 cursor-pointer ${
                    newDiscoveredGroupsCount > 0
                      ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white border-teal-500'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>القروبات</span>
                </button>
              )}

              {/* Orderi Spider operates automatically in the background without needing a manual button */}

              {/* PWA Install & APK Modal Button */}
              {onOpenAPKModal && (
                <button
                  onClick={onOpenAPKModal}
                  title="تثبيت التطبيق على الهاتف كـ APK أصلي"
                  className="hidden 2xl:flex h-10 items-center gap-1.5 px-3 rounded-xl text-xs font-black transition-all bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xs border border-emerald-500 cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-200" />
                  <span>تثبيت APK</span>
                </button>
              )}

              {/* PWA Install Button */}
              <div className="hidden 2xl:block">
                <PWAInstallButton />
              </div>

              {/* Face ID Camera Biometrics Quick Trigger */}
              {onOpenFaceLogin && (
                <button
                  type="button"
                  onClick={onOpenFaceLogin}
                  title="فحص وتسجيل الدخول ببصمة الوجه (Face ID)"
                  className="hidden 2xl:flex h-9 sm:h-10 items-center gap-1 px-2.5 rounded-xl text-xs font-black transition-all bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 shadow-2xs cursor-pointer active:scale-95 shrink-0 whitespace-nowrap"
                >
                  <Scan className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Face ID</span>
                </button>
              )}

              {/* Live Radar Toggle */}
              <button
                onClick={onToggleRadar}
                title={liveRadarActive ? 'إيقاف الرادار مؤقتاً' : 'تفعيل الرادار'}
                className={`h-9 px-2 sm:h-10 sm:px-3.5 flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                  liveRadarActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                <Wifi className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${liveRadarActive ? 'animate-pulse' : ''}`} />
                <span>{liveRadarActive ? 'جاهز 🟢' : 'متوقف'}</span>
              </button>

              {/* Exit / Logout Button (خروج من البرنامج) - Desktop */}
              <button
                onClick={() => setIsExitConfirmOpen(true)}
                title="خروج من البرنامج بالكامل"
                aria-label="خروج من البرنامج بالكامل"
                className="h-9 px-3 sm:h-10 sm:px-4 flex items-center justify-center gap-1.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white border border-rose-500 transition-all active:scale-95 shadow-sm shadow-rose-600/30 cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4 text-white shrink-0" />
                <span className="text-xs font-black text-white">خروج</span>
              </button>

            </div>

            {/* Mobile Top Actions (Always visible on phone screen) */}
            <div className="flex md:hidden items-center gap-1.5 shrink-0">
              {/* Sound Toggle */}
              <button
                onClick={onToggleSound}
                title={soundEnabled ? 'كتم الصوت' : 'تفعيل الصوت'}
                className={`h-8 w-8 flex items-center justify-center rounded-xl border transition-all active:scale-95 shrink-0 cursor-pointer ${
                  soundEnabled
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              {/* Live Radar Toggle */}
              <button
                onClick={onToggleRadar}
                title={liveRadarActive ? 'إيقاف الرادار' : 'تشغيل الرادار'}
                className={`h-8 px-2 flex items-center justify-center gap-1 rounded-xl text-xs font-bold transition-all active:scale-95 shrink-0 cursor-pointer ${
                  liveRadarActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                <Wifi className={`w-3.5 h-3.5 ${liveRadarActive ? 'animate-pulse' : ''}`} />
                <span className="text-[10px] font-bold">{liveRadarActive ? 'جاهز' : 'متوقف'}</span>
              </button>

              {/* Exit / Logout Button (خروج من البرنامج) - GUARANTEED VISIBLE ON MOBILE */}
              <button
                id="header-mobile-exit-button"
                onClick={() => setIsExitConfirmOpen(true)}
                title="خروج من البرنامج بالكامل"
                aria-label="خروج من البرنامج بالكامل"
                className="h-8 px-2.5 sm:px-3 flex items-center justify-center gap-1 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white border border-rose-500 shadow-sm shadow-rose-600/30 transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <LogOut className="w-3.5 h-3.5 text-white shrink-0" />
                <span className="text-xs font-black text-white shrink-0">خروج</span>
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Secondary Action Toolbar (Row 2 on phone screen: Location, WhatsApp, Mark Read, Commitments, Groups) */}
        <div className="md:hidden border-t border-slate-200/80 bg-slate-50/95 px-2.5 py-2 flex flex-wrap items-stretch gap-1.5">
          {/* GPS Location & Live Vehicle Tracking */}
          <button
            type="button"
            onClick={onRequestGps}
            title={isCarTrackingActive ? "تتبع حركة السيارة نشط: انقر لتحديث موقعك الآن عبر GPS" : "تحديد وتحديث موقعك الحالي عبر GPS"}
            className={`flex-1 min-w-[calc(33.333%-0.25rem)] min-h-[42px] flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl text-[11px] font-bold border transition-all active:scale-95 cursor-pointer shadow-2xs ${
              isCarTrackingActive
                ? 'bg-emerald-50 text-emerald-950 border-emerald-300 ring-1 ring-emerald-400/30'
                : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300'
            }`}
          >
            {isCarTrackingActive ? (
              <Car className="w-3.5 h-3.5 text-emerald-600 animate-pulse shrink-0" />
            ) : (
              <MapPin className={`w-3.5 h-3.5 shrink-0 ${isGpsLoading ? 'animate-bounce text-amber-600' : 'text-emerald-600'}`} />
            )}
            <span className="truncate font-bold">
              {isGpsLoading ? 'تحديد...' : (carSpeedKmh > 10 ? `${carSpeedKmh} كم/س` : driverLocation?.areaName || 'موقعي')}
            </span>
          </button>

          {/* WhatsApp Auto-Sync */}
          {onOpenAutoSyncModal && (
            <button
              type="button"
              onClick={onOpenAutoSyncModal}
              title="ربط واتساب وقراءة الإشعارات"
              className={`flex-1 min-w-[calc(33.333%-0.25rem)] min-h-[42px] flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl text-[11px] font-bold border transition-all active:scale-95 cursor-pointer shadow-2xs ${
                isWhatsAppConnected
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                  : 'bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-300'
              }`}
            >
              <QrCode className={`w-3.5 h-3.5 shrink-0 ${isWhatsAppConnected ? 'text-white' : 'text-emerald-600'}`} />
              <span className="whitespace-nowrap truncate">{isWhatsAppConnected ? 'واتساب متصل' : 'ربط واتساب'}</span>
            </button>
          )}

          {/* Mark All WhatsApp Groups as Read */}
          {onMarkAllWhatsAppAsRead && (
            <button
              type="button"
              onClick={handleMarkReadClick}
              disabled={isMarkingInternal}
              title="تحديد الكل وقراءة جميع قروبات الواتساب بما فيها المؤرشفة"
              className={`flex-1 min-w-[calc(33.333%-0.25rem)] min-h-[42px] flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl text-[11px] font-bold border transition-all active:scale-95 cursor-pointer shadow-2xs ${
                justMarked
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : isMarkingInternal
                  ? 'bg-slate-100 text-slate-600 border-slate-300 opacity-80 cursor-wait'
                  : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900'
              }`}
            >
              {isMarkingInternal ? (
                <RefreshCw className="w-3.5 h-3.5 text-slate-600 animate-spin shrink-0" />
              ) : (
                <CheckCheck className={`w-3.5 h-3.5 shrink-0 ${justMarked ? 'text-emerald-600' : 'text-emerald-400'}`} />
              )}
              <span className="whitespace-nowrap truncate font-bold">
                {isMarkingInternal ? 'جاري...' : justMarked ? 'مقروءة ✓' : 'قراءة الكل'}
              </span>
            </button>
          )}

          {/* Commitments if any */}
          {onOpenCommitments && commitmentsCount > 0 && (
            <button
              type="button"
              onClick={onOpenCommitments}
              className="flex-1 min-w-[calc(50%-0.25rem)] min-h-[40px] flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-950 shadow-2xs active:scale-95 cursor-pointer"
            >
              <CalendarDays className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>الالتزامات</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-indigo-600 text-white font-black tabular-nums leading-none">
                {commitmentsCount}
              </span>
            </button>
          )}

          {/* Discovered Groups if any */}
          {onOpenDiscoveredGroupsModal && newDiscoveredGroupsCount > 0 && (
            <button
              type="button"
              onClick={onOpenDiscoveredGroupsModal}
              className="flex-1 min-w-[calc(50%-0.25rem)] min-h-[40px] flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-950 shadow-2xs active:scale-95 cursor-pointer"
            >
              <LinkIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>قروبات مكتشفة</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-emerald-600 text-white font-black tabular-nums leading-none">
                {newDiscoveredGroupsCount}
              </span>
            </button>
          )}
        </div>
      </header>

      {/* Fixed Bottom Navigation Bar for Mobile Phones */}
      <nav 
        id="mobile-bottom-nav" 
        aria-label="التنقل الرئيسي للهاتف"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-2xl border-t border-slate-200/90 shadow-[0_-4px_24px_rgba(0,0,0,0.09)] px-1.5 py-1 flex items-center justify-between"
        style={{ paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom))' }}
      >
        {/* 1. Radar Feed */}
        <button
          id="mobile-nav-radar"
          onClick={() => onTabChange('radar')}
          className={`min-h-[48px] flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all flex-1 active:scale-95 cursor-pointer ${
            activeTab === 'radar'
              ? 'text-emerald-700 font-black bg-emerald-50/80 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <Radar className={`w-5 h-5 ${activeTab === 'radar' ? 'text-emerald-600' : 'text-slate-500'}`} />
            {liveRadarActive && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
          </div>
          <span className="text-[10px] sm:text-[11px] mt-0.5">الرادار</span>
        </button>

        {/* 2. Interactive Map */}
        <button
          id="mobile-nav-map"
          onClick={() => onTabChange('map')}
          className={`min-h-[48px] flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all flex-1 active:scale-95 cursor-pointer ${
            activeTab === 'map'
              ? 'text-emerald-700 font-black bg-emerald-50/80 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Map className={`w-5 h-5 ${activeTab === 'map' ? 'text-emerald-600' : 'text-slate-500'}`} />
          <span className="text-[10px] sm:text-[11px] mt-0.5">الخريطة</span>
        </button>

        {/* 3. CENTER BUTTON: Broadcast */}
        <button
          id="mobile-nav-broadcast"
          onClick={() => onTabChange('broadcast')}
          className={`min-h-[48px] flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all flex-1 active:scale-95 cursor-pointer ${
            activeTab === 'broadcast'
              ? 'text-emerald-700 font-black bg-emerald-50/80 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Send className={`w-5 h-5 ${activeTab === 'broadcast' ? 'text-emerald-600' : 'text-slate-500'}`} />
          <span className="text-[10px] sm:text-[11px] mt-0.5">نشر طلب</span>
        </button>

        {/* 4. Accepted Ledger & Daily Earnings */}
        <button
          id="mobile-nav-ledger"
          onClick={() => onTabChange('ledger')}
          className={`min-h-[48px] flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all flex-1 relative active:scale-95 cursor-pointer ${
            activeTab === 'ledger'
              ? 'text-emerald-700 font-black bg-emerald-50/80 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <FileSpreadsheet className={`w-5 h-5 ${activeTab === 'ledger' ? 'text-emerald-600' : 'text-slate-500'}`} />
            {acceptedCount > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 bg-emerald-600 text-white rounded-full text-[9px] font-black shadow-xs">
                {acceptedCount}
              </span>
            )}
          </div>
          <span className="text-[10px] sm:text-[11px] mt-0.5">المقبولة</span>
        </button>

        {/* 5. Filter Settings */}
        <button
          id="mobile-nav-settings"
          onClick={() => onTabChange('settings')}
          className={`min-h-[48px] flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all flex-1 active:scale-95 cursor-pointer ${
            activeTab === 'settings'
              ? 'text-emerald-700 font-black bg-emerald-50/80 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className={`w-5 h-5 ${activeTab === 'settings' ? 'text-emerald-600' : 'text-slate-500'}`} />
          <span className="text-[10px] sm:text-[11px] mt-0.5">الفلتر</span>
        </button>

        {/* 5B. WhatsApp Bridge */}
        <button
          id="mobile-nav-bridge"
          onClick={() => onTabChange('bridge')}
          className={`min-h-[48px] flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all flex-1 relative active:scale-95 cursor-pointer ${
            activeTab === 'bridge'
              ? 'text-emerald-700 font-black bg-emerald-50/80 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <LinkIcon className={`w-5 h-5 ${activeTab === 'bridge' ? 'text-emerald-600' : 'text-slate-500'}`} />
            {isBridgeConnected && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white" />
            )}
          </div>
          <span className="text-[10px] sm:text-[11px] mt-0.5">Bridge</span>
        </button>

        {/* 6. Exit Button (خروج من البرنامج) - In Mobile Bottom Navigation Bar */}
        <button
          id="mobile-nav-exit"
          onClick={() => setIsExitConfirmOpen(true)}
          className="min-h-[48px] flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all flex-1 active:scale-95 text-rose-600 hover:text-rose-700 hover:bg-rose-50/80 cursor-pointer"
          title="خروج من البرنامج بالكامل"
          aria-label="خروج من البرنامج بالكامل"
        >
          <LogOut className="w-5 h-5 text-rose-600" />
          <span className="text-[10px] sm:text-[11px] font-black text-rose-700 mt-0.5">خروج</span>
        </button>
      </nav>

      {/* Exit Confirmation Modal (تأكيد الخروج من البرنامج) */}
      {isExitConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsExitConfirmOpen(false)}
        >
          <div
            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 p-5 sm:p-6 text-slate-800 space-y-4 animate-in zoom-in-95 duration-150"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0 shadow-inner">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">إغلاق البرنامج بالكامل</h3>
                  <p className="text-[11px] text-slate-500 font-medium">إيقاف الرادار وإغلاق التطبيق 🛑</p>
                </div>
              </div>

              <button
                onClick={() => setIsExitConfirmOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              هل أنت متأكد من رغبتك في إغلاق برنامج Ordari بالكامل؟ سيتم إيقاف المراقبة اللحظية للرادار وقناة سحب طلبات الواتساب وحفظ سجل عملك وإغلاق التطبيق بأمان.
            </p>

            {currentUser && (
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">{currentUser.name}</span>
                  <span className="text-[11px] text-slate-500 font-mono">{currentUser.phone}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  {currentUser.licensePlan || 'حساب مفعل'}
                </span>
              </div>
            )}

            <div className="space-y-2 pt-1">
              <button
                onClick={handleExitApp}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs sm:text-sm shadow-md shadow-rose-600/25 transition-all active:scale-[0.98] cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>نعم، إغلاق البرنامج بالكامل 🛑</span>
              </button>

              <button
                onClick={() => setIsExitConfirmOpen(false)}
                className="w-full flex items-center justify-center py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                إلغاء والبقاء في التطبيق
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
