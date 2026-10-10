import React, { useState } from 'react';
import {
  CalendarDays,
  Clock,
  Plus,
  Trash2,
  Edit2,
  X,
  AlertTriangle,
  CheckCircle2,
  Phone,
  MessageCircle,
  MapPin,
  Navigation,
  School,
  Briefcase,
  Repeat,
  BellRing,
  HelpCircle,
  ShieldAlert,
  ChevronDown,
  Info
} from 'lucide-react';
import { MonthlyCommitment, DayOfWeek } from '../types';
import {
  DAYS_OF_WEEK_MAP,
  parseTimeToMinutes,
  formatMinutesTo12h,
  checkCommitmentConflict,
  getNextUpcomingCommitment
} from '../utils/commitmentManager';

interface MonthlyCommitmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  commitments: MonthlyCommitment[];
  onSaveCommitments: (updated: MonthlyCommitment[]) => void;
  onShowToast: (msg: string) => void;
}

export const MonthlyCommitmentsModal: React.FC<MonthlyCommitmentsModalProps> = ({
  isOpen,
  onClose,
  commitments,
  onSaveCommitments,
  onShowToast,
}) => {
  if (!isOpen) return null;

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<MonthlyCommitment>>({
    title: '',
    type: 'school',
    clientName: '',
    clientPhone: '',
    fromArea: '',
    toArea: '',
    pickupTime: '07:00',
    returnPickupTime: '',
    durationMinutes: 40,
    days: ['sun', 'mon', 'tue', 'wed', 'thu'],
    monthlyFeeBhd: 40,
    reminderMinutesBefore: 20,
    isActive: true,
    notes: '',
  });

  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'school',
      clientName: '',
      clientPhone: '',
      fromArea: '',
      toArea: '',
      pickupTime: '07:00',
      returnPickupTime: '',
      durationMinutes: 40,
      days: ['sun', 'mon', 'tue', 'wed', 'thu'],
      monthlyFeeBhd: 40,
      reminderMinutesBefore: 20,
      isActive: true,
      notes: '',
    });
    setFormError(null);
    setIsAddingNew(false);
    setEditingId(null);
  };

  const handleStartEdit = (commitment: MonthlyCommitment) => {
    setEditingId(commitment.id);
    setFormData({ ...commitment });
    setIsAddingNew(true);
  };

  const handleToggleDay = (dayId: DayOfWeek) => {
    const currentDays = formData.days || [];
    if (currentDays.includes(dayId)) {
      if (currentDays.length <= 1) {
        setFormError('يجب اختيار يوم واحد على الأقل للارتباط');
        return;
      }
      setFormData({ ...formData, days: currentDays.filter((d) => d !== dayId) });
    } else {
      setFormData({ ...formData, days: [...currentDays, dayId] });
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      setFormError('يرجى كتابة عنوان أو مسمى الارتباط (مثال: توصيل مدارس الرفاع)');
      return;
    }
    if (!formData.fromArea?.trim() || !formData.toArea?.trim()) {
      setFormError('يرجى تحديد منطقة الاستلام ومنطقة الوصول');
      return;
    }
    if (!formData.pickupTime) {
      setFormError('يرجى تحديد توقيت الاستلام بالساعة والدقيقة');
      return;
    }
    if (!formData.days || formData.days.length === 0) {
      setFormError('يرجى اختيار أيام التوصيل');
      return;
    }

    const commitmentToSave: MonthlyCommitment = {
      id: editingId || `commit-${Date.now()}`,
      title: formData.title.trim(),
      type: formData.type || 'school',
      clientName: formData.clientName?.trim() || 'عميل شهري',
      clientPhone: (formData.clientPhone || '').replace(/\D/g, ''),
      fromArea: formData.fromArea.trim(),
      toArea: formData.toArea.trim(),
      pickupTime: formData.pickupTime,
      returnPickupTime: formData.returnPickupTime?.trim() || undefined,
      durationMinutes: Number(formData.durationMinutes) || 40,
      days: formData.days,
      monthlyFeeBhd: Number(formData.monthlyFeeBhd) || 0,
      reminderMinutesBefore: Number(formData.reminderMinutesBefore) || 20,
      isActive: formData.isActive ?? true,
      notes: formData.notes?.trim() || '',
      createdAt: editingId ? (formData.createdAt || new Date().toISOString()) : new Date().toISOString(),
    };

    // Check for internal schedule conflict with other active commitments
    const otherCommitments = commitments.filter((c) => c.id !== commitmentToSave.id);
    for (const other of otherCommitments) {
      const conflict = checkCommitmentConflict(commitmentToSave, other);
      if (conflict.hasConflict) {
        setFormError(`⚠️ تنبيه تعارض: ${conflict.overlapDetail}. يرجى تعديل التوقيت أو الأيام لتفادي التعارض!`);
        return;
      }
    }

    let updated: MonthlyCommitment[];
    if (editingId) {
      updated = commitments.map((c) => (c.id === editingId ? commitmentToSave : c));
      onShowToast(`✅ تم تحديث الارتباط الشهري: «${commitmentToSave.title}»`);
    } else {
      updated = [commitmentToSave, ...commitments];
      onShowToast(`🎉 تم إضافة الارتباط الشهري الجديد بنجاح مع جدول التذكيرات المانع للتعارض`);
    }

    onSaveCommitments(updated);
    resetForm();
  };

  const handleDelete = (id: string, title: string) => {
    const updated = commitments.filter((c) => c.id !== id);
    onSaveCommitments(updated);
    onShowToast(`تم حذف الارتباط الشهري «${title}»`);
  };

  const handleToggleActive = (id: string) => {
    const updated = commitments.map((c) => {
      if (c.id === id) {
        const nextState = !c.isActive;
        onShowToast(nextState ? `تم تفعيل التذكيرات لـ «${c.title}»` : `تم تعليق التذكيرات مؤقتاً لـ «${c.title}»`);
        return { ...c, isActive: nextState };
      }
      return c;
    });
    onSaveCommitments(updated);
  };

  const nextUpcoming = getNextUpcomingCommitment(commitments);

  // Total monthly revenue calculation from active commitments
  const totalMonthlyBhd = commitments
    .filter((c) => c.isActive)
    .reduce((acc, c) => acc + (c.monthlyFeeBhd || 0), 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] pb-safe animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Bar */}
        <div className="sm:hidden w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-2 mb-1" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/25 border border-blue-400/40 flex items-center justify-center text-blue-300 shadow-inner">
              <CalendarDays className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  الارتباط بالتوصيلات الشهرية
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold border border-amber-400/30">
                  مدارس وعقود 🗓️
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                جدول التوصيل اليومي، تنبيهات المواعيد، ومنع التعارض عند قبول أي طلب
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Protection Banner: Anti-clash Guard */}
        <div className="bg-amber-500/10 border-b border-amber-200/80 px-4 py-2.5 flex items-center justify-between text-xs text-amber-950 font-medium">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>حماية المندوب من التعارض نشطة:</strong> سننبهك فوراً إذا حاولت قبول أي طلب يقع في موعد ارتباطك الشهري، مع إمكانية قبول الطلب إذا كان وقتك يسمح! ⏰
            </span>
          </div>
          {totalMonthlyBhd > 0 && (
            <div className="hidden sm:inline-flex items-center gap-1 font-black text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-lg border border-emerald-300 shrink-0">
              <span>الدخل الشهري الثابت:</span>
              <span>{totalMonthlyBhd.toFixed(1)} د.ب</span>
            </div>
          )}
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Next Upcoming Reminder Card */}
          {nextUpcoming && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex items-center justify-between text-xs shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <BellRing className="w-4 h-4 animate-bounce" />
                </div>
                <div>
                  <span className="font-black text-blue-950 block text-xs sm:text-sm">
                    الموعد القادم اليوم: {nextUpcoming.commitment.title}
                  </span>
                  <span className="text-slate-600 font-medium text-[11px]">
                    📍 الاستلام في الساعة <strong>{nextUpcoming.pickupTime12h}</strong> ({nextUpcoming.commitment.fromArea} ← {nextUpcoming.commitment.toArea})
                  </span>
                </div>
              </div>
              <div className="text-left shrink-0">
                <span className="inline-block px-2.5 py-1 rounded-full bg-blue-600 text-white font-black text-[11px] shadow-2xs">
                  {nextUpcoming.minutesUntil <= 0
                    ? 'حان الموعد الآن 🔔'
                    : `بعد ${nextUpcoming.minutesUntil} دقيقة ⏰`}
                </span>
              </div>
            </div>
          )}

          {/* Action to Add New Commitment */}
          {!isAddingNew ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black text-slate-700">
                قائمة الارتباطات المجدولة ({commitments.length})
              </span>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsAddingNew(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-sm shadow-blue-600/30 transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة ارتباط شهري جديد ➕</span>
              </button>
            </div>
          ) : (
            /* Add / Edit Commitment Form Card */
            <form onSubmit={handleSaveForm} className="p-4 sm:p-5 rounded-2xl bg-slate-50 border-2 border-blue-300 space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2 font-black text-sm text-blue-950">
                  <CalendarDays className="w-4 h-4 text-blue-600" />
                  <span>{editingId ? 'تعديل الارتباط الشهري' : 'إضافة ارتباط شهري جديد (مدارس أو توصيل يومي)'}</span>
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-slate-500 hover:text-slate-800 font-bold"
                >
                  إلغاء ✕
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Type Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">نوع الارتباط:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'school' })}
                    className={`py-2 px-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      formData.type === 'school'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <School className="w-3.5 h-3.5" />
                    <span>توصيل مدارس 🎒</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'daily_work' })}
                    className={`py-2 px-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      formData.type === 'daily_work'
                        ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>دوام يومي / موظفين 🏢</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'custom_recurring' })}
                    className={`py-2 px-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      formData.type === 'custom_recurring'
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Repeat className="w-3.5 h-3.5" />
                    <span>مشاوير خاصة متكررة 🚗</span>
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">
                  عنوان الارتباط / المسمى <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: توصيل طالبين لمدرسة بيان - الصباح والظهر"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs sm:text-sm bg-white rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold"
                />
              </div>

              {/* Route: From & To */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">منطقة الاستلام (الصباح) *:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: مدينة عيسى أو الرفاع"
                    value={formData.fromArea || ''}
                    onChange={(e) => setFormData({ ...formData, fromArea: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">منطقة الوصول (المدرسة أو العمل) *:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: السيف أو المنامة أو مدرسة..."
                    value={formData.toArea || ''}
                    onChange={(e) => setFormData({ ...formData, toArea: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Timing */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>توقيت الاستلام (الذهاب) *:</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.pickupTime || '07:00'}
                    onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>توقيت العودة (اختياري):</span>
                  </label>
                  <input
                    type="time"
                    value={formData.returnPickupTime || ''}
                    onChange={(e) => setFormData({ ...formData, returnPickupTime: e.target.value })}
                    placeholder="مثال: 13:30 ظهراً"
                    className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    المدة المتوقعة للرحلة:
                  </label>
                  <select
                    value={formData.durationMinutes || 40}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300 font-bold"
                  >
                    <option value={20}>20 دقيقة (مشوار سريع)</option>
                    <option value={30}>30 دقيقة</option>
                    <option value={40}>40 دقيقة (معتاد للمدارس)</option>
                    <option value={50}>50 دقيقة</option>
                    <option value={60}>ساعة كاملة (60 دقيقة)</option>
                  </select>
                </div>
              </div>

              {/* Days Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">
                  الأيام المتفق عليها أسبوعياً (اختر الأيام):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS_OF_WEEK_MAP.map((day) => {
                    const isSelected = formData.days?.includes(day.id);
                    return (
                      <button
                        type="button"
                        key={day.id}
                        onClick={() => handleToggleDay(day.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-2xs scale-102'
                            : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {day.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Client & Fee */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">اسم العميل / ولي الأمر:</label>
                  <input
                    type="text"
                    placeholder="مثال: أم محمد"
                    value={formData.clientName || ''}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">رقم الواتساب / الهاتف:</label>
                  <input
                    type="tel"
                    dir="ltr"
                    placeholder="39XXXXXX"
                    value={formData.clientPhone || ''}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300 font-mono text-right"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">المبلغ الشهري المتفق عليه (د.ب):</label>
                  <input
                    type="number"
                    step="5"
                    min="0"
                    placeholder="مثال: 45 د.ب"
                    value={formData.monthlyFeeBhd ?? ''}
                    onChange={(e) => setFormData({ ...formData, monthlyFeeBhd: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300 font-bold"
                  />
                </div>
              </div>

              {/* Reminder minutes */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <BellRing className="w-3.5 h-3.5 text-amber-500" />
                  <span>تذكيري بموعد التوصيل قبل:</span>
                </span>
                <select
                  value={formData.reminderMinutesBefore || 20}
                  onChange={(e) => setFormData({ ...formData, reminderMinutesBefore: parseInt(e.target.value, 10) })}
                  className="px-3 py-1.5 text-xs bg-white rounded-xl border border-slate-300 font-bold"
                >
                  <option value={10}>10 دقائق قبل الموعد</option>
                  <option value={15}>15 دقيقة قبل الموعد</option>
                  <option value={20}>20 دقيقة قبل الموعد (موصى به)</option>
                  <option value={30}>نصف ساعة (30 دقيقة)</option>
                  <option value={45}>45 دقيقة قبل الموعد</option>
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">ملاحظات إضافية (أرقام الطلاب، تفاصيل الاتفاق):</label>
                <input
                  type="text"
                  placeholder="مثال: ركوب من الباب الخلفي، الاتصال عند الوصول"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md shadow-blue-600/30 transition-all cursor-pointer"
                >
                  {editingId ? 'حفظ التعديلات ✅' : 'اعتماد وحفظ الارتباط الشهري 💾'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100"
                >
                  إلغاء
                </button>
              </div>
            </form>
          )}

          {/* Commitments Cards List */}
          <div className="space-y-3">
            {commitments.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <CalendarDays className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-800">لا توجد توصيلات شهرية مضافة بعد</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    سجّل توصيلات المدارس أو المشاوير اليومية ليقوم Orderi بتذكيرك بمواعيدها وتنبيهك تلقائياً لمنع التعارض عند قبول أي طلب خارجي.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setIsAddingNew(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-black text-xs shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة أول ارتباط شهري الآن</span>
                </button>
              </div>
            ) : (
              commitments.map((c) => {
                const daysLabels = c.days
                  .map((d) => DAYS_OF_WEEK_MAP.find((m) => m.id === d)?.name)
                  .filter(Boolean)
                  .join('، ');

                const pMinutes = parseTimeToMinutes(c.pickupTime);
                const pickupTime12h = formatMinutesTo12h(pMinutes);
                const returnTime12h = c.returnPickupTime
                  ? formatMinutesTo12h(parseTimeToMinutes(c.returnPickupTime))
                  : null;

                const cleanClientPhone = (c.clientPhone || '').replace(/\D/g, '');
                const clientWaUrl = cleanClientPhone
                  ? `https://wa.me/${cleanClientPhone.startsWith('973') ? cleanClientPhone : '973' + cleanClientPhone}`
                  : null;

                return (
                  <div
                    key={c.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      c.isActive
                        ? 'bg-white border-slate-200/90 shadow-2xs hover:border-blue-300'
                        : 'bg-slate-100/70 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            c.type === 'school'
                              ? 'bg-amber-100 text-amber-700'
                              : c.type === 'daily_work'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-indigo-100 text-indigo-700'
                          }`}
                        >
                          {c.type === 'school' ? (
                            <School className="w-4 h-4" />
                          ) : c.type === 'daily_work' ? (
                            <Briefcase className="w-4 h-4" />
                          ) : (
                            <Repeat className="w-4 h-4" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-slate-900 leading-tight">
                              {c.title}
                            </h3>
                            {!c.isActive && (
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                                معلق مؤقتاً
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {c.clientName} • {c.monthlyFeeBhd ? `${c.monthlyFeeBhd} د.ب شهرياً` : 'شهري'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(c.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                            c.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300'
                          }`}
                        >
                          {c.isActive ? 'مفعل 🔔' : 'معطل 🔕'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStartEdit(c)}
                          className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                          title="تعديل الارتباط"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(c.id, c.title)}
                          className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                          title="حذف الارتباط"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Route & Times */}
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="font-bold truncate">الاستلام: {c.fromArea}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Navigation className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-bold truncate">الوصول: {c.toArea}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-800">
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="font-black">الذهاب: {pickupTime12h}</span>
                          <span className="text-[10px] text-slate-500">({c.durationMinutes} دقيقة)</span>
                        </div>
                        {returnTime12h && (
                          <div className="flex items-center gap-1.5 text-slate-800">
                            <Repeat className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="font-black">العودة: {returnTime12h}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Days and Contact Row */}
                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                      <div className="flex items-center gap-1 font-bold">
                        <span className="text-slate-400">الأيام:</span>
                        <span className="text-blue-700">{daysLabels}</span>
                      </div>

                      {clientWaUrl && (
                        <div className="flex items-center gap-2">
                          <a
                            href={clientWaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 transition-colors"
                          >
                            <MessageCircle className="w-3 h-3 text-emerald-600" />
                            <span>واتساب العميل</span>
                          </a>
                          <a
                            href={`tel:${cleanClientPhone}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition-colors"
                          >
                            <Phone className="w-3 h-3 text-blue-600" />
                            <span>اتصال</span>
                          </a>
                        </div>
                      )}
                    </div>

                    {c.notes && (
                      <div className="mt-2 text-[11px] text-slate-500 bg-white/70 p-1.5 rounded-lg border border-slate-200">
                        💬 <strong>ملاحظات:</strong> {c.notes}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>حماية التعارض تعمل بالخلفية وتمنع قبول طلبات تصادف مواعيد التوصيل الشهري</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
          >
            تم وإغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
