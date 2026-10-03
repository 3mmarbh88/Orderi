import React from 'react';
import { DiscoveredGroupLink } from '../types';
import { 
  Link as LinkIcon, 
  ExternalLink, 
  Plus, 
  Check, 
  X, 
  Zap, 
  MessageSquare, 
  User, 
  Clock 
} from 'lucide-react';

interface NewGroupLinkPromptProps {
  groupLink: DiscoveredGroupLink;
  onJoinOnly: (link: DiscoveredGroupLink) => void;
  onMonitorOnly: (link: DiscoveredGroupLink) => void;
  onJoinAndMonitor: (link: DiscoveredGroupLink) => void;
  onDismiss: () => void;
}

export function NewGroupLinkPrompt({
  groupLink,
  onJoinOnly,
  onMonitorOnly,
  onJoinAndMonitor,
  onDismiss,
}: NewGroupLinkPromptProps) {
  return (
    <aside aria-label="رصد رابط قروب توصيل جديد" className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in slide-in-from-bottom duration-300">
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white shadow-2xl border-2 border-emerald-500/70 ring-4 ring-emerald-500/20 space-y-3.5 backdrop-blur-md">
        
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40">
                <LinkIcon className="w-5 h-5" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/30 text-emerald-300 border border-emerald-500/40">
                  رصد صائد القروبات 🔗
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>الآن</span>
                </span>
              </div>
              <h3 className="text-sm font-black text-white mt-0.5">
                رُصد رابط قروب توصيل جديد!
              </h3>
            </div>
          </div>

          <button
            onClick={onDismiss}
            aria-label="إغلاق التنبيه"
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Group Info Box */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-black text-emerald-300 leading-snug">
              {groupLink.title}
            </h4>
          </div>

          <div className="text-[11px] text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>نُشر في:</span>
              <span className="font-bold text-slate-200">{groupLink.sourceGroup}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>بواسطة:</span>
              <span className="font-bold text-slate-200">{groupLink.senderName}</span>
              {groupLink.senderPhone && (
                <span className="text-[10px] text-slate-400 font-mono">({groupLink.senderPhone})</span>
              )}
            </div>
          </div>

          {/* Raw snippet preview */}
          {groupLink.rawText && (
            <p className="text-[11px] text-slate-400 bg-black/30 p-2 rounded-xl border border-white/5 line-clamp-2 italic">
              "{groupLink.rawText}"
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          {/* Main Hero Action: Join & Monitor */}
          <button
            type="button"
            onClick={() => onJoinAndMonitor(groupLink)}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-[0.99] transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>انضمام للقروب ومراقبته بالرادار معاً ⚡</span>
          </button>

          {/* Secondary Individual Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onJoinOnly(groupLink)}
              className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700 active:scale-[0.99] transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>فتح في واتساب 📲</span>
            </button>

            <button
              type="button"
              onClick={() => onMonitorOnly(groupLink)}
              className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700 active:scale-[0.99] transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة للرادار فقط ➕</span>
            </button>
          </div>
        </div>

      </div>
    </aside>
  );
}
