"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Search as SearchIcon, X, Users, Building2, Briefcase, CheckSquare, Clock, ArrowRight } from "lucide-react";

const TABS = [
  { key: "contact", label: "Contacts", icon: Users },
  { key: "company", label: "Companies", icon: Building2 },
  { key: "deal", label: "Deals", icon: Briefcase },
  { key: "task", label: "Tasks", icon: CheckSquare },
];

export default function SearchPage() {
  const { workspace } = useParams<{ workspace: string }>();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searched, setSearched] = useState(false);
  const timer = useRef<NodeJS.Timeout | null>(null);

  const runSearch = useCallback(async (q: string) => {
    const text = q.trim();
    if (text.length < 2) { setResults([]); setSearched(false); return; }
    setLoading(true); setSearched(true);
    try {
      const res = await fetch("/api/search", {
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: text }),
      });
      const json = await res.json();
      setResults(json.data ?? []);
    } catch (e) { console.error(e); setResults([]); }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => runSearch(query), 300);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [query, runSearch]);

  const filtered = activeTab === "all" ? results : results.filter(r => r.type === activeTab);

  function navigate(r: any) {
    const path = `/${workspace}/${r.type}/${r.id}`;
    if (r.type === "task") router.push(`/${workspace}/tasks/${r.id}`);
    else if (r.type === "contact") router.push(`/${workspace}/contacts/${r.id}`);
    else if (r.type === "company") router.push(`/${workspace}/companies/${r.id}`);
    else if (r.type === "deal") router.push(`/${workspace}/deals/${r.id}`);
  }

  function typeIcon(type: string) {
    if (type === "contact") return <Users className="w-4 h-4 text-blue-400" />;
    if (type === "company") return <Building2 className="w-4 h-4 text-purple-400" />;
    if (type === "deal") return <Briefcase className="w-4 h-4 text-amber-400" />;
    return <CheckSquare className="w-4 h-4 text-emerald-400" />;
  }

  const counts = TABS.reduce<Record<string, number>>((acc, t) => {
    acc[t.key] = results.filter(r => r.type === t.key).length;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#f7f8f8]">Search</h1>
        <p className="text-[#62666d] text-sm mt-1">Find contacts, companies, deals, and tasks</p>
      </div>

      {/* Search input */}
      <div className="relative">
        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#62666d]" />
        <input
          autoFocus
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search anything..."
          className="w-full h-10 pl-10 pr-10 rounded-lg bg-[#0f1011] border border-white/[0.06] text-sm text-[#d0d6e0] placeholder-[#62666d] focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]/[0.3]"
        />
        {query && (
          <button onClick={() => { setQuery(""); setResults([]); setSearched(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#62666d] hover:text-[#8a8f98]">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tabs */}
      {searched && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={() => setActiveTab("all")}
            className={`h-8 px-3 rounded-md text-xs font-medium transition-colors ${activeTab === "all" ? "text-[#f7f8f8] bg-[#5e6ad2]/[0.12] border border-[#5e6ad2]/20" : "text-[#62666d] hover:text-[#8a8f98] border border-transparent hover:bg-[rgba(255,255,255,0.02)]"}`}>
            All {results.length > 0 && <span className="ml-1 text-[#8a8f98]">{results.length}</span>}
          </button>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`h-8 px-3 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors
                ${activeTab === t.key
                  ? "text-[#f7f8f8] bg-[#5e6ad2]/[0.12] border border-[#5e6ad2]/20"
                  : "text-[#62666d] hover:text-[#8a8f98] border border-transparent hover:bg-[rgba(255,255,255,0.02)]"}`}>
              <t.icon className="w-3.5 h-3.5 opacity-70" /> {t.label} {counts[t.key] > 0 && <span>{counts[t.key]}</span>}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-3 py-10 text-[#62666d] text-sm">
          {/* no spinner */}
          Searching...
        </div>
      )}

      {/* Results */}
      {!loading && searched && filtered.length === 0 && (
        <div className="text-center py-16 border border-dashed border-white/[0.06] rounded-xl">
          <SearchIcon className="w-10 h-10 mx-auto mb-3 opacity-40 text-[#62666d]" />
          <p className="text-sm text-[#62666d]">No results found for "{query}"</p>
          <p className="text-xs text-[#62666d] mt-1">Try a different keyword</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-1">
          {filtered.map(r => (
            <button key={`${r.type}-${r.id}`} onClick={() => navigate(r)}
              className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg border border-white/[0.06] bg-[#0f1011] hover:bg-[rgba(255,255,255,0.02)] hover:border-white/[0.08] transition-colors group">
              <div className="w-9 h-9 rounded-lg bg-[#191a1b] border border-white/[0.06] flex items-center justify-center shrink-0">
                {typeIcon(r.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#d0d6e0] truncate">{r.name || r.title || "Untitled"}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-white/[0.06] bg-[#191a1b] text-[#62666d] capitalize">{r.type}</span>
                </div>
                {r.email && <p className="text-xs text-[#62666d] truncate">{r.email}</p>}
              </div>
              <ArrowRight className="w-4 h-4 text-[#62666d] group-hover:text-[#8a8f98] transition-colors shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
