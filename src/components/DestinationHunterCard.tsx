import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Flag, 
  Plus, 
  X, 
  CheckCircle2, 
  Trash2, 
  Play, 
  Sparkles, 
  Bell, 
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { OrderFilter, HuntedDestinationLog, ParsedOrder } from '../types';
import { 
  POPULAR_BAHRAIN_DELIVERY_AREAS, 
  checkOrderDestinationHunt,
  getStoredHuntedDestinationLogs,
  clearHuntedDestinationLogs 
} from '../utils/destinationHunter';
import { BAHRAIN_AREAS } from '../data/bahrainAreas';
import { playAlertTone } from '../utils/sound';

interface DestinationHunterCardProps {
  filter: OrderFilter;
  onUpdateFilter: (updated: OrderFilter) => void;
  orders?: ParsedOrder[];
  onOpenOrder?: (order: ParsedOrder) => void;
  isCompact?: boolean;
}

export const DestinationHunterCard: React.FC<DestinationHunterCardProps> = ({
  filter,
  onUpdateFilter,
  orders = [],
  onOpenOrder,
  isCompact = false,
}) => {
  const [newDeliveryInput, setNewDeliveryInput] = useState('');
  const [huntedLogs, setHuntedLogs] = useState<HuntedDestinationLog[]>([]);
  
  // Simulator state
  const [simText, setSimText] = useState('أوردر من السيف إلى المحرق، السعر 2.5 د.ب');
  const [simResult, setSimResult] = useState<any>(null);
  const [showSimulator, setShowSimulator] = useState(false);

  useEffect(() => {
    setHuntedLogs(getStoredHuntedDestinationLogs());
  }, []);

  const desiredDelivery = (filter.desiredDeliveryAreas && filter.desiredDeliveryAreas.length > 0) 
    ? filter.desiredDeliveryAreas 
    : (filter.destinations || []);
  const isEnabled = filter.destinationHunterEnabled !== false;

  // Toggle master switch
  const handleToggleHunter = (enabled: boolean) => {
    onUpdateFilter({
      ...filter,
      destinationHunterEnabled: enabled,
    });
  };

  // Add / Remove Delivery Area
  const handleAddDelivery = (areaName: string) => {
    const trimmed = areaName.trim();
    if (!trimmed || desiredDelivery.includes(trimmed)) return;
    const updated = [...desiredDelivery, trimmed];
    onUpdateFilter({
      ...filter,
      desiredDeliveryAreas: updated,
      destinations: updated, // Sync with core destinations
    });
    setNewDeliveryInput('');
  };

  const handleRemoveDelivery = (areaName: string) => {
    const updated = desiredDelivery.filter(a => a !== areaName);
    onUpdateFilter({
      ...filter,
      desiredDeliveryAreas: updated,
      destinations: updated,
    });
  };

  // Run Simulator
  const handleRunSimulation = () => {
    if (!simText.trim()) return;
    // Extract rough from/to for test
    let testFrom = 'السيف';
    let testTo = 'المحرق';
    
    // Quick parse check
    for (const a of BAHRAIN_AREAS) {
      if (simText.includes(a.name)) {
        if (simText.indexOf(a.name) < simText.length / 2) {
          testFrom = a.name;
        } else {
          testTo = a.name;
        }
      }
    }

    const res = checkOrderDestinationHunt({ from: testFrom, to: testTo, rawText: simText }, filter);
    setSimResult({
      ...res,
      from: testFrom,
      to: testTo,
    });

    if (res.isHunted && filter.soundEnabled) {
      playAlertTone('cash_register', 80);
    }
  };

  // Hunted orders from active feed
  const activeHuntedOrders = orders.filter(o => o.isDestinationHunted && o.status !== 'closed_taken');

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden transition-all space-y-0">
      
      {/* Header Banner */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
            <Target className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                صائد وجهات التوصيل والتسليم المرغوبة 🎯
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white border border-white/30">
                {isEnabled ? 'الصائد شغال ⚡' : 'معطّل'}
              </span>
            </div>
            <p className="text-xs text-white/80 mt-0.5 leading-relaxed">
              يراقب قروبات الواتساب المنشورة لحظياً، ويصطاد فوراً أي طلب تسليم يطابق وجهاتك المفضلة
            </p>
          </div>
        </div>

        {/* Master Toggle */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <span className="text-xs font-bold text-white ml-2">
              {isEnabled ? 'مفعّل بالرادار' : 'متوقف'}
            </span>
            <div className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => handleToggleHunter(e.target.checked)}
                className="sr-only"
              />
              <span className={`w-full h-full rounded-full transition-colors ${isEnabled ? 'bg-white' : 'bg-white/30'}`}>
                <span className={`inline-block h-5 w-5 transform rounded-full shadow-xs transition duration-200 ease-in-out ${
                  isEnabled ? '-translate-x-5 bg-emerald-600' : 'translate-x-0 bg-white'
                }`} />
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Live Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-x-reverse divide-slate-100 bg-slate-50/70 border-b border-slate-100 text-center text-xs">
        <div className="p-3">
          <span className="text-[10px] text-slate-400 font-bold block">وجهات التسليم المرغوبة</span>
          <span className="text-sm font-black text-purple-700">{desiredDelivery.length === 0 ? 'كل البحرين 🌐' : `${desiredDelivery.length} وجهة`}</span>
        </div>
        <div className="p-3">
          <span className="text-[10px] text-slate-400 font-bold block">صيدات نشطة بالرادار الآن</span>
          <span className="text-sm font-black text-emerald-600 flex items-center justify-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>{activeHuntedOrders.length} طلبات</span>
          </span>
        </div>
        <div className="p-3 col-span-2 sm:col-span-1">
          <span className="text-[10px] text-slate-400 font-bold block">حالة المراقبة</span>
          <span className={`text-sm font-black ${isEnabled ? 'text-emerald-700' : 'text-slate-400'}`}>
            {isEnabled ? 'صيد فوري شغال 🎯' : 'الصائد متوقف'}
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">

        {/* Desired Delivery Areas (وجهات التسليم والتوصيل) */}
        <div className="p-4 rounded-2xl bg-purple-50/40 border border-purple-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-xs sm:text-sm font-black text-purple-950 flex items-center gap-1.5">
                <Flag className="w-4 h-4 text-purple-600" />
                <span>وجهات التسليم والتوصيل المرغوبة (إلى أين تريد التوصيل؟)</span>
              </h4>
              <p className="text-[11px] text-purple-800/80 mt-0.5">
                أي إعلان في القروبات يطلب توصيلاً إلى هذه الوجهات سيتم اصطياده وتنبيهك به فوراً
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onUpdateFilter({ ...filter, desiredDeliveryAreas: [], destinations: [] })}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white text-purple-700 border border-purple-200 hover:bg-purple-100/50 transition-colors"
              >
                توصيل لكل مناطق البحرين 🌐
              </button>
            </div>
          </div>

          {/* Quick Add Input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newDeliveryInput}
              onChange={(e) => setNewDeliveryInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddDelivery(newDeliveryInput)}
              placeholder="اكتب اسم منطقة تسليم مرغوبة (مثال: عراد، أمواج، البديع...)"
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-purple-200 bg-white font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/30"
            />
            <button
              type="button"
              onClick={() => handleAddDelivery(newDeliveryInput)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1 shrink-0 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة لوجهات الصيد</span>
            </button>
          </div>

          {/* Active Delivery Badges */}
          <div className="flex flex-wrap gap-1.5 min-h-[38px] p-2.5 rounded-xl bg-white border border-purple-100">
            {desiredDelivery.length === 0 ? (
              <span className="text-[11px] text-purple-600 font-semibold my-auto">
                🌐 مفتوح للكل: يصطاد الطلبات المتجهة إلى أي مدينة أو قرية في البحرين.
              </span>
            ) : (
              desiredDelivery.map((area) => (
                <span
                  key={area}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-900 border border-purple-200 shadow-2xs"
                >
                  <Flag className="w-3 h-3 text-purple-600 shrink-0" />
                  <span>{area}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDelivery(area)}
                    className="hover:text-rose-600 text-purple-400 p-0.5 rounded-md transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>

          {/* Quick Suggestions for Delivery */}
          <div>
            <span className="text-[10px] text-purple-800/80 font-bold block mb-1.5">
              مقترحات سريعة لوجهات شائعة بالقروبات (انقر للإضافة الفورية):
            </span>
            <div className="flex flex-wrap gap-1">
              {POPULAR_BAHRAIN_DELIVERY_AREAS.map((area) => {
                const isSelected = desiredDelivery.includes(area);
                return (
                  <button
                    key={area}
                    type="button"
                    onClick={() => isSelected ? handleRemoveDelivery(area) : handleAddDelivery(area)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                        : 'bg-white text-purple-800 border-purple-200 hover:bg-purple-100/60'
                    }`}
                  >
                    {isSelected ? `✓ ${area}` : `+ ${area}`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sniper Sound & Alert Preferences */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-emerald-600" />
                <span>نغمة وتنبيه قناص الوجهات الفوري ⚡</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                إطلاق نغمة قوية خاصة واهتزاز فوري عند اصطياد إعلان يطابق وجهتك المفضلة في القروبات
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filter.destinationSniperAlert !== false}
                onChange={(e) => onUpdateFilter({ ...filter, destinationSniperAlert: e.target.checked })}
                className="sr-only"
              />
              <div className={`w-9 h-5 rounded-full transition-colors ${filter.destinationSniperAlert !== false ? 'bg-emerald-600' : 'bg-slate-300'}`}>
                <span className={`inline-block w-4 h-4 transform rounded-full bg-white shadow transition ${filter.destinationSniperAlert !== false ? '-translate-x-4' : 'translate-x-0.5'} mt-0.5`} />
              </div>
            </label>
          </div>
        </div>

        {/* Simulator Toggle & Interactive Tester */}
        <div className="rounded-2xl border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowSimulator(!showSimulator)}
            className="w-full p-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-right font-black text-xs sm:text-sm text-slate-900 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>مختبر فحص ومحاكاة صائد الوجهات الفوري (Live Simulator) 🧪</span>
            </div>
            {showSimulator ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>

          {showSimulator && (
            <div className="p-4 sm:p-5 bg-white border-t border-slate-200 space-y-3">
              <p className="text-xs text-slate-600">
                جرب إدخال أي نص لإعلان نشر في قروب واتساب للتأكد من قدرة الصائد على التقاط الوجهة:
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={simText}
                  onChange={(e) => setSimText(e.target.value)}
                  placeholder="اكتب رسالة تجريبية..."
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 font-bold"
                />
                <button
                  type="button"
                  onClick={handleRunSimulation}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs flex items-center gap-1 shrink-0 transition-all active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>فحص الصيد</span>
                </button>
              </div>

              {simResult && (
                <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 animate-in fade-in duration-200 ${
                  simResult.isHunted
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <div className="flex items-center justify-between font-black">
                    <span className="flex items-center gap-1.5">
                      {simResult.isHunted ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>🎯 تم اصطياد الطلب بنجاح!</span>
                        </>
                      ) : (
                        <span>⚪ خارج قائمة الوجهات المحددة للصيد</span>
                      )}
                    </span>
                    {simResult.badgeLabel && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px]">
                        {simResult.badgeLabel}
                      </span>
                    )}
                  </div>
                  {simResult.reason && (
                    <p className="text-[11px] leading-relaxed text-emerald-800">
                      {simResult.reason}
                    </p>
                  )}
                  <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-500 font-mono">
                    <span>الاستلام: {simResult.from}</span>
                    <span>•</span>
                    <span>التسليم: {simResult.to}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Captured Logs (سجل الصيدات السابقة) */}
        {huntedLogs.length > 0 && (
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-3.5 bg-slate-50 flex items-center justify-between border-b border-slate-200">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-600" />
                <span>سجل ما تم اصطياده من قروبات التوصيل ({huntedLogs.length})</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  clearHuntedDestinationLogs();
                  setHuntedLogs([]);
                }}
                className="text-[10px] text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>مسح السجل</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
              {huntedLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="p-3 text-xs flex items-center justify-between hover:bg-slate-50/50">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 font-bold text-slate-900 truncate">
                      <span className="text-emerald-700 font-black">{log.from}</span>
                      <span className="text-slate-400">➔</span>
                      <span className="text-purple-700 font-black">{log.to}</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px]">
                        {log.price > 0 ? `${log.price} د.ب` : 'سعر غير محدد'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>قروب: {log.groupName}</span>
                      <span>•</span>
                      <span>{new Date(log.huntedAt).toLocaleTimeString('ar-BH')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
