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
  X
} from 'lucide-react';
import { MatcherLocation } from '../utils/matcher';
import { CaptainUser } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  driverLocation: MatcherLocation | null;
  liveRadarActive: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  ignoreNonMatching: boolean;
  keepScreenAwake?: boolean;
  activeTab: 'radar' | 'settings' | 'ledger' | 'broadcast' | 'map';
  acceptedCount: number;
  todayEarnings: number;
  currentUser?: CaptainUser | null;
  onOpenAuthModal?: (tab?: 'login' | 'register' | 'activate') => void;
  onLogout?: () => void;
  onToggleRadar: () => void;
  onToggleSound: () => void;
  onToggleIgnoreNonMatching: () => void;
  onToggleKeepScreenAwake?: () => void;
  onTabChange: (tab: 'radar' | 'settings' | 'ledger' | 'broadcast' | 'map') => void;
  onOpenVoiceModal?: () => void;
  onOpenBackgroundModal?: () => void;
  onOpenAutoSyncModal?: () => void;
  onOpenDiscoveredGroupsModal?: () => void;
  onOpenAPKModal?: () => void;
  newDiscoveredGroupsCount?: number;
  isStreamConnected?: boolean;
  isWhatsAppConnected?: boolean;
  onRequestGps: () => void;
  isGpsLoading: boolean;
  isCarTrackingActive?: boolean;
  onToggleCarTracking?: () => void;
  carSpeedKmh?: number;
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
  onOpenAPKModal,
  newDiscoveredGroupsCount = 0,
  isStreamConnected = false,
  isWhatsAppConnected = false,
  onRequestGps,
  isGpsLoading,
  isCarTrackingActive = true,
  onToggleCarTracking,
  carSpeedKmh = 0,
}: HeaderProps) {
  const [timeStr, setTimeStr] = useState('');
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);

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
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs w-full max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-20 gap-1 sm:gap-2 w-full max-w-full">
            
            {/* Logo & Identity */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
              <div className="relative">
                <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-2xl overflow-hidden shadow-md shadow-emerald-600/20 ring-2 ring-emerald-500/30 bg-white p-0.5 flex items-center justify-center">
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
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-base sm:text-2xl font-black tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">Ordari</span>
                  <span className="text-[8px] sm:text-xs px-1 sm:px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/60 shadow-2xs">
                    🇧🇭
                  </span>
                </div>
                <p className="hidden sm:block text-[11px] text-slate-500 font-medium">رادار طلبات التوصيل الذكي</p>
              </div>
            </div>

            {/* Center Navigation Tabs (Desktop & Tablet) */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/70">
              <button
                onClick={() => onTabChange('radar')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'radar'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Radar className="w-4 h-4 text-blue-600" />
                <span>الرادار المباشر</span>
              </button>

              <button
                onClick={() => onTabChange('map')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'map'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Map className="w-4 h-4 text-emerald-600" />
                <span>الخريطة والمناطق</span>
              </button>

              <button
                onClick={() => onTabChange('ledger')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'ledger'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>الطلبات المقبولة</span>
                {acceptedCount > 0 && (
                  <span className="px-1.5 py-0.2 text-xs rounded-full bg-emerald-500 text-white font-black">
                    {acceptedCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => onTabChange('broadcast')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'broadcast'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Share2 className="w-4 h-4 text-emerald-600" />
                <span>نشر بالقروبات</span>
              </button>

              <button
                onClick={() => onTabChange('settings')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'settings'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>ضبط الفلتر</span>
              </button>
            </nav>

            {/* Quick Action Controls */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              
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
                  <span className="hidden xs:inline text-[10px] sm:text-xs max-w-[65px] sm:max-w-[130px] truncate">
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
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border-emerald-300'
                  }`}
                  title="ربط WhatsApp العادي بالباركود وقراءة الإشعارات"
                >
                  <QrCode className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isWhatsAppConnected ? 'text-white' : 'text-emerald-600'}`} />
                  <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isWhatsAppConnected || isStreamConnected ? 'bg-emerald-400 opacity-75' : 'bg-amber-400 opacity-75'}`} />
                    <span className={`relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 ${isWhatsAppConnected || isStreamConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  </span>
                  <span className="hidden sm:inline text-xs">{isWhatsAppConnected ? 'متصل' : 'ربط'}</span>
                </button>
              )}

              {/* Sound Toggle */}
              <button
                onClick={onToggleSound}
                title={soundEnabled ? 'كتم التنبيهات الصوتية' : 'تفعيل التنبيهات الصوتية'}
                className={`h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-xl border transition-all active:scale-95 ${
                  soundEnabled
                    ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                    : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Screen Wake Lock Switch (Keep screen awake while driving) - hidden on small mobile */}
              {onToggleKeepScreenAwake && (
                <button
                  onClick={onToggleKeepScreenAwake}
                  title={keepScreenAwake ? 'إبقاء الشاشة مضاءة: مفعّل ☀️' : 'إبقاء الشاشة مضاءة: معطّل 🌙'}
                  className={`hidden sm:flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border transition-all active:scale-95 ${
                    keepScreenAwake
                      ? 'bg-amber-50 text-amber-600 border-amber-300'
                      : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {keepScreenAwake ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              )}

              {/* Discovered WhatsApp Group Links Sniffer Button - hidden on mobile screens */}
              {onOpenDiscoveredGroupsModal && (
                <button
                  onClick={onOpenDiscoveredGroupsModal}
                  title="صائد روابط قروبات التوصيل المنشورة في الواتساب"
                  className={`hidden md:flex h-9 sm:h-10 items-center gap-1.5 px-2.5 sm:px-3 rounded-xl text-xs font-black transition-all shadow-xs border active:scale-95 ${
                    newDiscoveredGroupsCount > 0
                      ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white border-teal-500'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>القروبات</span>
                </button>
              )}

              {/* PWA Install & APK Modal Button - visible on tablet/desktop */}
              {onOpenAPKModal && (
                <button
                  onClick={onOpenAPKModal}
                  title="تثبيت التطبيق على الهاتف كـ APK أصلي"
                  className="hidden lg:flex h-10 items-center gap-1.5 px-3 rounded-xl text-xs font-black transition-all bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xs border border-emerald-500 cursor-pointer active:scale-95"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-200" />
                  <span>تثبيت APK</span>
                </button>
              )}

              {/* PWA Install Button (Desktop/Tablet) */}
              <div className="hidden sm:block">
                <PWAInstallButton />
              </div>

              {/* Live Radar Toggle */}
              <button
                onClick={onToggleRadar}
                title={liveRadarActive ? 'إيقاف الرادار مؤقتاً' : 'تفعيل الرادار'}
                className={`h-9 px-2 sm:h-10 sm:px-3.5 flex items-center justify-center gap-1 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                  liveRadarActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                <Wifi className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${liveRadarActive ? 'animate-pulse' : ''}`} />
                <span className="hidden sm:inline">{liveRadarActive ? 'جاهز 🟢' : 'متوقف'}</span>
              </button>

              {/* Exit / Logout Button (خروج من البرنامج) */}
              <button
                onClick={() => setIsExitConfirmOpen(true)}
                title="خروج من البرنامج"
                aria-label="خروج من البرنامج"
                className="h-9 px-2 sm:h-10 sm:px-3 flex items-center justify-center gap-1 rounded-xl text-xs font-black bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all active:scale-95 shadow-2xs cursor-pointer shrink-0"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 shrink-0" />
                <span className="hidden xs:inline text-[11px] sm:text-xs">خروج</span>
              </button>

            </div>

          </div>
        </div>
      </header>

      {/* Fixed Bottom Navigation Bar for Mobile Phones */}
      <nav 
        id="mobile-bottom-nav" 
        aria-label="التنقل الرئيسي للهاتف"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-2xl border-t border-slate-200/90 shadow-[0_-4px_24px_rgba(0,0,0,0.09)] px-2 py-1 flex items-center justify-around"
        style={{ paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom))' }}
      >
        {/* 1. Radar Feed */}
        <button
          id="mobile-nav-radar"
          onClick={() => onTabChange('radar')}
          className={`min-h-[48px] flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all flex-1 active:scale-95 ${
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
          <span className="text-[11px] mt-0.5">الرادار</span>
        </button>

        {/* 2. Interactive Map */}
        <button
          id="mobile-nav-map"
          onClick={() => onTabChange('map')}
          className={`min-h-[48px] flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all flex-1 active:scale-95 ${
            activeTab === 'map'
              ? 'text-emerald-700 font-black bg-emerald-50/80 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Map className={`w-5 h-5 ${activeTab === 'map' ? 'text-emerald-600' : 'text-slate-500'}`} />
          <span className="text-[11px] mt-0.5">الخريطة</span>
        </button>

        {/* 3. CENTER BUTTON: Broadcast */}
        <button
          id="mobile-nav-broadcast"
          onClick={() => onTabChange('broadcast')}
          className={`min-h-[48px] flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all flex-1 active:scale-95 ${
            activeTab === 'broadcast'
              ? 'text-emerald-700 font-black bg-emerald-50/80 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Send className={`w-5 h-5 ${activeTab === 'broadcast' ? 'text-emerald-600' : 'text-slate-500'}`} />
          <span className="text-[11px] mt-0.5">نشر طلب</span>
        </button>

        {/* 4. Accepted Ledger & Daily Earnings */}
        <button
          id="mobile-nav-ledger"
          onClick={() => onTabChange('ledger')}
          className={`min-h-[48px] flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all flex-1 relative active:scale-95 ${
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
          <span className="text-[11px] mt-0.5">المقبولة</span>
        </button>

        {/* 5. Filter Settings */}
        <button
          id="mobile-nav-settings"
          onClick={() => onTabChange('settings')}
          className={`min-h-[48px] flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all flex-1 active:scale-95 ${
            activeTab === 'settings'
              ? 'text-emerald-700 font-black bg-emerald-50/80 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className={`w-5 h-5 ${activeTab === 'settings' ? 'text-emerald-600' : 'text-slate-500'}`} />
          <span className="text-[11px] mt-0.5">الفلتر</span>
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
