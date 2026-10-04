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
  ShieldCheck
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
  isWhatsAppWebConnected?: boolean;
  onRequestGps: () => void;
  isGpsLoading: boolean;
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
  isWhatsAppWebConnected = false,
  onRequestGps,
  isGpsLoading,
}: HeaderProps) {
  const [timeStr, setTimeStr] = useState('');

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
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
            
            {/* Logo & Identity */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="relative">
                <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl overflow-hidden shadow-md shadow-emerald-600/20 ring-2 ring-emerald-500/30 bg-white p-0.5 flex items-center justify-center">
                  <img 
                    src="/logo.png" 
                    alt="Ordari Bahrain Radar" 
                    className="w-full h-full object-cover rounded-[9px] sm:rounded-[13px]"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="absolute -bottom-0.5 -left-0.5 flex h-2.5 w-2.5 sm:h-4 sm:w-4">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${liveRadarActive ? 'bg-emerald-400 opacity-75' : 'bg-amber-400 opacity-75'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 sm:h-4 sm:w-4 border-2 border-white ${liveRadarActive ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                </span>
              </div>

              <div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">Ordari</span>
                  <span className="text-[9px] sm:text-xs px-1.5 sm:px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/60 shadow-2xs">
                    البحرين 🇧🇭
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
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              
              {/* Captain Profile & Auth / License Button */}
              {onOpenAuthModal && (
                <button
                  onClick={() => onOpenAuthModal(currentUser ? 'activate' : 'login')}
                  title={
                    currentUser
                      ? `الحساب: ${currentUser.name.replace(/كابتن\s*/g, '').replace(/الكابتن\s*/g, '').trim()} (${currentUser.licensePlan || 'نشط'}) - انقر لإدارة الترخيص أو كود التفعيل`
                      : 'تسجيل الدخول برقم الهاتف وكلمة المرور أو البصمة وإدخال كود التفعيل'
                  }
                  className={`min-h-[40px] flex items-center gap-1 px-2 py-1.5 sm:px-3 rounded-xl text-xs font-black border transition-all active:scale-95 shadow-2xs ${
                    currentUser
                      ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-950 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25'
                  }`}
                >
                  <Fingerprint className={`w-4 h-4 shrink-0 ${currentUser ? 'text-emerald-600' : 'text-emerald-300'}`} />
                  {currentUser ? (
                    <div className="hidden xs:flex flex-col text-right leading-none">
                      <span className="text-[10px] sm:text-[11px] font-black max-w-[55px] sm:max-w-[100px] truncate">
                        {currentUser.name.replace(/كابتن\s*/g, '').replace(/الكابتن\s*/g, '').trim()}
                      </span>
                      <span className="text-[8px] sm:text-[9px] text-emerald-700 font-bold mt-0.5 truncate max-w-[55px] sm:max-w-[100px]">
                        {currentUser.isActivated ? 'VIP 🇧🇭' : 'تفعيل 🔑'}
                      </span>
                    </div>
                  ) : (
                    <span className="hidden xs:inline text-[10px] sm:text-xs">دخول 🔑</span>
                  )}
                </button>
              )}

              {/* GPS Location Button */}
              <button
                onClick={onRequestGps}
                title="تحديد وتحديث موقعك الحالي عبر GPS"
                className={`min-h-[40px] flex items-center gap-1 px-2 py-1.5 sm:px-3 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                  driverLocation
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70'
                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <MapPin className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isGpsLoading ? 'animate-bounce text-amber-600' : 'text-emerald-600'}`} />
                <span className="text-[10px] sm:text-xs max-w-[48px] xs:max-w-[65px] sm:max-w-[120px] truncate">
                  {isGpsLoading ? '...' : driverLocation?.areaName || 'موقعي'}
                </span>
              </button>

              {/* WhatsApp Auto-Sync & Webhook Hub Button */}
              {onOpenAutoSyncModal && (
                <button
                  onClick={onOpenAutoSyncModal}
                  className={`min-h-[40px] flex items-center gap-1 px-2 py-1.5 sm:px-3 rounded-xl text-xs font-black transition-all shadow-2xs border active:scale-95 ${
                    isWhatsAppWebConnected
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30'
                      : 'bg-emerald-50 hover:bg-emerald-100/90 text-emerald-950 border-emerald-300'
                  }`}
                  title="ربط واتساب ويب بالباركود وقراءة إشعارات الأندرويد لسحب الطلبات تلقائياً"
                >
                  <QrCode className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isWhatsAppWebConnected ? 'text-white' : 'text-emerald-600'}`} />
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isWhatsAppWebConnected || isStreamConnected ? 'bg-emerald-400 opacity-75' : 'bg-amber-400 opacity-75'}`} />
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isWhatsAppWebConnected || isStreamConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  </span>
                  <span className="hidden xs:inline text-[10px] sm:text-xs">{isWhatsAppWebConnected ? 'متصل' : 'ربط ⚡'}</span>
                </button>
              )}

              {/* Sound Toggle */}
              <button
                onClick={onToggleSound}
                title={soundEnabled ? 'كتم التنبيهات الصوتية' : 'تفعيل التنبيهات الصوتية'}
                className={`min-h-[40px] min-w-[40px] flex items-center justify-center p-2 rounded-xl border transition-all active:scale-95 ${
                  soundEnabled
                    ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                    : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Screen Wake Lock Switch (Keep screen awake while driving) - hidden on small mobile to prevent clutter */}
              {onToggleKeepScreenAwake && (
                <button
                  onClick={onToggleKeepScreenAwake}
                  title={keepScreenAwake ? 'إبقاء الشاشة مضاءة: مفعّل ☀️' : 'إبقاء الشاشة مضاءة: معطّل 🌙'}
                  className={`hidden sm:flex min-h-[40px] min-w-[40px] items-center justify-center p-2 rounded-xl border transition-all active:scale-95 ${
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
                  title="صائد روابط قروبات التوصيل المنشورة في الواتساب للانضمام ومراقبتها"
                  className={`hidden md:flex min-h-[40px] items-center gap-1.5 px-2.5 py-2 sm:px-3 rounded-xl text-xs font-black transition-all shadow-xs border active:scale-95 ${
                    newDiscoveredGroupsCount > 0
                      ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white border-teal-500 shadow-teal-600/25 ring-2 ring-emerald-400/40'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <LinkIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${newDiscoveredGroupsCount > 0 ? 'text-emerald-200 animate-pulse' : 'text-emerald-600'}`} />
                  <span>صائد القروبات</span>
                  {newDiscoveredGroupsCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-white text-emerald-800 shadow-xs">
                      {newDiscoveredGroupsCount}
                    </span>
                  )}
                </button>
              )}

              {/* PWA Install & APK Modal Button - visible on tablet/desktop */}
              {onOpenAPKModal && (
                <button
                  onClick={onOpenAPKModal}
                  title="تحميل وتثبيت التطبيق على الهاتف كـ APK أصلي"
                  className="hidden lg:flex min-h-[40px] items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-xs border border-emerald-500 cursor-pointer active:scale-95"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-200" />
                  <span>تثبيت APK 📲</span>
                </button>
              )}

              {/* PWA Install Button (Available for desktop/tablet) */}
              <div className="hidden sm:block">
                <PWAInstallButton />
              </div>

              {/* Live Radar Toggle */}
              <button
                onClick={onToggleRadar}
                title={liveRadarActive ? 'إيقاف الرادار مؤقتاً' : 'تفعيل الرادار'}
                className={`min-h-[40px] min-w-[40px] flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                  liveRadarActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                <Wifi className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${liveRadarActive ? 'animate-pulse' : ''}`} />
                <span className="hidden sm:inline">{liveRadarActive ? 'جاهز 🟢' : 'متوقف'}</span>
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
    </>
  );
}
