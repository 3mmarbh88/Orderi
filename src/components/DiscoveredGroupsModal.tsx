import React, { useState } from 'react';
import { DiscoveredGroupLink } from '../types';
import { 
  Link as LinkIcon, 
  ExternalLink, 
  Plus, 
  Check, 
  X, 
  Copy, 
  Radio, 
  Search, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  User, 
  MessageSquare,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface DiscoveredGroupsModalProps {
  groups: DiscoveredGroupLink[];
  monitoredGroupNames: string[];
  onClose: () => void;
  onJoinGroup: (link: DiscoveredGroupLink) => void;
  onToggleMonitor: (link: DiscoveredGroupLink) => void;
  onDeleteGroup: (id: string) => void;
  onAddManualLink: (url: string, title?: string) => void;
}

export function DiscoveredGroupsModal({
  groups,
  monitoredGroupNames,
  onClose,
  onJoinGroup,
  onToggleMonitor,
  onDeleteGroup,
  onAddManualLink,
}: DiscoveredGroupsModalProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'joined' | 'monitored'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Manual Add Form State
  const [showAddManual, setShowAddManual] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [manualTitle, setManualTitle] = useState('');

  // Counters
  const newCount = groups.filter((g) => g.status === 'new').length;
  const joinedCount = groups.filter((g) => g.status === 'joined').length;
  const monitoredCount = groups.filter((g) => monitoredGroupNames.includes(g.title)).length;

  // Filtered list
  const filteredGroups = groups.filter((g) => {
    const isMonitored = monitoredGroupNames.includes(g.title);
    if (activeTab === 'new' && g.status !== 'new') return false;
    if (activeTab === 'joined' && g.status !== 'joined') return false;
    if (activeTab === 'monitored' && !isMonitored) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = g.title.toLowerCase().includes(q);
      const matchSource = g.sourceGroup.toLowerCase().includes(q);
      const matchSender = g.senderName.toLowerCase().includes(q);
      const matchText = g.rawText.toLowerCase().includes(q);
      return matchTitle || matchSource || matchSender || matchText;
    }
    return true;
  });

  const handleCopy = (link: DiscoveredGroupLink) => {
    navigator.clipboard.writeText(link.url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUrl.trim()) return;
    onAddManualLink(manualUrl.trim(), manualTitle.trim() || undefined);
    setManualUrl('');
    setManualTitle('');
    setShowAddManual(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black">صائد روابط قروبات التوصيل 🔗</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                  تلقائي بالرادار
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                التقاط فوري لروابط دعوة القروبات المنشورة بالواتساب للانضمام ومراقبتها
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar (Filters, Manual Add, Search) */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200/80 space-y-3 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            
            {/* Quick Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-200/70 text-xs font-bold text-slate-700">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  activeTab === 'all' ? 'bg-white text-slate-900 shadow-2xs font-black' : 'hover:text-slate-900'
                }`}
              >
                الكل ({groups.length})
              </button>

              <button
                onClick={() => setActiveTab('new')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
                  activeTab === 'new' ? 'bg-emerald-600 text-white shadow-2xs font-black' : 'hover:text-slate-900'
                }`}
              >
                <span>جديد لم تنضم</span>
                {newCount > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${activeTab === 'new' ? 'bg-white text-emerald-700' : 'bg-emerald-100 text-emerald-800'}`}>
                    {newCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('joined')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  activeTab === 'joined' ? 'bg-blue-600 text-white shadow-2xs font-black' : 'hover:text-slate-900'
                }`}
              >
                تم الانضمام ({joinedCount})
              </button>

              <button
                onClick={() => setActiveTab('monitored')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  activeTab === 'monitored' ? 'bg-purple-600 text-white shadow-2xs font-black' : 'hover:text-slate-900'
                }`}
              >
                مراقب بالرادار ({monitoredCount})
              </button>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>الرصد التلقائي نشط</span>
              </div>

              <button
                onClick={() => setShowAddManual(!showAddManual)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة رابط قروب ➕</span>
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم القروب، المرسل، أو القروب الذي نُشر فيه..."
              className="w-full pr-9 pl-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Manual Add Accordion Form */}
          {showAddManual && (
            <form onSubmit={handleAddSubmit} className="p-3.5 rounded-2xl bg-white border border-emerald-200 space-y-2.5 animate-in slide-in-from-top-2">
              <div className="flex items-center justify-between text-xs font-black text-slate-800">
                <span>إضافة رابط قروب واتساب يدوياً:</span>
                <span className="text-[10px] text-slate-400">مثال: chat.whatsapp.com/Jk99...</span>
              </div>
              <input
                type="url"
                required
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="https://chat.whatsapp.com/..."
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="اسم القروب (اختياري)..."
                  className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs shrink-0 cursor-pointer"
                >
                  حفظ وإضافة
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Groups List */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3">
          {filteredGroups.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-14 h-14 rounded-3xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <LinkIcon className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-black text-slate-700">لا توجد روابط قروبات في هذا القسم</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                أي شخص ينشر رابط دعوة لقروب واتساب في القروبات المفتوحة سيلتقطه الرادار فوراً، وينبهك لتنضم إليه وتراقبه.
              </p>
              <button
                onClick={() => setShowAddManual(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة رابط قروب يدوياً</span>
              </button>
            </div>
          ) : (
            filteredGroups.map((group) => {
              const isMonitored = monitoredGroupNames.includes(group.title);
              const isJoined = group.status === 'joined';

              return (
                <div
                  key={group.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    group.status === 'new'
                      ? 'bg-gradient-to-r from-emerald-50/70 via-white to-teal-50/40 border-emerald-300 shadow-xs'
                      : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    
                    {/* Left/Main Info */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-slate-900">
                          {group.title}
                        </span>

                        {group.status === 'new' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                            <span>جديد 🟢</span>
                          </span>
                        )}

                        {isJoined && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-blue-600" />
                            <span>تم الانضمام ✓</span>
                          </span>
                        )}

                        {isMonitored && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                            <Radio className="w-3 h-3 text-purple-600" />
                            <span>مراقب بالرادار 📡</span>
                          </span>
                        )}
                      </div>

                      {/* Source & Sender metadata */}
                      <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-y-1 gap-x-3">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-slate-400" />
                          <span>نُشر في:</span>
                          <span className="font-bold text-slate-700">{group.sourceGroup}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>بواسطة:</span>
                          <span className="font-bold text-slate-700">{group.senderName}</span>
                        </span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(group.capturedAt).toLocaleTimeString('ar-BH', { hour: '2-digit', minute: '2-digit' })}</span>
                        </span>
                      </div>

                      {/* Original text snippet */}
                      {group.rawText && (
                        <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 italic line-clamp-2">
                          "{group.rawText}"
                        </p>
                      )}

                      {/* Link URL & Copy */}
                      <div className="flex items-center gap-2 pt-0.5">
                        <code className="text-[11px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-xs">
                          {group.url}
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopy(group)}
                          title="نسخ الرابط للحافظة"
                          className="text-[11px] text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          {copiedId === group.id ? (
                            <span className="text-emerald-600 flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>تم النسخ!</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Copy className="w-3 h-3" />
                              <span>نسخ</span>
                            </span>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Actions Column */}
                    <div className="flex sm:flex-col items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      
                      {/* Join in WhatsApp */}
                      <button
                        type="button"
                        onClick={() => onJoinGroup(group)}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer ${
                          isJoined
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                        }`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{isJoined ? 'فتح في واتساب' : 'انضمام بالواتساب 📲'}</span>
                      </button>

                      {/* Toggle Radar Monitoring */}
                      <button
                        type="button"
                        onClick={() => onToggleMonitor(group)}
                        className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                          isMonitored
                            ? 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Radio className={`w-3.5 h-3.5 ${isMonitored ? 'text-purple-600' : 'text-slate-400'}`} />
                        <span>{isMonitored ? 'مراقب بالرادار ✓' : 'إضافة للرادار ➕'}</span>
                      </button>

                      {/* Delete / Dismiss */}
                      <button
                        type="button"
                        onClick={() => onDeleteGroup(group.id)}
                        title="حذف من السجل"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer self-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer info */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>الروابط تفتح مباشرة في تطبيق WhatsApp الرسمي لهاتفك بأمان تام.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
}
