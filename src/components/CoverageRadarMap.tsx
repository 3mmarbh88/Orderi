import { useState, useMemo } from 'react';
import { 
  MapPin, 
  Navigation, 
  Compass, 
  ZoomIn, 
  ZoomOut, 
  Crosshair, 
  CheckCircle2, 
  RefreshCw,
  Info,
  Maximize2,
  Sparkles
} from 'lucide-react';
import { BAHRAIN_AREAS, calculateDistanceKm } from '../data/bahrainAreas';
import { MatcherLocation } from '../utils/matcher';
import { AreaLocation } from '../types';

interface CoverageRadarMapProps {
  driverLocation: MatcherLocation | null;
  coverageKm: number;
  onCoverageChange: (km: number) => void;
  onRequestGps?: () => void;
  isGpsLoading?: boolean;
  onSelectAreaAsLocation?: (area: AreaLocation) => void;
}

export function CoverageRadarMap({
  driverLocation,
  coverageKm,
  onCoverageChange,
  onRequestGps,
  isGpsLoading = false,
  onSelectAreaAsLocation,
}: CoverageRadarMapProps) {
  // View mode: 'auto' (smart scale based on radius), 'local' (close-up around center), 'kingdom' (full Bahrain)
  const [viewMode, setViewMode] = useState<'auto' | 'local' | 'kingdom'>('auto');
  const [hoveredArea, setHoveredArea] = useState<{ name: string; dist: number; isInside: boolean } | null>(null);

  // Fallback center: Gudaibiya (القضيبية)
  const centerLat = driverLocation?.latitude ?? 26.2255;
  const centerLon = driverLocation?.longitude ?? 50.5971;
  const centerName = driverLocation?.areaName || 'القضيبية';
  const lastUpdated = driverLocation?.lastUpdated;

  // Calculate covered areas
  const { coveredAreas, outsideAreas } = useMemo(() => {
    const covered: { area: AreaLocation; dist: number }[] = [];
    const outside: { area: AreaLocation; dist: number }[] = [];

    BAHRAIN_AREAS.forEach((area) => {
      const dist = calculateDistanceKm(centerLat, centerLon, area.latitude, area.longitude);
      if (dist <= coverageKm) {
        covered.push({ area, dist });
      } else {
        outside.push({ area, dist });
      }
    });

    covered.sort((a, b) => a.dist - b.dist);
    outside.sort((a, b) => a.dist - b.dist);

    return { coveredAreas: covered, outsideAreas: outside };
  }, [centerLat, centerLon, coverageKm]);

  // Determine effective zoom mode
  const effectiveZoom = useMemo(() => {
    if (viewMode === 'local') return 'local';
    if (viewMode === 'kingdom') return 'kingdom';
    // Auto
    return coverageKm <= 5 ? 'local' : 'kingdom';
  }, [viewMode, coverageKm]);

  // Coordinates bounds
  // Kingdom bounds: Lat 25.98 - 26.32, Lon 50.42 - 50.68 (approx 37km x 26km)
  // Local bounds: ±0.06 deg lat (~6.6km), ±0.07 deg lon (~7km) centered on current position
  const bounds = useMemo(() => {
    if (effectiveZoom === 'local') {
      const latDelta = 0.055;
      const lonDelta = 0.065;
      return {
        minLat: centerLat - latDelta,
        maxLat: centerLat + latDelta,
        minLon: centerLon - lonDelta,
        maxLon: centerLon + lonDelta,
      };
    } else {
      return {
        minLat: 26.00,
        maxLat: 26.31,
        minLon: 50.43,
        maxLon: 50.68,
      };
    }
  }, [effectiveZoom, centerLat, centerLon]);

  // Project lat/lon to percentage (0 - 100%) inside map viewport
  const projectCoord = (lat: number, lon: number) => {
    const x = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * 100;
    const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * 100;
    return { x, y };
  };

  const centerCoord = projectCoord(centerLat, centerLon);

  // Approximate pixel / percentage radius for coverageKm
  // 1 degree lat ≈ 111.0 km, 1 degree lon ≈ 99.6 km at lat 26.2
  const latSpanKm = (bounds.maxLat - bounds.minLat) * 111.0;
  const lonSpanKm = (bounds.maxLon - bounds.minLon) * 99.6;

  // Radius in percentage of container width & height
  const radiusPercentX = (coverageKm / lonSpanKm) * 100;
  const radiusPercentY = (coverageKm / latSpanKm) * 100;

  // Concentric sub-ring ratios for radar visualization
  const subRingSteps = useMemo(() => {
    if (coverageKm <= 2) return [0.5, 1];
    if (coverageKm <= 6) return [0.33, 0.66, 1];
    return [0.25, 0.5, 0.75, 1];
  }, [coverageKm]);

  // Quick preset distances
  const PRESETS = [1, 2, 3, 5, 8, 12, 20, 30];

  return (
    <div className="w-full rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800 text-white overflow-hidden shadow-xl select-none">
      
      {/* 1. Header Toolbar */}
      <div className="p-3.5 sm:p-4 bg-slate-950/80 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Compass className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-black text-white">
                خريطة رادار التغطية والمسافة المقبولة 📡
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {coverageKm} كم من المركز
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              دائرة التغطية تتسع في كل الاتجاهات من موقعك المعتمد ({centerName})
            </p>
          </div>
        </div>

        {/* View Controls & GPS button */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="inline-flex p-0.5 rounded-xl bg-slate-800 border border-slate-700 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setViewMode('auto')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'auto' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              تلقائي ⚡
            </button>
            <button
              type="button"
              onClick={() => setViewMode('local')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'local' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="تكبير مقرب على محيط موقعك (1-5 كم)"
            >
              مقرب 🔍
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kingdom')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'kingdom' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="نظرة شاملة لكامل خريطة البحرين"
            >
              البحرين كاملة 🇧🇭
            </button>
          </div>

          {onRequestGps && (
            <button
              type="button"
              onClick={onRequestGps}
              disabled={isGpsLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isGpsLoading ? 'animate-spin' : ''}`} />
              <span>{isGpsLoading ? 'جاري الرصد...' : 'GPS 📍'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Interactive Map Canvas */}
      <div className="relative w-full h-[340px] sm:h-[420px] bg-gradient-to-b from-[#061224] via-[#091830] to-[#040D1A] overflow-hidden">
        
        {/* Subtle grid lines background */}
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

        {/* Dynamic SVG Radar Circles */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
          <defs>
            {/* Glowing radial gradient for coverage circle */}
            <radialGradient id="radarCoverageGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
              <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.18" />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>

            {/* Linear gradient for radius indicator pointer */}
            <linearGradient id="radiusLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Sub concentric distance helper rings */}
          {subRingSteps.map((fraction, idx) => {
            const rx = radiusPercentX * fraction;
            const ry = radiusPercentY * fraction;
            const subDist = (coverageKm * fraction).toFixed(1);
            return (
              <g key={`sub-ring-${idx}`}>
                <ellipse
                  cx={`${centerCoord.x}%`}
                  cy={`${centerCoord.y}%`}
                  rx={`${rx}%`}
                  ry={`${ry}%`}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth={fraction === 1 ? '2.5' : '1'}
                  strokeDasharray={fraction === 1 ? 'none' : '4 4'}
                  strokeOpacity={fraction === 1 ? '0.9' : '0.35'}
                />
              </g>
            );
          })}

          {/* Primary Filled Radar Coverage Circle */}
          <ellipse
            cx={`${centerCoord.x}%`}
            cy={`${centerCoord.y}%`}
            rx={`${radiusPercentX}%`}
            ry={`${radiusPercentY}%`}
            fill="url(#radarCoverageGlow)"
            stroke="#10b981"
            strokeWidth="2.5"
            className="transition-all duration-300 ease-out"
          />

          {/* Animated pulsing outer radar wave */}
          <ellipse
            cx={`${centerCoord.x}%`}
            cy={`${centerCoord.y}%`}
            rx={`${radiusPercentX}%`}
            ry={`${radiusPercentY}%`}
            fill="none"
            stroke="#34d399"
            strokeWidth="1.5"
            className="animate-ping origin-center opacity-40"
            style={{
              transformOrigin: `${centerCoord.x}% ${centerCoord.y}%`,
              animationDuration: '3s',
            }}
          />

          {/* Radius Distance Line from Center to Perimeter (East direction) */}
          <line
            x1={`${centerCoord.x}%`}
            y1={`${centerCoord.y}%`}
            x2={`${Math.min(96, centerCoord.x + radiusPercentX)}%`}
            y2={`${centerCoord.y}%`}
            stroke="url(#radiusLineGrad)"
            strokeWidth="2"
            strokeDasharray="3 3"
          />

          {/* Crosshair Center Lines */}
          <line
            x1={`${centerCoord.x - 3}%`}
            y1={`${centerCoord.y}%`}
            x2={`${centerCoord.x + 3}%`}
            y2={`${centerCoord.y}%`}
            stroke="#34d399"
            strokeWidth="1.5"
            strokeOpacity="0.6"
          />
          <line
            x1={`${centerCoord.x}%`}
            y1={`${centerCoord.y - 3}%`}
            x2={`${centerCoord.x}%`}
            y2={`${centerCoord.y + 3}%`}
            stroke="#34d399"
            strokeWidth="1.5"
            strokeOpacity="0.6"
          />
        </svg>

        {/* Distance Marker Tag on Circle Perimeter */}
        <div
          style={{
            left: `${Math.min(95, Math.max(5, centerCoord.x + radiusPercentX))}%`,
            top: `${centerCoord.y}%`,
          }}
          className="absolute -translate-y-1/2 translate-x-2 z-20 pointer-events-none"
        >
          <div className="px-2 py-0.5 rounded-lg bg-emerald-950/90 border border-emerald-400 text-emerald-300 text-[10px] font-black shadow-lg shadow-emerald-950/80 whitespace-nowrap flex items-center gap-1 backdrop-blur-xs">
            <span>نصف القطر: {coverageKm} كم</span>
          </div>
        </div>

        {/* Center Radar Point Beacon */}
        <div
          style={{
            left: `${centerCoord.x}%`,
            top: `${centerCoord.y}%`,
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
        >
          <div className="relative flex items-center justify-center">
            {/* Glowing beacon ripples */}
            <span className="animate-ping absolute inline-flex h-10 w-10 rounded-full bg-emerald-400 opacity-60" />
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 border-2 border-white shadow-xl shadow-emerald-500/60 flex items-center justify-center text-white font-black text-[10px]">
              <MapPin className="w-3.5 h-3.5 fill-white" />
            </div>

            {/* Beacon Info Badge */}
            <div className="absolute top-full mt-1.5 px-2.5 py-1 rounded-xl bg-slate-950/95 border border-emerald-500/80 shadow-2xl text-center whitespace-nowrap">
              <span className="text-[11px] font-black text-emerald-400 block leading-tight">
                📍 {centerName}
              </span>
              <span className="text-[9px] text-slate-300 font-mono block" dir="ltr">
                {centerLat.toFixed(4)}, {centerLon.toFixed(4)}
              </span>
              {lastUpdated && (
                <span className="text-[8px] text-emerald-300/70 block mt-0.5">
                  تحديث: {lastUpdated}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bahrain Areas Pins */}
        {BAHRAIN_AREAS.map((area) => {
          const pt = projectCoord(area.latitude, area.longitude);
          // Only show pins that fall within visible bounds (with slight padding)
          if (pt.x < 2 || pt.x > 98 || pt.y < 2 || pt.y > 98) {
            return null;
          }

          const dist = calculateDistanceKm(centerLat, centerLon, area.latitude, area.longitude);
          const isInside = dist <= coverageKm;
          const isCenter = area.name === centerName || dist < 0.2;
          if (isCenter) return null; // Center has dedicated beacon above

          const isHovered = hoveredArea?.name === area.name;

          return (
            <div
              key={area.id}
              style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
              onMouseEnter={() => setHoveredArea({ name: area.name, dist, isInside })}
              onMouseLeave={() => setHoveredArea(null)}
              onClick={() => {
                if (onSelectAreaAsLocation) {
                  onSelectAreaAsLocation(area);
                }
              }}
              title={`${area.name} - المسافة: ${dist.toFixed(1)} كم (${isInside ? 'داخل التغطية ✅' : 'خارج التغطية'}) - انقر لتعيين موقعك هنا`}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group transition-transform hover:scale-125"
            >
              {isInside ? (
                // Inside Coverage: Bright Glowing Emerald/Cyan Pin
                <div className="relative flex items-center justify-center">
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-400/50 animate-pulse absolute" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-950 shadow-md shadow-emerald-500/50" />
                  
                  {/* Always show label for nearby covered areas in local view or when hovered */}
                  {(effectiveZoom === 'local' || isHovered || dist <= 3) && (
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-md bg-emerald-950/90 border border-emerald-500/60 text-white text-[9px] font-bold whitespace-nowrap pointer-events-none shadow-md">
                      <span>{area.name}</span>
                      <span className="text-emerald-300 font-mono text-[8px] mr-1">({dist.toFixed(1)} كم)</span>
                    </div>
                  )}
                </div>
              ) : (
                // Outside Coverage: Subdued Slate Pin
                <div className="relative flex items-center justify-center">
                  <div className={`w-2 h-2 rounded-full border border-slate-900 transition-all ${
                    isHovered ? 'bg-amber-400 scale-150 ring-2 ring-amber-300' : 'bg-slate-600/70 hover:bg-slate-400'
                  }`} />
                  {isHovered && (
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-md bg-slate-900/95 border border-slate-700 text-slate-300 text-[9px] font-bold whitespace-nowrap pointer-events-none shadow-md">
                      <span>{area.name}</span>
                      <span className="text-slate-400 font-mono text-[8px] mr-1">({dist.toFixed(1)} كم · خارج النطاق)</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Compass & Legend Overlay in top-left */}
        <div className="absolute top-2.5 left-2.5 p-2 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 text-[10px] space-y-1.5 pointer-events-none z-30">
          <div className="flex items-center gap-1.5 font-bold text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-300/40 inline-block" />
            <span>داخل التغطية ({coveredAreas.length} منطقة)</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-slate-400">
            <span className="w-2 h-2 rounded-full bg-slate-600 inline-block" />
            <span>خارج النطاق</span>
          </div>
        </div>

        {/* Tip Badge in bottom-left */}
        <div className="absolute bottom-2.5 left-2.5 p-1.5 px-2.5 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[10px] text-slate-400 flex items-center gap-1.5 pointer-events-none z-30">
          <Info className="w-3 h-3 text-cyan-400 shrink-0" />
          <span>انقر على أي منطقة بالخريطة لتعيين موقعك المعتمد فيها فوراً</span>
        </div>

      </div>

      {/* 3. Coverage Slider & Dynamic Distance Controller */}
      <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800/80 space-y-4">
        
        {/* Slider row with live value display */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-xs sm:text-sm font-black text-white block">
              نطاق التغطية والمسافة المقبولة للاستلام:
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              اسحب للتحكم بدائرة الرادار من 1 كم وحتى 30 كم في كل الاتجاهات
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 flex items-baseline gap-1 shadow-inner">
              <span className="text-xl sm:text-2xl font-black text-white">{coverageKm}</span>
              <span className="text-xs font-bold text-emerald-400">كم</span>
            </div>
          </div>
        </div>

        {/* The Range Slider */}
        <div className="space-y-1.5">
          <div className="relative">
            <input
              type="range"
              min="1"
              max="30"
              step="1"
              value={coverageKm}
              onChange={(e) => onCoverageChange(Number(e.target.value))}
              className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-between text-[11px] font-bold text-slate-400 px-0.5">
            <span className="flex items-center gap-1 text-emerald-400">
              <span>1 كم</span>
              <span className="text-[9px] text-slate-500">(محيطك المباشر)</span>
            </span>
            <span>5 كم</span>
            <span>15 كم</span>
            <span className="flex items-center gap-1 text-cyan-400">
              <span>30 كم</span>
              <span className="text-[9px] text-slate-500">(كامل البحرين)</span>
            </span>
          </div>
        </div>

        {/* Quick Presets Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[11px] font-bold text-slate-400 ml-1">اختيار سريع:</span>
          {PRESETS.map((km) => (
            <button
              key={km}
              type="button"
              onClick={() => onCoverageChange(km)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                coverageKm === km
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950 border border-emerald-400 ring-2 ring-emerald-500/40'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              {km} كم
            </button>
          ))}
        </div>

        {/* Covered Areas Preview Chips */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>المناطق المشمولة بالاستلام حالياً ({coveredAreas.length} منطقة):</span>
            </span>
            <span className="text-[10px] text-slate-400">
              الطلبات من هذه المناطق ستقبل فوراً ⚡
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            {coveredAreas.length === 0 ? (
              <span className="text-xs text-amber-400">لا توجد مناطق ضمن هذا النطاق، وسّع الدائرة!</span>
            ) : (
              coveredAreas.slice(0, 14).map(({ area, dist }) => (
                <span
                  key={area.id}
                  className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-1"
                >
                  <span className="font-semibold text-white">{area.name}</span>
                  <span className="text-[10px] text-emerald-400 font-mono" dir="ltr">
                    {dist === 0 ? 'المركز' : `${dist.toFixed(1)}k`}
                  </span>
                </span>
              ))
            )}
            {coveredAreas.length > 14 && (
              <span className="px-2 py-0.5 rounded-lg bg-slate-900/60 text-[10px] text-slate-400">
                +{coveredAreas.length - 14} مناطق أخرى
              </span>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
