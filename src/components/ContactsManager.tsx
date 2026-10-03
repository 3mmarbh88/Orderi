import React, { useState } from 'react';
import { 
  Star, 
  ShieldAlert, 
  Plus, 
  Trash2, 
  Phone, 
  MessageCircle, 
  Search, 
  Check, 
  UserCheck, 
  UserX,
  Sparkles,
  Info,
  ShieldCheck,
  Building2,
  X
} from 'lucide-react';
import { StoreContact, OrderFilter } from '../types';
import { formatBahrainPhone, normalizePhoneNumber } from '../utils/contacts';

interface ContactsManagerProps {
  contacts: StoreContact[];
  autoBlockBlacklist?: boolean;
  onUpdateContacts: (updatedContacts: StoreContact[], autoBlockBlacklist?: boolean) => void;
  onClose?: () => void;
  initialNewContact?: Partial<StoreContact> | null;
}

export function ContactsManager({
  contacts,
  autoBlockBlacklist = true,
  onUpdateContacts,
  onClose,
  initialNewContact,
}: ContactsManagerProps) {
  const [activeTab, setActiveTab] = useState<'vip' | 'blacklist'>(
    initialNewContact?.type || 'vip'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(Boolean(initialNewContact));
  
  // Form State
  const [formName, setFormName] = useState(initialNewContact?.name || '');
  const [formPhone, setFormPhone] = useState(initialNewContact?.phone || '');
  const [formType, setFormType] = useState<'vip' | 'blacklist'>(
    initialNewContact?.type || 'vip'
  );
  const [formNotes, setFormNotes] = useState(initialNewContact?.notes || '');
  const [blockSwitch, setBlockSwitch] = useState(autoBlockBlacklist);

  const vipContacts = contacts.filter((c) => c.type === 'vip');
  const blacklistContacts = contacts.filter((c) => c.type === 'blacklist');

  const displayedContacts = (activeTab === 'vip' ? vipContacts : blacklistContacts).filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.notes && c.notes.toLowerCase().includes(q))
    );
  });

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPhone.trim()) return;

    const normalized = normalizePhoneNumber(formPhone);
    const existingIndex = contacts.findIndex(
      (c) => normalizePhoneNumber(c.phone) === normalized
    );

    const newContact: StoreContact = {
      id: existingIndex >= 0 ? contacts[existingIndex].id : 'contact-' + Date.now().toString(36),
      name: formName.trim() || (formType === 'vip' ? 'متجر VIP موثوق' : 'رقم مستبعد'),
      phone: normalized,
      type: formType,
      notes: formNotes.trim(),
      addedAt: new Date().toISOString(),
    };

    let updatedList: StoreContact[];
    if (existingIndex >= 0) {
      updatedList = [...contacts];
      updatedList[existingIndex] = newContact;
    } else {
      updatedList = [newContact, ...contacts];
    }

    onUpdateContacts(updatedList, blockSwitch);
    setIsAdding(false);
    setFormName('');
    setFormPhone('');
    setFormNotes('');
  };

  const handleDeleteContact = (id: string) => {
    const updated = contacts.filter((c) => c.id !== id);
    onUpdateContacts(updated, blockSwitch);
  };

  const handleToggleAutoBlock = () => {
    const next = !blockSwitch;
    setBlockSwitch(next);
    onUpdateContacts(contacts, next);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
            <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">
              دليل جهات الاتصال والمتاجر الموثوقة (VIP & القائمة السوداء)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ميّز المتاجر سريعة الدفع بشارة خاصة، واحجب المعلنين المزعجين وغير الجادين
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="self-end sm:self-auto p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Auto-block toggle card */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <strong className="text-xs font-black text-slate-900 block">
              حجب طلبات القائمة السوداء تلقائياً
            </strong>
            <span className="text-[11px] text-slate-500">
              استبعاد وإخفاء أي طلب صادر من أرقام القائمة السوداء من الرادار فور وصوله
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleAutoBlock}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            blockSwitch
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>{blockSwitch ? 'الحجب مفعّل' : 'معطّل (عرض مع تحذير)'}</span>
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl max-w-fit">
          <button
            onClick={() => {
              setActiveTab('vip');
              setFormType('vip');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === 'vip'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span>المتاجر الموثوقة VIP ({vipContacts.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('blacklist');
              setFormType('blacklist');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === 'blacklist'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>القائمة السوداء ({blacklistContacts.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم أو الهاتف..."
              className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              isAdding
                ? 'bg-slate-200 text-slate-700'
                : activeTab === 'vip'
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs shadow-amber-500/20'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-xs shadow-rose-600/20'
            }`}
          >
            {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{isAdding ? 'إلغاء' : activeTab === 'vip' ? 'إضافة متجر VIP' : 'إضافة للقائمة السوداء'}</span>
          </button>
        </div>
      </div>

      {/* Add / Edit Form */}
      {isAdding && (
        <form
          onSubmit={handleSaveContact}
          className="p-5 rounded-2xl bg-white border-2 border-dashed border-blue-200 space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-900">
                {formType === 'vip' ? 'إضافة جهة / متجر موثوق VIP ⭐' : 'إضافة رقم للقائمة السوداء 🚫'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFormType('vip')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                  formType === 'vip'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                VIP موثوق
              </button>
              <button
                type="button"
                onClick={() => setFormType('blacklist')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                  formType === 'blacklist'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                قائمة سوداء
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                اسم المتجر أو العميل:
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="مثال: متجر لافندر للزهور / مطعم السيف"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                رقم الهاتف أو الواتساب:
              </label>
              <input
                type="text"
                required
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="مثال: 39123456 أو 97339123456"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none font-mono"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              ملاحظات وتفاصيل التقييم:
            </label>
            <input
              type="text"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder={
                formType === 'vip'
                  ? 'مثال: يدفع بنفت فوري كاش، تعامل سريع، بضاعة مغلفة'
                  : 'مثال: ألغى الطلب بعد وصولي للفرع، لا يرد على الاتصالات'
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-black text-white shadow-xs ${
                formType === 'vip'
                  ? 'bg-amber-600 hover:bg-amber-500'
                  : 'bg-rose-600 hover:bg-rose-500'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>حفظ في الدليل</span>
            </button>
          </div>
        </form>
      )}

      {/* List of Contacts */}
      {displayedContacts.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-white border border-slate-200/80 space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            {activeTab === 'vip' ? <Building2 className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
          </div>
          <p className="text-xs font-bold text-slate-700">
            {activeTab === 'vip'
              ? 'لا توجد متاجر موثوقة مسجلة حالياً'
              : 'لا توجد أرقام في القائمة السوداء'}
          </p>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            {activeTab === 'vip'
              ? 'يمكنك إضافة متاجرك المفضلة هنا أو بنقرة واحدة مباشرة من بطاقة أي طلب بالرادار'
              : 'أضف أي معلن مزعج لحجب طلباته تلقائياً وتحذيرك قبل قبول أي مشوار منه'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {displayedContacts.map((contact) => (
            <div
              key={contact.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                contact.type === 'vip'
                  ? 'bg-amber-50/40 border-amber-200/80 hover:border-amber-300'
                  : 'bg-rose-50/40 border-rose-200/80 hover:border-rose-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {contact.type === 'vip' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-300">
                        <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-600" />
                        VIP موثوق
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-black border border-rose-300">
                        <ShieldAlert className="w-2.5 h-2.5 text-rose-600" />
                        قائمة سوداء
                      </span>
                    )}
                    <strong className="text-xs font-black text-slate-900">
                      {contact.name}
                    </strong>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-600 font-mono" dir="ltr">
                    <span>+973 {formatBahrainPhone(contact.phone)}</span>
                  </div>

                  {contact.notes && (
                    <p className="text-[11px] text-slate-600 mt-1 bg-white/70 p-2 rounded-xl border border-slate-200/50 leading-relaxed">
                      💬 {contact.notes}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteContact(contact.id)}
                  title="حذف من القائمة"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Communication Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px]">
                <span className="text-[10px] text-slate-400">
                  أُضيف: {new Date(contact.addedAt).toLocaleDateString('ar-BH')}
                </span>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://wa.me/973${normalizePhoneNumber(contact.phone)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-colors"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>واتساب</span>
                  </a>

                  <a
                    href={`tel:+973${normalizePhoneNumber(contact.phone)}`}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors"
                  >
                    <Phone className="w-3 h-3" />
                    <span>اتصال</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
