"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Tag, Plus, Trash2 } from "lucide-react";

export interface TagItem {
  id: string;
  name: string;
  color: string;
  useCount?: number;
}

export function TagChip({ tag, onRemove }: { tag: TagItem; onRemove?: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border"
      style={{
        backgroundColor: `${tag.color}15`,
        borderColor: `${tag.color}30`,
        color: tag.color,
      }}
    >
      {tag.name}
      {onRemove && (
        <button onClick={onRemove} className="ml-0.5 hover:opacity-70">
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

const PRESET_COLORS = [
  "#3b82f6","#ef4444","#f59e0b","#10b981","#8b5cf6","#ec4899",
  "#06b6d4","#f97316","#6366f1","#14b8a6","#84cc16","#d946ef",
];

export function TagManager({
  entityType,
  entityId,
  entityTags,
  onChange,
}: {
  entityType?: "contact" | "company" | "deal";
  entityId?: string;
  entityTags?: TagItem[];
  onChange?: (tags: TagItem[]) => void;
}) {
  const [allTags, setAllTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0]);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const isEntityMode = !!entityType && !!entityId;
  const currentTags = entityTags || allTags;

  async function loadTags() {
    setLoading(true);
    const res = await fetch("/api/tags");
    const json = await res.json();
    setAllTags(json.data || []);
    setLoading(false);
  }

  useEffect(() => { loadTags(); }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function createTag(name: string, color: string) {
    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });
    const json = await res.json();
    await loadTags();
    if (isEntityMode && onChange) {
      // Attach new tag to entity
      await fetch("/api/tags/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, entityId, tagIds: [json.data.id] }),
      });
      const updated = await fetchEntityTags();
      onChange(updated);
    }
    return json.data as TagItem;
  }

  async function fetchEntityTags() {
    const res = await fetch(`/api/tags?entityType=${entityType}&entityId=${entityId}`);
    const json = await res.json();
    return (json.data || []) as TagItem[];
  }

  async function applyTag(tag: TagItem) {
    if (!isEntityMode) return;
    await fetch("/api/tags/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entityType, entityId, tagIds: [tag.id] }),
    });
    const updated = await fetchEntityTags();
    onChange?.(updated);
    setQuery("");
    setShowDropdown(false);
  }

  async function removeTag(tag: TagItem) {
    if (!isEntityMode) return;
    await fetch("/api/tags/apply", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entityType, entityId, tagIds: [tag.id] }),
    });
    const updated = await fetchEntityTags();
    onChange?.(updated);
  }

  async function deleteTagFromWorkspace(tag: TagItem) {
    if (!confirm(`Delete tag "${tag.name}"? It will be removed from all entities.`)) return;
    await fetch(`/api/tags/${tag.id}`, { method: "DELETE" });
    await loadTags();
    if (isEntityMode) {
      const updated = await fetchEntityTags();
      onChange?.(updated);
    }
  }

  const filtered = allTags.filter(
    t => t.name.toLowerCase().includes(query.toLowerCase()) &&
         !currentTags?.some(ct => ct.id === t.id)
  );

  const displayCount = 8;
  const visibleTags = currentTags.slice(0, displayCount);
  const overflow = currentTags.length > displayCount;

  return (
    <div ref={wrapperRef} className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {visibleTags.map(tag => (
          <TagChip
            key={tag.id}
            tag={tag}
            onRemove={isEntityMode ? () => removeTag(tag) : undefined}
          />
        ))}
        {overflow && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border border-slate-700 text-slate-400 bg-slate-800/50">
            +{currentTags.length - displayCount}
          </span>
        )}

        {isEntityMode && (
          <button
            onClick={() => {
              setShowDropdown(true);
              setTimeout(() => inputRef.current?.focus(), 0);
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-slate-400 transition-colors"
          >
            <Plus className="w-3 h-3" /> Tag
          </button>
        )}
      </div>

      {isEntityMode && showDropdown && (
        <div className="relative">
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search or create tag..."
            className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/60"
          />
          <div className="absolute top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 shadow-xl z-50">
            {loading && <div className="p-4 text-center text-xs text-slate-500">Loading tags...</div>}
            {!loading && filtered.length === 0 && (
              <button
                onClick={() => {
                  setShowDropdown(false);
                  setNewTagName(query);
                  setShowAdd(true);
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 transition-colors text-left"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                Create "{query}"
              </button>
            )}
            {filtered.map(tag => (
              <button
                key={tag.id}
                onClick={() => applyTag(tag)}
                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-800 transition-colors text-left"
              >
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                <span className="text-sm text-slate-200">{tag.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {showAdd && (
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-3 space-y-2">
          <input
            value={newTagName}
            onChange={e => setNewTagName(e.target.value)}
            placeholder="Tag name"
            className="w-full h-9 px-3 rounded bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/60"
          />
          <div className="flex items-center gap-1.5">
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setNewTagColor(c)}
                className={`w-5 h-5 rounded-full border-2 transition-all ${newTagColor === c ? "border-white scale-110" : "border-transparent hover:scale-110"}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button onClick={() => setShowAdd(false)} className="h-8 px-3 rounded text-xs text-slate-400 hover:text-white">Cancel</button>
            <button
              onClick={() => { createTag(newTagName, newTagColor); setShowAdd(false); setNewTagName(""); }}
              disabled={!newTagName.trim()}
              className="h-8 px-3 rounded bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 disabled:opacity-40"
            >
              Create Tag
            </button>
          </div>
        </div>
      )}

      {!isEntityMode && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden mt-4">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-semibold text-white">All Tags</span>
            </div>
            <button onClick={() => setShowAdd(s => !s)} className="h-8 px-3 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 transition-colors">
              Add Tag
            </button>
          </div>
          <div className="divide-y divide-slate-800">
            {allTags.map(tag => (
              <div key={tag.id} className="px-5 py-2.5 flex items-center gap-3">
                <TagChip tag={tag} />
                <span className="text-xs text-slate-500 ml-auto">{tag.useCount ?? 0} uses</span>
                <button onClick={() => deleteTagFromWorkspace(tag)} className="p-1.5 rounded hover:bg-red-500/10 text-slate-600 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {!allTags.length && <div className="px-5 py-8 text-center text-sm text-slate-600">No tags yet.</div>}
          </div>
        </div>
      )}
    </div>
  );
}
