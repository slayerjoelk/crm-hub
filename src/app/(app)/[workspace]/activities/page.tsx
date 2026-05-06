"use client";

import { useEffect, useState } from "react";
import { Search, Mail, Phone, CalendarDays, FileText, CheckSquare, TrendingUp, TrendingDown, User, Building2, MessageCircle, Plug, Activity as ActivityIcon, Plus, X } from "lucide-react";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  email: <Mail className="w-4 h-4" />,
  call: <Phone className="w-4 h-4" />,
  meeting: <CalendarDays className="w-4 h-4" />,
  note: <FileText className="w-4 h-4" />,
  task: <CheckSquare className="w-4 h-4" />,
  deal_created: <TrendingUp className="w-4 h-4" />,
  deal_stage_change: <TrendingUp className="w-4 h-4" />,
  deal_won: <TrendingUp className="w-4 h-4" />,
  deal_lost: <TrendingDown className="w-4 h-4" />,
  contact_created: <User className="w-4 h-4" />,
  contact_updated: <User className="w-4 h-4" />,
  company_created: <Building2 className="w-4 h-4" />,
  company_updated: <Building2 className="w-4 h-4" />,
  sms: <MessageCircle className="w-4 h-4" />,
  whatsapp: <MessageCircle className="w-4 h-4" />,
  integration: <Plug className="w-4 h-4" />,
};

