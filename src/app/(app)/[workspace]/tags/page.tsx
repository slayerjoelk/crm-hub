"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Check, Tag } from "lucide-react";

interface TagItem {
  id: string;
  name: string;
  color: string;
  createdAt?: string;
}

const PRESET_COLORS = [
  "#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1",
  "#14B8A6", "#D946EF", "#EAB308", "#78716C", "#475569",
];

function tagStyle(color: string) {
  return { backgroundColor: `${color}20`, color, border: `1px solid ${color}40` };
}

export default function TagsPage() {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadTags() {
    try {
      const res = await fetch("/api/tags");
      const json = await res.json();
      if (json.success) setTags(json.data);
    } catch (e) {
      console.error("Failed to load tags", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTags(); }, []);

  async function createTag() {
    if (!newName.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      });
      const json = await res.json();
      if (json.success) {
        setTags((prev) => [...prev, json.data]);
        setNewName("");
        setNewColor(PRESET_COLORS[0]);
        setCreating(false);
      }
    } finally { setBusy(false); }
  }

  async function updateTag(id: string) {
    if (!editName.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/tags/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), color: editColor }),
      });
      const json = await res.json();
      if (json.success) {
        setTags((prev) => prev.map((t) => (t.id === id ? json.data : t)));
        setEditingId(null);
      }
    } finally { setBusy(false); }
  }

  async function deleteTag(id: string) {
    if (!confirm("Delete this tag? It will be removed from all records.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/tags/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) setTags((prev) => prev.filter((t) => t.id !== id));
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
            <Tag className="w-6 h-6 text-emerald-400" /> Tags
          </h1>
          <p className="text-sm text-slate-400 mt-1">Organize contacts, companies, and deals with tags.</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Tag
        </button>
      </div>

      {creating && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1">Tag name</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. VIP, Warm Lead, Churn Risk"
                className="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Color</label>
              <div className="flex items-center gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${newColor === c ? "border-white scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={createTag}
                disabled={busy || !newName.trim()}
                className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-500 disabled:opacity-50"
              >
                <Check className="w-4 h-4" /> Save
              </button>
              <button
                onClick={() => { setCreating(false); setNewName(""); }}
                className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-slate-800 text-slate-300 text-sm hover:bg-slate-700"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tags.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Tag className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No tags yet. Create your first tag above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tags.map((tag) => (
            <div key={tag.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              {editingId === tag.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 h-8 px-2 rounded bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                    autoFocus
                  />
                  <div className="flex gap-1">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setEditColor(c)}
                        className={`w-5 h-5 rounded-full border-2 ${editColor === c ? "border-white" : "border-transparent"}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <button onClick={() => updateTag(tag.id)} disabled={busy} className="text-emerald-400 hover:text-emerald-300">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-slate-500 hover:text-slate-300">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                    style={tagStyle(tag.color)}
                  >
                    {tag.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setEditingId(tag.id); setEditName(tag.name); setEditColor(tag.color); }}
                      className="w-7 h-7 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteTag(tag.id)}
                      className="w-7 h-7 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
