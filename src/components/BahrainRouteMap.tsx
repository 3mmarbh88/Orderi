import { useState, useMemo } from 'react';
import { 
  MapPin, 
  Navigation, 
  Compass, 
  Layers, 
  Info, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Crosshair, 
  Car, 
  Clock, 
  Sparkles, 
  ExternalLink, 
  Search, 
  Maximize2, 
  Radio, 
  Activity,
  ChevronDown
} from 'lucide-react';
import { BAHRAIN_AREAS, calculateDistanceKm, findAreaByName } from '../data/bahrainAreas';
import { MatcherLocation } from '../utils/matcher';
import { ParsedOrder } from '../types';

interface BahrainRouteMapProps {
  driverLocation: MatcherLocation | null;
  activeOrder: ParsedOrder | null;
  orders?: ParsedOrder[];
  onSelectAreaAsLocation: (areaName: string) => void;
  onSelectOrder?: (order: ParsedOrder) => void;
}

// Map styles / theme modes
type MapTheme = 'tactical' | 'satellite' | 'heatmap';

// 1. Geographic Island Polygons of the Kingdom of Bahrain (Lat, Lon)
const BAHRAIN_MAIN_ISLAND: [number, number][] = [
  // North Coast (West to East)
  [26.222, 50.468], // Budaiya tip
  [26.234, 50.485], // Diraz / Barbar coast
  [26.242, 50.510], // Karrana
  [26.248, 50.535], // Seef northern edge / Reef Island
  [26.245, 50.575], // Manama Corniche / Financial Harbour
  [26.240, 50.595], // Diplomatic Area
  [26.225, 50.608], // Juffair coast
  [26.208, 50.612], // Mina Salman
  // East Coast & Tubli Bay
  [26.195, 50.590], // Umm Al Hassam
  [26.178, 50.570], // Tubli bay inner
  [26.160, 50.585], // Sanad coast
  [26.140, 50.605], // Ma'ameer / Nuwaidrat channel
  [26.105, 50.618], // Ras Zuwayed
  [26.065, 50.625], // Askar coast
  [26.010, 50.625], // Jaww coast
  [25.975, 50.615], // Ras Hayyan
  [25.955, 50.595], // Durrat Al Bahrain tip
  // South Tip to West Coast
  [25.950, 50.585], // Ras Al Barr
  [25.970, 50.550], // South-west coast
  [26.015, 50.515], // Near Sakhir
  [26.050, 50.490], // Zallaq beach
  [26.100, 50.470], // Malkiya coast
  [26.145, 50.455], // Karzakan / Dumistan
  [26.162, 50.448], // Jasra coast
  [26.185, 50.460], // Janabiya
  [26.205, 50.465], // Budaiya approach
];

const MUHARRAQ_ISLAND: [number, number][] = [
  [26.275, 50.600], // Busaiteen north
  [26.282, 50.630], // Dair coast
  [26.275, 50.655], // Samaheej / Galali
  [26.248, 50.665], // Hidd industrial / Khalifa port
  [26.230, 50.655], // South Hidd
  [26.240, 50.620], // Arad bay
  [26.245, 50.605], // Halat Bu Maher / South Muharraq
  [26.260, 50.595], // Muharraq west coast
];

const AMWAJ_ISLANDS: [number, number][] = [
  [26.285, 50.655],
  [26.295, 50.665],
  [26.288, 50.680],
  [26.275, 50.670],
];

const DIYAR_AL_MUHARRAQ: [number, number][] = [
  [26.290, 50.615],
  [26.315, 50.635],
  [26.305, 50.650],
  [26.285, 50.635],
];

const SITRA_ISLAND: [number, number][] = [
  [26.170, 50.615], // North Sitra / Bridge approach
  [26.160, 50.635], // East Sitra
  [26.130, 50.630], // South Sitra
  [26.125, 50.615], // South-west Sitra
  [26.150, 50.605], // West channel
];

const NABIH_SALEH_ISLAND: [number, number][] = [
  [26.195, 50.600],
  [26.198, 50.610],
  [26.185, 50.612],
  [26.182, 50.600],
];

const UMM_AN_NASAN_ISLAND: [number, number][] = [
  [26.155, 50.395],
  [26.165, 50.415],
  [26.145, 50.420],
  [26.135, 50.400],
];