const TYPE_COLORS: Record<string, string> = {
  email: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  call: "bg-[#10b981]/[0.12] text-[#10b981] border-emerald-500/20",
  meeting: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  note: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  task: "bg-white/[0.04] text-[#8a8f98] border-white/[0.10]/20",
  deal_created: "bg-[#10b981]/[0.12] text-[#10b981] border-emerald-500/20",
  deal_stage_change: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  deal_won: "bg-[#10b981]/[0.12] text-[#10b981] border-emerald-500/20",
  deal_lost: "bg-red-500/10 text-red-400 border-red-500/20",
  contact_created: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  contact_updated: "bg-white/[0.04] text-[#8a8f98] border-white/[0.10]/20",
  company_created: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  company_updated: "bg-white/[0.04] text-[#8a8f98] border-white/[0.10]/20",
  sms: "bg-green-500/10 text-green-400 border-green-500/20",
  whatsapp: "bg-green-500/10 text-green-400 border-green-500/20",
  integration: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20",
};

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr); const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  if (isToday) return "Today"; if (isYesterday) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: "note", subject: "", body: "", durationMinutes: "", contactId: "" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/activities?q=${encodeURIComponent(search)}`).then(r => r.json()).then(r => setActivities(r.data ?? []));
  }, [search]);

  useEffect(() => {
    fetch(`/api/contacts`, { credentials: "include" }).then(r => r.json()).then(r => setContacts(r.data ?? []));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(null);
    const body: any = { ...form };
    if (body.durationMinutes) body.durationMinutes = parseInt(body.durationMinutes, 10);
    if (!body.durationMinutes || isNaN(body.durationMinutes)) body.durationMinutes = undefined;
    const res = await fetch("/api/activities", { credentials: "include", method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json().catch(() => ({ error: "Unknown" }));
    setSaving(false);
    if (!res.ok) { setError(json.error || "Failed to log activity"); return; }
    setShowModal(false);
    setForm({ type: "note", subject: "", body: "", durationMinutes: "", contactId: "" });
    setActivities(prev => [json.data, ...prev]);
  }

  const grouped: Record<string, any[]> = {};
  activities.forEach(a => { const key = formatDateLabel(a.createdAt); if (!grouped[key]) grouped[key] = []; grouped[key].push(a); });
  const dateKeys = Object.keys(grouped);

  const inputCls = "w-full h-10 px-3 rounded-lg bg-[#0f1011] border border-white/[0.06] text-sm text-[#d0d6e0] placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]/[0.3]";
  const labelCls = "block text-xs font-medium text-[#8a8f98] mb-1";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-[#f7f8f8]">Activities</h1><p className="text-[#62666d] text-sm mt-1">All interactions and events across your workspace</p></div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#5e6ad2] text-[#f7f8f8] text-sm font-medium hover:bg-[#5e6ad2] transition-colors"><Plus className="w-4 h-4" /> Log Activity</button>
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#62666d]" />
          <input type="text" placeholder="Search activities..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-[#0f1011] border border-white/[0.06] text-sm text-[#d0d6e0] placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
        </div>
      </div>

      <div className="space-y-6">
        {dateKeys.map(date => (
          <div key={date}>
            <div className="sticky top-0 z-10 bg-[#08090a]/90 backdrop-blur py-2 mb-3"><h3 className="text-xs font-semibold text-[#8a8f98] uppercase tracking-wider">{date}</h3></div>
            <div className="relative pl-6">
              <div className="absolute left-2 top-0 bottom-0 w-px bg-[#191a1b]"></div>
              <div className="space-y-3">
                {grouped[date].map(a => {
                  const icon = TYPE_ICONS[a.type] ?? <ActivityIcon className="w-4 h-4" />;
                  const color = TYPE_COLORS[a.type] ?? "bg-white/[0.04] text-[#8a8f98] border-white/[0.10]/20";
                  return (
                    <div key={a.id} className="relative flex gap-3 items-start">
                      <div className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center z-10 ${color}`}><div className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></div></div>
                      <div className="flex-1 rounded-xl border border-white/[0.06] bg-[#0f1011] p-3 hover:bg-[#191a1b]/40 transition-colors">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${color}`}>{icon}{a.type.replace(/_/g, " ")}</span>
                          <span className="text-[11px] text-[#62666d]">{new Date(a.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>
                          {a.durationMinutes && <span className="text-[11px] text-[#62666d]">{a.durationMinutes}m</span>}
                        </div>
                        <div className="text-sm text-[#d0d6e0]">{a.subject ? <span className="font-medium">{a.subject}</span> : a.body}</div>
                        {a.subject && a.body && <div className="text-xs text-[#62666d] mt-1">{a.body}</div>}
                        <div className="flex items-center gap-2 mt-2 text-[11px] text-[#62666d]">
                          {a.contactId && <span>👤 Contact</span>}{a.dealId && <span>💰 Deal</span>}{a.companyId && <span>🏢 Company</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <div className="rounded-xl border border-white/[0.06] bg-[#0f1011] p-12 text-center">
            <div className="text-3xl mb-2">📋</div><div className="text-[#d0d6e0] font-medium">No activities yet.</div>
            <button onClick={() => setShowModal(true)} className="mt-2 text-sm text-[#10b981] hover:underline">Log your first activity</button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-white/[0.06] bg-[#0f1011] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#10b981]/[0.12] text-[#10b981] flex items-center justify-center"><ActivityIcon className="w-4 h-4"/></div>
                <div><h2 className="text-sm font-semibold text-[#f7f8f8]">Log Activity</h2><p className="text-xs text-[#62666d]">Record an interaction</p></div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-[#191a1b] text-[#8a8f98]"><X className="w-4 h-4"/></button>
            </div>
            <form onSubmit={save} className="p-5 space-y-4">
              {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2">{error}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Type</label>
                  <select value={form.type} onChange={e=>setForm({...form, type:e.target.value})} className={`${inputCls} appearance-none`}>
                    {["note","email","call","meeting","task","sms","whatsapp"].map(s=> <option key={s} value={s} className="bg-[#0f1011]">{s}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>Duration (min)</label><input type="number" min="0" value={form.durationMinutes} onChange={e=>setForm({...form, durationMinutes:e.target.value})} className={inputCls} placeholder="15" /></div>
              </div>
              <div><label className={labelCls}>Subject</label><input value={form.subject} onChange={e=>setForm({...form, subject:e.target.value})} className={inputCls} placeholder="Quick catch-up call" /></div>
              <div><label className={labelCls}>Body / Notes</label><textarea value={form.body} onChange={e=>setForm({...form, body:e.target.value})} className={`${inputCls} h-20 py-2 resize-none`} placeholder="What happened..." rows={3} /></div>
              <div><label className={labelCls}>Related contact</label>
                <select value={form.contactId} onChange={e=>setForm({...form, contactId:e.target.value})} className={`${inputCls} appearance-none`}>
                  <option value="" className="bg-[#0f1011]">-- Optional --</option>
                  {contacts.map(c => <option key={c.id} value={c.id} className="bg-[#0f1011]">{c.firstName} {c.lastName}</option>)}
                </select>
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="h-9 px-4 rounded-lg border border-white/[0.06] text-[#8a8f98] text-sm font-medium hover:bg-[#191a1b] transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="h-9 px-4 rounded-lg bg-[#5e6ad2] text-[#f7f8f8] text-sm font-medium hover:bg-[#5e6ad2] transition-colors disabled:opacity-50 flex items-center gap-2">
                  {saving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>} Log Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
