"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Search, User, Building2, Briefcase, CheckSquare, X, Command } from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useParams();
  const workspace = (params?.workspace as string) || "";

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen(prev => !prev); }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) { setQ(""); setResults([]); return; }
    setQ(""); setResults([]); setLoading(false);
  }, [open]);

  const doSearch = useCallback(async (query: string) => {
    if (query.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ q: query }) });
      const json = await res.json();
      setResults(json.data || []);
    } catch { setResults([]); }
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => doSearch(q), 150);
    return () => clearTimeout(t);
  }, [q, doSearch]);

  function go(item: any) {
    setOpen(false);
    const typeMap: Record<string,string> = { contact: "contacts", company: "companies", deal: "deals", task: "tasks" };
    router.push(`/${workspace}/${typeMap[item.type] || item.type + "s"}/${item.id}`);
  }

  const iconMap: Record<string, any> = { contact: User, company: Building2, deal: Briefcase, task: CheckSquare };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]" onClick={()=>setOpen(false)}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg mx-4" onClick={e=>e.stopPropagation()}>
        <div className="rounded-xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 h-14 border-b border-slate-800">
            <Search className="w-5 h-5 text-slate-500" />
            <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Search contacts, companies, deals..." className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none" />
            <div className="flex items-center gap-1 text-[10px] text-slate-500 border border-slate-800 rounded px-1.5 py-0.5"><Command className="w-3 h-3"/>K</div>
            <button onClick={()=>setOpen(false)} className="p-1 rounded-md hover:bg-slate-800 text-slate-500"><X className="w-4 h-4"/></button>
          </div>
          {loading && q.length >= 2 && <div className="px-4 py-6 text-center text-sm text-slate-500">Searching...</div>}
          {results.length > 0 && (
            <div className="max-h-[40vh] overflow-y-auto py-2">
              {results.map((item, i) => {
                const Icon = iconMap[item.type] || Search;
                return (
                  <button key={`${item.type}-${item.id}-${i}`} onClick={()=>go(item)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/60 text-left transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center"><Icon className="w-4 h-4 text-slate-400"/></div>
                    <div className="flex-1 min-w-0"><div className="text-sm text-slate-200 truncate">{item.name}</div>{item.email ? <div className="text-xs text-slate-500 truncate">{item.email}</div> : null}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">{item.type}</div>
                  </button>
                );
              })}
            </div>
          )}
          {q.length >= 2 && !loading && results.length === 0 && <div className="px-4 py-6 text-center text-sm text-slate-500">No results found.</div>}
          {q.length < 2 && <div className="px-4 py-6 text-center text-sm text-slate-500">Type at least 2 characters to search.</div>}
        </div>
      </div>
    </div>
  );
}