// 2. Bridges & Causeways (الجسور الحيوية)
const BRIDGES = [
  {
    name: 'جسر الملك فهد (King Fahd Causeway)',
    points: [
      [26.162, 50.448],
      [26.150, 50.410],
      [26.185, 50.360],
      [26.190, 50.340],
    ] as [number, number][],
  },
  {
    name: 'جسر الشيخ عيسى بن سلمان',
    points: [
      [26.242, 50.590],
      [26.260, 50.605],
    ] as [number, number][],
  },
  {
    name: 'جسر الشيخ حمد',
    points: [
      [26.236, 50.585],
      [26.250, 50.600],
    ] as [number, number][],
  },
  {
    name: 'جسر الشيخ خليفة بن سلمان',
    points: [
      [26.218, 50.610],
      [26.230, 50.645],
    ] as [number, number][],
  },
  {
    name: 'جسر سترة',
    points: [
      [26.190, 50.595],
      [26.168, 50.615],
    ] as [number, number][],
  },
];

// 3. Arterial Highway Network (شبكة الطرق السريعة)
const HIGHWAYS = [
  [
    [26.175, 50.460],
    [26.180, 50.510],
    [26.182, 50.550],
    [26.190, 50.590],
    [26.210, 50.610],
  ] as [number, number][],
  [
    [26.240, 50.535],
    [26.215, 50.530],
    [26.170, 50.515],
    [26.130, 50.510],
    [26.080, 50.500],
  ] as [number, number][],
  [
    [26.242, 50.535],
    [26.245, 50.565],
    [26.245, 50.585],
    [26.240, 50.600],
  ] as [number, number][],
  [
    [26.222, 50.470],
    [26.220, 50.500],
    [26.220, 50.530],
    [26.220, 50.550],
  ] as [number, number][],
  [
    [26.175, 50.540],
    [26.140, 50.555],
    [26.115, 50.565],
  ] as [number, number][],
];

