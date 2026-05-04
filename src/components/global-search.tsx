"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Search, X, Users, Building2, BarChart3, CheckSquare, Mail, Tag } from "lucide-react";

interface SearchItem {
  id: string;
  type: "contact" | "company" | "deal" | "task" | "email" | "tag";
  label: string;
  sub: string;
  href: string;
}

export default function GlobalSearch() {
  const router = useRouter();
  const params = useParams();
  const ws = (params?.workspace as string) || "";
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<SearchItem[]>([]);
  const [idx, setIdx] = useState(0);

  // Load all searchable entities
  useEffect(() => {
    if (!open) return;
    async function load() {
      const out: SearchItem[] = [];
      try {
        const [contacts, companies, deals, tasks, tags] = await Promise.all([
          fetch("/api/contacts").then((r) => r.json()),
          fetch("/api/companies").then((r) => r.json()),
          fetch("/api/deals").then((r) => r.json()),
          fetch("/api/tasks").then((r) => r.json()),
          fetch("/api/tags").then((r) => r.json()),
        ]);
        (contacts.data || []).forEach((c: any) => {
          out.push({
            id: c.id,
            type: "contact",
            label: `${c.firstName} ${c.lastName}`.trim(),
            sub: c.email || c.phone || "",
            href: `/${ws}/contacts/${c.id}`,
          });
        });
        (companies.data || []).forEach((c: any) => {
          out.push({ id: c.id, type: "company", label: c.name, sub: c.domain || "", href: `/${ws}/companies/${c.id}` });
        });
        (deals.data || []).forEach((d: any) => {
          out.push({ id: d.id, type: "deal", label: d.name, sub: d.stage || "", href: `/${ws}/deals/${d.id}` });
        });
        (tasks.data || []).forEach((t: any) => {
          out.push({ id: t.id, type: "task", label: t.title, sub: t.status || "", href: `/${ws}/tasks/${t.id}` });
        });
        (tags.data || []).forEach((t: any) => {
          out.push({ id: t.id, type: "tag", label: t.name, sub: "", href: `/${ws}/tags` });
        });
      } catch (e) { console.error(e); }
      setItems(out);
    }
    load();
  }, [open, ws]);

  const results = q.trim()
    ? items.filter((it) => (it.label + " " + it.sub).toLowerCase().includes(q.toLowerCase())).slice(0, 12)
    : items.slice(0, 8);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function navigate(url: string) {
    setOpen(false);
    setQ("");
    router.push(url);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && results[idx]) { navigate(results[idx].href); }
  }

  const iconFor = (type: string) => {
    switch (type) {
      case "contact": return <Users className="w-4 h-4 text-emerald-400" />;
      case "company": return <Building2 className="w-4 h-4 text-blue-400" />;
      case "deal": return <BarChart3 className="w-4 h-4 text-violet-400" />;
      case "task": return <CheckSquare className="w-4 h-4 text-amber-400" />;
      case "email": return <Mail className="w-4 h-4 text-pink-400" />;
      case "tag": return <Tag className="w-4 h-4 text-cyan-400" />;
      default: return <Search className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-8 px-3 rounded-lg bg-slate-800/80 border border-slate-700/50 text-slate-400 text-sm hover:bg-slate-800 hover:text-slate-300 transition-colors"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden md:inline">Search...</span>
        <span className="hidden md:inline text-[10px] bg-slate-700/60 text-slate-500 px-1 py-0.5 rounded">⌘K</span>
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
              <Search className="w-5 h-5 text-slate-500 shrink-0" />
              <input
                value={q}
                onChange={(e) => { setQ(e.target.value); setIdx(0); }}
                onKeyDown={onKeyDown}
                placeholder="Search contacts, companies, deals, tasks, tags..."
                autoFocus
                className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none"
              />
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-slate-800 text-slate-500"><X className="w-4 h-4" /></button>
            </div>
            <div className="max-h-[50vh] overflow-y-auto">
              {results.length === 0 && q.trim() ? (
                <div className="px-4 py-8 text-center text-sm text-slate-500">No results for "{q}"</div>
              ) : (
                <div className="py-2">
                  {results.map((it, i) => (
                    <button
                      key={`${it.type}-${it.id}`}
                      onClick={() => navigate(it.href)}
                      className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                        i === idx ? "bg-slate-800" : "hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">{iconFor(it.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-200 truncate">{it.label}</div>
                        <div className="text-xs text-slate-500 truncate">{it.sub}</div>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded shrink-0">{it.type}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="px-4 py-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-600">
              <div className="flex items-center gap-3">
                <span>↑↓ navigate</span>
                <span>↵ open</span>
                <span>esc close</span>
              </div>
              <span>{results.length} result{results.length === 1 ? "" : "s"}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
