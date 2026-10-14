import { useEffect, useState } from 'react';
import { BrainCircuit, CheckCircle2, CopyCheck, ShieldCheck } from 'lucide-react';
import { getLocalClassificationStats } from '../utils/localClassificationLearning';

interface AIQualityPanelProps {
  acceptedCount: number;
  duplicateMerges: number;
  closedCount: number;
}

export function AIQualityPanel({ acceptedCount, duplicateMerges, closedCount }: AIQualityPanelProps) {
  const [stats, setStats] = useState(getLocalClassificationStats);

  useEffect(() => {
    const refresh = () => setStats(getLocalClassificationStats());
    window.addEventListener('orderi:classification-correction', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('orderi:classification-correction', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  return (
    <section dir="rtl" className="rounded-2xl border border-indigo-100 bg-white p-3 sm:p-4 shadow-xs space-y-3">
      <div className="flex items-center gap-2">
        <div className="rounded-xl bg-indigo-50 p-2 text-indigo-700"><BrainCircuit className="h-4 w-4" /></div>
        <div className="min-w-0">
          <h3 className="text-sm font-black text-slate-900">جودة التصنيف والتعلّم المحلي</h3>
          <p className="text-[11px] text-slate-500">إحصاءات فعلية من تصحيحاتك وسجل الطلبات، وليست نسبة ثقة تخمينية</p>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
          <div className="text-[11px] text-slate-500 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> تصحيحات محفوظة</div>
          <div className="text-xl font-black text-slate-900">{stats.totalCorrections}</div>
          <div className="text-[10px] text-slate-500">أوردر: {stats.orderCorrections} · إعلان: {stats.advertisementCorrections}</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
          <div className="text-[11px] text-slate-500 flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> طلبات مقبولة</div>
          <div className="text-xl font-black text-slate-900">{acceptedCount}</div>
          <div className="text-[10px] text-slate-500">من سجل القبول الحالي</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
          <div className="text-[11px] text-slate-500 flex items-center gap-1"><CopyCheck className="h-3.5 w-3.5" /> تكرارات مدمجة</div>
          <div className="text-xl font-black text-slate-900">{duplicateMerges}</div>
          <div className="text-[10px] text-slate-500">المحفوظة في الطلبات الحالية</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
          <div className="text-[11px] text-slate-500">طلبات مغلقة</div>
          <div className="text-xl font-black text-slate-900">{closedCount}</div>
          <div className="text-[10px] text-slate-500">تم أخذها أو إغلاقها</div>
        </div>
      </div>
      <p className="text-[11px] leading-relaxed text-slate-600">
        الخصوصية: التصحيحات محفوظة على هذا الجهاز فقط. الرسائل المشابهة تُعرض كاقتراح ولا تُعامل كنسخة مطابقة تلقائيًا. لا يمكن حساب نسبة صحة الاستبعاد أو الأوردرات الفائتة بدقة قبل توفير مراجعة للرسائل المستبعدة وتأكيد نتيجتها.
      </p>
    </section>
  );
}
