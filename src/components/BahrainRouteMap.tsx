import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  MapPin, 
  Navigation, 
  Compass, 
  Info, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Crosshair, 
  Car, 
  Clock, 
  ExternalLink, 
  Search, 
  Radio, 
  Package,
  Layers
} from 'lucide-react';
import { BAHRAIN_AREAS, calculateDistanceKm, findAreaByName } from '../data/bahrainAreas';
import { MatcherLocation } from '../utils/matcher';
import { ParsedOrder } from '../types';
import { resolveHereWeGoLocation } from '../data/hereWeGoBahrainMap';

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

// Compact Traffic Bottlenecks in Bahrain (نقاط الاختناق والازدحام المروري بدون أخذ حيز)
interface TrafficBottleneck {
  id: string;
  name: string;
  lat: number;
  lon: number;
  severity: 'heavy' | 'moderate';
  delay: string;
  road: string;
}

const BAHRAIN_BOTTLENECKS: TrafficBottleneck[] = [
  { id: 'sitra-bridge', name: 'جسر سترة', lat: 26.179, lon: 50.605, severity: 'heavy', delay: '+12د', road: 'شارع الشيخ جابر الأحمد' },
  { id: 'seef-flyover', name: 'كوبري السيف', lat: 26.236, lon: 50.540, severity: 'heavy', delay: '+14د', road: 'شارع الشيخ خليفة بن سلمان' },
  { id: 'sar-interchange', name: 'كوبري سار والجنبية', lat: 26.195, lon: 50.485, severity: 'heavy', delay: '+10د', road: 'شارع الجنبية السريع' },
  { id: 'farooq-junction', name: 'تقاطع الفاروق', lat: 26.230, lon: 50.575, severity: 'moderate', delay: '+7د', road: 'المنامة / السيتي سنتر' },
  { id: 'sanad-junction', name: 'تقاطع سند / الاستقلال', lat: 26.155, lon: 50.575, severity: 'moderate', delay: '+6د', road: 'شارع الاستقلال' },
  { id: 'mina-salman', name: 'تقاطع ميناء سلمان', lat: 26.205, lon: 50.600, severity: 'moderate', delay: '+8د', road: 'شارع الشيخ عيسى بن سلمان' },
  { id: 'isa-bridge', name: 'جسر الشيخ عيسى', lat: 26.250, lon: 50.598, severity: 'heavy', delay: '+11د', road: 'اتجاه الدبلوماسية' },
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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedInternalOrder, setSelectedInternalOrder] = useState<ParsedOrder | null>(null);
  const [hoveredOrder, setHoveredOrder] = useState<ParsedOrder | null>(null);
  const [showTraffic, setShowTraffic] = useState<boolean>(true);
  const [hoveredBottleneck, setHoveredBottleneck] = useState<string | null>(null);

  // References for gesture handling (Pinch-to-zoom & Touch/Mouse Pan)
  const containerRef = useRef<HTMLDivElement | null>(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const panRef = useRef(pan);
  panRef.current = pan;

  const [isMouseDragging, setIsMouseDragging] = useState<boolean>(false);
  const mouseDragRef = useRef({ startX: 0, startY: 0, startPan: { x: 0, y: 0 } });
  const touchStateRef = useRef({
    isPinching: false,
    isPanning: false,
    startDist: 0,
    startZoom: 1,
    startPan: { x: 0, y: 0 },
    startMid: { x: 50, y: 50 },
    startX: 0,
    startY: 0,
  });

  // Effective highlighted order: user selected or activeOrder
  const currentOrder = selectedInternalOrder || activeOrder || (orders.length > 0 ? orders[0] : null);

  // Native touch gestures: 2-finger pinch-to-zoom & 1-finger pan, plus mouse wheel zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Wheel zoom centered towards cursor point
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const cursorXPercent = ((e.clientX - rect.left) / rect.width) * 100;
      const cursorYPercent = ((e.clientY - rect.top) / rect.height) * 100;

      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      const currentZoom = zoomRef.current;
      const nextZoom = Math.min(5.0, Math.max(0.7, currentZoom * zoomFactor));

      const ratio = nextZoom / currentZoom;
      const currentPan = panRef.current;
      const newPanX = cursorXPercent - 50 - ratio * (cursorXPercent - 50 - currentPan.x);
      const newPanY = cursorYPercent - 50 - ratio * (cursorYPercent - 50 - currentPan.y);

      setZoom(Number(nextZoom.toFixed(2)));
      setPan({
        x: Math.max(-180, Math.min(180, newPanX)),
        y: Math.max(-180, Math.min(180, newPanY)),
      });
    };

    // Touch start: detect 2-finger pinch or 1-finger pan
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const rect = container.getBoundingClientRect();
        const midX = (((t1.clientX + t2.clientX) / 2 - rect.left) / rect.width) * 100;
        const midY = (((t1.clientY + t2.clientY) / 2 - rect.top) / rect.height) * 100;

        touchStateRef.current = {
          isPinching: true,
          isPanning: false,
          startDist: Math.max(10, dist),
          startZoom: zoomRef.current,
          startPan: { ...panRef.current },
          startMid: { x: midX, y: midY },
          startX: 0,
          startY: 0,
        };
      } else if (e.touches.length === 1) {
        const t = e.touches[0];
        touchStateRef.current = {
          isPinching: false,
          isPanning: true,
          startDist: 0,
          startZoom: zoomRef.current,
          startPan: { ...panRef.current },
          startMid: { x: 50, y: 50 },
          startX: t.clientX,
          startY: t.clientY,
        };
      }
    };

    // Touch move: continuous pinch scale & pan
    const onTouchMove = (e: TouchEvent) => {
      if (touchStateRef.current.isPinching && e.touches.length === 2) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const scale = currentDist / touchStateRef.current.startDist;
        const targetZoom = Math.min(5.0, Math.max(0.7, touchStateRef.current.startZoom * scale));

        const rect = container.getBoundingClientRect();
        const currentMidX = (((t1.clientX + t2.clientX) / 2 - rect.left) / rect.width) * 100;
        const currentMidY = (((t1.clientY + t2.clientY) / 2 - rect.top) / rect.height) * 100;

        const ratio = targetZoom / touchStateRef.current.startZoom;
        const startMid = touchStateRef.current.startMid;
        const startPan = touchStateRef.current.startPan;

        // Anchor zooming at the midpoint between fingers (like Google Maps & photo viewers)
        const newPanX = currentMidX - 50 - ratio * (startMid.x - 50 - startPan.x);
        const newPanY = currentMidY - 50 - ratio * (startMid.y - 50 - startPan.y);

        setZoom(Number(targetZoom.toFixed(2)));
        setPan({
          x: Math.max(-180, Math.min(180, newPanX)),
          y: Math.max(-180, Math.min(180, newPanY)),
        });
      } else if (touchStateRef.current.isPanning && e.touches.length === 1) {
        e.preventDefault();
        const t = e.touches[0];
        const rect = container.getBoundingClientRect();
        const dxPercent = ((t.clientX - touchStateRef.current.startX) / rect.width) * 100;
        const dyPercent = ((t.clientY - touchStateRef.current.startY) / rect.height) * 100;

        setPan({
          x: Math.max(-180, Math.min(180, touchStateRef.current.startPan.x + dxPercent)),
          y: Math.max(-180, Math.min(180, touchStateRef.current.startPan.y + dyPercent)),
        });
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        touchStateRef.current.isPinching = false;
        touchStateRef.current.isPanning = false;
      } else if (e.touches.length === 1) {
        // Transition back to 1-finger pan if one finger is lifted
        const t = e.touches[0];
        touchStateRef.current.isPinching = false;
        touchStateRef.current.isPanning = true;
        touchStateRef.current.startX = t.clientX;
        touchStateRef.current.startY = t.clientY;
        touchStateRef.current.startPan = { ...panRef.current };
      }
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd);
    container.addEventListener('touchcancel', onTouchEnd);

    return () => {
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

  // Mouse pan handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsMouseDragging(true);
    mouseDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPan: { ...panRef.current },
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dxPercent = ((e.clientX - mouseDragRef.current.startX) / rect.width) * 100;
    const dyPercent = ((e.clientY - mouseDragRef.current.startY) / rect.height) * 100;
    setPan({
      x: Math.max(-180, Math.min(180, mouseDragRef.current.startPan.x + dxPercent)),
      y: Math.max(-180, Math.min(180, mouseDragRef.current.startPan.y + dyPercent)),
    });
  };

  const handleMouseUp = () => {
    setIsMouseDragging(false);
  };

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
      x,
      y,
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

  // Helper to resolve coordinates for any text (area or HERE WeGo landmark)
  const resolveLocationCoords = (placeName: string) => {
    if (!placeName) return null;
    const directArea = findAreaByName(placeName);
    if (directArea) return { lat: directArea.latitude, lon: directArea.longitude, name: directArea.name };
    const hwg = resolveHereWeGoLocation(placeName);
    if (hwg && typeof hwg.latitude === 'number' && typeof hwg.longitude === 'number') {
      return { 
        lat: hwg.latitude, 
        lon: hwg.longitude, 
        name: hwg.matchedPlace?.name || hwg.officialArea || placeName 
      };
    }
    return null;
  };

  // Resolved Orders with spatial coordinates for radar point plotting
  const mappedOrders = useMemo(() => {
    return orders.map((ord) => {
      const fromLoc = resolveLocationCoords(ord.from);
      const toLoc = resolveLocationCoords(ord.to);
      return {
        order: ord,
        fromLoc,
        toLoc,
      };
    });
  }, [orders]);

  // Order counts per area for quick radar density indicators
  const areaOrderStats = useMemo(() => {
    const pickupCounts: Record<string, number> = {};
    const deliveryCounts: Record<string, number> = {};
    orders.forEach((o) => {
      if (o.from) pickupCounts[o.from] = (pickupCounts[o.from] || 0) + 1;
      if (o.to) deliveryCounts[o.to] = (deliveryCounts[o.to] || 0) + 1;
    });
    return { pickupCounts, deliveryCounts };
  }, [orders]);

  // Driver, Pickup & Delivery coordinates for current active order
  const driverCoords = driverLocation ? projectCoord(driverLocation.latitude, driverLocation.longitude) : null;
  const currentPickupLoc = currentOrder ? resolveLocationCoords(currentOrder.from) : null;
  const currentDeliveryLoc = currentOrder ? resolveLocationCoords(currentOrder.to) : null;
  const pickupCoords = currentPickupLoc ? projectCoord(currentPickupLoc.lat, currentPickupLoc.lon) : null;
  const deliveryCoords = currentDeliveryLoc ? projectCoord(currentDeliveryLoc.lat, currentDeliveryLoc.lon) : null;

  // Curved Route Bezier calculation for selected order
  const routeCurvePath = useMemo(() => {
    if (!pickupCoords || !deliveryCoords) return null;
    const dx = deliveryCoords.x - pickupCoords.x;
    const dy = deliveryCoords.y - pickupCoords.y;
    const cx = (pickupCoords.x + deliveryCoords.x) / 2 - dy * 0.15;
    const cy = (pickupCoords.y + deliveryCoords.y) / 2 + dx * 0.15;
    return `M ${pickupCoords.x.toFixed(2)} ${pickupCoords.y.toFixed(2)} Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${deliveryCoords.x.toFixed(2)} ${deliveryCoords.y.toFixed(2)}`;
  }, [pickupCoords, deliveryCoords]);

  // Trip Telemetry Metrics
  const tripMetrics = useMemo(() => {
    if (!currentPickupLoc || !currentDeliveryLoc) return null;
    const directDistance = calculateDistanceKm(
      currentPickupLoc.lat,
      currentPickupLoc.lon,
      currentDeliveryLoc.lat,
      currentDeliveryLoc.lon
    );
    const drivingKm = Math.round(directDistance * 1.25 * 10) / 10;
    const etaMinutes = Math.max(5, Math.round((drivingKm / 46) * 60));

    const driverToPickup = driverLocation
      ? Math.round(
          calculateDistanceKm(
            driverLocation.latitude,
            driverLocation.longitude,
            currentPickupLoc.lat,
            currentPickupLoc.lon
          ) * 1.25 * 10
        ) / 10
      : null;

    return {
      drivingKm,
      etaMinutes,
      driverToPickup,
    };
  }, [currentPickupLoc, currentDeliveryLoc, driverLocation]);

  // Filtered visible Bahrain areas
  const visibleAreas = useMemo(() => {
    return BAHRAIN_AREAS.filter((area) => {
      const matchQuery =
        !searchQuery.trim() ||
        area.name.includes(searchQuery.trim()) ||
        area.nameEn.toLowerCase().includes(searchQuery.trim().toLowerCase());
      return matchQuery;
    });
  }, [searchQuery]);

  // Handle Order Selection & Map Focus
  const handleSelectOrderAndFocus = (order: ParsedOrder) => {
    setSelectedInternalOrder(order);
    if (onSelectOrder) {
      onSelectOrder(order);
    }

    const pLoc = resolveLocationCoords(order.from);
    const dLoc = resolveLocationCoords(order.to);

    if (pLoc && dLoc) {
      const midLat = (pLoc.lat + dLoc.lat) / 2;
      const midLon = (pLoc.lon + dLoc.lon) / 2;
      const rawX = ((midLon - MIN_LON) / (MAX_LON - MIN_LON)) * 100;
      const rawY = ((MAX_LAT - midLat) / (MAX_LAT - MIN_LAT)) * 100;
      setZoom(1.8);
      setPan({ x: (50 - rawX) * 1.8, y: (50 - rawY) * 1.8 });
    } else if (pLoc) {
      const rawX = ((pLoc.lon - MIN_LON) / (MAX_LON - MIN_LON)) * 100;
      const rawY = ((MAX_LAT - pLoc.lat) / (MAX_LAT - MIN_LAT)) * 100;
      setZoom(2.0);
      setPan({ x: (50 - rawX) * 2.0, y: (50 - rawY) * 2.0 });
    }
  };

  // Zoom and Pan Controls
  const handleZoomIn = () => setZoom((prev) => Math.min(3.5, prev + 0.3));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.9, prev - 0.3));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleCenterOnDriver = () => {
    if (driverCoords) {
      setZoom(2.2);
      setPan({ x: (50 - driverCoords.rawX) * 2.2, y: (50 - driverCoords.rawY) * 2.2 });
    }
  };

  const handleCenterOnRoute = () => {
    if (currentPickupLoc && currentDeliveryLoc) {
      const midLat = (currentPickupLoc.lat + currentDeliveryLoc.lat) / 2;
      const midLon = (currentPickupLoc.lon + currentDeliveryLoc.lon) / 2;
      const rawX = ((midLon - MIN_LON) / (MAX_LON - MIN_LON)) * 100;
      const rawY = ((MAX_LAT - midLat) / (MAX_LAT - MIN_LAT)) * 100;
      setZoom(1.8);
      setPan({ x: (50 - rawX) * 1.8, y: (50 - rawY) * 1.8 });
    }
  };

  // Google Maps navigation external link generator
  const getGoogleMapsNavUrl = () => {
    if (!currentPickupLoc || !currentDeliveryLoc) return '#';
    const origin = `${currentPickupLoc.lat},${currentPickupLoc.lon}`;
    const destination = `${currentDeliveryLoc.lat},${currentDeliveryLoc.lon}`;
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
  };

  return (
    <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3.5 w-full max-w-full overflow-hidden select-none">
      
      {/* 1. Header Toolbar: Title, Realtime Status & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        
        {/* Left: Title & Navigation Radar Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <Compass className="w-5 h-5 animate-[spin_20s_linear_infinite]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                خريطة رادار البحرين الملاحية 🇧🇭
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>مباشر GPS</span>
              </span>
              {/* Radar Orders Counter Badge */}
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                <Package className="w-3 h-3 text-blue-600" />
                <span>{orders.length} طلبات بالرادار</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              نقاط مضيئة توضح أماكن الطلبات الملتقطة بالرادار ومسارات التوصيل التفاعلية
            </p>
          </div>
        </div>

        {/* Right: Search, Themes & Map Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Quick Area Search */}
          <div className="relative min-w-[120px] sm:min-w-[150px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن منطقة..."
              className="w-full pl-7 pr-2.5 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-hidden transition-all"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5 pointer-events-none" />
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
              title="الخريطة الحرارية للكثافة"
            >
              <span>🔥</span>
              <span className="hidden sm:inline">حراري</span>
            </button>
          </div>

          {/* Compact Traffic Bottlenecks Toggle */}
          <button
            type="button"
            onClick={() => setShowTraffic((prev) => !prev)}
            className={`px-2 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 shadow-2xs ${
              showTraffic
                ? 'bg-rose-50 text-rose-700 border-rose-300 ring-1 ring-rose-400/30'
                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
            }`}
            title={showTraffic ? 'إخفاء نقاط الازدحام' : 'إظهار نقاط الازدحام المروري'}
          >
            <span>🚦</span>
            <span className="hidden sm:inline">ازدحام</span>
            <span className="font-mono text-[10px]">({BAHRAIN_BOTTLENECKS.length})</span>
            {showTraffic && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />}
          </button>

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

      {/* 2. Quick Live Orders Strip (شريط الطلبات الملتقطة فوراً بالرادار) */}
      {orders.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <div className="flex items-center gap-1 text-[11px] font-black text-slate-700 shrink-0 px-2 py-1 rounded-lg bg-blue-50 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
            <span>الطلبات الملتقطة:</span>
          </div>

          {orders.slice(0, 10).map((ord) => {
            const isSelected = currentOrder?.id === ord.id;
            return (
              <button
                key={ord.id}
                type="button"
                onClick={() => handleSelectOrderAndFocus(ord)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                  isSelected
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-700 shadow-md scale-102 ring-2 ring-blue-400/40'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-white hover:border-blue-400'
                }`}
              >
                <span className="text-[10px] opacity-80">📦</span>
                <span className="font-extrabold">{ord.from}</span>
                <span className="text-[10px] opacity-60">⬅</span>
                <span className="font-extrabold">{ord.to}</span>
                {ord.price > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {ord.price} د.ب
                  </span>
                )}
              </button>
            );
          })}

          {orders.length > 10 && (
            <span className="text-[10px] font-bold text-slate-400 shrink-0 px-1">
              +{orders.length - 10} طلبات أخرى
            </span>
          )}
        </div>
      )}

      {/* 3. Interactive Map Canvas Container (Pinch-to-zoom & Smooth Pan) */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative w-full h-[400px] sm:h-[550px] rounded-2xl sm:rounded-3xl overflow-hidden border transition-all duration-300 flex items-center justify-center select-none shadow-inner touch-none ${
          isMouseDragging ? 'cursor-grabbing' : 'cursor-grab'
        } ${
          theme === 'tactical'
            ? 'bg-gradient-to-br from-[#040C1A] via-[#091B33] to-[#040D1B] border-slate-800'
            : theme === 'satellite'
            ? 'bg-gradient-to-br from-[#0F1E36] via-[#162C4E] to-[#0B1728] border-blue-900/40'
            : 'bg-gradient-to-br from-[#120D1A] via-[#1D142E] to-[#0D0814] border-purple-900/40'
        }`}
      >
        
        {/* CSS Keyframe animations */}
        <style>{`
          @keyframes radarSweep {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes dashMove {
            to { stroke-dashoffset: -40; }
          }
        `}</style>

        {/* Ambient Grid */}
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
            <linearGradient id="routeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>

            <linearGradient id="driverToPickupGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>

            <filter id="islandGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#38bdf8" floodOpacity="0.25" />
            </filter>
            
            <radialGradient id="orderBlipRadial" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#0284c7" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* 1. Realistic Bahrain Landmass Islands Polygons */}
          <g className="transition-all duration-300">
            <path
              d={pointsToSvgPath(BAHRAIN_MAIN_ISLAND)}
              fill={theme === 'tactical' ? '#0F264A' : theme === 'satellite' ? '#1E3A68' : '#24143D'}
              stroke={theme === 'tactical' ? '#38bdf8' : theme === 'satellite' ? '#60a5fa' : '#c084fc'}
              strokeWidth="1.5"
              strokeOpacity="0.5"
              filter="url(#islandGlow)"
            />
            <path
              d={pointsToSvgPath(MUHARRAQ_ISLAND)}
              fill={theme === 'tactical' ? '#13305E' : theme === 'satellite' ? '#23447A' : '#2E194D'}
              stroke={theme === 'tactical' ? '#38bdf8' : theme === 'satellite' ? '#60a5fa' : '#c084fc'}
              strokeWidth="1.4"
              strokeOpacity="0.5"
            />
            <path
              d={pointsToSvgPath(AMWAJ_ISLANDS)}
              fill={theme === 'tactical' ? '#183B72' : theme === 'satellite' ? '#2A4E8C' : '#391F5E'}
              stroke="#38bdf8"
              strokeWidth="1.2"
              strokeOpacity="0.6"
            />
            <path
              d={pointsToSvgPath(DIYAR_AL_MUHARRAQ)}
              fill={theme === 'tactical' ? '#183B72' : theme === 'satellite' ? '#2A4E8C' : '#391F5E'}
              stroke="#38bdf8"
              strokeWidth="1.2"
              strokeOpacity="0.6"
            />
            <path
              d={pointsToSvgPath(SITRA_ISLAND)}
              fill={theme === 'tactical' ? '#112C55' : theme === 'satellite' ? '#203E70' : '#2A1747'}
              stroke="#38bdf8"
              strokeWidth="1.2"
              strokeOpacity="0.5"
            />
            <path
              d={pointsToSvgPath(NABIH_SALEH_ISLAND)}
              fill={theme === 'tactical' ? '#143463' : theme === 'satellite' ? '#24457A' : '#311B50'}
              stroke="#38bdf8"
              strokeWidth="1.1"
              strokeOpacity="0.5"
            />
            <path
              d={pointsToSvgPath(UMM_AN_NASAN_ISLAND)}
              fill={theme === 'tactical' ? '#0D2140' : theme === 'satellite' ? '#1A335B' : '#201138'}
              stroke="#38bdf8"
              strokeWidth="1"
              strokeOpacity="0.4"
            />
          </g>

          {/* 2. Compact Traffic Bottlenecks Rings */}
          {showTraffic && (
            <g className="transition-all duration-300">
              {BAHRAIN_BOTTLENECKS.map((b) => {
                const pt = projectCoord(b.lat, b.lon);
                return (
                  <circle
                    key={`traffic-ring-${b.id}`}
                    cx={`${pt.x}%`}
                    cy={`${pt.y}%`}
                    r="13"
                    fill="none"
                    stroke={b.severity === 'heavy' ? '#ef4444' : '#f59e0b'}
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                    strokeOpacity="0.75"
                    className="animate-pulse"
                  />
                );
              })}
            </g>
          )}

          {/* 3. Driver to Pickup Trajectory */}
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
              style={{ animation: 'dashMove 1.5s linear infinite' }}
            />
          )}

          {/* 4. Pickup -> Delivery Curved Flow Path for Active Order */}
          {routeCurvePath && (
            <>
              <path
                d={routeCurvePath}
                fill="none"
                stroke="url(#routeGlow)"
                strokeWidth="6"
                strokeOpacity="0.3"
                strokeLinecap="round"
              />
              <path
                d={routeCurvePath}
                fill="none"
                stroke="url(#routeGlow)"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeDasharray="8 6"
                style={{ animation: 'dashMove 1.2s linear infinite' }}
              />
            </>
          )}

          {/* 5. Radar Halos for all captured order locations */}
          {mappedOrders.map(({ order, fromLoc }) => {
            if (!fromLoc) return null;
            const pt = projectCoord(fromLoc.lat, fromLoc.lon);
            const isCurrent = currentOrder?.id === order.id;
            return (
              <circle
                key={`halo-${order.id}`}
                cx={`${pt.x}%`}
                cy={`${pt.y}%`}
                r={isCurrent ? "26" : "18"}
                fill="url(#orderBlipRadial)"
                className="animate-pulse"
              />
            );
          })}
        </svg>

        {/* 6. Bahrain Base Areas Pins */}
        {visibleAreas.map((area) => {
          const pt = projectCoord(area.latitude, area.longitude);
          if (pt.x < -5 || pt.x > 105 || pt.y < -5 || pt.y > 105) return null;

          const isPickup = currentPickupLoc?.name === area.name;
          const isDelivery = currentDeliveryLoc?.name === area.name;
          const isHovered = hoveredArea === area.name;
          const pickupCount = areaOrderStats.pickupCounts[area.name] || 0;
          const isDriverHere = driverLocation?.areaName === area.name;

          return (
            <div
              key={area.id}
              style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
              onMouseEnter={() => setHoveredArea(area.name)}
              onMouseLeave={() => setHoveredArea(null)}
              onClick={() => {
                onSelectAreaAsLocation(area.name);
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-20 transition-transform hover:scale-125"
            >
              {isPickup ? (
                /* Selected Pickup Beacon */
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
                /* Selected Delivery Beacon */
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
              ) : pickupCount > 0 ? (
                /* Hotspot with order count */
                <div className="relative flex items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-cyan-400 opacity-60" />
                  <div className="px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-[10px] font-black border-2 border-white shadow-lg flex items-center gap-1">
                    <span>📦</span>
                    <span>{pickupCount}</span>
                  </div>
                </div>
              ) : (
                /* Normal Area Pin Point */
                <div
                  className={`w-2 h-2 rounded-full border transition-all ${
                    isHovered
                      ? 'bg-amber-400 scale-150 ring-4 ring-amber-400/40 border-white'
                      : 'bg-slate-300/60 border-slate-900/80 hover:bg-white hover:scale-125'
                  }`}
                />
              )}

              {/* Area Hover Card */}
              {isHovered && !isPickup && !isDelivery && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-xl bg-slate-950/95 backdrop-blur-md text-white text-[11px] font-bold whitespace-nowrap shadow-2xl border border-slate-700 z-40 pointer-events-none flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5 text-white">
                    <span className="text-amber-400">📍</span>
                    <span>{area.name}</span>
                    <span className="text-[9px] text-slate-400 font-normal">({area.governorate})</span>
                  </div>
                  {pickupCount > 0 && (
                    <span className="text-[10px] text-cyan-300 font-extrabold">
                      📦 ملتقط هنا: {pickupCount} طلب
                    </span>
                  )}
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

        {/* 7. Points of Radar-Captured Orders (نقاط توضح مكان الاوردرات التي يلتقطها الرادار) */}
        {mappedOrders.map(({ order, fromLoc, toLoc }) => {
          if (!fromLoc) return null;
          const pt = projectCoord(fromLoc.lat, fromLoc.lon);
          const isHighlighted = currentOrder?.id === order.id;

          return (
            <div
              key={`radar-order-${order.id}`}
              style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
              onClick={(e) => {
                e.stopPropagation();
                handleSelectOrderAndFocus(order);
              }}
              onMouseEnter={() => setHoveredOrder(order)}
              onMouseLeave={() => setHoveredOrder(null)}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-35 transition-transform hover:scale-125"
            >
              <div className="relative flex items-center justify-center">
                {/* Glowing Radar Pulse Dot */}
                <span className={`animate-ping absolute inline-flex rounded-full ${
                  isHighlighted 
                    ? 'h-9 w-9 bg-cyan-400 opacity-80' 
                    : 'h-6 w-6 bg-blue-400 opacity-60'
                }`} />

                {/* Radar Order Badge Dot */}
                <div className={`px-2 py-0.8 rounded-xl text-white text-[10px] font-black border-2 shadow-2xl flex items-center gap-1.5 transition-all ${
                  isHighlighted
                    ? 'bg-gradient-to-tr from-cyan-600 to-blue-600 border-white scale-110 shadow-cyan-500/60 ring-2 ring-cyan-300'
                    : 'bg-slate-900/95 border-cyan-400/90 hover:bg-cyan-700 hover:border-white'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="truncate max-w-[90px]">{order.from}</span>
                  {order.price > 0 && (
                    <span className="px-1 py-0.2 rounded bg-white/20 text-white font-mono text-[9px]">
                      {order.price} د.ب
                    </span>
                  )}
                </div>
              </div>

              {/* Hover Order Micro-Card */}
              {hoveredOrder?.id === order.id && !isHighlighted && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2.5 rounded-xl bg-slate-950/98 backdrop-blur-md text-white text-xs whitespace-nowrap shadow-2xl border border-cyan-500/80 z-50 pointer-events-none flex flex-col gap-1 min-w-[190px]">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1">
                    <span className="font-black text-cyan-300">📦 طلب ملتقط بالرادار</span>
                    {order.price > 0 && (
                      <span className="font-extrabold text-emerald-400">{order.price} د.ب</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold">
                    <span className="text-blue-300">من: {order.from}</span>
                    <span className="text-slate-400">⬅</span>
                    <span className="text-rose-300">إلى: {order.to}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                    {order.items || order.text}
                  </p>
                  <span className="text-[9px] text-cyan-400">انقر لتحديد ورسم مسار التوصيل 👆</span>
                </div>
              )}
            </div>
          );
        })}

        {/* 8. Compact Traffic Bottlenecks (نقاط الاختناق والازدحام بصورة مختصرة) */}
        {showTraffic &&
          BAHRAIN_BOTTLENECKS.map((b) => {
            const pt = projectCoord(b.lat, b.lon);
            if (pt.x < -5 || pt.x > 105 || pt.y < -5 || pt.y > 105) return null;

            const isHeavy = b.severity === 'heavy';
            const isHovered = hoveredBottleneck === b.id;

            return (
              <div
                key={`bottleneck-${b.id}`}
                style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                onMouseEnter={() => setHoveredBottleneck(b.id)}
                onMouseLeave={() => setHoveredBottleneck(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  setHoveredBottleneck((prev) => (prev === b.id ? null : b.id));
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-32 transition-transform hover:scale-125"
              >
                <div className="relative flex items-center justify-center">
                  {/* Subtle ping */}
                  <span
                    className={`animate-ping absolute inline-flex h-4 w-4 rounded-full ${
                      isHeavy ? 'bg-rose-500' : 'bg-amber-500'
                    } opacity-50`}
                  />

                  {/* Micro badge */}
                  <div
                    className={`px-1.5 py-0.5 rounded-lg text-white text-[9px] font-black border flex items-center gap-1 shadow-sm transition-all ${
                      isHeavy
                        ? 'bg-rose-600/95 border-rose-300'
                        : 'bg-amber-600/95 border-amber-300'
                    }`}
                  >
                    <span>{isHeavy ? '🛑' : '⚠️'}</span>
                    <span className="truncate max-w-[70px] hidden xs:inline">{b.name}</span>
                    <span className="font-mono text-[8px] bg-black/30 px-1 rounded">
                      {b.delay}
                    </span>
                  </div>
                </div>

                {/* Micro Tooltip */}
                {isHovered && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/95 backdrop-blur-md border border-rose-500/60 text-white text-[10px] whitespace-nowrap shadow-xl z-50 pointer-events-none flex flex-col gap-0.5">
                    <div className="flex items-center gap-1 font-bold">
                      <span>{isHeavy ? '🛑 نقطة اختناق' : '⚠️ حركة بطيئة'}:</span>
                      <span className="text-amber-300 font-black">{b.name}</span>
                      <span className="font-mono text-rose-300">({b.delay})</span>
                    </div>
                    <span className="text-[9px] text-slate-400">{b.road}</span>
                  </div>
                )}
              </div>
            );
          })}

        {/* 9. Driver Live GPS Puck */}
        {driverCoords && (
          <div
            style={{ left: `${driverCoords.x}%`, top: `${driverCoords.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none"
          >
            <div className="relative flex items-center justify-center">
              <span className="animate-ping absolute h-12 w-12 rounded-full bg-emerald-400 opacity-40" />
              <span className="animate-pulse absolute h-8 w-8 rounded-full bg-emerald-500/30" />
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center border-2 border-white shadow-xl shadow-emerald-500/70">
                <Navigation className="w-3.5 h-3.5 fill-white rotate-45" />
              </div>
              <div className="absolute top-full mt-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-950/95 text-emerald-200 border border-emerald-500/80 text-[10px] font-black whitespace-nowrap shadow-xl flex items-center gap-1 backdrop-blur-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>موقعي: {driverLocation?.areaName || 'البحرين'}</span>
              </div>
            </div>
          </div>
        )}

        {/* 9. Floating Tactical Controls (Top Left) */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-40">
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
            {/* Zoom Percentage */}
            <button
              type="button"
              onClick={handleResetView}
              className="py-1 px-0.5 rounded-md text-[9px] font-mono font-black text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors text-center"
              title="انقر لإعادة الضبط (100%)"
            >
              {Math.round(zoom * 100)}%
            </button>
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

        {/* 10. Floating Map Compass & Scale (Top Right) */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-40 pointer-events-none">
          <div className="px-2.5 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-700/80 text-white flex items-center gap-1.5 shadow-xl text-[10px] font-black">
            <span className="text-rose-500 font-extrabold text-xs">N</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-300">البحرين</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-700/80 text-white text-[10px] font-mono shadow-xl">
            <div className="w-8 h-1 bg-blue-400 rounded-full" />
            <span>5 كم</span>
          </div>
        </div>

        {/* 11. Selected Order Mission HUD Card (Floating Bottom) */}
        {currentOrder && tripMetrics ? (
          <div className="absolute bottom-3 left-3 right-3 z-40 pointer-events-auto">
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
                    {currentOrder.price > 0 && (
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

                {/* Google Maps External Launch */}
                <a
                  href={getGoogleMapsNavUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all active:scale-95"
                  title="فتح المسار في خرائط Google"
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
          <div className="absolute bottom-3 left-3 right-3 z-40 pointer-events-none">
            <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-white text-[11px] flex items-center justify-between gap-2 max-w-lg mx-auto shadow-xl">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-slate-300 text-[10px] sm:text-[11px]">
                  انقر على أي نقطة طلب لرسم مسار التوصيل، أو انقر على منطقة لتعيين موقعك.
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-[9px] font-bold shrink-0">
                {visibleAreas.length} منطقة نشطة
              </span>
            </div>
          </div>
        )}

        {/* Pinch-to-zoom & Gesture Guide Pill */}
        <div className="absolute top-3 right-3 pointer-events-none z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/70 text-[10px] font-bold text-slate-300 shadow-md">
          <span className="text-xs">🤏</span>
          <span className="hidden sm:inline">تكبير بالأصبعين مثل الصور · اسحب للتنقل</span>
          <span className="sm:hidden">تكبير بالأصبعين 🤏</span>
        </div>

      </div>

      {/* 4. Bottom Map Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
        
        {/* Geographic Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold">
          <span className="flex items-center gap-1.5 text-emerald-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 inline-block" />
            <span>موقع السائق</span>
          </span>
          <span className="flex items-center gap-1.5 text-blue-700">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-blue-100 inline-block" />
            <span>نقطة استلام طلب (From)</span>
          </span>
          <span className="flex items-center gap-1.5 text-rose-700">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 ring-4 ring-rose-100 inline-block" />
            <span>نقطة تسليم (To)</span>
          </span>
          <span className="flex items-center gap-1.5 text-cyan-700">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 ring-4 ring-cyan-100 inline-block" />
            <span>نقاط طلبات الرادار</span>
          </span>
          {showTraffic && (
            <span className="flex items-center gap-1.5 text-rose-700">
              <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-rose-200 inline-block" />
              <span>نقاط اختناق مروري</span>
            </span>
          )}
        </div>

        {/* Driver Location Badge */}
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
