import { useState, useEffect, useRef } from 'react';
import { 
  AlertCircle,
  MapPin, 
  Radar, 
  Navigation as StartIcon, 
  Flag, 
  Coins, 
  Clock, 
  Bell, 
  Volume2, 
  Vibrate, 
  Sparkles, 
  FilterX, 
  MessageSquare, 
  Check, 
  Plus, 
  X, 
  RefreshCw,
  Search,
  Save,
  CheckCircle2,
  VolumeX,
  Music,
  Upload,
  Play,
  RotateCcw,
  Sliders,
  Car,
  Zap,
  CheckSquare,
  Square,
  Sun,
  BellRing,
  Smartphone,
  ShieldCheck,
  Trash2,
  Users,
  Link as LinkIcon,
  Reply,
  Send,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  Fingerprint,
  KeyRound,
  Lock,
  User,
  AlertTriangle,
  ExternalLink,
  Layers
} from 'lucide-react';
import { OrderFilter, AreaLocation, AlertToneId, VibrationPatternId, CaptainUser } from '../types';
import { BAHRAIN_AREAS } from '../data/bahrainAreas';
import { MatcherLocation } from '../utils/matcher';
import { ContactsManager } from './ContactsManager';
import { PWAInstallButton } from './PWAInstallButton';
import { getVehicleTypeLabel, ACTIVATION_WHATSAPP_LINK } from '../utils/authManager';
import { 
  isInIframe,
  getNotificationPermission, 
  requestNotificationPermission, 
  sendBackgroundOrderNotification,
  requestScreenWakeLock,
  releaseScreenWakeLock,
  isNotificationSupported
} from '../utils/backgroundManager';
import { 
  playAlertTone, 
  playExcellentAlertSound, 
  triggerCustomVibration, 
  ALERT_TONE_PRESETS, 
  VIBRATION_PRESETS 
} from '../utils/sound';

interface FilterSettingsProps {
  filter: OrderFilter;
  driverLocation: MatcherLocation | null;
  isGpsLoading: boolean;
  currentUser?: CaptainUser | null;
  onOpenAuthModal?: (tab?: 'login' | 'register' | 'activate') => void;
  onUpdateFilter: (newFilter: OrderFilter) => void;
  onRequestGps: () => void;
  onSetManualLocation: (area: AreaLocation) => void;
  onSaveToast: () => void;
  detectedIncomingGroups?: string[];
  onOpenDiscoveredGroupsModal?: () => void;
  discoveredGroupsCount?: number;
  isCarTrackingActive?: boolean;
  onToggleCarTracking?: () => void;
  carSpeedKmh?: number;
  initialOpenSection?: string | null;
  onNavigateToRadar?: () => void;
}

