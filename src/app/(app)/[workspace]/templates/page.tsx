"use client";

import { useEffect, useState } from "react";
import { Mail, Plus, Trash2, X, FileText, Copy, CheckCircle2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = ["cold_outreach", "follow_up", "nurture", "onboarding", "newsletter", "transactional", "custom"];
const MERGE_TAGS = ["{{firstName}}", "{{lastName}}", "{{name}}", "{{email}}", "{{company}}"];

const inputCls = "w-full h-9 px-3 rounded-lg bg-[#08090a] border border-white/[0.08] text-[13px] text-[#d0d6e0] placeholder-[#62666d] focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]/40";
const labelCls = "text-[11px] font-medium text-[#8a8f98] uppercase tracking-wide mb-1.5 block";

interface Tpl { id: string; name: string; subject: string; body: string; category: string; useCount?: number; }

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Tpl[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Tpl | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/templates", { credentials: "include" }).then(r => r.json());
      setTemplates(r.data || []);
    } catch {}
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function remove(t: Tpl) {
    if (!confirm(`Delete template "${t.name}"?`)) return;
    await fetch(`/api/templates/${t.id}`, { method: "DELETE", credentials: "include" });
    load();
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5e6ad2] to-[#828fff] flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-[#f7f8f8] tracking-tight">Email Templates</h1>
          </div>
          <p className="text-[13px] text-[#8a8f98] mt-1">Reusable emails for sequences, workflows, and one-off sends. Supports merge tags.</p>
        </div>
        <button onClick={() => setEditing({ id: "", name: "", subject: "", body: "", category: "custom" })} className="h-9 px-4 rounded-lg bg-gradient-to-r from-[#5e6ad2] to-[#828fff] text-white text-[13px] font-medium flex items-center gap-2 hover:shadow-lg hover:shadow-[#5e6ad2]/20 transition-all">
          <Plus className="w-4 h-4" /> New template
        </button>
      </div>

      {loading ? <div className="text-[13px] text-[#62666d]">Loading…</div>
      : templates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/[0.10] p-12 text-center">
          <Mail className="w-8 h-8 text-[#5e6ad2] mx-auto mb-3" />
          <h3 className="text-[15px] font-semibold text-[#f7f8f8] mb-1">No templates yet</h3>
          <p className="text-[13px] text-[#8a8f98]">Create reusable emails to drop into sequences and workflows.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {templates.map(t => (
            <motion.div key={t.id} layout className="rounded-xl bg-[#0f1011] border border-white/[0.06] p-4 hover:border-white/[0.10] transition-colors">
              <div className="flex items-start justify-between gap-2 mb-2">
                <button onClick={() => setEditing(t)} className="text-left flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-[#f7f8f8] truncate">{t.name}</div>
                  <div className="text-[12px] text-[#8a8f98] truncate mt-0.5">{t.subject}</div>
                </button>
                <button onClick={() => remove(t)} className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[#8a8f98] hover:text-red-400 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <p className="text-[12px] text-[#62666d] line-clamp-2 mb-2">{t.body}</p>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#5e6ad2]/10 text-[#9aa4f2]">{t.category}</span>
                {!!t.useCount && <span className="text-[10px] text-[#62666d]">used {t.useCount}×</span>}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {editing && <TemplateEditor initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
      </AnimatePresence>
    </div>
  );
}

function TemplateEditor({ initial, onClose, onSaved }: { initial: Tpl; onClose: () => void; onSaved: () => void; }) {
  const [t, setT] = useState<Tpl>(initial);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const isEdit = !!initial.id;

  async function save() {
    if (!t.name.trim() || !t.subject.trim() || !t.body.trim()) { setErr("Name, subject and body are required"); return; }
    setSaving(true); setErr("");
    try {
      const res = await fetch(isEdit ? `/api/templates/${t.id}` : "/api/templates", {
        method: isEdit ? "PATCH" : "POST", credentials: "include",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(t),
      });
      const json = await res.json();
      if (!res.ok) { setErr(json.error || "Save failed"); setSaving(false); return; }
      onSaved();
    } catch (e: any) { setErr(e.message); setSaving(false); }
  }

  function insertTag(tag: string) { setT(prev => ({ ...prev, body: (prev.body || "") + " " + tag })); }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-10 px-4">
      <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }}
        className="w-full max-w-xl rounded-2xl bg-[#0f1011] border border-white/[0.08] shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-[15px] font-semibold text-[#f7f8f8]">{isEdit ? "Edit template" : "New template"}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#8a8f98] hover:bg-white/[0.06]"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Name</label><input className={inputCls} value={t.name} onChange={e => setT({ ...t, name: e.target.value })} placeholder="Intro email" /></div>
            <div><label className={labelCls}>Category</label>
              <select className={inputCls} value={t.category} onChange={e => setT({ ...t, category: e.target.value })}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
            </div>
          </div>
          <div><label className={labelCls}>Subject</label><input className={inputCls} value={t.subject} onChange={e => setT({ ...t, subject: e.target.value })} placeholder="Hi {{firstName}} 👋" /></div>
          <div>
            <label className={labelCls}>Body</label>
            <textarea className={`${inputCls} h-40 py-2.5`} value={t.body} onChange={e => setT({ ...t, body: e.target.value })} placeholder={"Hi {{firstName}},\n\n…"} />
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="text-[10px] text-[#62666d]">Insert:</span>
              {MERGE_TAGS.map(tag => <button key={tag} onClick={() => insertTag(tag)} className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-white/[0.04] border border-white/[0.06] text-[#9aa4f2] hover:bg-white/[0.08]">{tag}</button>)}
            </div>
          </div>
          {err && <div className="flex items-center gap-2 text-[12px] text-red-400"><AlertTriangle className="w-3.5 h-3.5" />{err}</div>}
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-white/[0.06]">
          <button onClick={onClose} className="h-9 px-4 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[#d0d6e0] text-[13px] font-medium hover:bg-white/[0.06]">Cancel</button>
          <button onClick={save} disabled={saving} className="h-9 px-4 rounded-lg bg-gradient-to-r from-[#5e6ad2] to-[#828fff] text-white text-[13px] font-medium flex items-center gap-2 hover:shadow-lg disabled:opacity-50">
            <CheckCircle2 className="w-4 h-4" /> {saving ? "Saving…" : "Save template"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
