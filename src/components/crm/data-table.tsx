"use client";

import { useState, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Trash2, RefreshCw, ChevronLeft, ChevronRight, Filter } from "lucide-react";

type Column<T> = {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  width?: string;
};

export function DataTable<T extends Record<string, any>>({
  columns, data, rowKey, onRowClick, searchable=true, pageSize=25,
  bulkActions = null,
}: {
  columns: Column<T>[];
  data: T[];
  rowKey: keyof T;
  onRowClick?: (row: T) => void;
  searchable?: boolean;
  pageSize?: number;
  bulkActions?: { label: string; icon: React.ReactNode; action: (ids: string[]) => void; danger?: boolean }[] | null;
}) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string|null>(null);
  const [sortDir, setSortDir] = useState<"asc"|"desc">("asc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [showFilters, setShowFilters] = useState(false);

  const filterableKeys = useMemo(() => {
    const keys = new Set<string>();
    data.forEach(row => {
      Object.keys(row).forEach(k => {
        if (typeof row[k] === "string" && row[k].length < 40) keys.add(k);
      });
    });
    return Array.from(keys);
  }, [data]);

  const filtered = useMemo(() => {
    let list = [...data];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(row => columns.some(col => {
        const v = String(row[col.key] ?? "").toLowerCase();
        return v.includes(q);
      }));
    }
    Object.entries(filters).forEach(([key, vals]) => {
      if (vals.length) list = list.filter(row => vals.includes(String(row[key])));
    });
    if (sortKey) {
      list.sort((a, b) => {
        const av = a[sortKey]; const bv = b[sortKey];
        if (av == null && bv == null) return 0; if (av == null) return 1; if (bv == null) return -1;
        return (av < bv ? -1 : 1) * (sortDir === "asc" ? 1 : -1);
      });
    }
    return list;
  }, [data, search, sortKey, sortDir, filters, columns]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice(page * pageSize, (page + 1) * pageSize);

  function toggleSort(key: string) {
    if (sortKey === key) { setSortDir(prev => prev === "asc" ? "desc" : "asc"); }
    else { setSortKey(key); setSortDir("asc"); }
  }

  function toggleAll() {
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map(r => String(r[rowKey]))));
  }

  function toggleRow(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  }

  const uniqueValues = (key: string) => [...new Set(data.map(r => String(r[key] ?? "")))].sort();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        {searchable && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" placeholder="Search..." value={search} onChange={e=>{setSearch(e.target.value); setPage(0);}}
              className="w-full h-9 pl-9 pr-4 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
          </div>
        )}
        <div className="flex items-center gap-2">
          {filterableKeys.length > 0 && (
            <button onClick={()=>setShowFilters(!showFilters)} className="h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-sm flex items-center gap-2 hover:bg-slate-800">
              <Filter className="w-4 h-4"/> Filters
            </button>
          )}
          {selected.size > 0 && bulkActions && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{selected.size} selected</span>
              {bulkActions.map((a, i) => (
                <button key={i} onClick={()=>{ a.action(Array.from(selected)); setSelected(new Set()); }}
                  className={`h-9 px-3 rounded-lg text-sm font-medium flex items-center gap-1.5 ${a.danger ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>
                  {a.icon}{a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {showFilters && filterableKeys.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
          {filterableKeys.slice(0, 5).map(key => (
            <div key={key} className="relative group">
              <select onChange={e => {
                const val = e.target.value;
                setFilters(prev => ({ ...prev, [key]: val ? [val] : [] }));
              }} className="h-8 px-3 pr-7 rounded-md bg-slate-800 border border-slate-700 text-xs text-slate-300 appearance-none cursor-pointer hover:border-slate-600">
                <option value="">{key.replace(/([A-Z])/g," $1").replace(/^./,s=>s.toUpperCase())}</option>
                {uniqueValues(key).map(v => <option key={v} value={v}>{v || "(empty)"}</option>)}
              </select>
            </div>
          ))}
          <button onClick={()=>setFilters({})} className="h-8 px-3 rounded-md text-xs text-slate-400 hover:bg-slate-800 flex items-center gap-1"><RefreshCw className="w-3 h-3"/> Clear</button>
        </div>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-800/40">
              <tr>
                {bulkActions && <th className="px-3 py-3 w-8"><input type="checkbox" checked={rows.length>0 && selected.size===rows.length} onChange={toggleAll} className="rounded bg-slate-800 border-slate-600 text-emerald-500 focus:ring-emerald-500/40"/></th>}
                {columns.map(col => (
                  <th key={col.key} className="px-4 py-3 font-medium whitespace-nowrap" style={col.width ? {width:col.width} : undefined}>
                    {col.sortable !== false ? (
                      <button onClick={()=>toggleSort(col.key)} className="flex items-center gap-1 hover:text-slate-300 transition-colors">
                        {col.label}
                        {sortKey===col.key ? (sortDir==="asc" ? <ArrowUp className="w-3 h-3 text-emerald-400"/> : <ArrowDown className="w-3 h-3 text-emerald-400"/>) : <ArrowUpDown className="w-3 h-3 opacity-30"/>}
                      </button>
                    ) : col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {rows.map(row => (
                <tr key={String(row[rowKey])} className={`transition-colors ${onRowClick ? "cursor-pointer hover:bg-slate-800/30" : ""}`} onClick={()=>onRowClick?.(row)}>
                  {bulkActions && <td className="px-3 py-3"><input type="checkbox" checked={selected.has(String(row[rowKey]))} onChange={(e)=>{ e.stopPropagation(); toggleRow(String(row[rowKey])); }} className="rounded bg-slate-800 border-slate-600 text-emerald-500 focus:ring-emerald-500/40"/></td>}
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {col.render ? col.render(row) : <span className="text-slate-300">{row[col.key] ?? "-"}</span>}
                    </td>
                  ))}
                </tr>
              ))}
              {rows.length===0 && <tr><td colSpan={columns.length + (bulkActions?1:0)} className="px-4 py-12 text-center text-slate-600">No results found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500">Showing {(page*pageSize)+1}-{Math.min((page+1)*pageSize,filtered.length)} of {filtered.length}</div>
          <div className="flex items-center gap-1">
            <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 disabled:opacity-30"><ChevronLeft className="w-4 h-4"/></button>
            {Array.from({length:Math.min(5,totalPages)},(_,i) => {
              let p = i;
              if (totalPages > 5 && page > 2) p = page + i - 2;
              if (p >= totalPages) return null;
              return <button key={p} onClick={()=>setPage(p)} className={`w-8 h-8 rounded-md text-xs font-medium ${page===p ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-slate-400 hover:bg-slate-800"}`}>{p+1}</button>;
            })}
            <button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page===totalPages-1} className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 disabled:opacity-30"><ChevronRight className="w-4 h-4"/></button>
          </div>
        </div>
      )}
    </div>
  );
}
