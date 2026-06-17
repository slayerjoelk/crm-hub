"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus, Plus, X, CheckCircle2, AlertTriangle, Trash2, Flame,
  ArrowRightLeft, Building2, Target, Search, Sparkles,
} from "lucide-react";

const STATUS: Record<string, string> = {
  new: "bg-[#3b82f6]/10 text-[#60a5fa] border-[#3b82f6]/20",
  working: "bg-[#f59e0b]/10 text-[#fbbf24] border-[#f59e0b]/20",
  nurturing: "bg-[#8b5cf6]/10 text-[#a78bfa] border-[#8b5cf6]/20",
  qualified: "bg-[#10b981]/10 text-[#34d399] border-[#10b981]/20",
  unqualified: "bg-white/[0.05] text-[#8a8f98] border-white/[0.08]",
  converted: "bg-[#5e6ad2]/12 text-[#9aa4f2] border-[#5e6ad2]/25",
};
const RATING: Record<string, string> = { hot: "text-[#ef4444]", warm: "text-[#f59e0b]", cold: "text-[#62666d]" };

const input = "w-full h-9 px-3 rounded-lg bg-[#08090a] border border-white/[0.08] text-[13px] text-[#d0d6e0] placeholder-[#62666d] focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]/40";
const lbl = "text-[11px] font-medium text-[#8a8f98] uppercase tracking-wide mb-1.5 block";

interface Lead { id: string; firstName?: string; lastName?: string; email?: string; company?: string; jobTitle?: string; status: string; rating: string; leadScore: number; source: string; isConverted?: boolean; }

export default function LeadsPage() {
  const params = useParams();
  const ws = params?.workspace as string;
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [converting, setConverting] = useState<Lead | null>(null);

  async function load() {
    setLoading(true);
    try { const r = await fetch("/api/leads", { credentials: "include" }).then(r => r.json()); setLeads(r.data || []); } catch {}
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function remove(l: Lead) {
    if (!confirm(`Delete lead ${l.firstName || l.email}?`)) return;
    await fetch(`/api/leads/${l.id}`, { method: "DELETE", credentials: "include" });
    load();
  }

  const filtered = leads.filter(l => !q || `${l.firstName} ${l.lastName} ${l.email} ${l.company}`.toLowerCase().includes(q.toLowerCase()));
  const open = leads.filter(l => !l.isConverted).length;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5e6ad2] to-[#828fff] flex items-center justify-center"><UserPlus className="w-4 h-4 text-white" /></div>
            <h1 className="text-2xl font-semibold text-[#f7f8f8] tracking-tight">Leads</h1>
          </div>
          <p className="text-[13px] text-[#8a8f98]">{open} open lead{open !== 1 ? "s" : ""} — qualify and convert them into accounts, contacts &amp; opportunities.</p>
        </div>
        <button onClick={() => setCreating(true)} className="h-9 px-4 rounded-lg bg-gradient-to-r from-[#5e6ad2] to-[#828fff] text-white text-[13px] font-medium flex items-center gap-2 hover:shadow-lg hover:shadow-[#5e6ad2]/20 transition-all">
          <Plus className="w-4 h-4" /> New lead
        </button>
      </div>

      <div className="relative max-w-sm mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#62666d]" />
        <input className={`${input} pl-9`} placeholder="Search leads..." value={q} onChange={e => setQ(e.target.value)} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/[0.07] bg-gradient-to-b from-[#141517] to-[#0f1011]">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/[0.02]" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              {["Name", "Company", "Status", "Rating", "Score", "Source", ""].map((h, i) => (
                <th key={i} className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.04em] text-[#8a8f98] whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-[13px] text-[#62666d]">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-[13px] text-[#62666d]">No leads yet. Create one or import a list.</td></tr>
            ) : filtered.map(l => (
              <tr key={l.id} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5e6ad2] to-[#828fff] flex items-center justify-center text-[11px] font-semibold text-white shrink-0">
                      {(l.firstName?.[0] || "") + (l.lastName?.[0] || "") || "?"}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium text-[#f7f8f8] truncate">{`${l.firstName || ""} ${l.lastName || ""}`.trim() || "—"}</div>
                      <div className="text-[11px] text-[#62666d] truncate">{l.email || "—"}{l.jobTitle ? ` · ${l.jobTitle}` : ""}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-[13px] text-[#d0d6e0]">{l.company || "—"}</td>
                <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium border capitalize ${STATUS[l.status] || STATUS.new}`}>{l.status}</span></td>
                <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 text-[12px] capitalize ${RATING[l.rating] || RATING.cold}`}><Flame className="w-3 h-3" />{l.rating}</span></td>
                <td className="px-4 py-3 text-[13px] tabular-nums text-[#d0d6e0]">{l.leadScore ?? 0}</td>
                <td className="px-4 py-3 text-[12px] text-[#8a8f98] capitalize">{(l.source || "other").replace(/_/g, " ")}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    {!l.isConverted && (
                      <button onClick={() => setConverting(l)} title="Convert" className="h-7 px-2.5 rounded-md bg-[#5e6ad2]/12 text-[#9aa4f2] hover:bg-[#5e6ad2]/20 text-[12px] font-medium flex items-center gap-1.5 transition-colors">
                        <ArrowRightLeft className="w-3.5 h-3.5" /> Convert
                      </button>
                    )}
                    <button onClick={() => remove(l)} className="w-7 h-7 rounded-md flex items-center justify-center text-[#62666d] hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {creating && <CreateLead onClose={() => setCreating(false)} onSaved={() => { setCreating(false); load(); }} />}
        {converting && <ConvertLead lead={converting} ws={ws} onClose={() => setConverting(null)} onDone={() => { setConverting(null); load(); }} />}
      </AnimatePresence>
    </div>
  );
}

function Modal({ title, onClose, children, footer }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-10 px-4">
      <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }} className="w-full max-w-lg rounded-2xl bg-[#0f1011] border border-white/[0.08] shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-[15px] font-semibold text-[#f7f8f8]">{title}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#8a8f98] hover:bg-white/[0.06]"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">{children}</div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-white/[0.06]">{footer}</div>
      </motion.div>
    </motion.div>
  );
}