export function BahrainRouteMap({
  driverLocation,
  activeOrder,
  orders = [],
  onSelectAreaAsLocation,
  onSelectOrder,
}: BahrainRouteMapProps) {
  // Navigation & View state
  const [theme, setTheme] = useState<MapTheme>('tactical');
  const [isRadarScanning, setIsRadarScanning] = useState<boolean>(true);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredArea, setHoveredArea] = useState<string | null>(null);
  const [selectedAreaDetails, setSelectedAreaDetails] = useState<string | null>(null);
  const [governorateFilter, setGovernorateFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedInternalOrder, setSelectedInternalOrder] = useState<ParsedOrder | null>(null);

  // Effective highlighted order: user selected or activeOrder
  const currentOrder = selectedInternalOrder || activeOrder;

  // Geographic Bounding Box for the Kingdom of Bahrain (Lat 25.92 - 26.33, Lon 50.36 - 50.72)
  const MIN_LAT = 25.92;
  const MAX_LAT = 26.33;
  const MIN_LON = 50.36;
  const MAX_LON = 50.72;

  // Project Geographic coordinates to Map SVG percentage (0-100%)
  const projectCoord = (lat: number, lon: number) => {
    const rawX = ((lon - MIN_LON) / (MAX_LON - MIN_LON)) * 100;
    const rawY = ((MAX_LAT - lat) / (MAX_LAT - MIN_LAT)) * 100;

    // Apply smooth zoom and pan around center (50%, 50%)
    const x = (rawX - 50) * zoom + 50 + pan.x;
    const y = (rawY - 50) * zoom + 50 + pan.y;

    return {
      x: Math.max(-20, Math.min(120, x)),
      y: Math.max(-20, Math.min(120, y)),
      rawX,
      rawY,
    };
  };

  // Convert coordinate array to SVG path string
  const pointsToSvgPath = (points: [number, number][], close = true) => {
    if (points.length === 0) return '';
    const projected = points.map(([lat, lon]) => projectCoord(lat, lon));
    const start = projected[0];
    let d = `M ${start.x.toFixed(2)} ${start.y.toFixed(2)}`;
    for (let i = 1; i < projected.length; i++) {
      d += ` L ${projected[i].x.toFixed(2)} ${projected[i].y.toFixed(2)}`;
    }
    if (close) d += ' Z';
    return d;
  };

  // Driver, Pickup & Delivery coordinates
  const driverCoords = driverLocation ? projectCoord(driverLocation.latitude, driverLocation.longitude) : null;
  const pickupAreaObj = currentOrder ? findAreaByName(currentOrder.from) : null;
  const deliveryAreaObj = currentOrder ? findAreaByName(currentOrder.to) : null;
  const pickupCoords = pickupAreaObj ? projectCoord(pickupAreaObj.latitude, pickupAreaObj.longitude) : null;
  const deliveryCoords = deliveryAreaObj ? projectCoord(deliveryAreaObj.latitude, deliveryAreaObj.longitude) : null;

  // Curved Route Bezier calculation
  const routeCurvePath = useMemo(() => {
    if (!pickupCoords || !deliveryCoords) return null;
    const dx = deliveryCoords.x - pickupCoords.x;
    const dy = deliveryCoords.y - pickupCoords.y;
    // Slight aerodynamic arc
    const cx = (pickupCoords.x + deliveryCoords.x) / 2 - dy * 0.15;
    const cy = (pickupCoords.y + deliveryCoords.y) / 2 + dx * 0.15;
    return `M ${pickupCoords.x.toFixed(2)} ${pickupCoords.y.toFixed(2)} Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${deliveryCoords.x.toFixed(2)} ${deliveryCoords.y.toFixed(2)}`;
  }, [pickupCoords, deliveryCoords]);

  // Trip Telemetry Metrics
  const tripMetrics = useMemo(() => {
    if (!pickupAreaObj || !deliveryAreaObj) return null;
    const directDistance = calculateDistanceKm(
      pickupAreaObj.latitude,
      pickupAreaObj.longitude,
      deliveryAreaObj.latitude,
      deliveryAreaObj.longitude
    );
    // Estimated real driving distance with Bahrain road network coefficient (~1.25x)
    const drivingKm = Math.round(directDistance * 1.25 * 10) / 10;
    // Estimated driving time (avg speed ~48 km/h in Bahrain traffic)
    const etaMinutes = Math.max(5, Math.round((drivingKm / 48) * 60));

    // Driver distance to pickup
    const driverToPickup = driverLocation
      ? Math.round(
          calculateDistanceKm(
            driverLocation.latitude,
            driverLocation.longitude,
            pickupAreaObj.latitude,
            pickupAreaObj.longitude
          ) * 1.25 * 10
        ) / 10
      : null;

    return {
      drivingKm,
      etaMinutes,
      driverToPickup,
    };
  }, [pickupAreaObj, deliveryAreaObj, driverLocation]);

  // Filtered Bahrain areas based on search and governorate
  const visibleAreas = useMemo(() => {
    return BAHRAIN_AREAS.filter((area) => {
      const matchGov = governorateFilter === 'all' || area.governorate === governorateFilter;
      const matchQuery =
        !searchQuery.trim() ||
        area.name.includes(searchQuery.trim()) ||
        area.nameEn.toLowerCase().includes(searchQuery.trim().toLowerCase());
      return matchGov && matchQuery;
    });
  }, [governorateFilter, searchQuery]);

  // Order counts per area
  const areaOrderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((o) => {
      if (o.from) counts[o.from] = (counts[o.from] || 0) + 1;
    });
    return counts;
  }, [orders]);

  // Zoom and pan actions
  const handleZoomIn = () => setZoom((prev) => Math.min(2.8, prev + 0.35));
  const handleZoomOut = () => {
    setZoom((prev) => {
      const next = Math.max(0.85, prev - 0.35);
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedAreaDetails(null);
  };

  const handleCenterOnDriver = () => {
    if (!driverLocation) return;
    const rawX = ((driverLocation.longitude - MIN_LON) / (MAX_LON - MIN_LON)) * 100;
    const rawY = ((MAX_LAT - driverLocation.latitude) / (MAX_LAT - MIN_LAT)) * 100;
    setZoom(1.6);
    setPan({ x: (50 - rawX) * 1.6, y: (50 - rawY) * 1.6 });
  };

  const handleCenterOnRoute = () => {
    if (!pickupAreaObj || !deliveryAreaObj) return;
    const midLat = (pickupAreaObj.latitude + deliveryAreaObj.latitude) / 2;
    const midLon = (pickupAreaObj.longitude + deliveryAreaObj.longitude) / 2;
    const rawX = ((midLon - MIN_LON) / (MAX_LON - MIN_LON)) * 100;
    const rawY = ((MAX_LAT - midLat) / (MAX_LAT - MIN_LAT)) * 100;
    setZoom(1.5);
    setPan({ x: (50 - rawX) * 1.5, y: (50 - rawY) * 1.5 });
  };

  // Google Maps navigation external link generator
  const getGoogleMapsNavUrl = () => {
    if (!pickupAreaObj || !deliveryAreaObj) return '#';
    const origin = `${pickupAreaObj.latitude},${pickupAreaObj.longitude}`;
    const destination = `${deliveryAreaObj.latitude},${deliveryAreaObj.longitude}`;
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
  };

  return (
    <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3.5 w-full max-w-full overflow-hidden select-none">
      
      {/* 1. Header Toolbar & Realtime Indicators */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        
        {/* Left: Title & GPS Live Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <Compass className="w-5 h-5 animate-[spin_20s_linear_infinite]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                خريطة رادار البحرين الملاحية 🇧🇭
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>مباشر GPS</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              تتبع جغرافي ذكي لمسارات التوصيل، شبكة الجسور، ومناطق الطلبات النشطة
            </p>
          </div>
        </div>

        {/* Center/Right: Search, Governorates & Theme Switchers */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Quick Area Search */}
          <div className="relative min-w-[130px] sm:min-w-[160px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن منطقة..."
              className="w-full pl-7 pr-2.5 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-hidden transition-all"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5 pointer-events-none" />
          </div>

          {/* Governorate Selector */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100 border border-slate-200/80 text-[11px] font-bold">
            {(['all', 'العاصمة', 'المحرق', 'الشمالية', 'الجنوبية'] as const).map((gov) => (
              <button
                key={gov}
                type="button"
                onClick={() => setGovernorateFilter(gov)}
                className={`px-2 py-1 rounded-lg transition-all ${
                  governorateFilter === gov
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {gov === 'all' ? 'الكل' : gov}
              </button>
            ))}
          </div>

          {/* Map Style Theme Toggle */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setTheme('tactical')}
              className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
                theme === 'tactical' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-400 hover:text-white'
              }`}
              title="رادار تكتيكي داكن"
            >
              <span>🛰️</span>
              <span className="hidden sm:inline">تكتيكي</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('satellite')}
              className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
                theme === 'satellite' ? 'bg-slate-700 text-white shadow-2xs' : 'text-slate-400 hover:text-white'
              }`}
              title="ملاحة الطرق الحضرية"
            >
              <span>🗺️</span>
              <span className="hidden sm:inline">ملاحة</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('heatmap')}
              className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
                theme === 'heatmap' ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-400 hover:text-white'
              }`}
              title="الخريطة الحرارية لكثافة الطلبات"
            >
              <span>🔥</span>
              <span className="hidden sm:inline">حراري</span>
            </button>
          </div>

          {/* Radar Scan Toggle */}
          <button
            type="button"
            onClick={() => setIsRadarScanning((prev) => !prev)}
            className={`p-1.5 rounded-xl border transition-all ${
              isRadarScanning
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
            }`}
            title={isRadarScanning ? 'إيقاف مسح الرادار 360°' : 'تشغيل مسح الرادار 360°'}
          >
            <Radio className={`w-4 h-4 ${isRadarScanning ? 'animate-pulse text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Interactive Map Canvas Container (Selected Element) */}
      <div 
        className={`relative w-full h-[380px] sm:h-[520px] rounded-2xl sm:rounded-3xl overflow-hidden border transition-all duration-300 flex items-center justify-center select-none shadow-inner ${
          theme === 'tactical'
            ? 'bg-gradient-to-br from-[#040C1A] via-[#091B33] to-[#040D1B] border-slate-800'
            : theme === 'satellite'
            ? 'bg-gradient-to-br from-[#0F1E36] via-[#162C4E] to-[#0B1728] border-blue-900/40'
            : 'bg-gradient-to-br from-[#120D1A] via-[#1D142E] to-[#0D0814] border-purple-900/40'
        }`}
      >
        
        {/* CSS Keyframe for continuous 360° Radar Scan Beam */}
        <style>{`
          @keyframes radarSweep {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes dashMove {
            to { stroke-dashoffset: -40; }
          }
        `}</style>

        {/* Tactical Ambient Depth Grids & Concentric Range Circles */}
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1.2px,transparent_1.2px)] [background-size:28px_28px] opacity-10 pointer-events-none" />

        {/* 360° Radar Rotating Sweep Beam */}
        {isRadarScanning && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
            <div
              className="w-[140%] h-[140%] rounded-full opacity-30"
              style={{
                background:
                  theme === 'heatmap'
                    ? 'conic-gradient(from 0deg, transparent 0deg, transparent 300deg, rgba(245, 158, 11, 0.08) 330deg, rgba(239, 68, 68, 0.35) 360deg)'
                    : 'conic-gradient(from 0deg, transparent 0deg, transparent 310deg, rgba(16, 185, 129, 0.08) 335deg, rgba(56, 189, 248, 0.38) 360deg)',
                animation: 'radarSweep 5s linear infinite',
                transformOrigin: '50% 50%',
              }}
            />
          </div>
        )}

        {/* Primary Cartographic SVG Engine */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
          <defs>
            {/* Glowing neon gradients for route lines */}
            <linearGradient id="routeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>

            <linearGradient id="driverToPickupGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>

            {/* Island Landmass Drop Shadow Filter */}
            <filter id="islandGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#38bdf8" floodOpacity="0.25" />
            </filter>

            {/* Heatmap Glow Radial */}
            <radialGradient id="heatBlipGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
              <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* 1. Realistic Bahrain Landmass Islands Polygons */}
          <g className="transition-all duration-300">
            {/* Main Bahrain Island */}
            <path
              d={pointsToSvgPath(BAHRAIN_MAIN_ISLAND)}
              fill={theme === 'tactical' ? '#0F264A' : theme === 'satellite' ? '#1E3A68' : '#24143D'}
              stroke={theme === 'tactical' ? '#38bdf8' : theme === 'satellite' ? '#60a5fa' : '#c084fc'}
              strokeWidth="1.5"
              strokeOpacity="0.5"
              filter="url(#islandGlow)"
            />

            {/* Muharraq Island */}
            <path
              d={pointsToSvgPath(MUHARRAQ_ISLAND)}
              fill={theme === 'tactical' ? '#13305E' : theme === 'satellite' ? '#23447A' : '#2E194D'}
              stroke={theme === 'tactical' ? '#38bdf8' : theme === 'satellite' ? '#60a5fa' : '#c084fc'}
              strokeWidth="1.4"
              strokeOpacity="0.5"
            />

            {/* Amwaj Islands */}
            <path
              d={pointsToSvgPath(AMWAJ_ISLANDS)}
              fill={theme === 'tactical' ? '#183B72' : theme === 'satellite' ? '#2A4E8C' : '#391F5E'}
              stroke="#38bdf8"
              strokeWidth="1.2"
              strokeOpacity="0.6"
            />

            {/* Diyar Al Muharraq */}
            <path
              d={pointsToSvgPath(DIYAR_AL_MUHARRAQ)}
              fill={theme === 'tactical' ? '#183B72' : theme === 'satellite' ? '#2A4E8C' : '#391F5E'}
              stroke="#38bdf8"
              strokeWidth="1.2"
              strokeOpacity="0.6"
            />

            {/* Sitra Island */}
            <path
              d={pointsToSvgPath(SITRA_ISLAND)}
              fill={theme === 'tactical' ? '#112C55' : theme === 'satellite' ? '#203E70' : '#2A1747'}
              stroke="#38bdf8"
              strokeWidth="1.2"
              strokeOpacity="0.5"
            />

            {/* Nabih Saleh Island */}
            <path
              d={pointsToSvgPath(NABIH_SALEH_ISLAND)}
              fill={theme === 'tactical' ? '#143463' : theme === 'satellite' ? '#24457A' : '#311B50'}
              stroke="#38bdf8"
              strokeWidth="1.1"
              strokeOpacity="0.5"
            />

            {/* Umm An Nasan Island */}
            <path
              d={pointsToSvgPath(UMM_AN_NASAN_ISLAND)}
              fill={theme === 'tactical' ? '#0D2140' : theme === 'satellite' ? '#1A335B' : '#201138'}
              stroke="#38bdf8"
              strokeWidth="1"
              strokeOpacity="0.4"
            />
          </g>

          {/* 2. Bahrain Bridges & Causeways (الجسور الحيوية) */}
          <g className="transition-all duration-300">
            {BRIDGES.map((bridge, i) => {
              const d = pointsToSvgPath(bridge.points, false);
              return (
                <path
                  key={`bridge-${i}`}
                  d={d}
                  stroke="#fbbf24"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeDasharray="3 2"
                  strokeOpacity="0.85"
                />
              );
            })}
          </g>

          {/* 3. Arterial Highway Network (شبكة الطرق السريعة) */}
          <g className="transition-all duration-300 opacity-60">
            {HIGHWAYS.map((hw, i) => {
              const d = pointsToSvgPath(hw, false);
              return (
                <path
                  key={`hw-${i}`}
                  d={d}
                  stroke={theme === 'tactical' ? '#38bdf8' : '#93c5fd'}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeOpacity="0.6"
                />
              );
            })}
          </g>

          {/* 4. Active Delivery Route Trajectories */}
          {/* Driver -> Pickup Link */}
          {driverCoords && pickupCoords && (
            <line
              x1={`${driverCoords.x}%`}
              y1={`${driverCoords.y}%`}
              x2={`${pickupCoords.x}%`}
              y2={`${pickupCoords.y}%`}
              stroke="url(#driverToPickupGlow)"
              strokeWidth="2.5"
              strokeDasharray="5 5"
              className="animate-pulse"
              style={{
                animation: 'dashMove 1.5s linear infinite',
              }}
            />
          )}

          {/* Pickup -> Delivery Curved Flow Path */}
          {routeCurvePath && (
            <>
              {/* Outer Glow Halo */}
              <path
                d={routeCurvePath}
                fill="none"
                stroke="url(#routeGlow)"
                strokeWidth="6"
                strokeOpacity="0.3"
                strokeLinecap="round"
              />
              {/* Core Route Line with Flowing Pulse */}
              <path
                d={routeCurvePath}
                fill="none"
                stroke="url(#routeGlow)"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeDasharray="8 6"
                style={{
                  animation: 'dashMove 1.2s linear infinite',
                }}
              />
            </>
          )}

          {/* 5. Heatmap Order Density Blips (in Heatmap Theme) */}
          {theme === 'heatmap' &&
            orders.map((o) => {
              const a = findAreaByName(o.from);
              if (!a) return null;
              const pt = projectCoord(a.latitude, a.longitude);
              return (
                <circle
                  key={`heat-${o.id}`}
                  cx={`${pt.x}%`}
                  cy={`${pt.y}%`}
                  r="18"
                  fill="url(#heatBlipGlow)"
                  className="animate-pulse"
                />
              );
            })}
        </svg>

        {/* 6. Bahrain Areas Interactive Pins */}
        {visibleAreas.map((area) => {
          const pt = projectCoord(area.latitude, area.longitude);
          // Bounds check for canvas visibility
          if (pt.x < -5 || pt.x > 105 || pt.y < -5 || pt.y > 105) return null;

          const isPickup = pickupAreaObj?.id === area.id;
          const isDelivery = deliveryAreaObj?.id === area.id;
          const isHovered = hoveredArea === area.name;
          const orderCount = areaOrderCounts[area.name] || 0;
          const isDriverHere = driverLocation?.areaName === area.name;

          return (
            <div
              key={area.id}
              style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
              onMouseEnter={() => setHoveredArea(area.name)}
              onMouseLeave={() => setHoveredArea(null)}
              onClick={() => {
                setSelectedAreaDetails(area.name);
                onSelectAreaAsLocation(area.name);
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-20 transition-transform hover:scale-125"
            >
              {isPickup ? (
                /* Pickup Beacon Pin */
                <div className="relative flex items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-blue-400 opacity-80" />
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 text-white flex items-center justify-center font-black text-[11px] shadow-lg shadow-blue-500/60 border-2 border-white">
                    من
                  </div>
                  <div className="absolute bottom-full mb-1 px-2 py-0.5 rounded-lg bg-blue-950/95 border border-blue-400 text-blue-200 text-[10px] font-black whitespace-nowrap shadow-xl">
                    استلام: {area.name}
                  </div>
                </div>
              ) : isDelivery ? (
                /* Delivery Beacon Pin */
                <div className="relative flex items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-rose-500 opacity-80" />
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-rose-600 to-pink-500 text-white flex items-center justify-center font-black text-[11px] shadow-lg shadow-rose-500/60 border-2 border-white">
                    إلى
                  </div>
                  <div className="absolute bottom-full mb-1 px-2 py-0.5 rounded-lg bg-rose-950/95 border border-rose-400 text-rose-200 text-[10px] font-black whitespace-nowrap shadow-xl">
                    تسليم: {area.name}
                  </div>
                </div>
              ) : isDriverHere ? (
                /* Driver Current Position Pin */
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 border border-white ring-4 ring-emerald-500/40 animate-pulse" />
              ) : orderCount > 0 ? (
                /* Hotspot Pin with Order Count */
                <div className="relative flex items-center justify-center">
                  <div className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black border border-white shadow-md">
                    {orderCount} طلب
                  </div>
                </div>
              ) : (
                /* Normal Area Pin Point */
                <div
                  className={`w-2.5 h-2.5 rounded-full border transition-all ${
                    isHovered
                      ? 'bg-amber-400 scale-150 ring-4 ring-amber-400/40 border-white'
                      : 'bg-slate-300/60 border-slate-900/80 hover:bg-white hover:scale-125'
                  }`}
                />
              )}

              {/* Instant Area Hover Micro-Card */}
              {isHovered && !isPickup && !isDelivery && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-xl bg-slate-950/95 backdrop-blur-md text-white text-[11px] font-bold whitespace-nowrap shadow-2xl border border-slate-700 z-40 pointer-events-none flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5 text-white">
                    <span className="text-amber-400">📍</span>
                    <span>{area.name}</span>
                    <span className="text-[9px] text-slate-400 font-normal">({area.governorate})</span>
                  </div>
                  {driverLocation && (
                    <span className="text-[10px] text-emerald-300 font-mono">
                      يبعد عنك: {calculateDistanceKm(driverLocation.latitude, driverLocation.longitude, area.latitude, area.longitude).toFixed(1)} كم
                    </span>
                  )}
                  <span className="text-[9px] text-blue-300">انقر لتعيين موقعك هنا 👆</span>
                </div>
              )}
            </div>
          );
        })}

        {/* 7. Driver Live GPS Vehicle Beacon */}
        {driverCoords && (
          <div
            style={{ left: `${driverCoords.x}%`, top: `${driverCoords.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
          >
            <div className="relative flex items-center justify-center">
              {/* Dual Concentric Pulsing Radar Rings */}
              <span className="animate-ping absolute h-12 w-12 rounded-full bg-emerald-400 opacity-40" />
              <span className="animate-pulse absolute h-8 w-8 rounded-full bg-emerald-500/30" />
              
              {/* Vehicle Navigation Center Puck */}
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center border-2 border-white shadow-xl shadow-emerald-500/70">
                <Navigation className="w-3.5 h-3.5 fill-white rotate-45" />
              </div>

              {/* Floating Driver Area Tag */}
              <div className="absolute top-full mt-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-950/95 text-emerald-200 border border-emerald-500/80 text-[10px] font-black whitespace-nowrap shadow-xl flex items-center gap-1 backdrop-blur-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>موقعي: {driverLocation?.areaName || 'البحرين'}</span>
              </div>
            </div>
          </div>
        )}

        {/* 8. Floating Map Tactical HUD Controls (Top Left) */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-30">
          <div className="flex flex-col bg-slate-950/85 backdrop-blur-md rounded-xl border border-slate-700/80 p-1 shadow-xl">
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="تكبير الخريطة (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="تصغير الخريطة (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="h-px bg-slate-800 my-0.5" />
            <button
              type="button"
              onClick={handleResetView}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="إعادة ضبط العرض الشامل"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            {driverCoords && (
              <button
                type="button"
                onClick={handleCenterOnDriver}
                className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 transition-colors"
                title="توسيط على موقع السائق"
              >
                <Crosshair className="w-4 h-4" />
              </button>
            )}
            {pickupCoords && (
              <button
                type="button"
                onClick={handleCenterOnRoute}
                className="p-1.5 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-slate-800 transition-colors"
                title="توسيط على مسار الطلب"
              >
                <Car className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 9. Floating Compass Rose & Scale Bar (Top Right) */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-30 pointer-events-none">
          {/* North Compass Rose */}
          <div className="px-2.5 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-700/80 text-white flex items-center gap-1.5 shadow-xl text-[10px] font-black">
            <span className="text-rose-500 font-extrabold text-xs">N</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-300">البحرين</span>
          </div>

          {/* Scale Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-700/80 text-white text-[10px] font-mono shadow-xl">
            <div className="w-8 h-1 bg-blue-400 rounded-full" />
            <span>5 كم</span>
          </div>
        </div>

        {/* 10. Selected Order Mission HUD Overlay (Floating Bottom) */}
        {currentOrder && tripMetrics ? (
          <div className="absolute bottom-3 left-3 right-3 z-30 pointer-events-auto">
            <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-950/92 backdrop-blur-md border border-slate-700 text-white shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
              
              {/* Mission Locations */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center shrink-0">
                  <Car className="w-4 h-4" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-600/30 text-blue-300 font-bold border border-blue-500/40">
                      من: {currentOrder.from}
                    </span>
                    <span className="text-slate-500 text-xs">⬅</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-600/30 text-rose-300 font-bold border border-rose-500/40">
                      إلى: {currentOrder.to}
                    </span>
                    {currentOrder.price && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-black border border-emerald-500/40">
                        {currentOrder.price} د.ب
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 truncate max-w-sm">
                    {currentOrder.items || currentOrder.text}
                  </p>
                </div>
              </div>

              {/* Telemetry Stats: Distance & Time */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-[11px] font-bold">
                  <span className="text-slate-400">المسافة:</span>
                  <span className="text-emerald-400 font-mono font-black">{tripMetrics.drivingKm} كم</span>
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-[11px] font-bold">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span className="text-cyan-300 font-mono font-black">~{tripMetrics.etaMinutes} دقيقة</span>
                </div>
                {tripMetrics.driverToPickup !== null && (
                  <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-[11px] font-bold">
                    <span className="text-slate-400">وصولك:</span>
                    <span className="text-blue-300 font-mono">{tripMetrics.driverToPickup} كم</span>
                  </div>
                )}

                {/* Google Maps External Launch Button */}
                <a
                  href={getGoogleMapsNavUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all active:scale-95"
                  title="فتح المسار في تطبيق خرائط Google"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Google Maps</span>
                  <span className="sm:hidden">خرائط</span>
                </a>
              </div>

            </div>
          </div>
        ) : (
          /* General Tip if no active order */
          <div className="absolute bottom-3 left-3 right-3 z-30 pointer-events-none">
            <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-white text-[11px] flex items-center justify-between gap-2 max-w-lg mx-auto shadow-xl">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-slate-300 text-[10px] sm:text-[11px]">
                  انقر على أي نقطة منطقة في البحرين لتعيين موقعك، أو اختر طلباً لرسم مساره التفاعلي.
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-[9px] font-bold shrink-0">
                {visibleAreas.length} منطقة نشطة
              </span>
            </div>
          </div>
        )}

      </div>

      {/* 3. Bottom Interactive Legend & Quick Area Jump Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
        
        {/* Geographic Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold">
          <span className="flex items-center gap-1.5 text-emerald-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 inline-block" />
            <span>موقع السائق</span>
          </span>
          <span className="flex items-center gap-1.5 text-blue-700">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-blue-100 inline-block" />
            <span>الاستلام (From)</span>
          </span>
          <span className="flex items-center gap-1.5 text-rose-700">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 ring-4 ring-rose-100 inline-block" />
            <span>التسليم (To)</span>
          </span>
          <span className="flex items-center gap-1.5 text-amber-700">
            <span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-amber-200 inline-block" />
            <span>جسور وطرق سريعة</span>
          </span>
        </div>

        {/* Quick Driver Location Setter Badge */}
        {driverLocation && (
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <span>موقعك المعتمد:</span>
            <strong className="text-slate-800 font-extrabold">{driverLocation.areaName}</strong>
            <span className="text-slate-400 font-mono text-[10px]">
              ({driverLocation.latitude.toFixed(3)}, {driverLocation.longitude.toFixed(3)})
            </span>
          </div>
        )}

      </div>

    </div>
  );
}
