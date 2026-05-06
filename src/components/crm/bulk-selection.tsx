"use client";

import { useState, useCallback, createContext, useContext, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Tag, Download, X, CheckSquare, Square, ChevronDown } from "lucide-react";

interface BulkSelectionContextType {
  selected: Set<string>;
  select: (id: string) => void;
  deselect: (id: string) => void;
  toggle: (id: string) => void;
  selectAll: (ids: string[]) => void;
  deselectAll: () => void;
  isSelected: (id: string) => boolean;
  hasSelection: boolean;
  count: number;
}

const BulkContext = createContext<BulkSelectionContextType | null>(null);

export function useBulkSelection() {
  const ctx = useContext(BulkContext);
  if (!ctx) throw new Error("useBulkSelection must be used within BulkProvider");
  return ctx;
}

export function BulkProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const select = useCallback((id: string) => setSelected(s => new Set([...s, id])), []);
  const deselect = useCallback((id: string) => setSelected(s => { const n = new Set(s); n.delete(id); return n; }), []);
  const toggle = useCallback((id: string) => setSelected(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; }), []);
  const selectAll = useCallback((ids: string[]) => setSelected(new Set(ids)), []);
  const deselectAll = useCallback(() => setSelected(new Set()), []);
  const isSelected = useCallback((id: string) => selected.has(id), [selected]);

  return (
    <BulkContext.Provider value={{
      selected, select, deselect, toggle, selectAll, deselectAll, isSelected,
      hasSelection: selected.size > 0,
      count: selected.size,
    }}>
      {children}
    </BulkContext.Provider>
  );
}

export function BulkActionBar({
  onDelete,
  onTag,
  onExport,
  onAssign,
}: {
  onDelete?: (ids: string[]) => void | Promise<void>;
  onTag?: (ids: string[]) => void | Promise<void>;
  onExport?: (ids: string[]) => void | Promise<void>;
  onAssign?: (ids: string[]) => void | Promise<void>;
}) {
  const { count, selected, deselectAll } = useBulkSelection();
  const [loading, setLoading] = useState<string | null>(null);

  if (count === 0) return null;

  const ids = Array.from(selected);

  const run = async (key: string, fn?: (ids: string[]) => void | Promise<void>) => {
    if (!fn) return;
    setLoading(key);
    await fn(ids);
    setLoading(null);
    deselectAll();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-elevated border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-sm"
      >
        <div className="flex items-center gap-2 px-2 border-r border-white/[0.06]">
          <CheckSquare className="w-4 h-4 text-brand" />
          <span className="text-[13px] font-medium text-secondary">{count} selected</span>
          <button onClick={deselectAll} className="p-1 rounded hover:bg-white/[0.04] text-faint hover:text-muted transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          {onDelete && (
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => run("delete", onDelete)} disabled={loading === "delete"} className="h-7 px-2.5 rounded-md text-[11px] font-medium text-danger bg-danger/5 hover:bg-danger/10 border border-danger/10 hover:border-danger/20 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </motion.button>
          )}
          {onTag && (
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => run("tag", onTag)} disabled={loading === "tag"} className="h-7 px-2.5 rounded-md text-[11px] font-medium text-secondary bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Tag className="w-3.5 h-3.5" /> Tag
            </motion.button>
          )}
          {onExport && (
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => run("export", onExport)} disabled={loading === "export"} className="h-7 px-2.5 rounded-md text-[11px] font-medium text-secondary bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </motion.button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export function SelectCheckbox({ id }: { id: string }) {
  const { isSelected, toggle } = useBulkSelection();
  const checked = isSelected(id);

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={(e) => { e.stopPropagation(); toggle(id); }}
      className={[
        "w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0",
        checked ? "bg-brand border-brand" : "border-white/[0.15] hover:border-white/[0.30] bg-transparent",
      ].join(" ")}
    >
      {checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
    </motion.button>
  );
}
