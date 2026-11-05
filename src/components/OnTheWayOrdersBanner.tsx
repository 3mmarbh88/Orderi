import React, { useState } from 'react';
import { RouteCorridorResult, ActiveRoute } from '../utils/routeCorridor';
import { ParsedOrder } from '../types';
import { 
  Navigation, 
  MapPin, 
  Coins, 
  ArrowRight, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Zap,
  TrendingUp,
  Clock
} from 'lucide-react';

interface OnTheWayOrdersBannerProps {
  activeRoute: ActiveRoute;
  matchedOrders: Array<{ order: ParsedOrder; match: RouteCorridorResult }>;
  onAcceptOrder: (order: ParsedOrder) => void;
  onClearActiveRoute: () => void;
  onViewOrderOnMap?: (order: ParsedOrder) => void;
}

export function OnTheWayOrdersBanner({
  activeRoute,
  matchedOrders,
  onAcceptOrder,
  onClearActiveRoute,
  onViewOrderOnMap
}: OnTheWayOrdersBannerProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!activeRoute) return null;

  const totalExtraEarnings = matchedOrders.reduce((sum, item) => sum + (item.order.price || 0), 0);
  const count = matchedOrders.length;

  return (
    <div className="rounded-2xl sm:rounded-3xl border-2 border-blue-400 bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 text-white shadow-xl shadow-blue-950/40 p-4 sm:p-5 space-y-4 animate-in fade-in slide-in-from-top-3 duration-300">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-800/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center shrink-0 shadow-inner">
            <Navigation className="w-5 h-5 text-blue-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/25 text-blue-300 border border-blue-400/30">
                🛣️ مسارك النشط المقبول
              </span>
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {activeRoute.acceptedAt}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white mt-0.5 flex items-center gap-2">
              <span>{activeRoute.from}</span>
              <ArrowRight className="w-4 h-4 text-blue-400 rotate-180" />
              <span>{activeRoute.to}</span>
              <span className="text-emerald-400 text-xs sm:text-sm font-bold bg-emerald-500/15 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                +{activeRoute.price.toFixed(1)} د.ب
              </span>
            </h3>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {count > 0 && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-400/30 text-xs font-bold transition-colors cursor-pointer"
            >
              <span>{count} طلبات على نفس الطريق</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            type="button"
            onClick={onClearActiveRoute}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-colors cursor-pointer"
            title="إنهاء أو إلغاء تتبع هذا المسار"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>إنهاء المشوار</span>
          </button>
        </div>
      </div>

      {/* Summary message */}
      <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
        {count > 0 ? (
          <div className="text-blue-200 flex items-center gap-1.5 flex-wrap">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              تم رصد <strong className="text-white underline decoration-amber-400">{count}</strong> طلبات إضافية على نفس خط سيرك!
            </span>
            <span className="text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-400/30">
              أرباح إضافية محتملة: +{totalExtraEarnings.toFixed(1)} د.ب 💰
            </span>
          </div>
        ) : (
          <div className="text-slate-400 text-xs font-normal">
            نظام الرادار يراقب قروبات الواتساب لحظياً وسينبهك فور وصول أي طلب يقع على نفس طريقك ({activeRoute.from} ← {activeRoute.to}) ⚡
          </div>
        )}
      </div>

      {/* List of Matched On-The-Way Orders */}
      {count > 0 && isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {matchedOrders.map(({ order, match }) => (
            <div
              key={order.id}
              className="rounded-2xl p-3.5 bg-slate-800/80 hover:bg-slate-800 border border-blue-400/40 hover:border-blue-300 transition-all flex flex-col justify-between gap-2.5 shadow-sm"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1">
                    <Navigation className="w-3 h-3 text-blue-400" />
                    <span>{match.reason}</span>
                  </span>
                  <span className="text-emerald-400 text-xs font-black bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-400/30">
                    +{order.price ? order.price.toFixed(1) : '0.0'} د.ب
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <span className="text-blue-300">{order.from}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 rotate-180" />
                  <span className="text-emerald-300">{order.to}</span>
                </div>

                {order.rawText && (
                  <p className="text-[11px] text-slate-300 line-clamp-1 font-mono bg-slate-900/60 p-1.5 rounded-lg border border-slate-700/60">
                    {order.rawText}
                  </p>
                )}

                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>من: {order.senderName || order.groupName || 'واتساب'}</span>
                  {match.detourKm <= 3 && (
                    <span className="text-emerald-400 font-bold">
                      انحراف 0-3 كم فقط ⚡
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-700/50">
                <button
                  type="button"
                  onClick={() => onAcceptOrder(order)}
                  className="flex-1 min-h-[38px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-700/30 transition-all active:scale-95 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>قبول وضم للمسار (+{order.price} د.ب)</span>
                </button>

                {onViewOrderOnMap && (
                  <button
                    type="button"
                    onClick={() => onViewOrderOnMap(order)}
                    className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="معاينة المسار على الخريطة"
                  >
                    <MapPin className="w-4 h-4 text-blue-400" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
