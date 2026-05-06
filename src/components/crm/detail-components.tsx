"use client";

import { useState, useCallback } from "react";
import { Pencil, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface InlineEditProps {
  value: string | number | null;
  onSave: (val: string) => void | Promise<void>;
  type?: "text" | "email" | "tel" | "url" | "number";
  label?: string;
  placeholder?: string;
  className?: string;
}

export function InlineEdit({ value, onSave, type = "text", label, placeholder = "—", className = "" }: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value || ""));
  const [saving, setSaving] = useState(false);

  const startEdit = () => { setDraft(String(value || "")); setEditing(true); };
  const cancel = () => setEditing(false);
  
  const save = async () => {
    if (draft === String(value || "")) { setEditing(false); return; }
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") save();
    if (e.key === "Escape") cancel();
  };

  return (
    <div className={className}>
      {label && <label className="block text-[11px] font-medium text-muted uppercase tracking-wider mb-1">{label}</label>}
      <AnimatePresence mode="wait">
        {editing ? (
          <motion.div
            key="edit"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="flex items-center gap-1"
          >
            <input
              type={type}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={handleKey}
              autoFocus
              className="flex-1 h-8 px-2 rounded-md bg-elevated border border-white/[0.08] text-[13px] text-secondary focus:outline-none focus:ring-1 focus:ring-brand/30 focus:border-brand/20"
            />
            <motion.button whileTap={{ scale: 0.9 }} onClick={save} disabled={saving} className="w-7 h-7 rounded-md bg-success/10 text-success flex items-center justify-center hover:bg-success/20 transition-colors">
              <Check className="w-3.5 h-3.5" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={cancel} className="w-7 h-7 rounded-md bg-danger/10 text-danger flex items-center justify-center hover:bg-danger/20 transition-colors">
              <X className="w-3.5 h-3.5" />
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="display"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={startEdit}
            className="group flex items-center gap-2 cursor-pointer"
          >
            <span className="text-[13px] text-secondary truncate">{value || placeholder}</span>
            <Pencil className="w-3 h-3 text-faint opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Rich Timeline Component ─────────────────────────────────
interface TimelineItem {
  id: string;
  type: "email" | "call" | "meeting" | "note" | "task" | "deal" | "sms" | "whatsapp";
  body: string;
  createdAt: string;
  author?: { name: string; avatar?: string };
  metadata?: Record<string, string>;
}

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  email: { icon: "Mail", color: "#3b82f6", bg: "#3b82f615", label: "Email" },
  call: { icon: "Phone", color: "#10b981", bg: "#10b98115", label: "Call" },
  meeting: { icon: "Calendar", color: "#f59e0b", bg: "#f59e0b15", label: "Meeting" },
  note: { icon: "FileText", color: "#8b5cf6", bg: "#8b5cf615", label: "Note" },
  task: { icon: "CheckSquare", color: "#ef4444", bg: "#ef444415", label: "Task" },
  deal: { icon: "DollarSign", color: "#5e6ad2", bg: "#5e6ad215", label: "Deal" },
  sms: { icon: "MessageSquare", color: "#ec4899", bg: "#ec489915", label: "SMS" },
  whatsapp: { icon: "Smartphone", color: "#22c55e", bg: "#22c55e15", label: "WhatsApp" },
};

export function RichTimeline({ items, onItemClick }: { items: TimelineItem[]; onItemClick?: (item: TimelineItem) => void }) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-10 h-10 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-3">
          <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm text-muted">No activity yet.</p>
        <p className="text-[11px] text-faint mt-1">Log calls, emails, and notes to build a history.</p>
      </div>
    );
  }

  // Group by date
  const grouped = items.reduce((acc: Record<string, TimelineItem[]>, item) => {
    const date = new Date(item.createdAt).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  return (
    <div className="relative">
      <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-white/[0.08] via-white/[0.04] to-transparent" />
      <div className="space-y-6">
        {Object.entries(grouped).map(([date, dayItems]) => (
          <div key={date}>
            <div className="sticky top-0 bg-canvas/80 backdrop-blur-sm z-10 py-1 mb-2">
              <span className="text-[11px] font-medium text-faint uppercase tracking-wider ml-10">{date}</span>
            </div>
            <div className="space-y-1">
              {dayItems.map((item, i) => {
                const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.note;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => onItemClick?.(item)}
                    className="group flex gap-3 py-2 px-2 -mx-2 rounded-lg hover:bg-white/[0.02] cursor-pointer transition-colors"
                  >
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: config.bg }}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-elevated border border-white/[0.06] flex items-center justify-center">
                        <span className="text-[8px] font-bold" style={{ color: config.color }}>{config.label[0]}</span>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] text-secondary leading-snug">{item.body}</p>
                      {item.author && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="w-4 h-4 rounded-full bg-brand/20 flex items-center justify-center text-[8px] font-bold text-brand">
                            {item.author.name?.[0] || "?"}
                          </div>
                          <span className="text-[11px] text-faint">{item.author.name}</span>
                        </div>
                      )}
                      {item.metadata && Object.keys(item.metadata).length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          {Object.entries(item.metadata).map(([k, v]) => (
                            <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.03] text-faint border border-white/[0.04]">
                              {k}: <span className="text-muted">{v}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0">
                      <span className="text-[11px] text-faint">
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
