"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Pencil, Trash2, X, AlertTriangle, ChevronUp, ChevronDown,
  Package, Layers, ArrowLeft, Check, GripVertical, Hash, Target
} from "lucide-react";

interface Stage {
  id: string;
  name: string;
  description: string | null;
  color: string;
  winProbability: number;
  displayOrder: number;
}

interface Pipeline {
  id: string;
  name: string;
  description: string | null;
  type: string;
  isDefault: boolean;
  color: string;
  displayOrder: number;
  createdAt: string;
  stageCount: number;
  stages?: Stage[];
}

const PRESET_COLORS = ["#4f46e5","#2563eb","#06b6d4","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#6366f1","#14b8a6"];

const inputCls = "w-full h-10 px-3 rounded-lg bg-[#0f1011] border border-white/[0.06] text-sm text-[#d0d6e0] placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]/[0.3]";
const labelCls = "block text-xs font-medium text-[#62666d] mb-1";

export default function PipelinesPage() {
  const router = useRouter();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewId, setViewId] = useState<string|null>(null);
  const [detail, setDetail] = useState<Pipeline|null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string|null>(null);
  const [showDeleteStage, setShowDeleteStage] = useState<string|null>(null);
  const [showEditStage, setShowEditStage] = useState<Stage|null>(null);
  const [form, setForm] = useState({ name: "", description: "", color: "#4f46e5" });
  const [stageForm, setStageForm] = useState<{ name: string; color: string; winProbability: number }[]>([]);
  const [error, setError] = useState<string|null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/pipelines", { credentials: "include" });
    const json = await res.json();
    setPipelines(json.data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function loadDetail(id: string) {
    setViewId(id);
    setDetailLoading(true);
    const res = await fetch(`/api/pipelines/${id}`);
    const json = await res.json();
    setDetail(json.data || null);
    setDetailLoading(false);
  }

  function openCreate() {
    setForm({ name: "", description: "", color: "#4f46e5" });
    setStageForm([
      { name: "Prospecting", color: "#94a3b8", winProbability: 10 },
      { name: "Qualification", color: "#94a3b8", winProbability: 25 },
      { name: "Proposal", color: "#94a3b8", winProbability: 50 },
      { name: "Negotiation", color: "#94a3b8", winProbability: 75 },
      { name: "Closed Won", color: "#94a3b8", winProbability: 100 },
    ]);
    setError(null);
    setShowCreate(true);
  }

  function openEdit(p: Pipeline) {
    setForm({ name: p.name, description: p.description || "", color: p.color });
    setShowEdit(true);
  }

  async function saveCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const body = {
      name: form.name.trim(),
      description: form.description || null,
      color: form.color,
      stages: stageForm.filter(s => s.name.trim()).map(s => ({ ...s, winProbability: Number(s.winProbability) || 0 })),
    };
    const res = await fetch("/api/pipelines", { credentials: "include", method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { setError(json.error || "Failed to create pipeline"); return; }
    setShowCreate(false);
    await load();
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!detail) return;
    setSaving(true);
    const res = await fetch(`/api/pipelines/${detail.id}`, { credentials: "include",
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name.trim(), description: form.description || null, color: form.color }),
    });
    setSaving(false);
    if (res.ok) {
      setShowEdit(false);
      await load();
      if (viewId === detail.id) await loadDetail(detail.id);
    }
  }

  async function del(id: string) {
    setDeletingId(id);
    await fetch(`/api/pipelines/${id}`, { credentials: "include", method: "DELETE" });
    setDeletingId(null);
    if (viewId === id) { setViewId(null); setDetail(null); }
    await load();
  }

  async function addStage() {
    if (!detail) return;
    const name = prompt("Stage name?");
    if (!name || !name.trim()) return;
    const res = await fetch(`/api/pipelines/${detail.id}/stages`, { credentials: "include",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), color: "#94a3b8", winProbability: 0 }),
    });
    if (res.ok) await loadDetail(detail.id);
  }

  async function moveStage(stageId: string, direction: number) {
    if (!detail || !detail.stages) return;
    const current = detail.stages;
    const idx = current.findIndex(s => s.id === stageId);
    if (idx === -1) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= current.length) return;
    const reordered = [...current];
    [reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];
    await fetch(`/api/pipelines/${detail.id}/stages`, { credentials: "include",
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageIds: reordered.map(s => s.id) }),
    });
    await loadDetail(detail.id);
  }

  async function updateStage(e: React.FormEvent) {
    e.preventDefault();
    if (!showEditStage || !detail) return;
    setSaving(true);
    await fetch(`/api/pipelines/${detail.id}/stages/${showEditStage.id}`, { credentials: "include",
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: showEditStage.name,
        color: showEditStage.color,
        winProbability: showEditStage.winProbability,
      }),
    });
    setSaving(false);
    setShowEditStage(null);
    await loadDetail(detail.id);
  }

  async function delStage(id: string) {
    if (!detail) return;
    await fetch(`/api/pipelines/${detail.id}/stages/${id}`, { credentials: "include", method: "DELETE" });
    setShowDeleteStage(null);
    await loadDetail(detail.id);
  }

  // ─── Render ──────────────────────────────────────────────

  if (viewId && detail) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => { setViewId(null); setDetail(null); }} className="flex items-center gap-1.5 text-sm text-[#8a8f98] hover:text-[#f7f8f8] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Pipelines
          </button>
          <div className="flex gap-2">
            <button onClick={() => openEdit(detail)} className="h-9 px-3 rounded-lg bg-[#191a1b] border border-white/[0.06] text-[#8a8f98] text-sm flex items-center gap-2 hover:bg-[#28282c] transition-colors">
              <Pencil size={14} /> Edit
            </button>
            <button onClick={() => setDeletingId(detail.id)} className="h-9 px-3 rounded-lg bg-[#191a1b] border border-white/[0.06] text-red-400 text-sm flex items-center gap-2 hover:bg-red-500/10 hover:border-red-500/30 transition-colors">
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${detail.color}20` }}>
            <Package className="w-7 h-7" style={{ color: detail.color }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-[#f7f8f8]">{detail.name}</h1>
              {detail.isDefault && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#10b981]/[0.12] text-[#10b981] border border-[#10b981]/[0.08]">Default</span>}
            </div>
            {detail.description && <p className="text-sm text-[#8a8f98] mt-1">{detail.description}</p>}
            <div className="flex items-center gap-4 mt-2 text-xs text-[#62666d]">
              <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> {detail.stages?.length || 0} stages</span>
              <span className="flex items-center gap-1"><Hash className="w-3.5 h-3.5" /> {detail.type}</span>
            </div>
          </div>
        </div>

        {/* Stages */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#f7f8f8]">Stages</h2>
            <button onClick={addStage} className="h-8 px-3 rounded-lg bg-[#5e6ad2] text-[#f7f8f8] text-xs font-medium hover:bg-[#5e6ad2] flex items-center gap-1.5 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Stage
            </button>
          </div>

          <div className="space-y-2">
            {detailLoading ? (
              <div className="p-6 text-center text-[#62666d] text-sm">Loading stages...</div>
            ) : !detail.stages || detail.stages.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-white/[0.06] bg-[#0f1011] text-[#62666d] text-sm">
                <Layers className="w-8 h-8 mx-auto mb-2 opacity-40" /> No stages yet
              </div>
            ) : (
              detail.stages.map((stage, idx) => (
                <div key={stage.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-[#0f1011] hover:border-white/[0.06] transition-colors group">
                  <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => moveStage(stage.id, -1)} disabled={idx === 0} className="text-[#62666d] hover:text-[#f7f8f8] disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5" /></button>
                    <button onClick={() => moveStage(stage.id, 1)} disabled={idx === (detail.stages?.length || 0) - 1} className="text-[#62666d] hover:text-[#f7f8f8] disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#d0d6e0]">{stage.name}</p>
                    {stage.description && <p className="text-xs text-[#62666d]">{stage.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-[#8a8f98] flex items-center gap-1"><Target className="w-3 h-3"/>{stage.winProbability}%</span>
                    <button onClick={() => setShowEditStage(stage)} className="p-1.5 rounded-lg hover:bg-[#191a1b] text-[#8a8f98] hover:text-[#f7f8f8] transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setShowDeleteStage(stage.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#8a8f98] hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#f7f8f8]">Pipelines</h1>
          <p className="text-[#62666d] text-sm mt-1">Manage deal and ticket pipelines</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#5e6ad2] text-[#f7f8f8] text-sm font-medium hover:bg-[#5e6ad2] transition-colors">
          <Plus className="w-4 h-4" /> New Pipeline
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-[#62666d] text-sm">Loading pipelines...</div>
      ) : pipelines.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-white/[0.06] bg-[#0f1011]">
          <Package className="w-12 h-12 text-[#62666d] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#f7f8f8] mb-1">No pipelines yet</h3>
          <p className="text-sm text-[#62666d] mb-6">Create your first pipeline to start tracking deals.</p>
          <button onClick={openCreate} className="h-9 px-4 rounded-lg bg-[#5e6ad2] text-[#f7f8f8] text-sm font-medium hover:bg-[#5e6ad2] transition-colors">Create Pipeline</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {pipelines.map((p) => (
            <div key={p.id} className="rounded-xl border border-white/[0.06] bg-[#0f1011] p-5 hover:border-white/[0.06] transition-colors group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${p.color}20` }}>
                    <Package className="w-5 h-5" style={{ color: p.color }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-[#f7f8f8]">{p.name}</h3>
                      {p.isDefault && <Check className="w-3.5 h-3.5 text-[#10b981]" />}
                    </div>
                    <p className="text-xs text-[#62666d] mt-0.5">{p.stageCount} stage{p.stageCount !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button onClick={() => { openEdit(p); setDetail(p); }} className="p-1.5 rounded-lg hover:bg-[#191a1b] text-[#8a8f98] hover:text-[#f7f8f8]">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeletingId(p.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#8a8f98] hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {p.description && <p className="text-xs text-[#8a8f98] mb-4 line-clamp-2">{p.description}</p>}
              <button onClick={() => loadDetail(p.id)} className="w-full h-8 rounded-lg border border-white/[0.06] text-[#8a8f98] text-xs font-medium hover:bg-[#191a1b] transition-colors">
                Manage Stages
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/[0.06] bg-[#0f1011] shadow-2xl">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
              <div className="w-8 h-8 rounded-lg bg-[#5e6ad2]/10 flex items-center justify-center"><Plus className="w-4 h-4 text-[#10b981]"/></div>
              <h2 className="text-lg font-semibold text-[#f7f8f8]">New Pipeline</h2>
              <button onClick={() => setShowCreate(false)} className="ml-auto p-1.5 rounded-lg hover:bg-[#191a1b] text-[#62666d]"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={saveCreate} className="p-6 space-y-5">
              {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2">{error}</div>}
              <div><label className={labelCls}>Name *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputCls} placeholder="Sales Pipeline" required /></div>
              <div><label className={labelCls}>Description</label><input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className={inputCls} placeholder="Track sales from first contact to close" /></div>
              <div>
                <label className={labelCls}>Color</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {PRESET_COLORS.map(c => (
                    <button type="button" key={c} onClick={() => setForm({...form, color: c})} className={`w-8 h-8 rounded-full border-2 transition-colors ${form.color === c ? "border-white scale-110" : "border-transparent hover:border-white/[0.08]"}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelCls}>Stages</label>
                {stageForm.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input value={s.name} onChange={e => { const next=[...stageForm]; next[idx].name=e.target.value; setStageForm(next); }} className={`${inputCls} flex-1`} placeholder="Stage name" />
                    <select value={s.winProbability} onChange={e => { const next=[...stageForm]; next[idx].winProbability=Number(e.target.value); setStageForm(next); }} className={`${inputCls} w-28`}>
                      {[0,10,25,50,75,90,100].map(v => <option key={v} value={v}>{v}%</option>)}
                    </select>
                    <button type="button" onClick={() => { setStageForm(prev => prev.filter((_, i) => i !== idx)); }} className="p-1.5 rounded-lg hover:bg-[#191a1b] text-[#62666d]"><X className="w-3.5 h-3.5"/></button>
                  </div>
                ))}
                <button type="button" onClick={() => setStageForm(prev => [...prev, { name: "", color: "#94a3b8", winProbability: 0 }])} className="w-full h-8 rounded-lg border border-dashed border-white/[0.06] text-[#62666d] text-xs font-medium hover:border-white/[0.10] hover:text-[#8a8f98] transition-colors flex items-center justify-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add Stage
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="h-9 px-4 rounded-lg bg-[#191a1b] text-[#8a8f98] text-sm font-medium hover:bg-[#28282c] transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="h-9 px-4 rounded-lg bg-[#5e6ad2] text-[#f7f8f8] text-sm font-medium hover:bg-[#5e6ad2] transition-colors disabled:opacity-50">{saving ? "Creating..." : "Create Pipeline"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowEdit(false); }}>
          <div className="w-full max-w-lg rounded-2xl border border-white/[0.06] bg-[#0f1011] shadow-2xl">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
              <div className="w-8 h-8 rounded-lg bg-[#5e6ad2]/10 flex items-center justify-center"><Pencil className="w-4 h-4 text-[#10b981]"/></div>
              <h2 className="text-lg font-semibold text-[#f7f8f8]">Edit Pipeline</h2>
              <button onClick={() => setShowEdit(false)} className="ml-auto p-1.5 rounded-lg hover:bg-[#191a1b] text-[#62666d]"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={saveEdit} className="p-6 space-y-4">
              <div><label className={labelCls}>Name</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputCls} required /></div>
              <div><label className={labelCls}>Description</label><input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className={inputCls} /></div>
              <div>
                <label className={labelCls}>Color</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {PRESET_COLORS.map(c => (
                    <button type="button" key={c} onClick={() => setForm({...form, color: c})} className={`w-8 h-8 rounded-full border-2 transition-colors ${form.color === c ? "border-white scale-110" : "border-transparent hover:border-white/[0.08]"}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowEdit(false)} className="h-9 px-4 rounded-lg bg-[#191a1b] text-[#8a8f98] text-sm font-medium hover:bg-[#28282c] transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="h-9 px-4 rounded-lg bg-[#5e6ad2] text-[#f7f8f8] text-sm font-medium hover:bg-[#5e6ad2] transition-colors disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Pipeline Confirmation */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) setDeletingId(null); }}>
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.06] bg-[#0f1011] shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto"><AlertTriangle className="w-5 h-5 text-red-400" /></div>
            <h3 className="text-lg font-semibold text-[#f7f8f8]">Delete Pipeline</h3>
            <p className="text-sm text-[#8a8f98]">Are you sure? This will also delete all stages. Deals using this pipeline will lose their stage reference.</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setDeletingId(null)} className="flex-1 h-9 rounded-lg bg-[#191a1b] text-[#8a8f98] text-sm font-medium hover:bg-[#28282c]">Cancel</button>
              <button onClick={() => del(deletingId)} disabled={saving} className="flex-1 h-9 rounded-lg bg-red-600 text-[#f7f8f8] text-sm font-medium hover:bg-red-500 disabled:opacity-50">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Stage Modal */}
      {showEditStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowEditStage(null); }}>
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.06] bg-[#0f1011] shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-[#f7f8f8]">Edit Stage</h3>
            <form onSubmit={updateStage} className="space-y-3">
              <div><label className={labelCls}>Name</label><input value={showEditStage.name} onChange={e => setShowEditStage({...showEditStage, name: e.target.value})} className={inputCls} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Color</label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {PRESET_COLORS.map(c => (
                      <button type="button" key={c} onClick={() => setShowEditStage({...showEditStage, color: c})} className={`w-6 h-6 rounded-full border-2 transition-colors ${showEditStage.color === c ? "border-white scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Win Probability</label>
                  <select value={showEditStage.winProbability} onChange={e => setShowEditStage({...showEditStage, winProbability: Number(e.target.value)})} className={inputCls}>
                    {[0,10,25,50,75,90,100].map(v => <option key={v} value={v}>{v}%</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowEditStage(null)} className="h-9 px-4 rounded-lg bg-[#191a1b] text-[#8a8f98] text-sm font-medium hover:bg-[#28282c]">Cancel</button>
                <button type="submit" disabled={saving} className="h-9 px-4 rounded-lg bg-[#5e6ad2] text-[#f7f8f8] text-sm font-medium hover:bg-[#5e6ad2] disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Stage Confirmation */}
      {showDeleteStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteStage(null); }}>
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.06] bg-[#0f1011] shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto"><AlertTriangle className="w-5 h-5 text-red-400" /></div>
            <h3 className="text-lg font-semibold text-[#f7f8f8]">Delete Stage</h3>
            <p className="text-sm text-[#8a8f98]">Deals in this stage will lose their stage reference. This cannot be undone.</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowDeleteStage(null)} className="flex-1 h-9 rounded-lg bg-[#191a1b] text-[#8a8f98] text-sm font-medium hover:bg-[#28282c]">Cancel</button>
              <button onClick={() => delStage(showDeleteStage)} className="flex-1 h-9 rounded-lg bg-red-600 text-[#f7f8f8] text-sm font-medium hover:bg-red-500">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
