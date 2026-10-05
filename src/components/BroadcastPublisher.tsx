import { useState, useEffect } from 'react';
import { 
  Send, 
  Share2, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  Sparkles, 
  MessageSquare, 
  CheckSquare, 
  Square, 
  Clock, 
  MapPin, 
  Coins, 
  Phone, 
  FileText, 
  Layers, 
  ExternalLink,
  History,
  RotateCcw,
  Search,
  Reply,
  CheckCircle2,
  X,
  Users,
  AlertCircle,
  Settings,
  CheckCheck,
  BookmarkCheck,
  Edit3
} from 'lucide-react';
import { BAHRAIN_AREAS, POPULAR_WHATSAPP_GROUPS } from '../data/bahrainAreas';
import { MatcherLocation, evaluateOrderMatch } from '../utils/matcher';
import { OrderBroadcast, OrderFilter, ParsedOrder } from '../types';

interface BroadcastPublisherProps {
  driverLocation: MatcherLocation | null;
  filter: OrderFilter;
  onAddOrderToRadar: (order: ParsedOrder) => void;
  onToast: (msg: string) => void;
  onUpdateFilter?: (filter: OrderFilter) => void;
  initialReplayBroadcastId?: string | null;
  onClearInitialReplayBroadcastId?: () => void;
}

const DEFAULT_GROUPS = [
  { id: '1', name: 'قروب مندوبي البحرين 🇧🇭', category: 'مندوبين' },
  { id: '2', name: 'طلبات التوصيل - المنامة والمحرق', category: 'عاصمة ومحرق' },
  { id: '3', name: 'توصيل سريع الرفاع ومدينة عيسى', category: 'الجنوبية' },
  { id: '4', name: 'شبكة مناديب التوصيل السريع', category: 'عام' },
  { id: '5', name: 'قروب أصحاب المشاريع والأسر المنتجة', category: 'مشاريع' },
  { id: '6', name: 'توصيل هدايا وورود البحرين', category: 'هدايا' },
  { id: '7', name: 'طلبات المطاعم والكافيهات البحرين', category: 'مطاعم' },
  { id: '8', name: 'قروب توصيل المحافظة الشمالية (سار والجنبية)', category: 'الشمالية' },
  { id: '9', name: 'سواق وسيارات توصيل البحرين', category: 'سيارات' },
];

