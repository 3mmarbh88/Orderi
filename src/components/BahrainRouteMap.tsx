import { useState } from 'react';
import { MapPin, Navigation, Compass, Layers, Info } from 'lucide-react';
import { BAHRAIN_AREAS, calculateDistanceKm, findAreaByName } from '../data/bahrainAreas';
import { MatcherLocation } from '../utils/matcher';
import { ParsedOrder } from '../types';

interface BahrainRouteMapProps {
  driverLocation: MatcherLocation | null;
  activeOrder: ParsedOrder | null;
  onSelectAreaAsLocation: (areaName: string) => void;
}

export function BahrainRouteMap({
  driverLocation,
  activeOrder,
  onSelectAreaAsLocation,
}: BahrainRouteMapProps) {
  const [hoveredArea, setHoveredArea] = useState<string | null>(null);

  // Bahrain bounding box for SVG projection
  // Lat: 26.00 to 26.32 (North to South)
  // Lon: 50.42 to 50.68 (West to East)
  const minLat = 26.00;
  const maxLat = 26.31;
  const minLon = 50.43;
  const maxLon = 50.68;

  const projectCoord = (lat: number, lon: number) => {
    // Map Lon -> X (0 to 100%)
    const x = ((lon - minLon) / (maxLon - minLon)) * 100;
    // Map Lat -> Y (0 at top, so maxLat is 0, minLat is 100%)
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
    return {
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y)),
    };
  };

  const driverCoords = driverLocation ? projectCoord(driverLocation.latitude, driverLocation.longitude) : null;
  
  const pickupAreaObj = activeOrder ? findAreaByName(activeOrder.from) : null;
  const deliveryAreaObj = activeOrder ? findAreaByName(activeOrder.to) : null;

  const pickupCoords = pickupAreaObj ? projectCoord(pickupAreaObj.latitude, pickupAreaObj.longitude) : null;
  const deliveryCoords = deliveryAreaObj ? projectCoord(deliveryAreaObj.latitude, deliveryAreaObj.longitude) : null;

  return (
    <div className="p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4 w-full max-w-full overflow-hidden">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">خريطة مناطق البحرين والمسارات</h3>
            <p className="text-[11px] text-slate-500">تمثيل جغرافي تفاعلي لموقعك ومسار الطلب المختار</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold">
          <span className="flex items-center gap-1.5 text-emerald-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 inline-block"></span>
            <span>موقع السائق</span>
          </span>
          <span className="flex items-center gap-1.5 text-blue-700">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-blue-100 inline-block"></span>
            <span>الاستلام (From)</span>
          </span>
          <span className="flex items-center gap-1.5 text-rose-700">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 ring-4 ring-rose-100 inline-block"></span>
            <span>التسليم (To)</span>
          </span>
        </div>
      </div>

      {/* Interactive Map Canvas Container */}
      <div className="relative w-full h-[320px] sm:h-[460px] rounded-2xl bg-gradient-to-br from-slate-900 via-[#0B1E38] to-[#122A4E] overflow-hidden border border-slate-800 flex items-center justify-center select-none shadow-inner">
        
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

        {/* SVG Route Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {/* Line from Driver to Pickup */}
          {driverCoords && pickupCoords && (
            <line
              x1={`${driverCoords.x}%`}
              y1={`${driverCoords.y}%`}
              x2={`${pickupCoords.x}%`}
              y2={`${pickupCoords.y}%`}
              stroke="#10b981"
              strokeWidth="2.5"
              strokeDasharray="4 4"
              className="animate-pulse"
            />
          )}

          {/* Line from Pickup to Delivery */}
          {pickupCoords && deliveryCoords && (
            <line
              x1={`${pickupCoords.x}%`}
              y1={`${pickupCoords.y}%`}
              x2={`${deliveryCoords.x}%`}
              y2={`${deliveryCoords.y}%`}
              stroke="#38bdf8"
              strokeWidth="3"
            />
          )}
        </svg>

        {/* Bahrain Areas Pins */}
        {BAHRAIN_AREAS.map((area) => {
          const pt = projectCoord(area.latitude, area.longitude);
          const isPickup = pickupAreaObj?.id === area.id;
          const isDelivery = deliveryAreaObj?.id === area.id;
          const isHovered = hoveredArea === area.name;

          return (
            <div
              key={area.id}
              style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
              onMouseEnter={() => setHoveredArea(area.name)}
              onMouseLeave={() => setHoveredArea(null)}
              onClick={() => onSelectAreaAsLocation(area.name)}
              title={`${area.name} (${area.governorate}) - انقر لتعيين موقعك هنا`}
              className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10 transition-transform hover:scale-125"
            >
              {isPickup ? (
                <div className="relative">
                  <span className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-blue-400 opacity-75"></span>
                  <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-black text-[10px] shadow-lg shadow-blue-500/50 border-2 border-white">
                    من
                  </div>
                </div>
              ) : isDelivery ? (
                <div className="relative">
                  <span className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-rose-400 opacity-75"></span>
                  <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center font-black text-[10px] shadow-lg shadow-rose-500/50 border-2 border-white">
                    إلى
                  </div>
                </div>
              ) : (
                <div className={`w-2.5 h-2.5 rounded-full border border-slate-900 transition-all ${
                  isHovered ? 'bg-amber-400 scale-150 ring-2 ring-amber-300' : 'bg-slate-400/60 hover:bg-white'
                }`} />
              )}

              {/* Tooltip on hover */}
              {(isHovered || isPickup || isDelivery) && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-lg bg-slate-950/90 text-white text-[11px] font-bold whitespace-nowrap pointer-events-none shadow-md border border-slate-700 z-30">
                  {area.name}
                  {isPickup && ' (استلام)'}
                  {isDelivery && ' (تسليم)'}
                </div>
              )}
            </div>
          );
        })}

        {/* Driver GPS Live Beacon Pin */}
        {driverCoords && (
          <div
            style={{ left: `${driverCoords.x}%`, top: `${driverCoords.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
          >
            <div className="relative flex items-center justify-center">
              <span className="animate-ping absolute h-8 w-8 rounded-full bg-emerald-400 opacity-60"></span>
              <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white shadow-lg shadow-emerald-500/50">
                <Navigation className="w-3 h-3 rotate-45 fill-white" />
              </div>
              <div className="absolute top-full mt-1 px-2 py-0.5 rounded-md bg-emerald-950/90 text-emerald-200 border border-emerald-500/50 text-[10px] font-extrabold whitespace-nowrap">
                موقعي: {driverLocation?.areaName}
              </div>
            </div>
          </div>
        )}

        {/* Floating Controls inside map */}
        <div className="absolute top-3 right-3 p-2.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-700 text-white text-[11px] space-y-1">
          <div className="font-bold flex items-center gap-1 text-slate-300">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span>نصيحة سريعة:</span>
          </div>
          <p className="text-[10px] text-slate-400 max-w-[200px]">
            يمكنك النقر على أي نقطة منطقة في الخريطة لتعيين موقعك هناك فورياً.
          </p>
        </div>

      </div>

    </div>
  );
}
