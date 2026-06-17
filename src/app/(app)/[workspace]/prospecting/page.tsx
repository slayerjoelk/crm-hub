"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radar, Search, Building2, Globe, Users2, Sparkles, UserPlus, CheckCircle2,
  Wand2, Mail, X, Database, Filter,
} from "lucide-react";

const input = "w-full h-9 px-3 rounded-lg bg-[#08090a] border border-white/[0.08] text-[13px] text-[#d0d6e0] placeholder-[#62666d] focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]/40";
const SIZE_BANDS = [
  { label: "Any size", min: undefined, max: undefined },
  { label: "1–50", min: 1, max: 50 },
  { label: "51–200", min: 51, max: 200 },
  { label: "201–1,000", min: 201, max: 1000 },
  { label: "1,001–5,000", min: 1001, max: 5000 },
  { label: "5,000+", min: 5000, max: undefined },
];

interface Prospect {
  id: string; firstName: string; lastName: string; title?: string; seniority?: string;
  email?: string; companyName: string; domain?: string; industry?: string;
  employeeCount?: number; country?: string; city?: string;
}

export default function ProspectingPage() {
  const params = useParams();
  const ws = params?.workspace as string;
  const [facets, setFacets] = useState<{ industries: string[]; seniorities: string[]; countries: string[] }>({ industries: [], seniorities: [], countries: [] });
  const [provider, setProvider] = useState("local");
  const [q, setQ] = useState(""); const [title, setTitle] = useState("");
  const [industry, setIndustry] = useState(""); const [seniority, setSeniority] = useState(""); const [country, setCountry] = useState("");
  const [band, setBand] = useState(0);
  const [results, setResults] = useState<Prospect[]>([]); const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState("");
  const [enrichOpen, setEnrichOpen] = useState(false);

  useEffect(() => {
    fetch("/api/prospecting/facets", { credentials: "include" }).then(r => r.json()).then(j => { setFacets(j.data || facets); setProvider(j.provider || "local"); }).catch(() => {});
  }, []);

  const search = useCallback(async () => {
    setLoading(true);
    const b = SIZE_BANDS[band];
    const filters: any = { q: q || undefined, title: title || undefined, limit: 100 };
    if (industry) filters.industry = [industry];
    if (seniority) filters.seniority = [seniority];
    if (country) filters.country = [country];
    if (b.min != null) filters.employeeMin = b.min;
    if (b.max != null) filters.employeeMax = b.max;
    try {
      const r = await fetch("/api/prospecting/search", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(filters) }).then(r => r.json());
      setResults(r.data?.prospects || []); setTotal(r.data?.total || 0);
    } catch {}
    setLoading(false);
  }, [q, title, industry, seniority, country, band]);

  useEffect(() => { search(); }, [search]);

  function toggle(id: string) { setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; }); }
  function toggleAll() { setSelected(p => p.size === results.length ? new Set() : new Set(results.map(r => r.id))); }

  async function importLeads() {
    if (selected.size === 0) return;
    setImporting(true);
    try {
      const r = await fetch("/api/prospecting/import", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prospectIds: [...selected], workspace: ws }) }).then(r => r.json());
      const d = r.data || {};
      setToast(`Added ${d.imported} lead${d.imported !== 1 ? "s" : ""}${d.skipped ? ` · ${d.skipped} already existed` : ""}`);
      setSelected(new Set());
    } catch { setToast("Import failed"); }
    setImporting(false);
    setTimeout(() => setToast(""), 4000);
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5e6ad2] to-[#828fff] flex items-center justify-center"><Radar className="w-4 h-4 text-white" /></div>
            <h1 className="text-2xl font-semibold text-[#f7f8f8] tracking-tight">Prospecting</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/[0.04] text-[#8a8f98] border border-white/[0.08]"><Database className="w-3 h-3" />{provider} db</span>
          </div>
          <p className="text-[13px] text-[#8a8f98]">Search the B2B database, filter by firmographics, and push targets straight into Leads.</p>
        </div>
        <button onClick={() => setEnrichOpen(true)} className="h-9 px-4 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[#d0d6e0] text-[13px] font-medium flex items-center gap-2 hover:bg-white/[0.06] transition-all">
          <Wand2 className="w-4 h-4 text-[#9aa4f2]" /> Enrich
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-white/[0.07] bg-gradient-to-b from-[#141517] to-[#0f1011] p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#62666d]" /><input className={`${input} pl-9`} placeholder="Name or company…" value={q} onChange={e => setQ(e.target.value)} /></div>
          <input className={input} placeholder="Title contains… (e.g. VP, Head of Sales)" value={title} onChange={e => setTitle(e.target.value)} />
          <select className={input} value={band} onChange={e => setBand(Number(e.target.value))}>{SIZE_BANDS.map((b, i) => <option key={i} value={i}>{b.label}</option>)}</select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select className={input} value={industry} onChange={e => setIndustry(e.target.value)}><option value="">All industries</option>{facets.industries.map(x => <option key={x} value={x}>{x}</option>)}</select>
          <select className={input} value={seniority} onChange={e => setSeniority(e.target.value)}><option value="">All seniorities</option>{facets.seniorities.map(x => <option key={x} value={x}>{x.replace(/_/g, " ")}</option>)}</select>
          <select className={input} value={country} onChange={e => setCountry(e.target.value)}><option value="">All countries</option>{facets.countries.map(x => <option key={x} value={x}>{x}</option>)}</select>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[12px] text-[#8a8f98]">{loading ? "Searching…" : `${total.toLocaleString()} matching prospect${total !== 1 ? "s" : ""}`}</span>
        {selected.size > 0 && <span className="text-[12px] text-[#9aa4f2]">{selected.size} selected</span>}
      </div>

      {/* Results */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.07] bg-gradient-to-b from-[#141517] to-[#0f1011]">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/[0.02]" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <th className="px-3 py-2.5 w-8"><input type="checkbox" checked={results.length > 0 && selected.size === results.length} onChange={toggleAll} className="accent-[#5e6ad2]" /></th>
              {["Name", "Company", "Industry", "Size", "Country", "Email"].map(h => <th key={h} className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.04em] text-[#8a8f98] whitespace-nowrap">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {results.length === 0 && !loading ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-[13px] text-[#62666d]">No prospects match these filters.</td></tr>
            ) : results.map(p => (
              <tr key={p.id} className={`transition-colors ${selected.has(p.id) ? "bg-[#5e6ad2]/[0.06]" : "hover:bg-white/[0.02]"}`} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td className="px-3 py-3"><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} className="accent-[#5e6ad2]" /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5e6ad2] to-[#828fff] flex items-center justify-center text-[11px] font-semibold text-white shrink-0">{p.firstName[0]}{p.lastName[0]}</div>
                    <div className="min-w-0"><div className="text-[13px] font-medium text-[#f7f8f8] truncate">{p.firstName} {p.lastName}</div><div className="text-[11px] text-[#62666d] truncate">{p.title || "—"}</div></div>
                  </div>
                </td>
                <td className="px-4 py-3"><div className="text-[13px] text-[#d0d6e0]">{p.companyName}</div><div className="text-[11px] text-[#62666d]">{p.domain}</div></td>
                <td className="px-4 py-3 text-[12px] text-[#8a8f98]">{p.industry || "—"}</td>
                <td className="px-4 py-3 text-[13px] tabular-nums text-[#d0d6e0]">{p.employeeCount?.toLocaleString() || "—"}</td>
                <td className="px-4 py-3 text-[12px] text-[#8a8f98]">{p.country || "—"}</td>
                <td className="px-4 py-3 text-[12px] text-[#9aa4f2] truncate max-w-[180px]">{p.email || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sticky action bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 px-5 py-3 rounded-xl bg-[#16171a] border border-white/[0.10] shadow-2xl shadow-black/50">
            <span className="text-[13px] text-[#d0d6e0]">{selected.size} prospect{selected.size !== 1 ? "s" : ""} selected</span>
            <button onClick={importLeads} disabled={importing} className="h-9 px-4 rounded-lg bg-gradient-to-r from-[#5e6ad2] to-[#828fff] text-white text-[13px] font-medium flex items-center gap-2 hover:shadow-lg disabled:opacity-50">
              <UserPlus className="w-4 h-4" /> {importing ? "Adding…" : `Add ${selected.size} to Leads`}
            </button>
            <button onClick={() => setSelected(new Set())} className="text-[#62666d] hover:text-[#d0d6e0]"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#10b981]/12 border border-[#10b981]/25 text-[#34d399] text-[13px] font-medium">
            <CheckCircle2 className="w-4 h-4" /> {toast}
          </motion.div>
        )}
        {enrichOpen && <EnrichTool onClose={() => setEnrichOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

function EnrichTool({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState(""); const [domain, setDomain] = useState("");
  const [firstName, setFirstName] = useState(""); const [lastName, setLastName] = useState("");
  const [res, setRes] = useState<any>(null); const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const r = await fetch("/api/prospecting/enrich", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, domain, firstName, lastName }) }).then(r => r.json());
      setRes(r.data);
    } catch {}
    setLoading(false);
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-10 px-4">
      <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }} className="w-full max-w-md rounded-2xl bg-[#0f1011] border border-white/[0.08] shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-[15px] font-semibold text-[#f7f8f8] flex items-center gap-2"><Wand2 className="w-4 h-4 text-[#9aa4f2]" /> Enrich</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#8a8f98] hover:bg-white/[0.06]"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-3">
          <p className="text-[12px] text-[#62666d]">Provide an email, or a domain + name, to find company data and a likely email.</p>
          <input className={input} placeholder="Email (optional)" value={email} onChange={e => setEmail(e.target.value)} />
          <div className="grid grid-cols-3 gap-2">
            <input className={input} placeholder="Domain" value={domain} onChange={e => setDomain(e.target.value)} />
            <input className={input} placeholder="First" value={firstName} onChange={e => setFirstName(e.target.value)} />
            <input className={input} placeholder="Last" value={lastName} onChange={e => setLastName(e.target.value)} />
          </div>
          <button onClick={run} disabled={loading} className="w-full h-9 rounded-lg bg-gradient-to-r from-[#5e6ad2] to-[#828fff] text-white text-[13px] font-medium flex items-center justify-center gap-2 disabled:opacity-50"><Sparkles className="w-4 h-4" />{loading ? "Enriching…" : "Enrich"}</button>
          {res && (
            <div className="rounded-lg bg-white/[0.03] p-3 space-y-1.5 text-[12px]">
              <Row label="Email" value={res.email} extra={res.emailConfidence ? `${res.emailConfidence}% conf${res.matched ? " · verified" : " · guessed"}` : undefined} />
              <Row label="Company" value={res.companyName} />
              <Row label="Industry" value={res.industry} />
              <Row label="Employees" value={res.employeeCount?.toLocaleString()} />
              <Row label="Country" value={res.country} />
              <div className="pt-1 text-[10px] text-[#62666d]">via {res.provider} provider</div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function Row({ label, value, extra }: { label: string; value?: string; extra?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[#62666d]">{label}</span>
      <span className="text-[#d0d6e0] truncate text-right">{value || "—"}{extra && <span className="text-[#62666d] ml-1.5">({extra})</span>}</span>
    </div>
  );
}