function CreateLead({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState<any>({ firstName: "", lastName: "", email: "", company: "", jobTitle: "", phone: "", source: "outbound", rating: "warm", status: "new" });
  const [saving, setSaving] = useState(false); const [err, setErr] = useState("");
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  async function save() {
    if (!f.firstName && !f.email) { setErr("Name or email required"); return; }
    setSaving(true); setErr("");
    const res = await fetch("/api/leads", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    if (!res.ok) { setErr("Failed to create"); setSaving(false); return; }
    onSaved();
  }
  return (
    <Modal title="New lead" onClose={onClose} footer={<>
      <button onClick={onClose} className="h-9 px-4 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[#d0d6e0] text-[13px] font-medium hover:bg-white/[0.06]">Cancel</button>
      <button onClick={save} disabled={saving} className="h-9 px-4 rounded-lg bg-gradient-to-r from-[#5e6ad2] to-[#828fff] text-white text-[13px] font-medium flex items-center gap-2 disabled:opacity-50"><CheckCircle2 className="w-4 h-4" />{saving ? "Saving…" : "Create lead"}</button>
    </>}>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={lbl}>First name</label><input className={input} value={f.firstName} onChange={e => set("firstName", e.target.value)} /></div>
        <div><label className={lbl}>Last name</label><input className={input} value={f.lastName} onChange={e => set("lastName", e.target.value)} /></div>
      </div>
      <div><label className={lbl}>Email</label><input className={input} value={f.email} onChange={e => set("email", e.target.value)} placeholder="name@company.com" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={lbl}>Company</label><input className={input} value={f.company} onChange={e => set("company", e.target.value)} /></div>
        <div><label className={lbl}>Job title</label><input className={input} value={f.jobTitle} onChange={e => set("jobTitle", e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><label className={lbl}>Source</label><select className={input} value={f.source} onChange={e => set("source", e.target.value)}>{["outbound","organic","paid","referral","social","event","partner","prospecting","list_import","other"].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
        <div><label className={lbl}>Rating</label><select className={input} value={f.rating} onChange={e => set("rating", e.target.value)}>{["hot","warm","cold"].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
        <div><label className={lbl}>Status</label><select className={input} value={f.status} onChange={e => set("status", e.target.value)}>{["new","working","nurturing","qualified","unqualified"].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
      </div>
      {err && <div className="flex items-center gap-2 text-[12px] text-red-400"><AlertTriangle className="w-3.5 h-3.5" />{err}</div>}
    </Modal>
  );
}

function ConvertLead({ lead, ws, onClose, onDone }: { lead: Lead; ws: string; onClose: () => void; onDone: () => void }) {
  const [createDeal, setCreateDeal] = useState(true);
  const [dealName, setDealName] = useState(`${lead.company || lead.firstName || "New"} opportunity`);
  const [dealValue, setDealValue] = useState("");
  const [saving, setSaving] = useState(false); const [err, setErr] = useState(""); const [result, setResult] = useState<any>(null);

  async function convert() {
    setSaving(true); setErr("");
    const res = await fetch(`/api/leads/${lead.id}/convert`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ createDeal, dealName, dealValue: dealValue ? Number(dealValue) : 0 }) });
    const json = await res.json();
    if (!res.ok) { setErr(json.error || "Conversion failed"); setSaving(false); return; }
    setResult(json.data); setSaving(false);
  }

  if (result) {
    return (
      <Modal title="Lead converted 🎉" onClose={onDone} footer={
        <button onClick={onDone} className="h-9 px-4 rounded-lg bg-gradient-to-r from-[#5e6ad2] to-[#828fff] text-white text-[13px] font-medium">Done</button>
      }>
        <p className="text-[13px] text-[#8a8f98]">Created from this lead:</p>
        <div className="space-y-2">
          {result.company && <ResultRow icon={Building2} label="Account" value={result.company.name} href={`/${ws}/companies/${result.company.id}`} />}
          <ResultRow icon={UserPlus} label="Contact" value={`${result.contact.firstName || ""} ${result.contact.lastName || ""}`.trim() || result.contact.email} href={`/${ws}/contacts/${result.contact.id}`} />
          {result.deal && <ResultRow icon={Target} label="Opportunity" value={result.deal.name} href={`/${ws}/deals/${result.deal.id}`} />}
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Convert lead" onClose={onClose} footer={<>
      <button onClick={onClose} className="h-9 px-4 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[#d0d6e0] text-[13px] font-medium hover:bg-white/[0.06]">Cancel</button>
      <button onClick={convert} disabled={saving} className="h-9 px-4 rounded-lg bg-gradient-to-r from-[#5e6ad2] to-[#828fff] text-white text-[13px] font-medium flex items-center gap-2 disabled:opacity-50"><ArrowRightLeft className="w-4 h-4" />{saving ? "Converting…" : "Convert"}</button>
    </>}>
      <div className="rounded-lg bg-white/[0.03] p-3 text-[13px] text-[#d0d6e0]">
        <div className="flex items-center gap-2 mb-2 text-[#9aa4f2]"><Sparkles className="w-3.5 h-3.5" /> This will create:</div>
        <ul className="space-y-1 text-[12px] text-[#8a8f98]">
          {lead.company && <li>• <b className="text-[#d0d6e0]">Account</b> — {lead.company}</li>}
          <li>• <b className="text-[#d0d6e0]">Contact</b> — {`${lead.firstName || ""} ${lead.lastName || ""}`.trim() || lead.email}</li>
          {createDeal && <li>• <b className="text-[#d0d6e0]">Opportunity</b> — {dealName}</li>}
        </ul>
      </div>
      <label className="flex items-center gap-2 text-[13px] text-[#d0d6e0] cursor-pointer">
        <input type="checkbox" checked={createDeal} onChange={e => setCreateDeal(e.target.checked)} className="accent-[#5e6ad2]" /> Also create an opportunity
      </label>
      {createDeal && (
        <div className="grid grid-cols-2 gap-3">
          <div><label className={lbl}>Opportunity name</label><input className={input} value={dealName} onChange={e => setDealName(e.target.value)} /></div>
          <div><label className={lbl}>Value ($)</label><input type="number" className={input} value={dealValue} onChange={e => setDealValue(e.target.value)} placeholder="0" /></div>
        </div>
      )}
      {err && <div className="flex items-center gap-2 text-[12px] text-red-400"><AlertTriangle className="w-3.5 h-3.5" />{err}</div>}
    </Modal>
  );
}

function ResultRow({ icon: Icon, label, value, href }: any) {
  return (
    <a href={href} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.05] transition-colors">
      <div className="w-8 h-8 rounded-lg bg-[#5e6ad2]/12 flex items-center justify-center"><Icon className="w-4 h-4 text-[#9aa4f2]" /></div>
      <div className="min-w-0"><div className="text-[11px] text-[#62666d] uppercase tracking-wide">{label}</div><div className="text-[13px] text-[#f7f8f8] truncate">{value}</div></div>
    </a>
  );
}
