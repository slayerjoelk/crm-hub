"use client";

import { useState, useMemo } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
} from "lucide-react";

export type Column<T> = {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  width?: string;
};

type BulkAction = {
  label: string;
  icon: React.ReactNode;
  action: (ids: string[]) => void;
  danger?: boolean;
};

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  rowKey,
  onRowClick,
  searchable = true,
  pageSize = 25,
  bulkActions = null,
}: {
  columns: Column<T>[];
  data: T[];
  rowKey: keyof T;
  onRowClick?: (row: T) => void;
  searchable?: boolean;
  pageSize?: number;
  bulkActions?: BulkAction[] | null;
}) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [showFilters, setShowFilters] = useState(false);

  const filterableKeys = useMemo(() => {
    // Exclude id/internal columns so we don't surface raw UUIDs as filter dropdowns
    const isInternal = (k: string) => k === "id" || /Id$/.test(k) || k === "createdAt" || k === "updatedAt" || k === "notes" || k === "avatarUrl";
    const keys = new Set<string>();
    data.forEach((row) => {
      Object.keys(row).forEach((k) => {
        if (isInternal(k)) return;
        if (typeof row[k] === "string" && row[k].length < 40) keys.add(k);
      });
    });
    return Array.from(keys);
  }, [data]);

  const filtered = useMemo(() => {
    let list = [...data];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((row) =>
        columns.some((col) => {
          const v = String(row[col.key] ?? "").toLowerCase();
          return v.includes(q);
        })
      );
    }
    Object.entries(filters).forEach(([key, vals]) => {
      if (vals.length) list = list.filter((row) => vals.includes(String(row[key])));
    });
    if (sortKey) {
      list.sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        return (av < bv ? -1 : 1) * (sortDir === "asc" ? 1 : -1);
      });
    }
    return list;
  }, [data, search, sortKey, sortDir, filters, columns]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentRows = filtered.slice(page * pageSize, (page + 1) * pageSize);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function toggleAll() {
    const currentIds = currentRows.map((r) => String(r[rowKey]));
    const allSelected = currentIds.every((id) => selected.has(id));
    const next = new Set(selected);
    if (allSelected) {
      currentIds.forEach((id) => next.delete(id));
    } else {
      currentIds.forEach((id) => next.add(id));
    }
    setSelected(next);
  }

  function toggleRow(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  const uniqueValues = (key: string) =>
    [...new Set(data.map((r) => String(r[key] ?? "")))].sort();

  const isNameColumn = (col: Column<T>) =>
    col.key === "name" || col.key === "title" || col.key === "firstName";

  return (
    <div className="space-y-3">
      {/* Top controls */}
      <div className="flex items-center justify-between gap-3">
        {searchable && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#62666d]" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="w-full h-9 pl-9 pr-4 rounded-md border text-[13px] font-normal bg-transparent placeholder-[#62666d] text-[#d0d6e0] focus:outline-none focus:ring-1 focus:ring-[rgba(94,106,210,0.3)]"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          {filterableKeys.length > 0 && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="h-9 px-3 rounded-md text-[13px] font-medium flex items-center gap-2 border hover:bg-[rgba(255,255,255,0.02)] text-[#8a8f98] hover:text-[#d0d6e0] transition-colors"
              style={{ backgroundColor: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}
            >
              <Filter className="w-3.5 h-3.5" /> Filters
            </button>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && bulkActions && (
        <div
          className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all"
          style={{
            backgroundColor: "#191a1b",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <span className="text-[12px] font-medium text-[#62666d]">
            {selected.size} selected
          </span>
          <div className="h-3 w-px bg-[rgba(255,255,255,0.06)]" />
          {bulkActions.map((a, i) => (
            <button
              key={i}
              onClick={() => {
                a.action(Array.from(selected));
                setSelected(new Set());
              }}
              className={`h-7 px-2.5 rounded-md text-[12px] font-medium flex items-center gap-1.5 transition-colors ${
                a.danger
                  ? "text-[#ef4444] hover:bg-[rgba(239,68,68,0.08)]"
                  : "text-[#d0d6e0] hover:bg-[rgba(255,255,255,0.04)]"
              }`}
            >
              {a.icon}
              {a.label}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      {showFilters && filterableKeys.length > 0 && (
        <div
          className="flex flex-wrap gap-2 p-3 rounded-lg"
          style={{
            backgroundColor: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {filterableKeys.slice(0, 5).map((key) => (
            <div key={key} className="relative group">
              <select
                onChange={(e) => {
                  const val = e.target.value;
                  setFilters((prev) => ({ ...prev, [key]: val ? [val] : [] }));
                  setPage(0);
                }}
                className="h-8 px-3 pr-7 rounded-md text-[12px] text-[#d0d6e0] appearance-none cursor-pointer focus:outline-none"
                style={{
                  backgroundColor: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <option value="" style={{ backgroundColor: "#191a1b" }}>
                  {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                </option>
                {uniqueValues(key).map((v) => (
                  <option key={v} value={v} style={{ backgroundColor: "#191a1b" }}>
                    {v || "(empty)"}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <button
            onClick={() => setFilters({})}
            className="h-8 px-3 rounded-md text-[12px] text-[#62666d] hover:text-[#d0d6e0] flex items-center gap-1 hover:bg-[rgba(255,255,255,0.02)] transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Clear
          </button>
        </div>
      )}

      {/* Table in an elevated card for depth */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.07] bg-gradient-to-b from-[#141517] to-[#0f1011]">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/[0.02]" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              {bulkActions && (
                <th className="px-3 py-2.5 w-8">
                  <input
                    type="checkbox"
                    checked={
                      currentRows.length > 0 &&
                      currentRows.every((r) => selected.has(String(r[rowKey])))
                    }
                    onChange={toggleAll}
                    className="rounded border focus:ring-0 focus:outline-none"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.03)",
                      borderColor: "rgba(255,255,255,0.14)",
                      accentColor: "#5e6ad2",
                    }}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-2.5 whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.04em] text-[#8a8f98]"
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.sortable !== false ? (
                    <button
                      onClick={() => toggleSort(col.key)}
                      className="flex items-center gap-1 hover:text-[#d0d6e0] transition-colors"
                    >
                      {col.label}
                      {sortKey === col.key ? (
                        sortDir === "asc" ? (
                          <ArrowUp className="w-3 h-3 text-[#5e6ad2]" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-[#5e6ad2]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentRows.map((row) => {
              const id = String(row[rowKey]);
              const isSelected = selected.has(id);
              return (
                <tr
                  key={id}
                  onClick={() => onRowClick?.(row)}
                  className="transition-colors cursor-pointer"
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    backgroundColor: isSelected
                      ? "rgba(94,106,210,0.08)"
                      : undefined,
                    borderLeft: isSelected
                      ? "2px solid #5e6ad2"
                      : "2px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                        "rgba(255,255,255,0.02)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                        "transparent";
                    }
                  }}
                >
                  {bulkActions && (
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(id)}
                        onChange={() => toggleRow(id)}
                        className="rounded border focus:ring-0 focus:outline-none"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.03)",
                          borderColor: "rgba(255,255,255,0.14)",
                          accentColor: "#5e6ad2",
                        }}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-4 py-3 whitespace-nowrap text-[13px] font-normal tabular-nums"
                      style={{
                        color: isNameColumn(col) ? "#f7f8f8" : "#d0d6e0",
                        fontWeight: isNameColumn(col) ? 510 : 400,
                      }}
                    >
                      {col.render ? (
                        col.render(row)
                      ) : (
                        <span>{row[col.key] ?? "-"}</span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
            {currentRows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + (bulkActions ? 1 : 0)}
                  className="px-4 py-12 text-center text-[13px] text-[#62666d]"
                >
                  No results found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-[12px] font-medium text-[#62666d]">
            Showing {(page * pageSize) + 1}-
            {Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-md hover:bg-[rgba(255,255,255,0.04)] text-[#62666d] hover:text-[#d0d6e0] disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p = i;
              if (totalPages > 5 && page > 2) p = page + i - 2;
              if (p >= totalPages) return null;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className="w-8 h-8 rounded-md text-[12px] font-medium transition-colors"
                  style={{
                    color: page === p ? "#5e6ad2" : "#62666d",
                    backgroundColor:
                      page === p ? "rgba(94,106,210,0.08)" : "transparent",
                    border:
                      page === p
                        ? "1px solid rgba(94,106,210,0.2)"
                        : "1px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (page !== p) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                        "rgba(255,255,255,0.04)";
                      (e.currentTarget as HTMLButtonElement).style.color = "#d0d6e0";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (page !== p) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                        "transparent";
                      (e.currentTarget as HTMLButtonElement).style.color = "#62666d";
                    }
                  }}
                >
                  {p + 1}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="p-1.5 rounded-md hover:bg-[rgba(255,255,255,0.04)] text-[#62666d] hover:text-[#d0d6e0] disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
