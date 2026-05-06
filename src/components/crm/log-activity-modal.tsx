"use client";

import { useState } from "react";
import { X, Activity, Phone, Mail, CalendarDays, FileText, CheckSquare, Clock } from "lucide-react";

interface Props {
  entityType: "contact" | "deal" | "company" | "task";
  entityId: string;
  entityName?: string;
  onClose: () => void;
  onCreated: () => void;
}

const TYPES = [
  { value: "email", label: "Email", icon: Mail },
  { value: "call", label: "Call", icon: Phone },
  { value: "meeting", label: "Meeting", icon: CalendarDays },
  { value: "note", label: "Note", icon: FileText },
  { value: "task", label: "Task", icon: CheckSquare },
] as const;

const inputCls = "w-full h-10 px-3 rounded-lg bg-[#0f1011] border border-white/[0.06] text-sm text-[#d0d6e0] placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]/[0.3]";
const labelCls = "block text-xs font-medium text-[#62666d] mb-1";

export function LogActivityModal({ entityType, entityId, entityName, onClose, onCreated }: Props) {
  const [type, setType] = useState<typeof TYPES[number]["value"]>("note");
  const [body, setBody] = useState("");
  const [subject, setSubject] = useState("");
  const [duration, setDuration] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string|null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload: any = {
      type,
      body: body.trim(),
      subject: subject.trim() || null,
      durationMinutes: duration ? Number(duration) : null,
    };
    if (entityType === "contact") payload.contactId = entityId;
    if (entityType === "deal") payload.dealId = entityId;
    if (entityType === "company") payload.companyId = entityId;
    if (entityType === "task") payload.taskId = entityId;

    const res = await fetch("/api/activities", { credentials: "include",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { setError(json.error || "Failed to log activity"); return; }
    onCreated();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-[#0f1011] shadow-2xl">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
          <div className="w-8 h-8 rounded-lg bg-[#5e6ad2]/10 flex items-center justify-center"><Activity className="w-4 h-4 text-[#10b981]"/></div>
          <h2 className="text-lg font-semibold text-white">Log Activity</h2>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-[#191a1b] text-[#62666d]"><X className="w-4 h-4"/></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2">{error}</div>}
          {entityName && <div className="text-xs text-[#62666d]">For: <span className="text-[#8a8f98] font-medium">{entityName}</span></div>}

          <div className="flex gap-2 flex-wrap">
            {TYPES.map((t) => {
              const Icon = t.icon;
              return (
                <button type="button" key={t.value} onClick={() => setType(t.value)} className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium border transition-colors ${type === t.value ? "bg-[#10b981]/[0.12] text-[#10b981] border-emerald-500/30" : "bg-[#191a1b] text-[#8a8f98] border-white/[0.06] hover:bg-[#28282c]"}`}
                >
                  <Icon className="w-3.5 h-3.5" />{t.label}
                </button>
              );
            })}
          </div>

          {(type === "email" || type === "call" || type === "meeting") && (
            <div><label className={labelCls}>Subject / Title</label><input value={subject} onChange={e => setSubject(e.target.value)} className={inputCls} placeholder="e.g. Discovery call" /></div>
          )}

          <div><label className={labelCls}>Notes</label><textarea value={body} onChange={e => setBody(e.target.value)} rows={4} className={`${inputCls} h-auto py-3`} placeholder="What happened?" required /></div>

          {(type === "call" || type === "meeting") && (
            <div><label className={labelCls}>Duration (minutes)</label><input type="number" value={duration} onChange={e => setDuration(e.target.value)} className={inputCls} placeholder="30" /></div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="h-9 px-4 rounded-lg bg-[#191a1b] text-[#8a8f98] text-sm font-medium hover:bg-[#28282c] transition-colors">Cancel</button>
            <button type="submit" disabled={saving || !body.trim()} className="h-9 px-4 rounded-lg bg-[#5e6ad2] text-white text-sm font-medium hover:bg-[#5e6ad2] transition-colors disabled:opacity-50">{saving ? "Saving..." : "Log Activity"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
