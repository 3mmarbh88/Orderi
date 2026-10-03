import { 
  FileSpreadsheet, 
  Coins, 
  TrendingUp, 
  Trash2, 
  Phone, 
  MessageCircle, 
  Clock, 
  MapPin, 
  ArrowLeft,
  Calendar
} from 'lucide-react';
import { ParsedOrder } from '../types';

interface AcceptedLedgerProps {
  acceptedOrders: ParsedOrder[];
  onClearLedger: () => void;
  customTemplate: string;
  driverLocation?: { areaName?: string } | null;
}

export function AcceptedLedger({
  acceptedOrders,
  onClearLedger,
  driverLocation,
}: AcceptedLedgerProps) {
  const totalEarnings = acceptedOrders.reduce((sum, ord) => sum + ord.price, 0);
  const averagePrice = acceptedOrders.length > 0 ? totalEarnings / acceptedOrders.length : 0;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto pb-12">
      
      {/* Ledger Header & Metrics */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4 sm:space-y-6">
        <div className="flex flex-row items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">سجل الطلبات المقبولة اليوم</h2>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">متابعة حسابات الدخل والتوصيلات التي قمت بقبولها عبر الرادار</p>
          </div>

          {acceptedOrders.length > 0 && (
            <button
              onClick={onClearLedger}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>تفريغ السجل</span>
            </button>
          )}
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
          
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-emerald-50/70 border border-emerald-200 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
              <span>إجمالي دخل اليوم</span>
              <Coins className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-emerald-700">{totalEarnings.toFixed(1)}</span>
              <span className="text-xs font-black text-emerald-600">د.ب</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-emerald-600/80 mt-0.5 sm:mt-1">صافي الأجرة المحسوبة</p>
          </div>

          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-blue-50/70 border border-blue-200">
            <div className="flex items-center justify-between text-xs font-bold text-blue-800">
              <span>الطلبات المنفذة</span>
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-blue-700">{acceptedOrders.length}</span>
              <span className="text-xs font-black text-blue-600">طلبات</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-blue-600/80 mt-0.5 sm:mt-1">تم قبولها بنجاح</p>
          </div>

          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-purple-50/70 border border-purple-200">
            <div className="flex items-center justify-between text-xs font-bold text-purple-800">
              <span>متوسط الطلب</span>
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-purple-700">{averagePrice.toFixed(1)}</span>
              <span className="text-xs font-black text-purple-600">د.ب</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-purple-600/80 mt-0.5 sm:mt-1">معدل العائد لكل مشوار</p>
          </div>

        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {acceptedOrders.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white border border-slate-200/80 space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">لا توجد طلبات مقبولة حتى الآن</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              عندما تعجبك شروط طلب في الرادار وتضغط على &quot;قبول الطلب&quot;، سيتم تدوينه تلقائياً هنا في جدول أرباحك اليومية.
            </p>
          </div>
        ) : (
          acceptedOrders.map((ord, idx) => {
            const cleanPhone = ord.senderPhone.replace(/[^\d+]/g, '');
            const myArea = driverLocation?.areaName || 'البحرين';
            const messageBody = `#مندوب_توصيل انا في (${myArea})`;

            const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageBody)}` : null;

            return (
              <div
                key={ord.id || idx}
                className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                      طلب #{idx + 1}
                    </span>
                    <span className="text-xs text-slate-500 font-bold">{ord.groupName}</span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(ord.receivedAt).toLocaleTimeString('ar-BH', { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  </div>

                  {/* Route */}
                  <div className="flex items-center gap-3 text-sm font-bold text-slate-800">
                    <span className="text-blue-700 font-black">{ord.from}</span>
                    <ArrowLeft className="w-4 h-4 text-slate-400 rotate-180" />
                    <span className="text-rose-700 font-black">{ord.to}</span>
                    {ord.match.pickupToDeliveryDistanceKm && (
                      <span className="text-xs font-semibold text-slate-400">
                        (~{ord.match.pickupToDeliveryDistanceKm} كم)
                      </span>
                    )}
                  </div>

                  {ord.notes && (
                    <p className="text-xs text-slate-500 font-medium">
                      تفاصيل الشحنة: {ord.notes}
                    </p>
                  )}
                </div>

                {/* Price & Contact actions */}
                <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                  <div className="text-left px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] text-emerald-800 font-semibold block">الأجرة</span>
                    <strong className="text-lg font-black text-emerald-700">{ord.price.toFixed(1)} د.ب</strong>
                  </div>

                  {waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors"
                      title="مراسلة العميل في واتساب"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  )}

                  {ord.senderPhone && (
                    <a
                      href={`tel:+${ord.senderPhone}`}
                      className="p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
                      title="اتصال هاتفي"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
