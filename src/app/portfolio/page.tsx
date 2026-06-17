"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Plus, Users, DollarSign, KanbanSquare, ArrowRight, X,
  Layers, TrendingUp, CheckCircle2, AlertTriangle, Briefcase,
} from "lucide-react";

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n || 0).toLocaleString()}`;
}

const PLAN_COLORS: Record<string, string> = {
  free: "bg-white/[0.05] text-[#8a8f98] border-white/[0.08]",
  starter: "bg-[#3b82f6]/10 text-[#60a5fa] border-[#3b82f6]/20",
  pro: "bg-[#5e6ad2]/12 text-[#9aa4f2] border-[#5e6ad2]/25",
  enterprise: "bg-[#10b981]/10 text-[#34d399] border-[#10b981]/20",
};

interface Company {
  id: string; slug: string; name: string; domain?: string; plan: string;
  primaryColor?: string; workspaceSlug: string | null; workspaceCount: number;
  stats: { contacts: number; companies: number; deals: number; openPipeline: number; wonRevenue: number };
}

export default function PortfolioPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [totals, setTotals] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/portfolio", { credentials: "include" }).then(r => r.json());
      setCompanies(r.data || []);
      setTotals(r.totals || null);
    } catch {}
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function enter(c: Company) {
    if (c.workspaceSlug) router.push(`/${c.workspaceSlug}/dashboard`);
  }

  function initials(name: string) {
    return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  }

  return (
    <div className="min-h-screen bg-[#08090a] text-[#f7f8f8]">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5e6ad2] to-[#828fff] flex items-center justify-center shadow-lg shadow-[#5e6ad2]/20">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-[26px] font-semibold tracking-tight">Your Companies</h1>
            </div>
            <p className="text-[13px] text-[#8a8f98]">Pick a company to open its full CRM — contacts, deals, pipeline, and automation.</p>
          </div>
          <button onClick={() => setCreating(true)} className="h-9 px-4 rounded-lg bg-gradient-to-r from-[#5e6ad2] to-[#828fff] text-white text-[13px] font-medium flex items-center gap-2 hover:shadow-lg hover:shadow-[#5e6ad2]/20 transition-all">
            <Plus className="w-4 h-4" /> New company
          </button>
        </div>

        {/* Portfolio totals */}
        {totals && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <TotalCard icon={Briefcase} label="Companies" value={String(totals.companies)} />
            <TotalCard icon={Users} label="Total Contacts" value={totals.contacts.toLocaleString()} />
            <TotalCard icon={KanbanSquare} label="Open Pipeline" value={fmtMoney(totals.openPipeline)} />
            <TotalCard icon={TrendingUp} label="Won Revenue" value={fmtMoney(totals.wonRevenue)} />
          </div>
        )}

        {/* Company grid */}
        {loading ? (
          <div className="text-[13px] text-[#62666d]">Loading companies…</div>
        ) : companies.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/[0.10] p-12 text-center">
            <Building2 className="w-8 h-8 text-[#5e6ad2] mx-auto mb-3" />
            <h3 className="text-[15px] font-semibold mb-1">No companies yet</h3>
            <p className="text-[13px] text-[#8a8f98] mb-4">Create your first SaaS company to start managing its CRM.</p>
            <button onClick={() => setCreating(true)} className="h-9 px-4 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[#d0d6e0] text-[13px] font-medium inline-flex items-center gap-2 hover:bg-white/[0.06]">
              <Plus className="w-4 h-4" /> Create a company
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((c, i) => (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => enter(c)}
                className="group relative text-left bg-gradient-to-b from-[#151619] to-[#0f1011] border border-white/[0.07] rounded-2xl p-5 overflow-hidden hover:border-white/[0.14] hover:-translate-y-0.5 transition-all"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.10] to-transparent" />
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[14px] font-bold text-white shrink-0 shadow-lg" style={{ background: `linear-gradient(135deg, ${c.primaryColor || "#5e6ad2"}, #828fff)` }}>
                      {initials(c.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[15px] font-semibold truncate">{c.name}</div>
                      <div className="text-[12px] text-[#62666d] truncate">{c.domain || `${c.slug}.crm`}</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border capitalize shrink-0 ${PLAN_COLORS[c.plan] || PLAN_COLORS.free}`}>{c.plan}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <Stat label="Contacts" value={c.stats.contacts.toLocaleString()} />
                  <Stat label="Deals" value={c.stats.deals.toLocaleString()} />
                  <Stat label="Pipeline" value={fmtMoney(c.stats.openPipeline)} />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/[0.05]">
                  <span className="text-[11px] text-[#62666d]">{c.stats.wonRevenue > 0 ? `${fmtMoney(c.stats.wonRevenue)} won` : "No revenue yet"}</span>
                  <span className="text-[12px] font-medium text-[#9aa4f2] group-hover:text-white flex items-center gap-1 transition-colors">
                    Open CRM <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {creating && <CreateCompany onClose={() => setCreating(false)} onCreated={(slug) => router.push(`/${slug}/dashboard`)} />}
      </AnimatePresence>
    </div>
  );
}

function TotalCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-gradient-to-b from-[#141517] to-[#0f1011] border border-white/[0.07] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="w-3.5 h-3.5 text-[#62666d]" />
        <span className="text-[11px] text-[#8a8f98] uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-[22px] font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/[0.03] px-2.5 py-2">
      <div className="text-[15px] font-semibold tabular-nums">{value}</div>
      <div className="text-[10px] text-[#62666d] uppercase tracking-wide mt-0.5">{label}</div>
    </div>
  );
}

function CreateCompany({ onClose, onCreated }: { onClose: () => void; onCreated: (slug: string) => void }) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [plan, setPlan] = useState("starter");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const input = "w-full h-9 px-3 rounded-lg bg-[#08090a] border border-white/[0.08] text-[13px] text-[#d0d6e0] placeholder-[#62666d] focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]/40";

  async function create() {
    if (!name.trim()) { setErr("Company name is required"); return; }
    setSaving(true); setErr("");
    try {
      const res = await fetch("/api/businesses", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, domain, plan }) });
      const json = await res.json();
      if (!res.ok) { setErr(json.error || "Failed to create"); setSaving(false); return; }
      onCreated(json.data.workspaceSlug);
    } catch (e: any) { setErr(e.message); setSaving(false); }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }} className="w-full max-w-md rounded-2xl bg-[#0f1011] border border-white/[0.08] shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-[15px] font-semibold">New company</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#8a8f98] hover:bg-white/[0.06]"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div><label className="text-[11px] font-medium text-[#8a8f98] uppercase tracking-wide mb-1.5 block">Company name</label><input className={input} value={name} onChange={e => setName(e.target.value)} placeholder="Acme SaaS" autoFocus /></div>
          <div><label className="text-[11px] font-medium text-[#8a8f98] uppercase tracking-wide mb-1.5 block">Domain (optional)</label><input className={input} value={domain} onChange={e => setDomain(e.target.value)} placeholder="acme.com" /></div>
          <div><label className="text-[11px] font-medium text-[#8a8f98] uppercase tracking-wide mb-1.5 block">Plan</label>
            <select className={input} value={plan} onChange={e => setPlan(e.target.value)}>{["free", "starter", "pro", "enterprise"].map(p => <option key={p} value={p}>{p}</option>)}</select>
          </div>
          {err && <div className="flex items-center gap-2 text-[12px] text-red-400"><AlertTriangle className="w-3.5 h-3.5" />{err}</div>}
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-white/[0.06]">
          <button onClick={onClose} className="h-9 px-4 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[#d0d6e0] text-[13px] font-medium hover:bg-white/[0.06]">Cancel</button>
          <button onClick={create} disabled={saving} className="h-9 px-4 rounded-lg bg-gradient-to-r from-[#5e6ad2] to-[#828fff] text-white text-[13px] font-medium flex items-center gap-2 hover:shadow-lg disabled:opacity-50">
            <CheckCircle2 className="w-4 h-4" /> {saving ? "Creating…" : "Create & open"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