export function BroadcastPublisher({
  driverLocation,
  filter,
  onAddOrderToRadar,
  onToast,
  onUpdateFilter,
  initialReplayBroadcastId,
  onClearInitialReplayBroadcastId,
}: BroadcastPublisherProps) {
  // Form fields for Quick Order Builder
  const [pickupArea, setPickupArea] = useState(driverLocation?.areaName || 'المنامة');
  const [deliveryArea, setDeliveryArea] = useState('الرفاع');
  const [price, setPrice] = useState('3.0');
  const [timing, setTiming] = useState('فوري ⚡');
  const [phone, setPhone] = useState('3');
  const [notes, setNotes] = useState('أغراض خفيفة - استلام وتسليم مباشر');

  // Active builder mode: 'builder' | 'freeform'
  const [editorMode, setEditorMode] = useState<'builder' | 'freeform'>('builder');

  // The actual final message formula/text
  const [broadcastText, setBroadcastText] = useState('');

  // Groups management
  const [availableGroups, setAvailableGroups] = useState(DEFAULT_GROUPS);
  const [selectedGroupNames, setSelectedGroupNames] = useState<string[]>([
    'قروب مندوبي البحرين 🇧🇭',
    'طلبات التوصيل - المنامة والمحرق',
    'شبكة مناديب التوصيل السريع'
  ]);
  const [groupSearch, setGroupSearch] = useState('');
  const [newGroupName, setNewGroupName] = useState('');

  // Published history
  const [broadcastHistory, setBroadcastHistory] = useState<OrderBroadcast[]>([]);
  const [copied, setCopied] = useState(false);

  // Replay (تم) Modal State
  const [replayItem, setReplayItem] = useState<OrderBroadcast | null>(null);
  const [replayText, setReplayText] = useState('');
  const [replayTargetGroups, setReplayTargetGroups] = useState<string[]>([]);
  const [repliedGroups, setRepliedGroups] = useState<string[]>([]);
  const [replayCopied, setReplayCopied] = useState(false);
  const [replayIncludeQuote, setReplayIncludeQuote] = useState<boolean>(filter.broadcastIncludeQuote ?? true);
  const [replayDoneWord, setReplayDoneWord] = useState<string>(filter.broadcastDefaultDoneText || '(تم) ✅');
  const [isSavedAsDefault, setIsSavedAsDefault] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('orderi_broadcast_history');
      if (savedHistory) {
        setBroadcastHistory(JSON.parse(savedHistory));
      }
      const savedCustomGroups = localStorage.getItem('orderi_custom_broadcast_groups');
      if (savedCustomGroups) {
        setAvailableGroups(JSON.parse(savedCustomGroups));
      }
    } catch {}
  }, []);

  // Listen to external request to open replay modal
  useEffect(() => {
    if (initialReplayBroadcastId && broadcastHistory.length > 0) {
      const target = broadcastHistory.find((b) => b.id === initialReplayBroadcastId);
      if (target) {
        handleOpenReplayModal(target);
      }
      onClearInitialReplayBroadcastId?.();
    }
  }, [initialReplayBroadcastId, broadcastHistory]);

  // Update default text when builder fields change
  useEffect(() => {
    if (editorMode === 'builder') {
      generateFormattedText();
    }
  }, [pickupArea, deliveryArea, price, timing, phone, notes]);

  const generateFormattedText = () => {
    const formatted = `🚀 *طلب توصيل جديد* 🇧🇭
📍 *الاستلام من:* ${pickupArea}
🏁 *التسليم إلى:* ${deliveryArea}
💰 *السعر:* ${price} د.ب
⏱️ *التوقيت:* ${timing}
📞 *للتواصل:* ${phone ? phone : 'واتساب مباشر'}
${notes ? `📝 *ملاحظات:* ${notes}` : ''}

#مطلوب_مندوب #توصيل_البحرين #دليفري`;

    setBroadcastText(formatted);
  };

  // Preset templates
  const applyPresetTemplate = (type: 'instant' | 'gift' | 'errand' | 'courier_available') => {
    setEditorMode('freeform');
    if (type === 'instant') {
      setBroadcastText(`🚀 *طلب توصيل فوري ومستعجل* 🇧🇭
📍 *من:* ${pickupArea || 'المنامة'}
🏁 *إلى:* ${deliveryArea || 'المحرق'}
💰 *السعر:* 3.5 د.ب
⏱️ *الوقت:* الآن فوري
📞 *واتساب:* ${phone || '3XXXXXXX'}
#مطلوب_مندوب_فوري #توصيل_مستعجل`);
    } else if (type === 'gift') {
      setBroadcastText(`🎁 *طلب توصيل هدايا / ورد / كيك* 🌸
📍 *استلام:* ${pickupArea || 'السيف'}
🏁 *تسليم:* ${deliveryArea || 'الرفاع'}
💰 *السعر:* 4.0 د.ب
⚠️ *تنبيه:* يرجى الحفاظ على البضاعة وتوصيل بعناية وتكييف
📞 *للتواصل:* ${phone || '3XXXXXXX'}
#توصيل_هدايا #بحرين`);
    } else if (type === 'errand') {
      setBroadcastText(`📦 *مشوار استلام بضاعة وفواتير*
📍 *الموقع الأول:* ${pickupArea || 'توبلي'}
🏁 *الموقع الثاني:* ${deliveryArea || 'مدينة عيسى'}
💰 *السعر:* 3.0 د.ب
📞 *للتواصل السريع:* ${phone || '3XXXXXXX'}
#مشاوير_البحرين`);
    } else if (type === 'courier_available') {
      setBroadcastText(`🚗 *مندوب توصيل متاح الآن* 🇧🇭
📍 *موقعي الحالي:* ${driverLocation?.areaName || 'المنامة'}
🌐 *جاهز للتوصيل إلى:* جميع مناطق البحرين
⏱️ *الاستلام:* فوري
📞 *تواصل واتساب أو اتصال:* ${phone || '3XXXXXXX'}
#مندوب_توصيل #متاح_للتوصيل`);
    }
  };

  // Group selection handlers
  const handleToggleGroup = (name: string) => {
    if (selectedGroupNames.includes(name)) {
      setSelectedGroupNames(selectedGroupNames.filter((n) => n !== name));
    } else {
      setSelectedGroupNames([...selectedGroupNames, name]);
    }
  };

  const handleSelectAllGroups = () => {
    setSelectedGroupNames(availableGroups.map((g) => g.name));
  };

  const handleClearAllGroups = () => {
    setSelectedGroupNames([]);
  };

  const handleAddCustomGroup = () => {
    const trimmed = newGroupName.trim();
    if (!trimmed) return;
    if (availableGroups.some((g) => g.name === trimmed)) {
      onToast('القروب موجود بالفعل');
      return;
    }
    const updated = [
      ...availableGroups,
      { id: 'custom-' + Date.now(), name: trimmed, category: 'مخصص' }
    ];
    setAvailableGroups(updated);
    setSelectedGroupNames([...selectedGroupNames, trimmed]);
    setNewGroupName('');
    try {
      localStorage.setItem('orderi_custom_broadcast_groups', JSON.stringify(updated));
    } catch {}
    onToast(`تمت إضافة القروب: "${trimmed}"`);
  };

  const handleDeleteCustomGroup = (id: string, name: string) => {
    const updated = availableGroups.filter((g) => g.id !== id);
    setAvailableGroups(updated);
    setSelectedGroupNames(selectedGroupNames.filter((n) => n !== name));
    try {
      localStorage.setItem('orderi_custom_broadcast_groups', JSON.stringify(updated));
    } catch {}
    onToast('تم حذف القروب');
  };

  // Publish to WhatsApp Action
  const handlePublishToWhatsApp = () => {
    if (!broadcastText.trim()) {
      onToast('يرجى كتابة نص الإعلان أولاً');
      return;
    }

    // 1. Copy text to clipboard automatically for hassle-free pasting in multiple groups
    navigator.clipboard.writeText(broadcastText);

    // 2. Open WhatsApp Web/Mobile sharing intent with encoded message
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(broadcastText)}`;
    window.open(waUrl, '_blank');

    // 3. Save to broadcast history
    const newBroadcast: OrderBroadcast = {
      id: 'bcast-' + Date.now(),
      text: broadcastText,
      targetGroups: [...selectedGroupNames],
      createdAt: new Date().toLocaleString('ar-BH'),
      from: pickupArea,
      to: deliveryArea,
      price: parseFloat(price) || 0,
      phone,
      isCompleted: false,
    };

    const updatedHistory = [newBroadcast, ...broadcastHistory.slice(0, 19)];
    setBroadcastHistory(updatedHistory);
    try {
      localStorage.setItem('orderi_broadcast_history', JSON.stringify(updatedHistory));
    } catch {}

    onToast('🚀 تم نسخ النص وفتح واتساب للنشر في القروبات المختارة!');
  };

  // Build formatted replay message
  const buildReplayMessage = (
    broadcast: OrderBroadcast,
    preset: 'full_quote' | 'done_only' | 'done_details' | 'saved_template',
    customWord?: string,
    includeQuote?: boolean
  ) => {
    const raw = broadcast.text.trim();
    const quoted = raw ? '> ' + raw.replace(/\n/g, '\n> ') : '';
    const word = customWord !== undefined ? customWord : (filter.broadcastDefaultDoneText || '(تم) ✅');
    const withQuote = includeQuote !== undefined ? includeQuote : (filter.broadcastIncludeQuote ?? true);

    if (preset === 'done_only') {
      return word;
    }

    if (preset === 'done_details') {
      const detailsMsg = `${word} تم توفير مندوب لتوصيل الطلب من [${broadcast.from || 'منطقة الاستلام'}] إلى [${broadcast.to || 'منطقة التسليم'}]. شكراً لكم جميعاً!`;
      return withQuote && quoted ? `${detailsMsg}\n\n${quoted}` : detailsMsg;
    }

    if (preset === 'saved_template' && filter.broadcastReplayTemplate) {
      return filter.broadcastReplayTemplate
        .replace(/{doneText}/g, word)
        .replace(/{quote}/g, withQuote && quoted ? quoted : '')
        .replace(/{from}/g, broadcast.from || 'البحرين')
        .replace(/{to}/g, broadcast.to || 'البحرين')
        .replace(/{price}/g, broadcast.price ? `${broadcast.price} د.ب` : '')
        .replace(/{rawText}/g, raw);
    }

    // Default full quote
    const closing = `تم العثور على مندوب لتوصيل هذا الطلب، شكراً لكم جميعاً! يرجى التوقف عن التواصل.`;
    if (withQuote && quoted) {
      return `${word}\n\n${quoted}\n\n${closing}`;
    }
    return `${word} ${closing}`;
  };

  // Open Replay (تم) Modal
  const handleOpenReplayModal = (broadcast: OrderBroadcast) => {
    const initialPreset = filter.broadcastReplayTemplate ? 'saved_template' : 'full_quote';
    const initialText = broadcast.replyTextSent || buildReplayMessage(broadcast, initialPreset);

    setReplayItem(broadcast);
    setReplayText(initialText);
    setReplayTargetGroups(broadcast.targetGroups && broadcast.targetGroups.length > 0 ? broadcast.targetGroups : ['قروبات الواتساب']);
    setRepliedGroups(broadcast.repliedGroups || []);
    setReplayIncludeQuote(filter.broadcastIncludeQuote ?? true);
    setReplayDoneWord(filter.broadcastDefaultDoneText || '(تم) ✅');
    setReplayCopied(false);
    setIsSavedAsDefault(false);
  };

  // Publish Replay (تم) to ALL target WhatsApp groups
  const handlePublishReplayToAllWhatsApp = async () => {
    if (!replayItem || !replayText.trim()) return;

    // 1. Copy replay text to clipboard for instant pasting anywhere
    navigator.clipboard.writeText(replayText);

    // 2. Open WhatsApp share link with encoded message
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(replayText)}`;
    window.open(waUrl, '_blank');

    // 3. Mark all target groups as replied & completed
    const allGroups = replayTargetGroups.length > 0 ? replayTargetGroups : ['قروبات الواتساب'];
    const updatedHistory = broadcastHistory.map((item) => {
      if (item.id === replayItem.id) {
        return {
          ...item,
          isCompleted: true,
          completedAt: new Date().toLocaleTimeString('ar-BH', { hour: '2-digit', minute: '2-digit' }),
          repliedGroups: allGroups,
          replyTextSent: replayText,
        };
      }
      return item;
    });

    setBroadcastHistory(updatedHistory);
    setRepliedGroups(allGroups);
    try {
      localStorage.setItem('orderi_broadcast_history', JSON.stringify(updatedHistory));
    } catch {}

    // 4. Also notify server via webhook/SSE
    fetch('/api/whatsapp/broadcast-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        broadcastId: replayItem.id,
        replyText: replayText,
        targetGroups: allGroups,
        originalText: replayItem.text,
      }),
    }).catch(() => {});

    onToast(`🚀 تم نسخ رد (تم) وفتح واتساب للنشر في كافة القروبات (${allGroups.length})!`);
  };

  // Send Replay to a single specific group
  const handleSendReplayToSingleGroup = (groupName: string) => {
    if (!replayItem || !replayText.trim()) return;

    // Copy to clipboard
    navigator.clipboard.writeText(replayText);

    // Open WhatsApp
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(replayText)}`;
    window.open(waUrl, '_blank');

    const updatedReplied = Array.from(new Set([...repliedGroups, groupName]));
    setRepliedGroups(updatedReplied);

    const isAllDone = replayTargetGroups.every((g) => updatedReplied.includes(g));

    const updatedHistory = broadcastHistory.map((item) => {
      if (item.id === replayItem.id) {
        return {
          ...item,
          isCompleted: isAllDone ? true : item.isCompleted,
          completedAt: isAllDone ? new Date().toLocaleTimeString('ar-BH', { hour: '2-digit', minute: '2-digit' }) : item.completedAt,
          repliedGroups: updatedReplied,
          replyTextSent: replayText,
        };
      }
      return item;
    });

    setBroadcastHistory(updatedHistory);
    try {
      localStorage.setItem('orderi_broadcast_history', JSON.stringify(updatedHistory));
    } catch {}

    onToast(`تم نسخ الرد وفتح واتساب لإرساله إلى: "${groupName}"`);
  };

  // Save current replay text as permanent default in settings
  const handleSaveAsDefaultReplay = () => {
    if (!replayText.trim()) return;

    if (onUpdateFilter) {
      const updatedFilter: OrderFilter = {
        ...filter,
        broadcastReplayTemplate: replayText,
        broadcastDefaultDoneText: replayDoneWord,
        broadcastIncludeQuote: replayIncludeQuote,
      };
      onUpdateFilter(updatedFilter);
      setIsSavedAsDefault(true);
      setTimeout(() => setIsSavedAsDefault(false), 3000);
      onToast('⭐ تم حفظ هذه الصيغة كإعداد رد افتراضي دائم لجميع إعلاناتك القادمة!');
    } else {
      localStorage.setItem('orderi_default_replay_text', replayText);
      setIsSavedAsDefault(true);
      setTimeout(() => setIsSavedAsDefault(false), 3000);
      onToast('تم حفظ صيغة الرد الافتراضية بنجاح');
    }
  };

  // Replay message presets
  const setReplayPreset = (type: 'quote_and_done' | 'done_only' | 'done_thanks' | 'custom_template') => {
    if (!replayItem) return;

    if (type === 'quote_and_done') {
      setReplayText(buildReplayMessage(replayItem, 'full_quote', replayDoneWord, replayIncludeQuote));
    } else if (type === 'done_only') {
      setReplayText(buildReplayMessage(replayItem, 'done_only', replayDoneWord, false));
    } else if (type === 'done_thanks') {
      setReplayText(buildReplayMessage(replayItem, 'done_details', replayDoneWord, replayIncludeQuote));
    } else if (type === 'custom_template') {
      setReplayText(buildReplayMessage(replayItem, 'saved_template', replayDoneWord, replayIncludeQuote));
    }
  };

  // Copy only
  const handleCopyText = () => {
    if (!broadcastText.trim()) return;
    navigator.clipboard.writeText(broadcastText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onToast('تم نسخ نص الإعلان للحافظة بنجاح');
  };

  // Also add this order into the local radar feed
  const handleAddToMyRadar = () => {
    const parsedPrice = parseFloat(price) || 3.0;
    const match = evaluateOrderMatch(
      pickupArea,
      deliveryArea,
      parsedPrice,
      filter,
      driverLocation
    );

    const order: ParsedOrder = {
      id: 'broadcast-mine-' + Date.now(),
      from: pickupArea,
      to: deliveryArea,
      price: parsedPrice,
      rawText: broadcastText,
      groupName: selectedGroupNames[0] || 'إعلاني المنشور',
      senderName: 'أنا (معلن)',
      senderPhone: phone || '3XXXXXXX',
      receivedAt: new Date(),
      confidence: 100,
      type: 'إعلاني الخاص',
      notes,
      status: 'pending',
      match,
    };

    onAddOrderToRadar(order);
    onToast('✅ تم إدراج إعلانك أيضاً في رادارك المحلي للمتابعة');
  };

  const filteredGroups = availableGroups.filter((g) =>
    g.name.includes(groupSearch) || g.category?.includes(groupSearch)
  );

  const activeWaitingBroadcasts = broadcastHistory.filter((b) => !b.isCompleted);

  return (
    <div className="space-y-4 sm:space-y-8 animate-in fade-in duration-300 w-full max-w-full overflow-x-hidden min-w-0">
      
      {/* Top Banner / Header */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-xl shadow-emerald-700/15 flex flex-col md:flex-row md:items-center justify-between gap-4 w-full max-w-full overflow-hidden">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-black tracking-tight truncate">نشر وإعلان طلب في قروبات الواتساب</h2>
              <p className="text-[11px] sm:text-xs text-emerald-100 font-medium">
                اكتب صيغة الطلب، اختر القروبات المستهدفة، وانشر رد (تم) فور العثور على مندوب
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleCopyText}
            className="min-h-[44px] flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-xs font-black transition-all border border-white/20 shadow-2xs backdrop-blur-md active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'تم النسخ!' : 'نسخ النص'}</span>
          </button>

          <button
            type="button"
            onClick={handlePublishToWhatsApp}
            className="min-h-[44px] flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-900 text-xs font-black transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            <Send className="w-4 h-4 text-emerald-600" />
            <span>نشر في الواتساب الآن 🚀</span>
          </button>
        </div>
      </div>

      {/* Active Broadcasts Waiting For Courier (اذا حصلت مندوب انشر تم) */}
      {activeWaitingBroadcasts.length > 0 && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-50 to-emerald-50 border-2 border-amber-300/80 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-200/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Clock className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black text-amber-950 flex items-center gap-2">
                  <span>طلبات معلنة بانتظار مندوب ({activeWaitingBroadcasts.length})</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-extrabold">قيد الانتظار</span>
                </h3>
                <p className="text-[11px] text-amber-800 font-medium">
                  هل وافق مندوب على طلبك؟ اضغط "حصلت مندوب (رد: تم)" لنشر الرد بنفس القروبات فوراً!
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {activeWaitingBroadcasts.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-white border border-amber-200 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-black">
                    <span className="text-slate-900 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{item.from} ← {item.to}</span>
                    </span>
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                      {item.price} د.ب
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 line-clamp-2 font-mono bg-slate-50 p-2 rounded-xl border border-slate-100">
                    {item.text}
                  </p>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                    <Users className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <span className="truncate">
                      نُشر في: <strong className="text-purple-950 font-bold">{item.targetGroups.join('، ')}</strong>
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenReplayModal(item)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <Reply className="w-4 h-4" />
                    <span>حصلت مندوب (انشر: تم) 🎯</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(item.text);
                      onToast('تم نسخ نص الإعلان الأصلي');
                    }}
                    title="نسخ نص الإعلان"
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main 2-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: 1. Formulation & Message Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-5">
            
            {/* Mode Switcher */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">صيغة إعلان الطلب</h3>
                  <p className="text-[11px] text-slate-500">اختر الطريقة الأنسب لك لصياغة نص الإعلان</p>
                </div>
              </div>

              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setEditorMode('builder');
                    generateFormattedText();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    editorMode === 'builder'
                      ? 'bg-white text-blue-700 shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  المنشئ السريع ⚡
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode('freeform')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    editorMode === 'freeform'
                      ? 'bg-white text-blue-700 shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  المحرر الحر ✍️
                </button>
              </div>
            </div>

            {/* Quick Presets Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none">
              <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap pl-1">قوالب جاهزة:</span>
              <button
                type="button"
                onClick={() => applyPresetTemplate('instant')}
                className="min-h-[36px] px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-200 transition-colors whitespace-nowrap active:scale-95"
              >
                ⚡ طلب مستعجل
              </button>
              <button
                type="button"
                onClick={() => applyPresetTemplate('gift')}
                className="min-h-[36px] px-3 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-800 text-[11px] font-bold border border-pink-200 transition-colors whitespace-nowrap active:scale-95"
              >
                🌸 باقة ورد وهدايا
              </button>
              <button
                type="button"
                onClick={() => applyPresetTemplate('errand')}
                className="min-h-[36px] px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-[11px] font-bold border border-indigo-200 transition-colors whitespace-nowrap active:scale-95"
              >
                📦 مشوار بضاعة
              </button>
              <button
                type="button"
                onClick={() => applyPresetTemplate('courier_available')}
                className="min-h-[36px] px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 transition-colors whitespace-nowrap active:scale-95"
              >
                🚗 مندوب متاح الآن
              </button>
            </div>

            {/* Builder Mode Input Fields */}
            {editorMode === 'builder' && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                
                {/* From & To Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      <span>مكان الاستلام (من)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        list="bahrain-areas-list-from"
                        value={pickupArea}
                        onChange={(e) => setPickupArea(e.target.value)}
                        placeholder="مثلاً: المحرق، المنامة، السيف"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20"
                      />
                      <datalist id="bahrain-areas-list-from">
                        {BAHRAIN_AREAS.map((a) => (
                          <option key={'from-' + a.id} value={a.name} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-purple-600" />
                      <span>مكان التسليم (إلى)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        list="bahrain-areas-list-to"
                        value={deliveryArea}
                        onChange={(e) => setDeliveryArea(e.target.value)}
                        placeholder="مثلاً: الرفاع، سار، مدينة عيسى"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20"
                      />
                      <datalist id="bahrain-areas-list-to">
                        {BAHRAIN_AREAS.map((a) => (
                          <option key={'to-' + a.id} value={a.name} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                </div>

                {/* Price, Timing & Phone Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* Price */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-emerald-600" />
                      <span>السعر (د.ب)</span>
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        max="50"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-900 focus:ring-2 focus:ring-blue-500/20"
                      />
                      <div className="flex gap-1">
                        {['2.5', '3.0', '3.5'].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setPrice(p)}
                            className={`px-1.5 py-1 text-[10px] font-bold rounded-lg border transition-colors ${
                              price === p ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Timing */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>وقت التوصيل</span>
                    </label>
                    <select
                      value={timing}
                      onChange={(e) => setTiming(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="فوري ⚡">فوري ⚡</option>
                      <option value="خلال ساعة">خلال ساعة</option>
                      <option value="اليوم قبل المساء">اليوم قبل المساء</option>
                      <option value="غداً صباحاً">غداً صباحاً</option>
                    </select>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      <span>رقم التواصل</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="39XXXXXX"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                {/* Notes Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">ملاحظات إضافية على الطلب</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="مثال: كرتون خفيف، باقة ورد، حلويات مبردة، استلام مبلغ..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            )}

            {/* The Textarea Editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">النص النهائي للإعلان (قابل للتعديل بحرية):</label>
                <div className="text-[11px] text-slate-400 font-semibold">
                  {broadcastText.length} حرف • {broadcastText.split(/\s+/).filter(Boolean).length} كلمة
                </div>
              </div>

              <textarea
                rows={7}
                value={broadcastText}
                onChange={(e) => {
                  setBroadcastText(e.target.value);
                  if (editorMode !== 'freeform') setEditorMode('freeform');
                }}
                placeholder="اكتب صيغة الإعلان هنا..."
                className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white text-sm font-bold text-slate-900 leading-relaxed focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-sans"
              />

              {/* Quick Hashtags */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-400">إضافة وسوم سريعة:</span>
                {['#مطلوب_مندوب', '#توصيل_فوري', '#توصيل_البحرين', '#مندوب_متاح'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setBroadcastText(prev => prev.trim() + '\n' + tag)}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Realistic WhatsApp Chat Bubble Preview */}
            <div className="pt-2">
              <div className="text-[11px] font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>معاينة الرسالة كما ستظهر في مجموعات واتساب:</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#ECE5DD] border border-slate-200 shadow-inner flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-tr-none bg-[#DCF8C6] text-slate-900 p-3.5 shadow-sm text-xs font-sans leading-relaxed whitespace-pre-wrap relative">
                  {broadcastText || 'اكتب شيئاً ليظهر هنا...'}
                  <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-slate-500">
                    <span>{new Date().toLocaleTimeString('ar-BH', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-blue-500 font-bold">✓✓</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: 2. WhatsApp Groups Selection & Publish Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            
            {/* Groups Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">القروبات المراد النشر فيها</h3>
                  <p className="text-[11px] text-slate-500">اختر القروبات التي ترغب بالنشر إليها</p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 font-black text-xs border border-purple-200">
                {selectedGroupNames.length} محدد
              </span>
            </div>

            {/* Quick Bulk Select Buttons */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={handleSelectAllGroups}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-colors"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>تحديد كل القروبات</span>
              </button>

              <button
                type="button"
                onClick={handleClearAllGroups}
                className="py-1.5 px-3 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-700 text-xs font-bold transition-colors"
              >
                إلغاء التحديد
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
                placeholder="ابحث بالاسم أو الفئة..."
                className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            {/* Add Custom Group Name */}
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomGroup();
                  }
                }}
                placeholder="أضف اسم قروب إضافي..."
                className="flex-1 px-3 py-2 rounded-xl border border-dashed border-slate-300 text-xs font-bold text-slate-800 bg-slate-50/60 focus:bg-white focus:border-purple-400"
              />
              <button
                type="button"
                onClick={handleAddCustomGroup}
                disabled={!newGroupName.trim()}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة</span>
              </button>
            </div>

            {/* Groups Scrollable List */}
            <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
              {filteredGroups.map((grp) => {
                const isChecked = selectedGroupNames.includes(grp.name);
                const isCustom = grp.id.startsWith('custom-');

                return (
                  <div
                    key={grp.id}
                    onClick={() => handleToggleGroup(grp.name)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                      isChecked ? 'bg-purple-50/60 hover:bg-purple-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                        isChecked ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className={`text-xs font-bold ${isChecked ? 'text-purple-950 font-black' : 'text-slate-800'}`}>
                        {grp.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {grp.category && (
                        <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 rounded-md bg-slate-100">
                          {grp.category}
                        </span>
                      )}
                      {isCustom && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCustomGroup(grp.id, grp.name);
                          }}
                          className="p-1 rounded-md text-slate-300 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Big Action Buttons Card */}
            <div className="pt-4 border-t border-slate-100 space-y-2.5">
              
              <button
                type="button"
                onClick={handlePublishToWhatsApp}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-black transition-all shadow-md shadow-emerald-600/20 hover:shadow-lg active:scale-[0.99]"
              >
                <Send className="w-5 h-5" />
                <span>نشر في القروبات عبر الواتساب الآن</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ نص الإعلان</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddToMyRadar}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-black transition-colors border border-blue-200/60"
                  title="إدراج هذا الإعلان في راداري المحلي لمتابعة توافقه"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>إدراجه براداري</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-[11px] text-emerald-800 leading-relaxed font-semibold">
                💡 <span className="font-bold">طريقة النشر:</span> عند الضغط على "نشر في القروبات"، يتم نسخ النص فوراً إلى حافظتك وفتح واتساب، لتقوم باختيار المجموعات وتوجيهه إليها فوراً بدون عناء إعادة الكتابة.
              </div>

            </div>

          </div>

          {/* Broadcasts History Log */}
          {broadcastHistory.length > 0 && (
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-500" />
                  <h4 className="text-xs font-black text-slate-800">إعلانات سابقة تم نشرها</h4>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setBroadcastHistory([]);
                    localStorage.removeItem('orderi_broadcast_history');
                  }}
                  className="text-[11px] text-slate-400 hover:text-rose-600 font-bold"
                >
                  مسح السجل
                </button>
              </div>

              <div className="space-y-2.5 max-h-[280px] overflow-y-auto">
                {broadcastHistory.slice(0, 8).map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border text-xs space-y-2 transition-colors ${
                      item.isCompleted 
                        ? 'bg-emerald-50/40 border-emerald-200/80' 
                        : 'bg-slate-50 border-slate-200/70 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-800 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        {item.from} ← {item.to} ({item.price} د.ب)
                      </span>
                      <div className="flex items-center gap-1.5">
                        {item.isCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>(تم) منجز</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-850 text-[10px] font-extrabold">
                            <Clock className="w-2.5 h-2.5 text-amber-600" />
                            <span>بانتظار مندوب</span>
                          </span>
                        )}
                        <span className="text-slate-400 font-medium">{item.createdAt}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-700 line-clamp-1 font-mono">
                      {item.text.replace(/\n/g, ' ')}
                    </p>

                    {item.targetGroups && item.targetGroups.length > 0 && (
                      <div className="text-[10px] text-slate-500 truncate">
                        القروبات: <span className="font-semibold text-slate-700">{item.targetGroups.join('، ')}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleOpenReplayModal(item)}
                        className={`text-[11px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all shadow-2xs ${
                          item.isCompleted 
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        <Reply className="w-3 h-3" />
                        <span>{item.isCompleted ? 'إعادة إرسال (تم)' : 'حصلت مندوب (رد: تم) 🎯'}</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setBroadcastText(item.text);
                            setEditorMode('freeform');
                            onToast('تم استرجاع نص الإعلان للمحرر');
                          }}
                          className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>استرجاع</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(item.text);
                            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(item.text)}`, '_blank');
                          }}
                          className="text-[11px] font-bold text-slate-600 hover:text-emerald-700 hover:underline flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>إعادة نشر</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Modal: Replay (تم) in Same Groups */}
      {replayItem && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setReplayItem(null)}
        >
          <div 
            className="w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Sheet Drag Handle */}
            <div className="sm:hidden w-10 h-1.5 bg-slate-300 rounded-full mx-auto -mt-2 mb-3" />
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0">
                  <Reply className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <span>نشر رد (تم) في كافة قروبات الإعلان</span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold">
                      {replayTargetGroups.length} قروبات
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    إشعار سريع لجميع المناديب والقروبات بأنك حصلت على مندوب لتفادي الاتصالات المتكررة
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReplayItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Groups Dispatcher Status Card */}
            <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-black text-purple-950">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>القروبات التي تم نشر هذا الطلب فيها ({replayTargetGroups.length}):</span>
                </div>
                <span className="text-[11px] font-black text-purple-700">
                  {repliedGroups.length} من {replayTargetGroups.length} مكتمل
                </span>
              </div>

              {/* Multi-Group Quick Action List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                {replayTargetGroups.map((grpName, idx) => {
                  const isSent = repliedGroups.includes(grpName);
                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-colors ${
                        isSent 
                          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' 
                          : 'bg-white border-purple-200/70 text-slate-800 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                          isSent ? 'bg-emerald-600 text-white' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {isSent ? <Check className="w-2.5 h-2.5" /> : <span className="text-[9px] font-bold">{idx + 1}</span>}
                        </div>
                        <span className="font-bold text-xs truncate" title={grpName}>
                          {grpName}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSendReplayToSingleGroup(grpName)}
                        className={`text-[11px] font-bold px-2 py-1 rounded-lg shrink-0 flex items-center gap-1 transition-all ${
                          isSent
                            ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                            : 'bg-purple-600 hover:bg-purple-700 text-white shadow-2xs'
                        }`}
                      >
                        {isSent ? (
                          <>
                            <CheckCheck className="w-3 h-3" />
                            <span>تم الإرسال</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3 h-3" />
                            <span>إرسال رد (تم)</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              <p className="text-[11px] text-purple-900/80 font-medium">
                💡 يمكنك إرسال الرد لكل قروب على حدة، أو الضغط على الزر الأخضر بالأسفل لنشر الرد لجميع القروبات فوراً.
              </p>
            </div>

            {/* Custom Pre-configured Done Wording ("نص يمكن تحديده مسبقاً") */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                  <span>تحديد صيغة الرد السريعة:</span>
                </label>

                {/* Save as default permanent template button */}
                <button
                  type="button"
                  onClick={handleSaveAsDefaultReplay}
                  className={`text-[11px] font-bold flex items-center gap-1.5 px-3 py-1 rounded-xl transition-all ${
                    isSavedAsDefault
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                  title="حفظ هذا النص كصيغة رد افتراضية تلقائية لكل إعلاناتك المستقبلية"
                >
                  <BookmarkCheck className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isSavedAsDefault ? 'تم الحفظ كإعداد دائم!' : 'حفظ كصيغة رد مسبقة دائمة'}</span>
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setReplayPreset('quote_and_done')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors border border-emerald-200 shadow-2xs flex items-center gap-1"
                >
                  <span>(تم) + اقتباس الإعلان الأصلي</span>
                  <span className="text-[10px] bg-emerald-200 px-1 rounded font-black">موصى به</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReplayPreset('done_only')}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors border border-slate-200"
                >
                  (تم) فقط
                </button>
                <button
                  type="button"
                  onClick={() => setReplayPreset('done_thanks')}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors border border-slate-200"
                >
                  (تم) مع تفاصيل المسار
                </button>
                {filter.broadcastReplayTemplate && (
                  <button
                    type="button"
                    onClick={() => setReplayPreset('custom_template')}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold transition-colors border border-blue-200"
                  >
                    ⭐ قالبي المعتمد مسبقاً
                  </button>
                )}
              </div>

              {/* Textarea for Exact Reply Message */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-600">نص الرد الذي سيتم إرساله (يمكنك التعديل بحرية):</label>
                  <span className="text-[10px] text-slate-400 font-semibold">{replayText.length} حرف</span>
                </div>
                <textarea
                  value={replayText}
                  onChange={(e) => setReplayText(e.target.value)}
                  rows={5}
                  className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs font-mono text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500/20 leading-relaxed shadow-inner"
                  placeholder="اكتب رد (تم)..."
                />
              </div>

              {/* WhatsApp Bubble Preview */}
              <div className="p-3.5 rounded-2xl bg-[#ECE5DD] border border-slate-200 space-y-1 shadow-inner">
                <span className="text-[10px] font-bold text-slate-500 block">معاينة الرد كما يظهر لأعضاء قروب الواتساب:</span>
                <div className="bg-[#DCF8C6] text-slate-900 p-3 rounded-xl rounded-tr-none shadow-xs text-xs space-y-2 max-w-md ml-auto">
                  <div className="border-r-4 border-emerald-600 pr-2 pl-1 py-1 bg-white/70 text-[11px] text-slate-600 rounded font-mono">
                    <span className="text-[10px] text-emerald-800 font-bold block mb-0.5">📌 رد على منشورك:</span>
                    {replayItem.text.slice(0, 110)}...
                  </div>
                  <div className="font-bold text-slate-950 whitespace-pre-wrap leading-relaxed">
                    {replayText}
                  </div>
                  <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500">
                    <span>{new Date().toLocaleTimeString('ar-BH', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-blue-500 font-bold">✓✓</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Master Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="button"
                onClick={handlePublishReplayToAllWhatsApp}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <Send className="w-4 h-4" />
                <span>🚀 نشر رد (تم) في كل القروبات ({replayTargetGroups.length}) الآن</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(replayText);
                  setReplayCopied(true);
                  setTimeout(() => setReplayCopied(false), 2000);
                  onToast('تم نسخ صيغة الرد (تم) للحافظة');
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                {replayCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{replayCopied ? 'تم النسخ!' : 'نسخ فقط'}</span>
              </button>

              <button
                type="button"
                onClick={() => setReplayItem(null)}
                className="w-full sm:w-auto py-3 px-4 rounded-2xl text-slate-500 hover:text-slate-800 text-xs font-bold hover:bg-slate-100"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
