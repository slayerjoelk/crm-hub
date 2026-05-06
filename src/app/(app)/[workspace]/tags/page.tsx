"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, AlertTriangle } from "lucide-react";

const presetColors = [
  "#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1",
  "#14B8A6", "#D946EF", "#EAB308", "#78716C", "#475569",
];

function tagStyle(color: string) {
  return {
    backgroundColor: `${color}20`,
    color,
    border: `1px solid ${color}40`,
    borderRadius: "9999px",
    padding: "4px 12px",
    fontSize: "12px",
    fontWeight: 500,
    display: "inline-flex",
    alignItems: "center",
  };
}

export default function TagsPage() {
  const [tags, setTags] = useState<{ id: string; name: string; color: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(presetColors[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [busy, setBusy] = useState(false);
  const [showDelete, setShowDelete] = useState<{ id: string; name: string } | null>(null);

  async function loadTags() {
    setLoading(true);
    try {
      const res = await fetch("/api/tags", { credentials: "include" });
      const json = await res.json();
      if (json.success) setTags(json.data);
    } catch (e) { console.error("Failed to load tags", e); }
    setLoading(false);
  }

  useEffect(() => { loadTags(); }, []);

  async function createTag() {
    if (!newName.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/tags", {
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      });
      const json = await res.json();
      if (json.success) { setTags(p => [...p, json.data]); setNewName(""); setNewColor(presetColors[0]); setCreating(false); }
    } finally { setBusy(false); }
  }

  async function updateTag(id: string) {
    if (!editName.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/tags/${id}`, {
        credentials: "include", method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), color: editColor }),
      });
      const json = await res.json();
      if (json.success) { setTags(p => p.map(t => t.id === id ? json.data : t)); setEditingId(null); }
    } finally { setBusy(false); }
  }

  async function deleteTag() {
    if (!showDelete || busy) return;
    setBusy(true);
    try {
      await fetch(`/api/tags/${showDelete.id}`, { credentials: "include", method: "DELETE" });
      setTags(p => p.filter(t => t.id !== showDelete.id));
    } finally { setBusy(false); setShowDelete(null); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#f7f8f8]">Tags</h1>
          <p className="text-sm text-[#8a8f98] mt-1">Organize contacts, companies, and deals with tags.</p>
        </div>
        <button onClick={() => setCreating(true)} className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#5e6ad2] text-[#f7f8f8] text-sm font-medium hover:bg-[#5e6ad2] transition-colors">
          <Plus className="w-4 h-4" /> New Tag
        </button>
      </div>

      {creating && (
        <div className="bg-[#0f1011] border border-white/[0.06] rounded-xl p-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-[#8a8f98] mb-1">Tag name</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. VIP"
                className="w-full h-9 px-3 rounded-lg bg-[#08090a] border border-white/[0.06] text-sm text-[#d0d6e0] focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]/[0.3]"
                autoFocus />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8a8f98] mb-1">Color</label>
              <div className="flex items-center gap-1.5">{presetColors.map(c => (
                <button key={c} onClick={() => setNewColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${newColor === c ? "border-white scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }} />
              ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={createTag} disabled={busy || !newName.trim()} className="h-9 px-3 rounded-lg bg-[#5e6ad2] text-[#f7f8f8] text-sm hover:bg-[#5e6ad2] disabled:opacity-50"><Plus className="w-4 h-4 inline mr-1" /> Save</button>
              <button onClick={() => { setCreating(false); setNewName(""); }} className="h-9 px-3 rounded-lg bg-[#191a1b] text-[#8a8f98] text-sm hover:bg-[#28282c]"><X className="w-4 h-4 inline mr-1" /> Cancel</button>
            </div>
          </div>
        </div>
      )}

      {tags.length === 0 && !loading ? (
        <div className="text-center py-16 border border-dashed border-white/[0.06] rounded-xl">
          <span className="text-4xl opacity-30 mb-3 block">#️⃣</span>
          <p className="text-sm text-[#62666d]">No tags yet. Create one above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tags.map(tag => (
            <div key={tag.id} className="bg-[#0f1011] border border-white/[0.06] rounded-xl p-4 flex items-center justify-between">
              {editingId === tag.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus
                    className="flex-1 h-8 px-2 rounded bg-[#08090a] border border-white/[0.06] text-sm text-[#d0d6e0] focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]/[0.3]"
                  />
                  <div className="flex gap-1">{presetColors.map(c => (
                    <button key={c} onClick={() => setEditColor(c)} className={`w-5 h-5 rounded-full border-2 ${editColor === c ? "border-white" : "border-transparent"}`} style={{ backgroundColor: c }} />
                  ))}</div>
                  <button onClick={() => updateTag(tag.id)} disabled={busy} className="text-[#10b981]">✓</button>
                  <button onClick={() => setEditingId(null)} className="text-[#62666d]">✕</button>
                </div>
              ) : (
                <>
                  <span style={tagStyle(tag.color)} className="text-xs font-medium">#{tag.name}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditingId(tag.id); setEditName(tag.name); setEditColor(tag.color); }} className="p-1.5 rounded hover:bg-[#191a1b] text-[#8a8f98]">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setShowDelete({ id: tag.id, name: tag.name })} className="p-1.5 rounded hover:bg-red-500/10 text-[#8a8f98] hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowDelete(null); }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.06] bg-[#0f1011] shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-[#f7f8f8]">Delete Tag</h3>
            <p className="text-sm text-[#8a8f98]">Are you sure you want to delete <span className="text-[#d0d6e0] font-medium">#{showDelete.name}</span>? This will be removed from all records.</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowDelete(null)} disabled={busy} className="flex-1 h-9 rounded-lg bg-[#191a1b] text-[#8a8f98] text-sm font-medium hover:bg-[#28282c] transition-colors">Cancel</button>
              <button onClick={deleteTag} disabled={busy} className="flex-1 h-9 rounded-lg bg-red-600 text-[#f7f8f8] text-sm font-medium hover:bg-red-500 transition-colors disabled:opacity-50">{busy ? "Deleting..." : "Delete"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
