"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, Plus, X, CheckCircle2, AlertTriangle, Trash2, Users2, TrendingUp, DollarSign, UserPlus, Search } from "lucide-react";

function fmtMoney(n: number) { if (n >= 1e6) return `$${(n/1e6).toFixed(1)}M`; if (n >= 1e3) return `$${(n/1e3).toFixed(1)}K`; return `$${Math.round(n||0)}`; }
const STATUS: Record<string, string> = {
  planned: "bg-white/[0.05] text-[#8a8f98] border-white/[0.08]",
  active: "bg-[#10b981]/10 text-[#34d399] border-[#10b981]/20",
  completed: "bg-[#5e6ad2]/12 text-[#9aa4f2] border-[#5e6ad2]/25",
  aborted: "bg-[#ef4444]/10 text-[#f87171] border-[#ef4444]/20",
};
const input = "w-full h-9 px-3 rounded-lg bg-[#08090a] border border-white/[0.08] text-[13px] text-[#d0d6e0] placeholder-[#62666d] focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]/40";
const lbl = "text-[11px] font-medium text-[#8a8f98] uppercase tracking-wide mb-1.5 block";

interface Campaign { id: string; name: string; type: string; status: string; actualCost: number; expectedRevenue: number; memberCount: number; respondedCount: number; roi: number | null; }

