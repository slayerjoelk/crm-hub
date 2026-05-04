"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Plus, Tag } from "lucide-react";

export interface TagItem {
  id: string;
  name: string;
  color: string;
}

const PRESET_COLORS = [
  "#ef4444","#f97316","#f59e0b","#84cc16","#10b981",
  "#06b6d4","#3b82f6","#6366f1","#8b5cf6","#d946ef",
  "#f43f5e","#94a3b8","#64748b",
];

function hexToRgba(hex: string, a: number) {
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${a})`;
}

export function TagChip({ tag, onRemove, removable = false }: { tag: TagItem; onRemove?: () => void; removable?: boolean }) {
  const bg = hexToRgba(tag.color, 0.12);
  const text = tag.color;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border border-white/5 transition-colors"
      style={{ background: bg, color: text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: tag.color }} />
      {tag.name}
      {removable && onRemove && (
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="ml-0.5 hover:opacity-70">
          <X size={10} />
        </button>
      )}
    </span>
  );
}

export function TagManager({
  entityType,
  entityId,
}: {
  entityType: "contact" | "company" | "deal";
  entityId: string;
}) {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [allTags, setAllTags] = useState<TagItem[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!entityId) return;
    const [entityRes, allRes] = await Promise.all([
      fetch(`/api/tags?entityType=${entityType}&entityId=${entityId}`).then(r => r.json()),
      fetch(`/api/tags`).then(r => r.json()),
    ]);
    setTags(entityRes.data || []);
    setAllTags(allRes.data || []);
  }, [entityType, entityId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const filtered = allTags.filter(t => t.name.toLowerCase().includes(query.toLowerCase()) && !tags.some(x => x.id === t.id));
  const canCreate = query.trim().length > 0 && !allTags.some(t => t.name.toLowerCase() === query.trim().toLowerCase());

  async function addTag(tag: TagItem) {
    await fetch(`/api/tags/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entityType, entityId, tagIds: [tag.id] }),
    });
    setTags(prev => [...prev, tag]);
    setQuery("");
  }

  async function removeTag(tagId: string) {
    await fetch(`/api/tags/apply`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entityType, entityId, tagIds: [tagId] }),
    });
    setTags(prev => prev.filter(t => t.id !== tagId));
  }

  async function createTag() {
    const name = query.trim();
    if (!name) return;
    setCreating(true);
    const res = await fetch(`/api/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)] }),
    });
    const json = await res.json();
    setCreating(false);
    if (json.data) {
      await addTag(json.data);
      setAllTags(prev => [...prev, json.data]);
    }
  }

  return (
    <div className="relative" ref={popoverRef}>
      <div className="flex flex-wrap items-center gap-2">
        {tags.map(t => <TagChip key={t.id} tag={t} removable onRemove={() => removeTag(t.id)} />)}
        <button onClick={() => setOpen(!open)} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-colors">
          <Plus size={12} /> Add tag
        </button>
      </div>
      {open && (
        <div className="absolute z-50 mt-2 w-64 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl p-3 space-y-2">
          <div className="relative">
            <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search or create tag..."
              className="w-full h-8 pl-8 pr-3 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40" />
          </div>
          {filtered.length > 0 && (
            <div className="max-h-40 overflow-y-auto space-y-1">
              {filtered.map(t => (
                <button key={t.id} onClick={() => addTag(t)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-800 text-left transition-colors">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: t.color }} />
                  <span className="text-xs text-slate-300">{t.name}</span>
                </button>
              ))}
            </div>
          )}
          {canCreate && (
            <button onClick={createTag} disabled={creating}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-800 text-left transition-colors disabled:opacity-50">
              <Plus size={14} className="text-slate-400" />
              <span className="text-xs text-slate-300">Create "{query.trim()}"</span>
            </button>
          )}
          {!canCreate && filtered.length === 0 && query.trim() === "" && (
            <div className="text-xs text-slate-500 text-center py-2">Type to search or create a tag</div>
          )}
        </div>
      )}
    </div>
  );
}
