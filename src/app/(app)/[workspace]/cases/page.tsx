"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LifeBuoy, Plus, X, CheckCircle2, AlertTriangle, Trash2 } from "lucide-react";

const STATUS: Record<string, string> = {
  new: "bg-[#3b82f6]/10 text-[#60a5fa] border-[#3b82f6]/20",
  open: "bg-[#5e6ad2]/12 text-[#9aa4f2] border-[#5e6ad2]/25",
  in_progress: "bg-[#f59e0b]/10 text-[#fbbf24] border-[#f59e0b]/20",
  escalated: "bg-[#ef4444]/10 text-[#f87171] border-[#ef4444]/20",
  waiting: "bg-[#8b5cf6]/10 text-[#a78bfa] border-[#8b5cf6]/20",
  closed: "bg-white/[0.05] text-[#8a8f98] border-white/[0.08]",
};
const PRIORITY: Record<string, string> = { urgent: "text-[#ef4444]", high: "text-[#f59e0b]", medium: "text-[#8a8f98]", low: "text-[#62666d]" };
const input = "w-full h-9 px-3 rounded-lg bg-[#08090a] border border-white/[0.08] text-[13px] text-[#d0d6e0] placeholder-[#62666d] focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]/40";
const lbl = "text-[11px] font-medium text-[#8a8f98] uppercase tracking-wide mb-1.5 block";

interface Case { id: string; caseNumber: number; subject: string; status: string; priority: string; type: string; origin: string; }

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function load() { setLoading(true); try { const r = await fetch("/api/cases", { credentials: "include" }).then(r => r.json()); setCases(r.data || []); } catch {} setLoading(false); }
  useEffect(() => { load(); }, []);

  async function setStatus(c: Case, status: string) {
    await fetch(`/api/cases/${c.id}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    load();
  }
  async function remove(c: Case) { if (!confirm(`Delete case #${c.caseNumber}?`)) return; await fetch(`/api/cases/${c.id}`, { method: "DELETE", credentials: "include" }); load(); }

  const open = cases.filter(c => c.status !== "closed").length;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5e6ad2] to-[#828fff] flex items-center justify-center"><LifeBuoy className="w-4 h-4 text-white" /></div>
            <h1 className="text-2xl font-semibold text-[#f7f8f8] tracking-tight">Cases</h1>
          </div>
          <p className="text-[13px] text-[#8a8f98]">{open} open case{open !== 1 ? "s" : ""} — support tickets across all accounts.</p>
        </div>
        <button onClick={() => setCreating(true)} className="h-9 px-4 rounded-lg bg-gradient-to-r from-[#5e6ad2] to-[#828fff] text-white text-[13px] font-medium flex items-center gap-2 hover:shadow-lg hover:shadow-[#5e6ad2]/20 transition-all"><Plus className="w-4 h-4" /> New case</button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/[0.07] bg-gradient-to-b from-[#141517] to-[#0f1011]">
        <table className="w-full text-left">
          <thead><tr className="bg-white/[0.02]" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            {["#", "Subject", "Status", "Priority", "Type", ""].map((h, i) => <th key={i} className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.04em] text-[#8a8f98] whitespace-nowrap">{h}</th>)}
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="px-4 py-12 text-center text-[13px] text-[#62666d]">Loading…</td></tr>
            : cases.length === 0 ? <tr><td colSpan={6} className="px-4 py-12 text-center text-[13px] text-[#62666d]">No cases yet.</td></tr>
            : cases.map(c => (
              <tr key={c.id} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td className="px-4 py-3 text-[12px] tabular-nums text-[#62666d]">#{c.caseNumber}</td>
                <td className="px-4 py-3 text-[13px] font-medium text-[#f7f8f8]">{c.subject}</td>
                <td className="px-4 py-3">
                  <select value={c.status} onChange={e => setStatus(c, e.target.value)} className={`inline-flex px-2 py-1 rounded-md text-[10px] font-medium border capitalize bg-transparent ${STATUS[c.status] || STATUS.new}`}>
                    {["new","open","in_progress","escalated","waiting","closed"].map(s => <option key={s} value={s} className="bg-[#16171a] text-[#d0d6e0]">{s.replace(/_/g," ")}</option>)}
                  </select>
                </td>
                <td className={`px-4 py-3 text-[12px] capitalize ${PRIORITY[c.priority] || PRIORITY.medium}`}>{c.priority}</td>
                <td className="px-4 py-3 text-[12px] text-[#8a8f98] capitalize">{(c.type || "").replace(/_/g," ")}</td>
                <td className="px-4 py-3 text-right"><button onClick={() => remove(c)} className="w-7 h-7 rounded-md flex items-center justify-center text-[#62666d] hover:text-red-400 hover:bg-red-500/10 transition-colors ml-auto"><Trash2 className="w-3.5 h-3.5" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>{creating && <CreateCase onClose={() => setCreating(false)} onSaved={() => { setCreating(false); load(); }} />}</AnimatePresence>
    </div>
  );
}

function CreateCase({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState<any>({ subject: "", description: "", priority: "medium", type: "question", origin: "web", status: "new" });
  const [saving, setSaving] = useState(false); const [err, setErr] = useState("");
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  async function save() {
    if (!f.subject.trim()) { setErr("Subject is required"); return; }
    setSaving(true); setErr("");
    const res = await fetch("/api/cases", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    if (!res.ok) { setErr("Failed to create"); setSaving(false); return; }
    onSaved();
  }
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-10 px-4">
      <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }} className="w-full max-w-md rounded-2xl bg-[#0f1011] border border-white/[0.08] shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]"><h2 className="text-[15px] font-semibold text-[#f7f8f8]">New case</h2><button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#8a8f98] hover:bg-white/[0.06]"><X className="w-4 h-4" /></button></div>
        <div className="p-6 space-y-4">
          <div><label className={lbl}>Subject</label><input className={input} value={f.subject} onChange={e => set("subject", e.target.value)} placeholder="Login issue on mobile" autoFocus /></div>
          <div><label className={lbl}>Description</label><textarea className={`${input} h-20 py-2`} value={f.description} onChange={e => set("description", e.target.value)} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className={lbl}>Priority</label><select className={input} value={f.priority} onChange={e => set("priority", e.target.value)}>{["low","medium","high","urgent"].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className={lbl}>Type</label><select className={input} value={f.type} onChange={e => set("type", e.target.value)}>{["question","problem","feature_request","billing","other"].map(s => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}</select></div>
            <div><label className={lbl}>Origin</label><select className={input} value={f.origin} onChange={e => set("origin", e.target.value)}>{["web","email","phone","chat","other"].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          {err && <div className="flex items-center gap-2 text-[12px] text-red-400"><AlertTriangle className="w-3.5 h-3.5" />{err}</div>}
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-white/[0.06]">
          <button onClick={onClose} className="h-9 px-4 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[#d0d6e0] text-[13px] font-medium hover:bg-white/[0.06]">Cancel</button>
          <button onClick={save} disabled={saving} className="h-9 px-4 rounded-lg bg-gradient-to-r from-[#5e6ad2] to-[#828fff] text-white text-[13px] font-medium flex items-center gap-2 disabled:opacity-50"><CheckCircle2 className="w-4 h-4" />{saving ? "Saving…" : "Create case"}</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