export default function CampaignsPage() {
  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [managing, setManaging] = useState<Campaign | null>(null);

  async function load() { setLoading(true); try { const r = await fetch("/api/campaigns", { credentials: "include" }).then(r => r.json()); setItems(r.data || []); } catch {} setLoading(false); }
  useEffect(() => { load(); }, []);
  async function remove(c: Campaign) { if (!confirm(`Delete campaign "${c.name}"?`)) return; await fetch(`/api/campaigns/${c.id}`, { method: "DELETE", credentials: "include" }); load(); }

  const totalSpend = items.reduce((s, c) => s + (c.actualCost || 0), 0);
  const totalPipeline = items.reduce((s, c) => s + (c.expectedRevenue || 0), 0);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5e6ad2] to-[#828fff] flex items-center justify-center"><Megaphone className="w-4 h-4 text-white" /></div><h1 className="text-2xl font-semibold text-[#f7f8f8] tracking-tight">Campaigns</h1></div>
          <p className="text-[13px] text-[#8a8f98]">{items.length} campaign{items.length !== 1 ? "s" : ""} · {fmtMoney(totalSpend)} spend → {fmtMoney(totalPipeline)} attributed pipeline.</p>
        </div>
        <button onClick={() => setCreating(true)} className="h-9 px-4 rounded-lg bg-gradient-to-r from-[#5e6ad2] to-[#828fff] text-white text-[13px] font-medium flex items-center gap-2 hover:shadow-lg hover:shadow-[#5e6ad2]/20 transition-all"><Plus className="w-4 h-4" /> New campaign</button>
      </div>

      {loading ? <div className="text-[13px] text-[#62666d]">Loading…</div>
      : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/[0.10] p-12 text-center"><Megaphone className="w-8 h-8 text-[#5e6ad2] mx-auto mb-3" /><h3 className="text-[15px] font-semibold text-[#f7f8f8] mb-1">No campaigns yet</h3><p className="text-[13px] text-[#8a8f98]">Track marketing efforts, members, and ROI.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(c => (
            <motion.div key={c.id} layout className="rounded-xl bg-gradient-to-b from-[#141517] to-[#0f1011] border border-white/[0.07] p-5 hover:border-white/[0.12] transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0"><div className="text-[15px] font-semibold text-[#f7f8f8] truncate">{c.name}</div><div className="text-[12px] text-[#62666d] capitalize mt-0.5">{c.type.replace(/_/g," ")}</div></div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border capitalize ${STATUS[c.status] || STATUS.planned}`}>{c.status}</span>
                  <button onClick={() => setManaging(c)} title="Manage members" className="w-7 h-7 rounded-md flex items-center justify-center text-[#62666d] hover:text-[#9aa4f2] hover:bg-[#5e6ad2]/10"><Users2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => remove(c)} className="w-7 h-7 rounded-md flex items-center justify-center text-[#62666d] hover:text-red-400 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <Stat icon={Users2} label="Members" value={String(c.memberCount)} />
                <Stat icon={TrendingUp} label="Responded" value={String(c.respondedCount)} />
                <Stat icon={DollarSign} label="Spend" value={fmtMoney(c.actualCost || 0)} />
                <Stat icon={TrendingUp} label="ROI" value={c.roi != null ? `${c.roi}%` : "—"} accent={c.roi != null && c.roi >= 0} />
              </div>
            </motion.div>
          ))}
        </div>
      )}
      <AnimatePresence>
        {creating && <CreateCampaign onClose={() => setCreating(false)} onSaved={() => { setCreating(false); load(); }} />}
        {managing && <MembersModal campaign={managing} onClose={() => setManaging(null)} onChanged={load} />}
      </AnimatePresence>
    </div>
  );
}

function MembersModal({ campaign, onClose, onChanged }: { campaign: Campaign; onClose: () => void; onChanged: () => void }) {
  const [members, setMembers] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [cm, ct] = await Promise.all([
        fetch(`/api/campaigns/${campaign.id}`, { credentials: "include" }).then(r => r.json()),
        fetch(`/api/contacts`, { credentials: "include" }).then(r => r.json()),
      ]);
      setMembers(cm.data?.members || []);
      setContacts(ct.data || []);
    } catch {}
    setLoading(false);
  }
  useEffect(() => { load(); }, []); // eslint-disable-line

  const memberContactIds = new Set(members.map(m => m.contactId));
  const candidates = contacts.filter(c => !memberContactIds.has(c.id) && (!q || `${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(q.toLowerCase())));
  const byId = new Map(contacts.map(c => [c.id, c]));

  function toggle(id: string) { setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; }); }

  async function add() {
    if (selected.size === 0) return;
    setAdding(true);
    await fetch(`/api/campaigns/${campaign.id}/members`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contactIds: [...selected] }) });
    setSelected(new Set());
    await load();
    onChanged();
    setAdding(false);
  }

  const RESP = ["responded", "registered", "attended", "converted"];
  const input = "w-full h-9 px-3 rounded-lg bg-[#08090a] border border-white/[0.08] text-[13px] text-[#d0d6e0] placeholder-[#62666d] focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]/40";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-10 px-4">
      <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }} className="w-full max-w-2xl rounded-2xl bg-[#0f1011] border border-white/[0.08] shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div><h2 className="text-[15px] font-semibold text-[#f7f8f8]">{campaign.name} · Members</h2><p className="text-[12px] text-[#62666d] mt-0.5">{members.length} member{members.length !== 1 ? "s" : ""}</p></div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#8a8f98] hover:bg-white/[0.06]"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-5">
          {/* Current members */}
          <div>
            <span className="block text-[11px] font-medium text-[#8a8f98] uppercase tracking-wide mb-2">In this campaign</span>
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {loading ? <div className="text-[12px] text-[#62666d]">Loading…</div>
              : members.length === 0 ? <div className="text-[12px] text-[#62666d]">No members yet.</div>
              : members.map(m => { const c = byId.get(m.contactId); return (
                <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03]">
                  <span className="text-[13px] text-[#d0d6e0] truncate">{c ? `${c.firstName || ""} ${c.lastName || ""}`.trim() || c.email : "Contact"}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${RESP.includes(m.status) ? "bg-[#10b981]/10 text-[#34d399]" : "bg-white/[0.05] text-[#8a8f98]"}`}>{m.status}</span>
                </div>
              ); })}
            </div>
          </div>
          {/* Add contacts */}
          <div>
            <span className="block text-[11px] font-medium text-[#8a8f98] uppercase tracking-wide mb-2">Add contacts</span>
            <div className="relative mb-2"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#62666d]" /><input className={`${input} pl-9`} placeholder="Search contacts…" value={q} onChange={e => setQ(e.target.value)} /></div>
            <div className="space-y-1 max-h-56 overflow-y-auto">
              {candidates.length === 0 ? <div className="text-[12px] text-[#62666d] py-2">No contacts to add.</div>
              : candidates.map(c => (
                <label key={c.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.03] cursor-pointer">
                  <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} className="accent-[#5e6ad2]" />
                  <span className="text-[13px] text-[#d0d6e0] truncate">{`${c.firstName || ""} ${c.lastName || ""}`.trim() || c.email}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-white/[0.06]">
          <button onClick={onClose} className="h-9 px-4 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[#d0d6e0] text-[13px] font-medium hover:bg-white/[0.06]">Close</button>
          <button onClick={add} disabled={adding || selected.size === 0} className="h-9 px-4 rounded-lg bg-gradient-to-r from-[#5e6ad2] to-[#828fff] text-white text-[13px] font-medium flex items-center gap-2 disabled:opacity-50"><UserPlus className="w-4 h-4" />{adding ? "Adding…" : `Add ${selected.size || ""}`.trim()}</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Stat({ icon: Icon, label, value, accent }: any) {
  return (
    <div className="rounded-lg bg-white/[0.03] px-2.5 py-2">
      <div className={`text-[14px] font-semibold tabular-nums ${accent ? "text-[#34d399]" : "text-[#f7f8f8]"}`}>{value}</div>
      <div className="text-[10px] text-[#62666d] uppercase tracking-wide mt-0.5 flex items-center gap-1"><Icon className="w-2.5 h-2.5" />{label}</div>
    </div>
  );
}

function CreateCampaign({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState<any>({ name: "", type: "email", status: "planned", actualCost: "", expectedRevenue: "" });
  const [saving, setSaving] = useState(false); const [err, setErr] = useState("");
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  async function save() {
    if (!f.name.trim()) { setErr("Name is required"); return; }
    setSaving(true); setErr("");
    const res = await fetch("/api/campaigns", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    if (!res.ok) { setErr("Failed to create"); setSaving(false); return; }
    onSaved();
  }
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-10 px-4">
      <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }} className="w-full max-w-md rounded-2xl bg-[#0f1011] border border-white/[0.08] shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]"><h2 className="text-[15px] font-semibold text-[#f7f8f8]">New campaign</h2><button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#8a8f98] hover:bg-white/[0.06]"><X className="w-4 h-4" /></button></div>
        <div className="p-6 space-y-4">
          <div><label className={lbl}>Campaign name</label><input className={input} value={f.name} onChange={e => set("name", e.target.value)} placeholder="Q3 Product Launch" autoFocus /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Type</label><select className={input} value={f.type} onChange={e => set("type", e.target.value)}>{["email","event","webinar","paid_ads","content","social","referral","other"].map(s => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}</select></div>
            <div><label className={lbl}>Status</label><select className={input} value={f.status} onChange={e => set("status", e.target.value)}>{["planned","active","completed","aborted"].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Actual cost ($)</label><input type="number" className={input} value={f.actualCost} onChange={e => set("actualCost", e.target.value)} placeholder="0" /></div>
            <div><label className={lbl}>Expected revenue ($)</label><input type="number" className={input} value={f.expectedRevenue} onChange={e => set("expectedRevenue", e.target.value)} placeholder="0" /></div>
          </div>
          {err && <div className="flex items-center gap-2 text-[12px] text-red-400"><AlertTriangle className="w-3.5 h-3.5" />{err}</div>}
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-white/[0.06]">
          <button onClick={onClose} className="h-9 px-4 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[#d0d6e0] text-[13px] font-medium hover:bg-white/[0.06]">Cancel</button>
          <button onClick={save} disabled={saving} className="h-9 px-4 rounded-lg bg-gradient-to-r from-[#5e6ad2] to-[#828fff] text-white text-[13px] font-medium flex items-center gap-2 disabled:opacity-50"><CheckCircle2 className="w-4 h-4" />{saving ? "Saving…" : "Create campaign"}</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