export function FilterSettings({
  filter,
  driverLocation,
  isGpsLoading,
  currentUser,
  onOpenAuthModal,
  onUpdateFilter,
  onRequestGps,
  onSetManualLocation,
  onSaveToast,
  detectedIncomingGroups = [],
  onOpenDiscoveredGroupsModal,
  discoveredGroupsCount = 0,
  isCarTrackingActive = true,
  onToggleCarTracking,
  carSpeedKmh = 0,
  initialOpenSection = null,
  onNavigateToRadar,
}: FilterSettingsProps) {
  const [localFilter, setLocalFilter] = useState<OrderFilter>(filter);
  const [areaSearch, setAreaSearch] = useState('');
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>('الكل');
  const [modalMode, setModalMode] = useState<'start' | 'dest' | null>(null);
  const [customAreaInput, setCustomAreaInput] = useState('');
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(getNotificationPermission());
  const [showNotifGuideModal, setShowNotifGuideModal] = useState<boolean>(false);
  const [vibratingPatternId, setVibratingPatternId] = useState<VibrationPatternId | 'current' | null>(null);

  const handleTestVibration = (patternId?: VibrationPatternId, intensity?: number) => {
    const targetPattern = patternId || localFilter.vibrationPattern || 'standard';
    const targetIntensity = intensity ?? localFilter.vibrationIntensity ?? 2;
    setVibratingPatternId(patternId ? patternId : 'current');
    const durMs = triggerCustomVibration(targetPattern, targetIntensity);
    setTimeout(() => {
      setVibratingPatternId(null);
    }, Math.max(durMs, 600));
  };

  // Sync with parent filter prop when it changes
  useEffect(() => {
    setLocalFilter(filter);
    if (filter.customGroups && filter.customGroups.length > 0) {
      setMyGroups(filter.customGroups);
    }
  }, [filter]);

  // Keep ref for unmount auto-save
  const localFilterRef = useRef(localFilter);
  localFilterRef.current = localFilter;

  // Auto-persist localFilter to localStorage so changes are never lost even if user closes app without clicking save
  useEffect(() => {
    try {
      localStorage.setItem('orderi_filter_settings', JSON.stringify(localFilter));
    } catch {}
  }, [localFilter]);

  // Save on unmount
  useEffect(() => {
    return () => {
      try {
        localStorage.setItem('orderi_filter_settings', JSON.stringify(localFilterRef.current));
      } catch {}
    };
  }, []);

  const handleRequestNotifPermission = async () => {
    if (isInIframe()) {
      setShowNotifGuideModal(true);
      return;
    }
    const current = getNotificationPermission();
    if (current === 'denied') {
      setShowNotifGuideModal(true);
      return;
    }
    const res = await requestNotificationPermission();
    setNotifPermission(res);
    if (res === 'granted') {
      onSaveToast();
      sendBackgroundOrderNotification({
        id: `test-welcome-${Date.now()}`,
        from: 'المنامة',
        to: 'المحرق',
        price: 2.5,
        rawText: 'تم تفعيل إشعارات النظام بنجاح! ستصلك التنبيهات المنبثقة مباشرة فوق واتساب والخرائط',
        groupName: 'قروب مناديب البحرين',
        senderName: 'متجر ورود VIP',
        senderPhone: '97339000000',
        receivedAt: new Date(),
        confidence: 1,
        type: 'delivery',
        status: 'pending',
        match: {
          score: 95,
          startMatched: true,
          destinationMatched: true,
          priceMatched: true,
          distanceMatched: true,
          timeMatched: true,
          distanceKm: 3.5,
          statusLabel: 'طلب ممتاز',
          statusColor: 'emerald',
        },
        contactStatus: 'vip',
      });
    } else if (res === 'denied') {
      setShowNotifGuideModal(true);
    }
  };

  const handleRefreshNotifPermission = () => {
    const current = getNotificationPermission();
    setNotifPermission(current);
    if (current === 'granted') {
      setShowNotifGuideModal(false);
      onSaveToast();
    }
  };

  // Accordion collapsible sections state (all closed or selectively opened to reduce space)
  type SettingsSection = 
    | 'auth'
    | 'location' 
    | 'destinations' 
    | 'groups' 
    | 'notifications' 
    | 'response_template' 
    | 'gemini_ai' 
    | 'contacts' 
    | 'done_template' 
    | 'background_mode';

  const [openSections, setOpenSections] = useState<Record<SettingsSection, boolean>>({
    auth: false,
    location: false,
    destinations: false,
    groups: false,
    notifications: false,
    response_template: false,
    gemini_ai: false,
    contacts: false,
    done_template: false,
    background_mode: false,
  });
  const [audioUploadError, setAudioUploadError] = useState<string | null>(null);

  // Auto-expand and scroll to targeted section when requested (e.g. from WhatsApp Sync Modal)
  useEffect(() => {
    if (initialOpenSection && (initialOpenSection in openSections)) {
      setOpenSections((prev) => ({ ...prev, [initialOpenSection]: true }));
      setTimeout(() => {
        const el = document.getElementById(`settings-section-${initialOpenSection}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    }
  }, [initialOpenSection]);

  const toggleSection = (sec: SettingsSection) => {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const expandAll = () => {
    setOpenSections({
      auth: true,
      location: true,
      destinations: true,
      groups: true,
      notifications: true,
      response_template: true,
      gemini_ai: true,
      contacts: true,
      done_template: true,
      background_mode: true,
    });
  };

  const collapseAll = () => {
    setOpenSections({
      auth: false,
      location: false,
      destinations: false,
      groups: false,
      notifications: false,
      response_template: false,
      gemini_ai: false,
      contacts: false,
      done_template: false,
      background_mode: false,
    });
  };

  // WhatsApp Groups joined on user's phone
  const [newGroupNameInput, setNewGroupNameInput] = useState('');
  const [myGroups, setMyGroups] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('orderi_my_whatsapp_groups');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    if (filter.customGroups && filter.customGroups.length > 0) {
      return filter.customGroups;
    }
    return [];
  });

  const governorates = ['الكل', 'العاصمة', 'المحرق', 'الشمالية', 'الجنوبية'];

  const filteredAreas = BAHRAIN_AREAS.filter((area) => {
    const matchesGov = selectedGovernorate === 'الكل' || area.governorate === selectedGovernorate;
    const matchesSearch = !areaSearch || area.name.includes(areaSearch) || area.nameEn.toLowerCase().includes(areaSearch.toLowerCase());
    return matchesGov && matchesSearch;
  });

  const handleToggleDestination = (areaName: string) => {
    const exists = localFilter.destinations.includes(areaName);
    const updated = exists 
      ? localFilter.destinations.filter((a) => a !== areaName)
      : [...localFilter.destinations, areaName];
    setLocalFilter({ ...localFilter, destinations: updated });
  };

  // Select all areas in current filter or governorate
  const handleSelectAllAreas = (mode: 'start' | 'dest' | null) => {
    const allAreaNames = BAHRAIN_AREAS.map(a => a.name);
    setLocalFilter({ ...localFilter, destinations: allAreaNames });
  };

  // Clear all areas (open to anywhere)
  const handleClearAllAreas = (mode: 'start' | 'dest' | null) => {
    setLocalFilter({ ...localFilter, destinations: [] });
  };

  // Select all areas of the currently selected governorate or search
  const handleSelectVisibleAreas = (mode: 'start' | 'dest' | null) => {
    const visibleNames = filteredAreas.map(a => a.name);
    const merged = Array.from(new Set([...localFilter.destinations, ...visibleNames]));
    setLocalFilter({ ...localFilter, destinations: merged });
  };

  // Add custom area or landmark manually
  const handleAddCustomArea = (mode: 'start' | 'dest' | null) => {
    const trimmed = customAreaInput.trim();
    if (!trimmed) return;
    if (!localFilter.destinations.includes(trimmed)) {
      setLocalFilter({ ...localFilter, destinations: [...localFilter.destinations, trimmed] });
    }
    setCustomAreaInput('');
  };

  const handleSelectAllGov = (gov: string) => {
    const govAreas = BAHRAIN_AREAS.filter(a => gov === 'الكل' || a.governorate === gov).map(a => a.name);
    const merged = Array.from(new Set([...localFilter.destinations, ...govAreas]));
    setLocalFilter({ ...localFilter, destinations: merged });
  };

  const handleAddMyGroup = (nameToAdd?: string) => {
    const target = (nameToAdd || newGroupNameInput).trim();
    if (!target) return;
    if (!myGroups.includes(target)) {
      const updated = [...myGroups, target];
      setMyGroups(updated);
      try {
        localStorage.setItem('orderi_my_whatsapp_groups', JSON.stringify(updated));
      } catch {}
      const updatedSelected = localFilter.selectedGroups.length > 0
        ? [...localFilter.selectedGroups, target]
        : [];
      setLocalFilter({
        ...localFilter,
        customGroups: updated,
        selectedGroups: updatedSelected,
      });
    }
    if (!nameToAdd) setNewGroupNameInput('');
  };

  const handleLinkAllDetectedGroups = () => {
    if (!detectedIncomingGroups || detectedIncomingGroups.length === 0) return;
    const merged = Array.from(new Set([...myGroups, ...detectedIncomingGroups]));
    setMyGroups(merged);
    try {
      localStorage.setItem('orderi_my_whatsapp_groups', JSON.stringify(merged));
    } catch {}
    const updatedSelected = localFilter.selectedGroups.length > 0
      ? Array.from(new Set([...localFilter.selectedGroups, ...detectedIncomingGroups]))
      : [];
    setLocalFilter({
      ...localFilter,
      customGroups: merged,
      selectedGroups: updatedSelected,
    });
    onSaveToast();
  };

  const handleRemoveMyGroup = (groupToRemove: string) => {
    const updated = myGroups.filter(g => g !== groupToRemove);
    setMyGroups(updated);
    try {
      localStorage.setItem('orderi_my_whatsapp_groups', JSON.stringify(updated));
    } catch {}
    const updatedSelected = localFilter.selectedGroups.filter(g => g !== groupToRemove);
    setLocalFilter({
      ...localFilter,
      customGroups: updated,
      selectedGroups: updatedSelected,
    });
  };

  const handleToggleGroup = (groupName: string) => {
    if (localFilter.selectedGroups.length === 0) {
      const updated = myGroups.filter(g => g !== groupName);
      setLocalFilter({ ...localFilter, selectedGroups: updated });
    } else {
      const exists = localFilter.selectedGroups.includes(groupName);
      const updated = exists
        ? localFilter.selectedGroups.filter(g => g !== groupName)
        : [...localFilter.selectedGroups, groupName];
      setLocalFilter({ ...localFilter, selectedGroups: updated });
    }
  };

  const handleSave = () => {
    const finalFilter: OrderFilter = {
      ...localFilter,
      customGroups: myGroups,
    };
    try {
      localStorage.setItem('orderi_filter_settings', JSON.stringify(finalFilter));
      localStorage.setItem('orderi_my_whatsapp_groups', JSON.stringify(myGroups));
    } catch (e) {
      console.error('Error saving settings to storage:', e);
    }
    onUpdateFilter(finalFilter);
    onSaveToast();
    collapseAll();
    onNavigateToRadar?.();
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-5xl mx-auto pb-12 overflow-x-hidden min-w-0">
      
      {/* Settings Header with Expand/Collapse All */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 shadow-xs w-full max-w-full overflow-hidden">
        <div className="min-w-0">
          <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight">إعدادات الرادار وفلتر المطابقة</h2>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">اضغط على أي عنوان أدناه لفتحه وتعديل تفاصيله باختصار لتقليل المساحة على الهاتف</p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={expandAll}
            className="flex-1 sm:flex-none px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all active:scale-95 text-center"
          >
            توسيع الكل ▾
          </button>

          <button
            type="button"
            onClick={collapseAll}
            className="flex-1 sm:flex-none px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all active:scale-95 text-center"
          >
            طي الكل ▴
          </button>

          <button
            onClick={handleSave}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.01] active:scale-[0.98]"
          >
            <Save className="w-4 h-4" />
            <span>حفظ وتطبيق الشروط</span>
          </button>
        </div>
      </div>

      {/* Accordion List Container */}
      <div className="space-y-3 sm:space-y-4 w-full max-w-full min-w-0">
        
        {/* 1. Accordion: موقعك الحالي في البحرين */}
        <div className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => toggleSection('location')}
            className="w-full min-h-[60px] flex items-center justify-between p-4 sm:p-5 text-right bg-white hover:bg-slate-50/80 transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 shadow-2xs">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
                    مكان الاستلام (من) ونطاق التغطية من موقعك الحالي
                  </h3>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                    GPS 📍
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  الاستلام المعتمد: <strong className="text-emerald-700 font-bold">{driverLocation?.areaName || 'لم يتم تحديده بعد'}</strong> · نطاق المسافة المقبولة: {localFilter.coverageKm} كم
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 mr-2">
              <span className="hidden sm:inline text-xs font-bold text-slate-400">
                {openSections.location ? 'إخفاء' : 'تعديل التفاصيل'}
              </span>
              <div className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 transition-transform duration-200 ${openSections.location ? 'rotate-180 bg-emerald-50 text-emerald-700' : ''}`}>
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </button>

          {openSections.location && (
            <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/40 space-y-6 animate-in fade-in duration-200">
              
              {/* 1. Live Vehicle Movement Tracking Control Card */}
              {onToggleCarTracking && (
                <div className={`p-4 rounded-2xl border transition-all ${
                  isCarTrackingActive
                    ? 'bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border-emerald-300 ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-200/90'
                }`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        isCarTrackingActive ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <Car className={`w-5 h-5 ${isCarTrackingActive ? 'animate-pulse' : ''}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-black text-slate-900">
                            تتبع حركة السيارة تلقائياً أثناء القيادة 🚗
                          </h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            isCarTrackingActive
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {isCarTrackingActive ? 'مفعّل وشغال ⚡' : 'متوقف'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                          يتغير موقعك المعتمد تلقائياً كلما تحركت بالسيارة بين مناطق البحرين (مثلاً: من المنامة إلى السيف أو الرفاع)، ليتم تحديث رادار الطلبات الأقرب لك فوراً وبدون أي تدخل يدوي!
                        </p>
                        {isCarTrackingActive && carSpeedKmh > 0 && (
                          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-700">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                            <span>السرعة الحالية: {carSpeedKmh} كم/س</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={onToggleCarTracking}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isCarTrackingActive ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          isCarTrackingActive ? '-translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}

              {/* 2. Current Location & Instant GPS Refresh Card */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-500 block">الموقع المعتمد حالياً للرادار:</span>
                  <strong className="text-base font-black text-slate-900 mt-0.5 block flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{driverLocation?.areaName || 'لم يتم تحديد موقعك بعد'}</span>
                  </strong>
                  {driverLocation && (
                    <span className="text-[11px] text-emerald-700 font-mono font-semibold block mt-0.5" dir="ltr">
                      {driverLocation.latitude.toFixed(4)}, {driverLocation.longitude.toFixed(4)}
                      {driverLocation.lastUpdated && ` · آخر تحديث: ${driverLocation.lastUpdated}`}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onRequestGps}
                  disabled={isGpsLoading}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGpsLoading ? 'animate-spin' : ''}`} />
                  <span>{isGpsLoading ? 'جاري الاتصال بالأقمار الصناعية...' : 'تحديد وتحديث الموقع عبر GPS 📍'}</span>
                </button>
              </div>

              {/* Coverage Range Slider */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">نطاق التغطية والمسافة المقبولة:</span>
                    <span className="text-[11px] text-slate-500">أقصى مسافة مسموحة من موقعك الحالي لنقطة الاستلام (من)</span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-black text-sm border border-blue-200">
                    {localFilter.coverageKm} كم
                  </span>
                </div>

                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={localFilter.coverageKm}
                  onChange={(e) => setLocalFilter({ ...localFilter, coverageKm: Number(e.target.value) })}
                  className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                />

                <div className="flex justify-between text-[11px] text-slate-400 font-bold">
                  <span>1 كم (قريب جداً)</span>
                  <span>15 كم</span>
                  <span>30 كم (شامل أغلب البحرين)</span>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* 2. Accordion: وجهات التسليم المطلوبة */}
        <div className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => toggleSection('destinations')}
            className="w-full min-h-[60px] flex items-center justify-between p-4 sm:p-5 text-right bg-white hover:bg-slate-50/80 transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100 shadow-2xs">
                <Flag className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
                    وجهات التسليم المطلوبة
                  </h3>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800">
                    {localFilter.destinations.length === 0 ? 'كل المناطق 🌐' : `${localFilter.destinations.length} وجهة`}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {localFilter.destinations.length === 0 ? 'جميع وجهات البحرين مقبولة' : `${localFilter.destinations.length} وجهة محددة`} · الحد الأدنى للأجرة: {localFilter.minimumPrice} د.ب
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 mr-2">
              <span className="hidden sm:inline text-xs font-bold text-slate-400">
                {openSections.destinations ? 'إخفاء' : 'تعديل التفاصيل'}
              </span>
              <div className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 transition-transform duration-200 ${openSections.destinations ? 'rotate-180 bg-purple-50 text-purple-700' : ''}`}>
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </button>

          {openSections.destinations && (
            <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/40 space-y-6 animate-in fade-in duration-200">
              
              {/* Destination Areas */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">وجهات التوصيل والتسليم المرغوبة:</h4>
                    <p className="text-[11px] text-slate-500">
                      {localFilter.destinations.length === 0 
                        ? 'جميع وجهات البحرين مقبولة (توصيل لكافة المناطق)' 
                        : `${localFilter.destinations.length} وجهة محددة`}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectAllAreas('dest')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-black border border-purple-200 transition-colors shadow-2xs active:scale-95"
                      title="تحديد كافة مدن وقرى البحرين كوجهات مقبولة"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-purple-600" />
                      <span>إضافة كل المناطق</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleClearAllAreas('dest')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors active:scale-95"
                      title="تفريغ التحديد ليقبل التوصيل لأي مكان"
                    >
                      <span>مفتوح للكل</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setModalMode('dest')}
                      className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black transition-colors shadow-2xs active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة وتعديل</span>
                    </button>
                  </div>
                </div>

                {/* Destination Chips */}
                <div className="flex flex-wrap gap-1.5 min-h-[50px] p-3 rounded-2xl bg-slate-50 border border-slate-200/60 max-h-[160px] overflow-y-auto">
                  {localFilter.destinations.length === 0 ? (
                    <span className="text-xs text-slate-400 font-semibold my-auto">
                      مفتوح للجميع: يتم قبول التوصيل لأي وجهة في البحرين (اضغط "إضافة وتعديل" لتخصيص مناطق محددة أو "إضافة كل المناطق")
                    </span>
                  ) : (
                    localFilter.destinations.map((dest) => (
                      <span
                        key={dest}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200"
                      >
                        <span>{dest}</span>
                        <button
                          onClick={() => handleToggleDestination(dest)}
                          className="hover:text-rose-600 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Minimum Price Slider & Working Hours in 2-cols */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Minimum Price */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">الحد الأدنى لسعر الطلب:</span>
                      <span className="text-[10px] text-slate-400">يستبعد الطلبات الأقل سعراً</span>
                    </div>
                    <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-black text-sm border border-emerald-200">
                      {localFilter.minimumPrice.toFixed(1)} د.ب
                    </span>
                  </div>

                  <input
                    type="range"
                    min="1.0"
                    max="15.0"
                    step="0.5"
                    value={localFilter.minimumPrice}
                    onChange={(e) => setLocalFilter({ ...localFilter, minimumPrice: Number(e.target.value) })}
                    className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                  />

                  <div className="flex justify-between text-[11px] text-slate-400 font-bold">
                    <span>1.0 د.ب</span>
                    <span>5.0 د.ب</span>
                    <span>10.0 د.ب</span>
                    <span>15.0 د.ب</span>
                  </div>
                </div>

                {/* Working Hours */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">أوقات العمل المعتمدة:</span>
                    <span className="text-[10px] text-slate-400">فترة مراقبة الطلبات النشطة</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500">من الساعة:</label>
                      <input
                        type="time"
                        value={localFilter.startTime}
                        onChange={(e) => setLocalFilter({ ...localFilter, startTime: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500">إلى الساعة:</label>
                      <input
                        type="time"
                        value={localFilter.endTime}
                        onChange={(e) => setLocalFilter({ ...localFilter, endTime: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>

        {/* 3. Accordion: قروبات واتسابي المراقبة (على هذا الهاتف) */}
        <div id="settings-section-groups" className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => toggleSection('groups')}
            className="w-full min-h-[60px] flex items-center justify-between p-4 sm:p-5 text-right bg-white hover:bg-slate-50/80 transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 shadow-2xs">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
                    قروبات واتسابي المراقبة (على هذا الهاتف)
                  </h3>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                    واتسابي 🟢
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {localFilter.selectedGroups.length === 0 ? '✓ يراقب جميع قروباتي في الواتساب' : `يراقب ${localFilter.selectedGroups.length} قروبات محددة`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 mr-2">
              <span className="hidden sm:inline text-xs font-bold text-slate-400">
                {openSections.groups ? 'إخفاء' : 'تعديل التفاصيل'}
              </span>
              <div className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 transition-transform duration-200 ${openSections.groups ? 'rotate-180 bg-emerald-50 text-emerald-700' : ''}`}>
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </button>

          {openSections.groups && (
            <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/40 space-y-5 animate-in fade-in duration-200">
              
              {/* Header & Subtitle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-sm font-black text-slate-900">إدارة قروبات الواتساب المراقبة:</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    القروبات والمحادثات التي أنت منضم إليها في تطبيق الواتساب على هاتفك ويقوم الرادار بمراقبتها
                  </p>
                </div>

                {/* Quick status pill */}
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
                    localFilter.selectedGroups.length === 0
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {localFilter.selectedGroups.length === 0 
                      ? '✓ يراقب جميع قروباتي في الواتساب' 
                      : `يراقب ${localFilter.selectedGroups.length} قروبات محددة`}
                  </span>
                </div>
              </div>

        {/* Informational Banner: Same phone context */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 text-xs text-emerald-900 space-y-1.5">
          <div className="flex items-center gap-2 font-black text-emerald-950">
            <Smartphone className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>رصد وسحب تلقائي من نفس هاتف الواتساب:</span>
          </div>
          <p className="text-[11px] leading-relaxed text-emerald-800/90 font-medium">
            بما أن Ordari يعمل على نفس الهاتف الذي يحتوي على تطبيق واتساب، فإن أي إشعار يردك من قروباتك المنضم إليها يتم التقاطه فوراً ومقارنته بالمناطق والأسعار المحددة في الفلتر.
          </p>
        </div>

        {/* Automatic Group Link Sniffer & Hunter Feature Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50/40 border border-teal-200/90 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <LinkIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-black text-slate-900">
                    صائد روابط قروبات التوصيل المنشورة 🔗
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-100 text-teal-800 border border-teal-200">
                    مفعّل تلقائياً ⚡
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  عندما ينشر أي شخص في قروباتك رابطاً لدعوة قروب توصيل جديد (chat.whatsapp.com)، يلتقطه الرادار فوراً ويسألك لتنضم إليه وتراقبه.
                </p>
              </div>
            </div>

            {onOpenDiscoveredGroupsModal && (
              <button
                type="button"
                onClick={onOpenDiscoveredGroupsModal}
                className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition-all shrink-0 cursor-pointer self-start sm:self-center"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>إدارة الروابط المكتشفة ({discoveredGroupsCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setLocalFilter({ ...localFilter, selectedGroups: [] })}
            className={`p-3.5 rounded-2xl border text-right transition-all flex items-start gap-3 cursor-pointer ${
              localFilter.selectedGroups.length === 0
                ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20 text-slate-900'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
            }`}
          >
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
              localFilter.selectedGroups.length === 0 
                ? 'border-emerald-600 bg-emerald-600 text-white' 
                : 'border-slate-300 bg-white'
            }`}>
              {localFilter.selectedGroups.length === 0 && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 block">
                مراقبة جميع قروبات واتسابي تلقائياً ⚡ (موصى به)
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                يستقبل الطلبات من أي قروب أنت عضو فيه في الواتساب دون الحاجة لتسميته
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setLocalFilter({ ...localFilter, selectedGroups: myGroups })}
            className={`p-3.5 rounded-2xl border text-right transition-all flex items-start gap-3 cursor-pointer ${
              localFilter.selectedGroups.length > 0
                ? 'bg-blue-500/10 border-blue-500 ring-2 ring-blue-500/20 text-slate-900'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
            }`}
          >
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
              localFilter.selectedGroups.length > 0 
                ? 'border-blue-600 bg-blue-600 text-white' 
                : 'border-slate-300 bg-white'
            }`}>
              {localFilter.selectedGroups.length > 0 && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 block">
                تحديد قروبات معينة فقط من واتسابي 🎯
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                استقبال الإعلانات فقط من القروبات المفعلة أدناه وتجاهل البقية
              </span>
            </div>
          </button>
        </div>

        {/* Add New Custom Group From My WhatsApp */}
        <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5">
          <label className="text-xs font-black text-slate-800 block">
            إضافة اسم قروب من قروبات واتسابك المنضم لها:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newGroupNameInput}
              onChange={(e) => setNewGroupNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddMyGroup();
                }
              }}
              placeholder="اكتب اسم القروب كما يظهر تماماً في واتسابك..."
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={() => handleAddMyGroup()}
              disabled={!newGroupNameInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة القروب</span>
            </button>
          </div>
        </div>

        {/* Auto-Discovered Groups From Incoming Phone Notifications */}
        {detectedIncomingGroups && detectedIncomingGroups.length > 0 && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-white border border-blue-200/90 space-y-2.5 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-blue-950">
                <Smartphone className="w-4 h-4 text-blue-600" />
                <span>قروبات تم رصد إشعارات منها على هاتفك مؤخراً ({detectedIncomingGroups.length}):</span>
              </div>
              <button
                type="button"
                onClick={handleLinkAllDetectedGroups}
                className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Check className="w-3.5 h-3.5" />
                <span>ربط واعتماد كافة هذه القروبات بحسابي فوراً ⚡</span>
              </button>
            </div>

            <p className="text-[11px] text-blue-900/80 leading-relaxed font-medium">
              هذه هي القروبات الحقيقية التي استلم تطبيقك إشعارات ورسائل منها على الهاتف. عند النقر على الزر أعلاه، يتم ربطها واعتمادها فوراً في حسابك ورقمك الواتساب لمراقبة وسحب كافة طلبات التوصيل منها تلقائياً.
            </p>

            <div className="flex flex-wrap gap-2 pt-0.5">
              {detectedIncomingGroups.map((discGroup) => {
                const isAlreadyInMyGroups = myGroups.includes(discGroup);
                return (
                  <button
                    key={discGroup}
                    type="button"
                    onClick={() => {
                      if (!isAlreadyInMyGroups) {
                        handleAddMyGroup(discGroup);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      isAlreadyInMyGroups
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 cursor-default'
                        : 'bg-white hover:bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-300 cursor-pointer shadow-2xs'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isAlreadyInMyGroups ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                    <span>{discGroup}</span>
                    {isAlreadyInMyGroups ? (
                      <span className="text-[10px] text-emerald-700 font-black">(مرتبط بحسابك ✓)</span>
                    ) : (
                      <Plus className="w-3 h-3 text-blue-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* My Monitored Groups List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-black text-slate-800">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>قائمة قروباتي في الواتساب ({myGroups.length}):</span>
            </div>
            {localFilter.selectedGroups.length > 0 && (
              <button
                type="button"
                onClick={() => setLocalFilter({ ...localFilter, selectedGroups: myGroups })}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                تحديد كافة قروباتي
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {myGroups.length === 0 ? (
              <div className="col-span-full p-4 rounded-2xl bg-white border border-dashed border-slate-200 text-center">
                <p className="text-xs font-bold text-slate-700">لا توجد قروبات مسجلة في القائمة</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  اكتب اسم قروب واتسابك في خانة "إضافة اسم قروب" أعلاه لإضافته ومراقبته، أو اترك الخيار مفعلاً على "مراقبة جميع قروبات واتسابي تلقائياً" لمراقبة كل شيء دون الحاجة لتسميتها.
                </p>
              </div>
            ) : (
              myGroups.map((group) => {
                const isSelected = localFilter.selectedGroups.length === 0 || localFilter.selectedGroups.includes(group);
                return (
                  <div
                    key={group}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      isSelected 
                        ? 'bg-emerald-50/40 border-emerald-200/90 text-emerald-950 font-bold shadow-2xs' 
                        : 'bg-slate-50/50 border-slate-200 text-slate-400 font-medium'
                    }`}
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleGroup(group)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 shrink-0"
                      />
                      <span className="text-xs truncate">{group}</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => handleRemoveMyGroup(group)}
                      title="إزالة هذا القروب من القائمة"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 ml-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

            </div>
          )}
        </div>

        {/* 4. Accordion: الإشعارات والتنبيهات الصوتية */}
        <div className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => toggleSection('notifications')}
            className="w-full min-h-[60px] flex items-center justify-between p-4 sm:p-5 text-right bg-white hover:bg-slate-50/80 transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100 shadow-2xs">
                <Bell className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
                    الإشعارات والتنبيهات الصوتية
                  </h3>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                    {localFilter.soundEnabled ? 'صوت 🔊' : 'صامت 🔇'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  الصوت: {localFilter.soundEnabled ? `مفعّل (${ALERT_TONE_PRESETS.find(p => p.id === localFilter.alertTone)?.name || 'نغمة'})` : 'معطّل'} · الاهتزاز: {localFilter.vibrationEnabled ? 'مفعّل 📳' : 'معطّل'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 mr-2">
              <span className="hidden sm:inline text-xs font-bold text-slate-400">
                {openSections.notifications ? 'إخفاء' : 'تعديل التفاصيل'}
              </span>
              <div className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 transition-transform duration-200 ${openSections.notifications ? 'rotate-180 bg-rose-50 text-rose-700' : ''}`}>
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </button>

          {openSections.notifications && (
            <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/40 space-y-6 animate-in fade-in duration-200">
              
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">خيارات التنبيه والنغمات</h4>
                  <p className="text-[11px] text-slate-500">تخصيص النغمة، الاهتزاز وقوة الصوت عند وصول طلب مطابق</p>
                </div>
              </div>

        {/* 1. Quick Master Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Sound Alert Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">الصوت والتنبيه</span>
                <span className="text-[11px] text-slate-500">تشغيل نغمة عند رصد طلب مطابق</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => playAlertTone(localFilter.alertTone || 'chime', localFilter.soundVolume ?? 80, localFilter.customSoundDataUrl)}
                className="text-[11px] text-blue-600 hover:underline font-bold px-2 py-1 bg-blue-50 rounded-lg"
              >
                تجربة النغمة
              </button>
              <input
                type="checkbox"
                checked={localFilter.soundEnabled}
                onChange={(e) => setLocalFilter({ ...localFilter, soundEnabled: e.target.checked })}
                className="w-5 h-5 rounded text-blue-600 cursor-pointer"
              />
            </div>
          </div>

          {/* VIP Order 90%+ Alert */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-200 text-amber-900">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-950 block">تنبيه الطلب الممتاز (90%+)</span>
                <span className="text-[11px] text-amber-800/80">نغمة تصاعدية خاصة للطلبات عالية الأجر</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => playExcellentAlertSound(localFilter.soundVolume ?? 85)}
                className="text-[11px] text-amber-800 hover:underline font-bold px-2 py-1 bg-amber-100/70 rounded-lg"
              >
                تجربة
              </button>
              <input
                type="checkbox"
                checked={localFilter.excellentAlertEnabled}
                onChange={(e) => setLocalFilter({ ...localFilter, excellentAlertEnabled: e.target.checked })}
                className="w-5 h-5 rounded text-amber-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Vibration Alert */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                <Vibrate className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">الهزاز والاهتزاز</span>
                <span className="text-[11px] text-slate-500">اهتزاز الهاتف عند وصول طلب مطابق</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => triggerCustomVibration(localFilter.vibrationPattern || 'standard', localFilter.vibrationIntensity ?? 2)}
                className="text-[11px] text-indigo-700 hover:underline font-bold px-2 py-1 bg-indigo-50 rounded-lg"
              >
                تجربة الهزاز
              </button>
              <input
                type="checkbox"
                checked={localFilter.vibrationEnabled}
                onChange={(e) => setLocalFilter({ ...localFilter, vibrationEnabled: e.target.checked })}
                className="w-5 h-5 rounded text-indigo-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Ignore Non-matching */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200/80">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                <FilterX className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-rose-950 block">مفتاح إلغاء غير المطابق تلقائياً (&lt; 80%)</span>
                <span className="text-[11px] text-rose-800/80">إخفاء واستبعاد الطلبات التي لا تطابق موقعك أو سعرك</span>
              </div>
            </div>

            <label className="relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out">
              <input
                type="checkbox"
                checked={localFilter.ignoreNonMatching}
                onChange={(e) => setLocalFilter({ ...localFilter, ignoreNonMatching: e.target.checked })}
                className="sr-only"
              />
              <span className={`w-full h-full rounded-full transition-colors ${localFilter.ignoreNonMatching ? 'bg-rose-600' : 'bg-slate-300'}`}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                  localFilter.ignoreNonMatching ? '-translate-x-6' : 'translate-x-0'
                }`} />
              </span>
            </label>
          </div>

        </div>

        {/* 2. Volume & Audio Control Slider */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-800">مستوى صوت التنبيهات:</span>
              <span className="text-xs font-black text-blue-600 px-2 py-0.5 rounded-md bg-blue-100">
                {localFilter.soundVolume ?? 80}%
              </span>
            </div>

            <button
              type="button"
              onClick={() => playAlertTone(localFilter.alertTone || 'chime', localFilter.soundVolume ?? 80, localFilter.customSoundDataUrl)}
              className="flex items-center gap-1 text-xs font-bold text-blue-700 bg-white border border-blue-200 px-2.5 py-1 rounded-xl shadow-xs hover:bg-blue-50"
            >
              <Play className="w-3 h-3" />
              <span>فحص مستوى الصوت</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <VolumeX className="w-4 h-4 text-slate-400" />
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={localFilter.soundVolume ?? 80}
              onChange={(e) => setLocalFilter({ ...localFilter, soundVolume: parseInt(e.target.value) })}
              className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <Volume2 className="w-5 h-5 text-blue-600" />
          </div>
        </div>

        {/* 3. Tone Selector (Presets + Custom Upload) */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Music className="w-4 h-4 text-blue-600" />
                <span>اختر نغمة التنبيه المفضلة:</span>
              </h4>
              <p className="text-[11px] text-slate-500">اختر إحدى نغمات التنبيه الواضحة أو ارفع نغمة إشعارك الخاصة من هاتفك</p>
            </div>

            {/* Custom file info if present */}
            {localFilter.customSoundFileName && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200/80 flex items-center gap-1">
                <span>الملف الحالي:</span>
                <span className="truncate max-w-[140px]">{localFilter.customSoundFileName}</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ALERT_TONE_PRESETS.map((preset) => {
              const isSelected = (localFilter.alertTone || 'chime') === preset.id;
              const isCustom = preset.id === 'custom_file';

              return (
                <div
                  key={preset.id}
                  onClick={() => {
                    setLocalFilter({ ...localFilter, alertTone: preset.id });
                    if (!isCustom || localFilter.customSoundDataUrl) {
                      playAlertTone(preset.id, localFilter.soundVolume ?? 80, localFilter.customSoundDataUrl);
                    }
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between text-right relative ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-blue-600 ring-4 ring-blue-100' : 'bg-slate-300'}`} />
                        <span className="text-xs font-black text-slate-900">{preset.name}</span>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {preset.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                      {isCustom && localFilter.customSoundFileName 
                        ? `ملفك المرفوع: ${localFilter.customSoundFileName}` 
                        : preset.description
                      }
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    {/* Test Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocalFilter({ ...localFilter, alertTone: preset.id });
                        playAlertTone(preset.id, localFilter.soundVolume ?? 80, localFilter.customSoundDataUrl);
                      }}
                      className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800"
                    >
                      <Play className="w-3 h-3" />
                      <span>استماع</span>
                    </button>

                    {/* Upload button for custom file */}
                    {isCustom && (
                      <label 
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg cursor-pointer border border-emerald-200"
                      >
                        <Upload className="w-3 h-3" />
                        <span>{localFilter.customSoundDataUrl ? 'تغيير الملف' : 'اختيار ملف صوتي'}</span>
                        <input
                          type="file"
                          accept="audio/*"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            if (file.size > 8 * 1024 * 1024) {
                              setAudioUploadError('حجم الملف الصوتي كبير، يرجى اختيار ملف نغمة أقل من 8 ميجابايت');
                              return;
                            }
                            setAudioUploadError(null);

                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const result = event.target?.result as string;
                              if (result) {
                                setLocalFilter({
                                  ...localFilter,
                                  alertTone: 'custom_file',
                                  customSoundDataUrl: result,
                                  customSoundFileName: file.name,
                                });
                                playAlertTone('custom_file', localFilter.soundVolume ?? 80, result);
                              }
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {audioUploadError && (
            <div className="mt-3 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-2.5 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{audioUploadError}</span>
            </div>
          )}
        </div>

        {/* 4. Vibration Patterns & Intensity Control */}
        <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                <Vibrate className="w-4 h-4 text-indigo-600" />
                <span>التحكم في الهزاز والاهتزاز (Vibration Controls):</span>
              </h4>
              <p className="text-[11px] text-indigo-900/70">تخصيص قوة ونمط اهتزاز هاتفك عند رصد الطلبات على حامل السيارة</p>
            </div>

            <button
              type="button"
              onClick={() => handleTestVibration()}
              className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer self-start sm:self-auto ${
                vibratingPatternId
                  ? 'bg-indigo-600 text-white border border-indigo-700 animate-pulse ring-2 ring-indigo-300 shadow-md'
                  : 'text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 active:scale-95'
              }`}
            >
              <Vibrate className={`w-4 h-4 ${vibratingPatternId ? 'animate-bounce text-amber-300' : 'text-indigo-600'}`} />
              <span>{vibratingPatternId ? '📳 جاري الاهتزاز الآن...' : 'تجربة نمط الهزاز الحالي ⚡'}</span>
            </button>
          </div>

          {/* Intensity Selector: 1 to 3 */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-xs font-bold text-indigo-900 shrink-0">قوة الاهتزاز:</span>
            <div className="grid grid-cols-3 gap-2 w-full max-w-sm">
              {[
                { level: 1, label: 'خفيف' },
                { level: 2, label: 'متوسط (مستحسن)' },
                { level: 3, label: 'قوي جداً' }
              ].map((item) => (
                <button
                  key={item.level}
                  type="button"
                  onClick={() => {
                    setLocalFilter({ ...localFilter, vibrationIntensity: item.level });
                    handleTestVibration(localFilter.vibrationPattern || 'standard', item.level);
                  }}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer active:scale-95 ${
                    (localFilter.vibrationIntensity ?? 2) === item.level
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-indigo-900 border-indigo-200 hover:bg-indigo-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pattern Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 block">نمط الاهتزاز المفضل:</span>
              {vibratingPatternId && (
                <span className="text-[11px] font-black text-indigo-700 animate-pulse flex items-center gap-1">
                  <Vibrate className="w-3.5 h-3.5" />
                  <span>نبضات الهزاز نشطة...</span>
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {VIBRATION_PRESETS.map((p) => {
                const isSelected = (localFilter.vibrationPattern || 'standard') === p.id;
                const isThisVibrating = vibratingPatternId === p.id || (vibratingPatternId === 'current' && isSelected);
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setLocalFilter({ ...localFilter, vibrationPattern: p.id });
                      handleTestVibration(p.id, localFilter.vibrationIntensity ?? 2);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all relative select-none ${
                      isThisVibrating
                        ? 'bg-indigo-50 border-indigo-600 shadow-md ring-2 ring-indigo-400 scale-[1.02]'
                        : isSelected
                        ? 'bg-white border-indigo-600 shadow-xs ring-1 ring-indigo-500'
                        : 'bg-white/80 hover:bg-white border-indigo-100 hover:border-indigo-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Vibrate className={`w-3.5 h-3.5 ${isThisVibrating ? 'animate-bounce text-indigo-600' : isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <span className="text-xs font-bold text-indigo-950">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isThisVibrating && (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-indigo-600 text-white animate-pulse">
                            يهتز 📳
                          </span>
                        )}
                        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                      </div>
                    </div>
                    <p className="text-[10px] text-indigo-800/80 leading-relaxed mb-2">{p.description}</p>
                    
                    {/* Quick Test Action Button */}
                    <div className="pt-2 border-t border-indigo-100/70 flex items-center justify-between">
                      <span className="text-[10px] font-medium text-slate-500">
                        {p.durations.length === 1 ? 'نبضة واحدة' : `${Math.ceil(p.durations.length / 2)} نبضات`}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocalFilter({ ...localFilter, vibrationPattern: p.id });
                          handleTestVibration(p.id, localFilter.vibrationIntensity ?? 2);
                        }}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                          isThisVibrating
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200/80'
                        }`}
                      >
                        <Vibrate className="w-2.5 h-2.5" />
                        <span>{isThisVibrating ? 'جاري الهز...' : 'تجربة ⚡'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

            </div>
          )}
        </div>

        {/* 5. Accordion: صيغة الرد بالواتساب */}
        <div className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => toggleSection('response_template')}
            className="w-full min-h-[60px] flex items-center justify-between p-4 sm:p-5 text-right bg-white hover:bg-slate-50/80 transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200 shadow-2xs">
                <Reply className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
                    صيغة الرد بالواتساب
                  </h3>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-200 text-slate-800">
                    واتساب 💬
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5 font-mono">
                  {(localFilter.customResponseTemplate || '#مندوب_توصيل انا في ({area})').replace('{area}', driverLocation?.areaName || 'الموقع الحالي')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 mr-2">
              <span className="hidden sm:inline text-xs font-bold text-slate-400">
                {openSections.response_template ? 'إخفاء' : 'تعديل التفاصيل'}
              </span>
              <div className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 transition-transform duration-200 ${openSections.response_template ? 'rotate-180 bg-slate-200 text-slate-800' : ''}`}>
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </button>

          {openSections.response_template && (
            <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/40 space-y-4 animate-in fade-in duration-200">
              <div>
                <h4 className="text-sm font-black text-slate-900">تخصيص نص الرد السريع عند حجز الطلب:</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  هذه الرسالة تُرسل تلقائياً إلى واتساب المعلن أو القروب فور ضغطك على زر "قبول الطلب والرد بالواتساب"
                </p>
              </div>

              {/* Quick Template Presets */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">قوالب جاهزة سريعة (اضغط للتطبيق):</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    '#مندوب_توصيل انا في ({area})',
                    'جاهز للتوصيل حالياً في ({area}) 🛵',
                    'متواجد قريب منكم في ({area})، أقدر استلم الطلب الآن ✅',
                    'مندوب جاهز للتوصيل السريع من ({area}) ⚡'
                  ].map((presetText) => (
                    <button
                      key={presetText}
                      type="button"
                      onClick={() => setLocalFilter({ ...localFilter, customResponseTemplate: presetText })}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-bold border border-slate-200 hover:border-emerald-300 transition-colors shadow-2xs active:scale-95"
                    >
                      {presetText}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">النص المعتمد (يمكنك تعديله وإضافة رقمك أو اسمك):</label>
                  <span className="text-[10px] text-slate-400 font-mono">يدعم: {'{area}'}</span>
                </div>
                <input
                  type="text"
                  value={localFilter.customResponseTemplate || '#مندوب_توصيل انا في ({area})'}
                  onChange={(e) => setLocalFilter({ ...localFilter, customResponseTemplate: e.target.value })}
                  placeholder="#مندوب_توصيل انا في ({area})"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
                />
                <p className="text-[10px] text-slate-400">
                  💡 ملاحظة: الكلمة <code className="text-emerald-700 font-bold">{'{area}'}</code> يتم استبدالها تلقائياً باسم موقعك أو منطقتك الحالية في البحرين.
                </p>
              </div>

              {/* Preview Box */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <div className="text-[11px] text-slate-400 font-bold">معاينة الرسالة الفعلية التي ستصل للواتساب:</div>
                <div className="text-emerald-700 font-black text-sm p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 font-mono">
                  {(localFilter.customResponseTemplate || '#مندوب_توصيل انا في ({area})').replace('{area}', driverLocation?.areaName || 'الموقع الحالي')}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 6. Accordion: مطابقة إعلانات الواتساب بشروطي عبر الـ AI Gemini AI 🤖 */}
        <div className="rounded-2xl sm:rounded-3xl bg-white border border-blue-200/90 shadow-2xs overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => toggleSection('gemini_ai')}
            className="w-full min-h-[60px] flex items-center justify-between p-4 sm:p-5 text-right bg-white hover:bg-blue-50/40 transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/20">
                <Sparkles className="w-5 h-5 fill-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
                    مطابقة إعلانات الواتساب بشروطي عبر الـ AI
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
                    Gemini AI 🤖
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  الفحص التلقائي: {localFilter.autoAiEvaluate ? 'مفعّل تلقائياً ⚡' : 'يدوي عند الطلب'} · {localFilter.customConditionsNotes?.trim() ? 'شروط خاصة مضافة 📝' : 'لا توجد شروط مخصصة بعد'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 mr-2">
              <span className="hidden sm:inline text-xs font-bold text-slate-400">
                {openSections.gemini_ai ? 'إخفاء' : 'تعديل التفاصيل'}
              </span>
              <div className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 transition-transform duration-200 ${openSections.gemini_ai ? 'rotate-180 bg-blue-50 text-blue-700' : ''}`}>
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </button>

          {openSections.gemini_ai && (
            <div className="p-4 sm:p-6 border-t border-blue-100 bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 space-y-5 animate-in fade-in duration-200">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-100">
                <div>
                  <h4 className="text-sm font-black text-slate-900">تحليل الإعلانات ومطابقتها بشروطك المحددة:</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    الذكاء الاصطناعي يقرأ لهجة رسائل الإعلانات الأصلية بالواتساب، ويطابقها حرفياً مع شروطك وملاحظاتك الخاصة
                  </p>
                </div>

                <label className="relative inline-flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-xs font-bold text-slate-700">فحص تلقائي فوري:</span>
                  <div className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out">
                    <input
                      type="checkbox"
                      checked={localFilter.autoAiEvaluate ?? false}
                      onChange={(e) => setLocalFilter({ ...localFilter, autoAiEvaluate: e.target.checked })}
                      className="sr-only"
                    />
                    <span className={`w-full h-full rounded-full transition-colors ${localFilter.autoAiEvaluate ? 'bg-blue-600' : 'bg-slate-300'}`}>
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                        localFilter.autoAiEvaluate ? '-translate-x-5' : 'translate-x-0'
                      }`} />
                    </span>
                  </div>
                </label>
              </div>

              {/* Custom notes textarea */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-800 flex items-center justify-between">
                  <span>شروطك وملاحظاتك الخاصة الإضافية (اكتبها بالعامية أو الفصحى):</span>
                  <span className="text-[10px] font-normal text-slate-400">يقرأها الذكاء الاصطناعي عند تحليل كل إعلان</span>
                </label>
                <textarea
                  rows={4}
                  value={localFilter.customConditionsNotes || ''}
                  onChange={(e) => setLocalFilter({ ...localFilter, customConditionsNotes: e.target.value })}
                  placeholder={`مثال:
- لا أقبل توصيل أطعمة أو آيسكريم وقت الظهيرة.
- أفضل أن يكون الدفع عبر بنفت بي BenefitPay.
- الطلبات إلى ديار المحرق وجزر أمواج أو درة البحرين لا تقل عن 3 دينار.
- حمولات خفيفة فقط ولا أقبل كراتين ثقيلة.`}
                  className="w-full p-3.5 rounded-2xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none leading-relaxed shadow-2xs"
                />
                <p className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-0.5">
                  <span className="text-amber-500 font-bold">💡 نصيحة:</span>
                  <span>كلما كانت شروطك أوضح، استطاع الذكاء الاصطناعي تنبيهك إلى أي عيب أو محظور خفي داخل رسالة المعلن فوراً.</span>
                </p>
              </div>

            </div>
          )}
        </div>

        {/* 7. Accordion: دليل جهات الاتصال والمتاجر الموثوقة (VIP & القائمة السوداء) */}
        <div className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => toggleSection('contacts')}
            className="w-full min-h-[60px] flex items-center justify-between p-4 sm:p-5 text-right bg-white hover:bg-slate-50/80 transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200 shadow-2xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
                    دليل جهات الاتصال والمتاجر الموثوقة (VIP & القائمة السوداء)
                  </h3>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900">
                    {(localFilter.contacts || []).length} جهة
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {(localFilter.contacts || []).filter(c => c.type === 'vip').length} متاجر VIP 🌟 · {(localFilter.contacts || []).filter(c => c.type === 'blacklist').length} قائمة سوداء 🚫 · حظر تلقائي: {localFilter.autoBlockBlacklist ? 'مفعّل' : 'معطّل'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 mr-2">
              <span className="hidden sm:inline text-xs font-bold text-slate-400">
                {openSections.contacts ? 'إخفاء' : 'تعديل التفاصيل'}
              </span>
              <div className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 transition-transform duration-200 ${openSections.contacts ? 'rotate-180 bg-amber-50 text-amber-800' : ''}`}>
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </button>

          {openSections.contacts && (
            <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/40 space-y-4 animate-in fade-in duration-200">
              <ContactsManager
                contacts={localFilter.contacts || []}
                autoBlockBlacklist={localFilter.autoBlockBlacklist ?? true}
                onUpdateContacts={(updatedContacts, autoBlock) => {
                  setLocalFilter((prev) => ({
                    ...prev,
                    contacts: updatedContacts,
                    autoBlockBlacklist: autoBlock ?? prev.autoBlockBlacklist,
                  }));
                }}
              />
            </div>
          )}
        </div>

        {/* 8. Accordion: صيغة الرد التلقائي عند الحصول على مندوب (تم) */}
        <div className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => toggleSection('done_template')}
            className="w-full min-h-[60px] flex items-center justify-between p-4 sm:p-5 text-right bg-white hover:bg-slate-50/80 transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200 shadow-2xs">
                <Reply className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
                    صيغة الرد التلقائي عند الحصول على مندوب (تم)
                  </h3>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                    {localFilter.broadcastDefaultDoneText || '(تم) ✅'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  الرد المعتمد: "{localFilter.broadcastDefaultDoneText || '(تم) ✅'}" · {localFilter.broadcastIncludeQuote ? 'مع اقتباس الإعلان الأصلي' : 'بدون اقتباس'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 mr-2">
              <span className="hidden sm:inline text-xs font-bold text-slate-400">
                {openSections.done_template ? 'إخفاء' : 'تعديل التفاصيل'}
              </span>
              <div className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 transition-transform duration-200 ${openSections.done_template ? 'rotate-180 bg-emerald-50 text-emerald-700' : ''}`}>
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </button>

          {openSections.done_template && (
            <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/40 space-y-5 animate-in fade-in duration-200">
              
              <div>
                <h4 className="text-sm font-black text-slate-900">إعدادات رد الإنجاز (تم) التلقائي:</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  تحديد النص المسبق الذي يقوم التطبيق بكتابته كـ Replay على إعلانك في كل القروبات فور حصولك على مندوب
                </p>
              </div>

              {/* Quick Word & Quote Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">كلمة الإنجاز الأساسية (مثل: تم):</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={localFilter.broadcastDefaultDoneText || '(تم) ✅'}
                      onChange={(e) => setLocalFilter({ ...localFilter, broadcastDefaultDoneText: e.target.value })}
                      placeholder="(تم) ✅"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <div className="flex gap-1 shrink-0">
                      {['(تم) ✅', 'تم توفير مندوب 🛵', 'تم بحمد الله 🌟'].map((w) => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => setLocalFilter({ ...localFilter, broadcastDefaultDoneText: w })}
                          className="px-2 py-1 text-[10px] font-bold rounded-lg border bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
                        >
                          {w.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">اقتباس الإعلان الأصلي</span>
                    <span className="text-[11px] text-slate-500">وضع اقتباس &gt; لرسالة إعلانك الأصلية</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={localFilter.broadcastIncludeQuote ?? true}
                    onChange={(e) => setLocalFilter({ ...localFilter, broadcastIncludeQuote: e.target.checked })}
                    className="w-5 h-5 rounded text-emerald-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Quick preset formulas */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">قوالب صيغة الرد الجاهزة:</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const tmpl = `(تم) ✅\n\n> {quote}\n\nتم العثور على مندوب لتوصيل هذا الطلب، شكراً لكم جميعاً! يرجى التوقف عن التواصل.`;
                      setLocalFilter({
                        ...localFilter,
                        broadcastReplayTemplate: tmpl,
                        broadcastDefaultDoneText: '(تم) ✅',
                        broadcastIncludeQuote: true,
                      });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors shadow-2xs active:scale-95"
                  >
                    (تم) + اقتباس كامل (شامل وموصى به) 🌟
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLocalFilter({
                        ...localFilter,
                        broadcastReplayTemplate: `(تم) ✅`,
                        broadcastDefaultDoneText: '(تم) ✅',
                        broadcastIncludeQuote: false,
                      });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-colors shadow-2xs active:scale-95"
                  >
                    (تم) فقط
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const tmpl = `(تم) ✅ تم توفير مندوب بنجاح لتوصيل الطلب من [{from}] إلى [{to}]، شكراً لتعاونكم!`;
                      setLocalFilter({
                        ...localFilter,
                        broadcastReplayTemplate: tmpl,
                        broadcastDefaultDoneText: '(تم) ✅',
                        broadcastIncludeQuote: false,
                      });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-colors shadow-2xs active:scale-95"
                  >
                    (تم) مع تفاصيل المسار
                  </button>
                </div>
              </div>

              {/* Replay Template Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">النص المعتمد مسبقاً (قابل للتعديل والتخصيص):</label>
                  <span className="text-[10px] text-slate-400 font-mono">يدعم: {'{doneText}'} و {'{quote}'} و {'{from}'} و {'{to}'}</span>
                </div>
                <textarea
                  rows={4}
                  value={localFilter.broadcastReplayTemplate || `(تم) ✅\n\n> {quote}\n\nتم العثور على مندوب لتوصيل هذا الطلب، شكراً لكم جميعاً! يرجى التوقف عن التواصل.`}
                  onChange={(e) => setLocalFilter({ ...localFilter, broadcastReplayTemplate: e.target.value })}
                  className="w-full p-3.5 rounded-2xl border border-slate-200 bg-white font-mono text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500/20 leading-relaxed shadow-2xs"
                  placeholder="اكتب صيغة الرد الافتراضية المسبقة هنا..."
                />
              </div>

              {/* WhatsApp Chat Preview */}
              <div className="p-3.5 rounded-2xl bg-[#ECE5DD] border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 block">معاينة الرسالة في قروبات الواتساب:</span>
                <div className="bg-[#DCF8C6] text-slate-900 p-3 rounded-xl rounded-tr-none shadow-xs text-xs space-y-2 max-w-md ml-auto">
                  <div className="border-r-4 border-emerald-600 pr-2 pl-1 py-1 bg-white/70 text-[11px] text-slate-600 rounded font-mono">
                    <span className="text-[10px] text-emerald-800 font-bold block mb-0.5">📌 رد على منشورك:</span>
                    طلب توصيل فوري: من المنامة إلى الرفاع (3.5 د.ب)...
                  </div>
                  <div className="font-bold text-slate-950 whitespace-pre-wrap leading-relaxed">
                    {(localFilter.broadcastReplayTemplate || `(تم) ✅\n\nتم العثور على مندوب، شكراً لكم جميعاً!`)
                      .replace('{doneText}', localFilter.broadcastDefaultDoneText || '(تم) ✅')
                      .replace('{quote}', '')
                      .replace('{from}', 'المنامة')
                      .replace('{to}', 'الرفاع')}
                  </div>
                  <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500">
                    <span>{new Date().toLocaleTimeString('ar-BH', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-blue-500 font-bold">✓✓</span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* 9. Accordion: العمل في الخلفية وتثبيت التطبيق على الهاتف */}
        <div className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => toggleSection('background_mode')}
            className="w-full min-h-[60px] flex items-center justify-between p-4 sm:p-5 text-right bg-white hover:bg-slate-50/80 transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200 shadow-2xs">
                <Zap className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
                    العمل في الخلفية وتثبيت التطبيق على الهاتف
                  </h3>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
                    {notifPermission === 'granted' ? 'مفعّل ⚡' : 'إذن مطلوب'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  إشعارات النظام: {notifPermission === 'granted' ? 'مفعّلة ✅' : 'تحتاج إذن'} · الشاشة مضاءة: {localFilter.keepScreenAwake ? 'نعم ☀️' : 'لا'} · تثبيت PWA
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 mr-2">
              <span className="hidden sm:inline text-xs font-bold text-slate-400">
                {openSections.background_mode ? 'إخفاء' : 'تعديل التفاصيل'}
              </span>
              <div className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 transition-transform duration-200 ${openSections.background_mode ? 'rotate-180 bg-amber-50 text-amber-700' : ''}`}>
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </button>

          {openSections.background_mode && (
            <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/40 space-y-5 animate-in fade-in duration-200">
              
              <div>
                <h4 className="text-sm font-black text-slate-900">تشغيل الرادار واستقبال الإشعارات في الخلفية:</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  استمرار رصد الطلبات وتلقي التنبيهات حتى عند فتح واتساب أو خرائط Google وتثبيت التطبيق
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Native Notifications Card */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        localFilter.backgroundNotificationsEnabled !== false
                          ? (notifPermission === 'granted' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700')
                          : 'bg-slate-200 text-slate-500'
                      }`}>
                        <BellRing className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-black text-slate-900">إشعارات النظام المنبثقة</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            localFilter.backgroundNotificationsEnabled === false
                              ? 'bg-slate-200 text-slate-700'
                              : notifPermission === 'granted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : notifPermission === 'denied'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {localFilter.backgroundNotificationsEnabled === false
                              ? 'متوقفة (OFF)'
                              : notifPermission === 'granted'
                              ? 'مفعّلة ومستعدة (ON) ✅'
                              : notifPermission === 'denied'
                              ? 'محظورة بالمتصفح 🚫'
                              : 'تحتاج إذن ⚠️'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          إشعار فوري منبثق فوق واتساب والخرائط عند ظهور طلب مطابق
                        </p>
                      </div>
                    </div>

                    {/* Direct ON / OFF Switch */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const next = !(localFilter.backgroundNotificationsEnabled !== false);
                          setLocalFilter({
                            ...localFilter,
                            backgroundNotificationsEnabled: next,
                          });
                          if (next && notifPermission !== 'granted' && isNotificationSupported()) {
                            handleRequestNotifPermission();
                          }
                        }}
                        className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                          localFilter.backgroundNotificationsEnabled !== false ? 'bg-emerald-600' : 'bg-slate-300'
                        }`}
                        title="تبديل تشغيل أو إيقاف إشعارات النظام المنبثقة ON / OFF"
                      >
                        <span
                          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center text-[10px] font-black ${
                            localFilter.backgroundNotificationsEnabled !== false ? 'translate-x-6 text-emerald-700' : 'translate-x-0 text-slate-400'
                          }`}
                        >
                          {localFilter.backgroundNotificationsEnabled !== false ? 'ON' : 'OFF'}
                        </span>
                      </button>
                      <span className="text-[9px] font-bold text-slate-400">
                        {localFilter.backgroundNotificationsEnabled !== false ? 'مفعلة' : 'معطلة'}
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                    {notifPermission === 'granted' ? (
                      <button
                        type="button"
                        onClick={() => {
                          sendBackgroundOrderNotification({
                            id: `test-${Date.now()}`,
                            from: 'المنامة (السلمانية)',
                            to: 'المحرق (البسيتين)',
                            price: 2.5,
                            rawText: 'تجربة إشعار خلفية منبثق فوق التطبيقات',
                            groupName: 'قروب مناديب البحرين',
                            senderName: 'متجر ورود VIP',
                            senderPhone: '97339000000',
                            receivedAt: new Date(),
                            confidence: 1,
                            type: 'delivery',
                            status: 'pending',
                            match: {
                              score: 95,
                              startMatched: true,
                              destinationMatched: true,
                              priceMatched: true,
                              distanceMatched: true,
                              timeMatched: true,
                              distanceKm: 3.5,
                              statusLabel: 'طلب ممتاز',
                              statusColor: 'emerald',
                            },
                            contactStatus: 'vip',
                          });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 active:scale-95 shadow-2xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>إرسال تجربة فورية</span>
                      </button>
                    ) : notifPermission === 'denied' ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (isInIframe()) {
                            window.open(window.location.href, '_blank');
                          } else {
                            setShowNotifGuideModal(true);
                          }
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-2xs shrink-0 active:scale-95 cursor-pointer flex items-center gap-1.5"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>فك الحظر 🔓</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRequestNotifPermission}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-2xs shrink-0 active:scale-95 cursor-pointer flex items-center gap-1.5"
                      >
                        <span>منح الإذن الآن 🔔</span>
                      </button>
                    )}

                    {isInIframe() && (
                      <button
                        type="button"
                        onClick={() => window.open(window.location.href, '_blank')}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-2xs cursor-pointer flex items-center gap-1.5 transition-all active:scale-95"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>فتح كامل ↗</span>
                      </button>
                    )}
                  </div>

                  {/* Why blocked notice & solution */}
                  {isInIframe() && (
                    <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-950 text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>لماذا تظهر «محظورة بالمتصفح 🚫» في المعاينة؟</span>
                      </div>
                      <p className="text-[11px] text-amber-900/90 leading-relaxed">
                        المتصفح يمنع إذن الإشعارات أمنياً داخل نافذة المعاينة (iFrame). لفك الحظر والحصول على الإشعارات المنبثقة الحقيقية فوق واتساب وخرائط Google، اضغط <strong>«فتح كامل ↗»</strong> أو ثبّت التطبيق على شاشة هاتفك.
                      </p>
                      <p className="text-[10px] text-emerald-800 font-bold">
                        ✓ التنبيهات المنبثقة التفاعلية داخل شاشة التطبيق والأصوات والاهتزاز تعمل دائماً وبشكل كامل.
                      </p>
                    </div>
                  )}
                </div>

                {/* Deduplication Across WhatsApp Groups Card */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        localFilter.preventDuplicateOrders !== false ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-500'
                      }`}>
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-black text-slate-900">منع تكرار الإعلانات عبر القروبات</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            localFilter.preventDuplicateOrders !== false
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {localFilter.preventDuplicateOrders !== false ? 'مفعل لمنع التكرار (ON) ✅' : 'معطل (OFF)'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          مقارنة بيانات الطلب ورقم المعلن عبر كافة قروبات الواتساب ودمجها في طلب واحد
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setLocalFilter({
                          ...localFilter,
                          preventDuplicateOrders: !(localFilter.preventDuplicateOrders !== false),
                        });
                      }}
                      className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        localFilter.preventDuplicateOrders !== false ? 'bg-purple-600' : 'bg-slate-300'
                      }`}
                      title="تبديل منع التكرار ON / OFF"
                    >
                      <span
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center text-[10px] font-black ${
                          localFilter.preventDuplicateOrders !== false ? 'translate-x-6 text-purple-700' : 'translate-x-0 text-slate-400'
                        }`}
                      >
                        {localFilter.preventDuplicateOrders !== false ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100 text-purple-950 text-xs space-y-1">
                    <p className="font-bold text-[11px]">
                      🛡️ آلية الذكاء الاصطناعي لمنع التكرار:
                    </p>
                    <p className="text-[11px] text-purple-900/80 leading-relaxed">
                      عند قيام تاجر أو معلن بنشر نفس الطلب في عدة قروبات واتساب، يتعرف البرنامج على رقم المعلن والمسار فوراً ويعرض لك طلباً واحداً فقط مع تمييزه بعلامة <strong>«مكرر في عدة قروبات (تم دمجه)»</strong> لمنع الإزعاج.
                    </p>
                  </div>
                </div>

                {/* Screen Wake Lock Card */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        localFilter.keepScreenAwake ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'
                      }`}>
                        <Sun className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">إبقاء الشاشة مضاءة (Wake Lock)</span>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          منع الشاشة من التعتيم أو القفل أثناء تثبيت الهاتف في السيارة
                        </p>
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={localFilter.keepScreenAwake ?? false}
                      onChange={async (e) => {
                        const val = e.target.checked;
                        setLocalFilter({ ...localFilter, keepScreenAwake: val });
                        if (val) {
                          await requestScreenWakeLock();
                        } else {
                          await releaseScreenWakeLock();
                        }
                      }}
                      className="w-5 h-5 rounded text-amber-600 cursor-pointer shrink-0 mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* PWA Install Banner */}
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-blue-950">تثبيت تطبيق Ordari على هاتفك (PWA)</h4>
                    <p className="text-[11px] text-blue-800/80 mt-0.5">
                      سرعة استجابة فائقة، شاشة كاملة بدون متصفح، وأيقونة مباشرة على شاشة الهاتف لتقليل المساحة والاختصار
                    </p>
                  </div>
                </div>
                <PWAInstallButton variant="header" />
              </div>

            </div>
          )}
        </div>

        {/* 10. Accordion: الحساب والترخيص (دخول بالهاتف والبصمة وكود التفعيل) */}
        <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white via-emerald-50/20 to-teal-50/30 border border-emerald-200/90 shadow-2xs overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => toggleSection('auth')}
            className="w-full min-h-[60px] flex items-center justify-between p-4 sm:p-5 text-right bg-white hover:bg-slate-50/80 transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200 shadow-2xs">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
                    الحساب والترخيص (دخول بالهاتف والبصمة وكود التفعيل)
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    currentUser?.isActivated 
                       ? 'bg-emerald-100 text-emerald-800' 
                       : 'bg-amber-100 text-amber-800'
                  }`}>
                    {currentUser ? (currentUser.isActivated ? 'حساب VIP 🇧🇭' : 'بانتظار التفعيل') : 'تسجيل / تفعيل'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {currentUser ? (
                    <>الاسم: <strong className="text-emerald-700 font-bold">{currentUser.name}</strong> · الهاتف: +973 {currentUser.phone} · الخطة: {currentUser.licensePlan || 'نشط'}</>
                  ) : (
                    'الدخول برقم الهاتف وكلمة المرور، مستشعر البصمة البيومترية، وإدخال كود التفعيل المعتمد'
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 mr-2">
              <span className="hidden sm:inline text-xs font-bold text-slate-400">
                {openSections.auth ? 'إخفاء' : 'إدارة الحساب'}
              </span>
              <div className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 transition-transform duration-200 ${openSections.auth ? 'rotate-180 bg-emerald-50 text-emerald-700' : ''}`}>
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </button>

          {openSections.auth && (
            <div className="p-4 sm:p-6 border-t border-emerald-100 space-y-4 bg-slate-50/40 animate-in fade-in duration-150">
              
              {/* Profile Overview Card */}
              {currentUser ? (
                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-emerald-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-emerald-600/20 shrink-0">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-black text-slate-900">{currentUser.name}</h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {currentUser.isActivated ? 'ترخيص معتمد ✅' : 'يحتاج تفعيل'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        رقم الهاتف: <strong className="text-slate-700 font-mono" dir="ltr">+973 {currentUser.phone}</strong> · وسيلة التوصيل: <strong className="text-slate-800">{getVehicleTypeLabel(currentUser.vehicleType)}</strong>
                      </p>
                      <p className="text-[11px] text-emerald-700 font-bold mt-1">
                        خطة الترخيص: {currentUser.licensePlan || 'ترخيص VIP سنوي'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenAuthModal?.('activate')}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>تجديد / إدخال كود التفعيل</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenAuthModal?.('login')}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all active:scale-95"
                    >
                      تبديل الحساب
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-black text-slate-900">لم تقم بتسجيل الدخول بعد</h4>
                      <p className="text-xs text-slate-500 mt-0.5">سجل دخولك برقم الهاتف أو البصمة لحفظ إعدادات الرادار وربط ترخيص البرنامج</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenAuthModal?.('login')}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>تسجيل الدخول (هاتف وباسوورد)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenAuthModal?.('register')}
                      className="px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition-all active:scale-95"
                    >
                      حساب جديد
                    </button>
                  </div>
                </div>
              )}

              {/* 3 Quick Action Cards for Login / Biometrics / Activation Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => onOpenAuthModal?.('login')}
                  className="p-3.5 rounded-2xl bg-white hover:bg-emerald-50/40 border border-slate-200 hover:border-emerald-300 text-right transition-all group shadow-2xs"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black text-slate-900">دخول الهاتف وكلمة المرور</span>
                    <Lock className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    تسجيل الدخول برقم واتساب البحرين (+973) مع كلمة المرور الخاصة بك.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenAuthModal?.('login')}
                  className="p-3.5 rounded-2xl bg-white hover:bg-emerald-50/40 border border-slate-200 hover:border-emerald-300 text-right transition-all group shadow-2xs"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black text-slate-900">المصادقة السريعة بالبصمة</span>
                    <Fingerprint className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    تسجيل دخول فوري وآمن بنقرة إصبع عبر مستشعر البصمة أو Face ID.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenAuthModal?.('activate')}
                  className="p-3.5 rounded-2xl bg-white hover:bg-emerald-50/40 border border-slate-200 hover:border-emerald-300 text-right transition-all group shadow-2xs"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black text-slate-900">كود التفعيل وترخيص البرنامج</span>
                    <KeyRound className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    إدخال كود الترخيص الرسمي لفتح ميزات السحب الآلي وفحص AI.
                  </p>
                </button>
              </div>

              {/* Features Unlocked & WhatsApp Activation Request */}
              <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800">الميزات المفعلة عند إدخال كود التفعيل:</span>
                  <span className="text-[10px] text-emerald-700 font-bold">رادار Ordari 🇧🇭</span>
                </div>

                <ul className="space-y-1.5 text-xs text-slate-700">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>سحب فوري لكافة طلبات مجموعات واتساب على نفس الهاتف</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>فحص الذكاء الاصطناعي بـ Gemini AI لشروط التوصيل</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>العمل في الخلفية واستقبال الإشعارات فوق خرائط Google</span>
                  </li>
                </ul>

                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
                  {/* WhatsApp Direct Contact Button to Request Activation Code */}
                  <a
                    href={ACTIVATION_WHATSAPP_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-black text-xs shadow-xs transition-all flex items-center justify-center gap-2 active:scale-95 group"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    <span>تواصل عبر واتساب للحصول على كود التفعيل</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => onOpenAuthModal?.('activate')}
                    className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                    <span>إدخال كود التفعيل</span>
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Save Button Floating / Sticky at bottom */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.01] active:scale-[0.98]"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>حفظ التعديلات وتفعيل شروط الفلتر</span>
        </button>
      </div>

      {/* Areas Multi-Select Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>تحديد وجهات التسليم المطلوبة</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                    {localFilter.destinations.length} محدد
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">اختر الوجهات، أو أضف كل المناطق بضغطة واحدة، أو اكتب اسم وجهة خاصة</p>
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Bulk Action Bar */}
            <div className="py-2.5 px-3 my-2 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSelectAllAreas(modalMode)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>إضافة كل مناطق البحرين (الكل)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectVisibleAreas(modalMode)}
                  className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-colors"
                  title="تحديد كل المعروض بالقائمة حالياً"
                >
                  <span>تحديد المعروض فقط</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleClearAllAreas(modalMode)}
                className="px-2.5 py-1.5 rounded-xl hover:bg-rose-50 text-rose-600 text-xs font-bold transition-colors"
              >
                مسح التحديد (الكل متاح)
              </button>
            </div>

            {/* Search & Custom Area Adder */}
            <div className="py-2 space-y-2">
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="ابحث عن منطقة في البحرين..."
                    value={areaSearch}
                    onChange={(e) => setAreaSearch(e.target.value)}
                    className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Add Custom Landmark / Area Input */}
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="أو أضف اسم منطقة / مجمع / وجهة خاصة..."
                  value={customAreaInput}
                  onChange={(e) => setCustomAreaInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomArea(modalMode);
                    }
                  }}
                  className="flex-1 px-3 py-2 rounded-xl border border-dashed border-slate-300 text-xs font-bold text-slate-800 bg-slate-50/60 focus:bg-white focus:border-purple-400"
                />
                <button
                  type="button"
                  onClick={() => handleAddCustomArea(modalMode)}
                  disabled={!customAreaInput.trim()}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة</span>
                </button>
              </div>

              {/* Gov Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1">
                {governorates.map((gov) => {
                  const isCur = selectedGovernorate === gov;
                  return (
                    <button
                      key={gov}
                      type="button"
                      onClick={() => setSelectedGovernorate(gov)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                        isCur
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {gov}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Area Checkboxes List */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 py-1 divide-y divide-slate-100">
              {filteredAreas.map((area) => {
                const isSelected = localFilter.destinations.includes(area.name);

                return (
                  <div
                    key={area.id}
                    onClick={() => handleToggleDestination(area.name)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                      isSelected ? 'bg-purple-50/70 hover:bg-purple-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className={`text-xs font-bold ${isSelected ? 'text-purple-950 font-black' : 'text-slate-800'}`}>
                        {area.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 rounded-md bg-slate-100">
                        {area.governorate}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-bold text-purple-600 bg-purple-100/80 px-1.5 py-0.5 rounded">
                          مضاف
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-500 font-bold">
                {localFilter.destinations.length === 0 ? 'مفتوح لجميع وجهات التسليم' : `${localFilter.destinations.length} وجهة تسليم محددة`}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-black text-xs shadow-xs hover:bg-blue-500 transition-all"
                >
                  تم واعتماد الوجهات
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Notification Fix & Permission Unblock Modal */}
      {showNotifGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 text-right">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-700 font-black text-base">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3>إذن إشعارات النظام المنبثقة</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNotifGuideModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* In-Iframe Explanation */}
            {isInIframe() && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-2 text-amber-950">
                <div className="flex items-center gap-1.5 font-black text-amber-900">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>أنت تتصفح حالياً من نافذة المعاينة (iFrame)</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-900/90 font-medium">
                  المتصفحات الحديثة (Chrome / Safari) تمنع طلب إذن الإشعارات وتثبيت PWA من داخل الإطارات المضمنة لحماية الخصوصية. افتح التطبيق في نافذة مستقلة كاملة لمنح الإذن فوراً:
                </p>
                <button
                  type="button"
                  onClick={() => window.open(window.location.href, '_blank')}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>فتح في متصفح مستقل كامل الآن 🚀</span>
                </button>
              </div>
            )}

            {/* Step-by-Step Unblock Guide for Denied Permission */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-800">
                خطوات فك حظر الإشعارات في متصفح هاتفك (Chrome / Safari):
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="w-5 h-5 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                  <p className="text-slate-700">اضغط على أيقونة <strong>القفل 🔒</strong> بجانب رابط الموقع أعلى شاشة المتصفح.</p>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="w-5 h-5 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                  <p className="text-slate-700">اختر <strong>«أذونات الموقع» (Permissions / Site settings)</strong>.</p>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="w-5 h-5 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                  <p className="text-slate-700">اضغط على <strong>«الإشعارات» (Notifications)</strong> وغيّرها إلى <strong>«سماح» (Allow)</strong>.</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleRefreshNotifPermission}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>إعادة فحص الإذن الآن 🔄</span>
              </button>
              <button
                type="button"
                onClick={() => setShowNotifGuideModal(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
