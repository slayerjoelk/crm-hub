"use client";

import { useEffect, useState } from "react";
import {
  Workflow, Plus, Zap, Trash2, Play, Pause, X, ArrowRight,
  GitBranch, Filter, Activity, ChevronDown, CheckCircle2, AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Catalog ────────────────────────────────────────────────
const TRIGGERS: { value: string; label: string; hint: string }[] = [
  { value: "contact_created", label: "Contact created", hint: "A new contact/lead enters the CRM" },
  { value: "lead_score_threshold", label: "Lead score reaches…", hint: "Score crosses a threshold" },
  { value: "contact_replied", label: "Contact replied", hint: "An inbound reply is received" },
  { value: "email_opened", label: "Email opened", hint: "Contact opens a tracked email" },
  { value: "email_clicked", label: "Email clicked", hint: "Contact clicks a link" },
  { value: "email_bounced", label: "Email bounced", hint: "An email hard-bounces" },
  { value: "tag_added", label: "Tag added", hint: "A specific tag is applied" },
  { value: "deal_created", label: "Deal created", hint: "A new deal is opened" },
  { value: "deal_stage_changed", label: "Deal stage changed", hint: "A deal moves stage" },
  { value: "deal_won", label: "Deal won", hint: "A deal is marked won" },
  { value: "deal_lost", label: "Deal lost", hint: "A deal is marked lost" },
  { value: "scheduled", label: "Scheduled sweep", hint: "Runs on the automation cron" },
];

const ACTIONS: { value: string; label: string }[] = [
  { value: "create_task", label: "Create task" },
  { value: "add_tag", label: "Add tag" },
  { value: "enroll_sequence", label: "Enroll in sequence" },
  { value: "send_email", label: "Send email" },
  { value: "set_lifecycle", label: "Set lifecycle stage" },
  { value: "adjust_score", label: "Adjust lead score" },
  { value: "update_field", label: "Update field" },
  { value: "send_notification", label: "Notify me" },
  { value: "trigger_webhook", label: "Trigger webhook" },
];

const OPS = [
  { value: "eq", label: "equals" }, { value: "neq", label: "not equals" },
  { value: "contains", label: "contains" }, { value: "gte", label: "≥" },
  { value: "lte", label: "≤" }, { value: "gt", label: ">" }, { value: "lt", label: "<" },
  { value: "is_not_empty", label: "is set" }, { value: "is_empty", label: "is empty" },
];

const LIFECYCLE = ["subscriber", "lead", "qualified", "opportunity", "customer", "champion", "evangelist"];

const inputCls = "w-full h-9 px-3 rounded-lg bg-[#08090a] border border-white/[0.08] text-[13px] text-[#d0d6e0] placeholder-[#62666d] focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]/40";
const labelCls = "text-[11px] font-medium text-[#8a8f98] uppercase tracking-wide mb-1.5 block";

interface Cond { field: string; op: string; value: string; }
interface Act { type: string; config: Record<string, any>; }
interface WF {
  id: string; name: string; description?: string; status: string;
  triggerType: string; triggerConfig: any; conditions: Cond[]; actions: Act[];
  allowReenrollment?: boolean;
  enrolledCount?: number; completedCount?: number;
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WF[]>([]);
  const [sequences, setSequences] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<WF | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [w, s, t] = await Promise.all([
        fetch("/api/workflows", { credentials: "include" }).then(r => r.json()),
        fetch("/api/sequences", { credentials: "include" }).then(r => r.json()),
        fetch("/api/templates", { credentials: "include" }).then(r => r.json()),
      ]);
      setWorkflows(w.data || []);
      setSequences(s.data || []);
      setTemplates(t.data || []);
    } catch {}
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function blankWorkflow(): WF {
    return { id: "", name: "", description: "", status: "draft", triggerType: "contact_created", triggerConfig: {}, conditions: [], actions: [{ type: "create_task", config: { title: "Follow up", priority: "medium" } }] };
  }

  async function toggleStatus(wf: WF) {
    const next = wf.status === "active" ? "paused" : "active";
    await fetch(`/api/workflows/${wf.id}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
    load();
  }
  async function remove(wf: WF) {
    if (!confirm(`Delete workflow "${wf.name}"?`)) return;
    await fetch(`/api/workflows/${wf.id}`, { method: "DELETE", credentials: "include" });
    load();
  }

  const activeCount = workflows.filter(w => w.status === "active").length;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5e6ad2] to-[#828fff] flex items-center justify-center">
              <Workflow className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-[#f7f8f8] tracking-tight">Workflows</h1>
          </div>
          <p className="text-[13px] text-[#8a8f98] mt-1">
            When something happens → check conditions → run actions. {activeCount} active.
          </p>
        </div>
        <button onClick={() => setEditing(blankWorkflow())} className="h-9 px-4 rounded-lg bg-gradient-to-r from-[#5e6ad2] to-[#828fff] text-white text-[13px] font-medium flex items-center gap-2 hover:shadow-lg hover:shadow-[#5e6ad2]/20 transition-all">
          <Plus className="w-4 h-4" /> New workflow
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-[13px] text-[#62666d]">Loading…</div>
      ) : workflows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/[0.10] p-12 text-center">
          <Zap className="w-8 h-8 text-[#5e6ad2] mx-auto mb-3" />
          <h3 className="text-[15px] font-semibold text-[#f7f8f8] mb-1">No workflows yet</h3>
          <p className="text-[13px] text-[#8a8f98] mb-4">Automate repetitive work — route hot leads, send follow-ups, alert your team.</p>
          <button onClick={() => setEditing(blankWorkflow())} className="h-9 px-4 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[#d0d6e0] text-[13px] font-medium inline-flex items-center gap-2 hover:bg-white/[0.06]">
            <Plus className="w-4 h-4" /> Create your first workflow
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {workflows.map(wf => {
            const trig = TRIGGERS.find(t => t.value === wf.triggerType);
            return (
              <motion.div key={wf.id} layout className="rounded-xl bg-[#0f1011] border border-white/[0.06] p-4 hover:border-white/[0.10] transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <button onClick={() => setEditing(wf)} className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[14px] font-semibold text-[#f7f8f8] truncate">{wf.name}</span>
                      <StatusPill status={wf.status} />
                    </div>
                    <div className="flex items-center gap-1.5 text-[12px] text-[#8a8f98] flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#5e6ad2]/10 text-[#9aa4f2]"><Zap className="w-3 h-3" />{trig?.label || wf.triggerType}</span>
                      {wf.conditions?.length > 0 && <><ArrowRight className="w-3 h-3" /><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.04]"><Filter className="w-3 h-3" />{wf.conditions.length} condition{wf.conditions.length > 1 ? "s" : ""}</span></>}
                      <ArrowRight className="w-3 h-3" />
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300"><GitBranch className="w-3 h-3" />{wf.actions?.length || 0} action{(wf.actions?.length || 0) !== 1 ? "s" : ""}</span>
                    </div>
                  </button>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] text-[#62666d] hidden sm:flex items-center gap-1"><Activity className="w-3 h-3" />{wf.enrolledCount || 0} runs</span>
                    <button onClick={() => toggleStatus(wf)} title={wf.status === "active" ? "Pause" : "Activate"} className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[#8a8f98] hover:text-white hover:bg-white/[0.08]">
                      {wf.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => remove(wf)} className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[#8a8f98] hover:text-red-400 hover:bg-red-500/10">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {editing && (
          <Builder
            initial={editing}
            sequences={sequences}
            templates={templates}
            onClose={() => setEditing(null)}
            onSaved={() => { setEditing(null); load(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    paused: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    draft: "bg-white/[0.04] text-[#8a8f98] border-white/[0.08]",
    archived: "bg-white/[0.04] text-[#62666d] border-white/[0.08]",
  };
  return <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${map[status] || map.draft}`}>{status}</span>;
}

// ── Builder modal ──────────────────────────────────────────
function Builder({ initial, sequences, templates, onClose, onSaved }: {
  initial: WF; sequences: any[]; templates: any[]; onClose: () => void; onSaved: () => void;
}) {
  const [wf, setWf] = useState<WF>(initial);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const isEdit = !!initial.id;

  function patch(p: Partial<WF>) { setWf(prev => ({ ...prev, ...p })); }

  async function save(activate?: boolean) {
    if (!wf.name.trim()) { setErr("Name is required"); return; }
    setSaving(true); setErr("");
    const payload = { ...wf, status: activate ? "active" : wf.status };
    try {
      const res = await fetch(isEdit ? `/api/workflows/${wf.id}` : "/api/workflows", {
        method: isEdit ? "PATCH" : "POST", credentials: "include",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) { setErr(json.error || "Save failed"); setSaving(false); return; }
      onSaved();
    } catch (e: any) { setErr(e.message); setSaving(false); }
  }

  const trig = TRIGGERS.find(t => t.value === wf.triggerType);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-10 px-4">
      <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }}
        className="w-full max-w-2xl rounded-2xl bg-[#0f1011] border border-white/[0.08] shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-[15px] font-semibold text-[#f7f8f8]">{isEdit ? "Edit workflow" : "New workflow"}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#8a8f98] hover:bg-white/[0.06]"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className={labelCls}>Name</label>
            <input className={inputCls} value={wf.name} onChange={e => patch({ name: e.target.value })} placeholder="e.g. Route hot leads to sales" />
          </div>

          {/* Trigger */}
          <div>
            <label className={labelCls}>① When this happens (trigger)</label>
            <div className="relative">
              <select className={`${inputCls} appearance-none pr-9`} value={wf.triggerType} onChange={e => patch({ triggerType: e.target.value, triggerConfig: {} })}>
                {TRIGGERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-[#62666d] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {trig && <p className="text-[11px] text-[#62666d] mt-1.5">{trig.hint}</p>}
            {wf.triggerType === "lead_score_threshold" && (
              <input type="number" className={`${inputCls} mt-2`} placeholder="Score threshold (e.g. 70)"
                value={wf.triggerConfig?.scoreThreshold ?? ""} onChange={e => patch({ triggerConfig: { ...wf.triggerConfig, scoreThreshold: Number(e.target.value) } })} />
            )}
            {wf.triggerType === "tag_added" && (
              <input className={`${inputCls} mt-2`} placeholder="Tag name to watch for"
                value={wf.triggerConfig?.tagName ?? ""} onChange={e => patch({ triggerConfig: { ...wf.triggerConfig, tagName: e.target.value } })} />
            )}
          </div>

          {/* Conditions */}
          <div>
            <label className={labelCls}>② Only if (conditions — all must match)</label>
            <div className="space-y-2">
              {wf.conditions.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input className={`${inputCls} flex-1`} placeholder="field (e.g. leadScore, lifecycleStage, sourceType)" value={c.field} onChange={e => { const next = [...wf.conditions]; next[i] = { ...c, field: e.target.value }; patch({ conditions: next }); }} />
                  <select className={`${inputCls} w-28`} value={c.op} onChange={e => { const next = [...wf.conditions]; next[i] = { ...c, op: e.target.value }; patch({ conditions: next }); }}>
                    {OPS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  {!["is_empty", "is_not_empty"].includes(c.op) && (
                    <input className={`${inputCls} w-32`} placeholder="value" value={c.value} onChange={e => { const next = [...wf.conditions]; next[i] = { ...c, value: e.target.value }; patch({ conditions: next }); }} />
                  )}
                  <button onClick={() => patch({ conditions: wf.conditions.filter((_, j) => j !== i) })} className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[#8a8f98] hover:text-red-400 shrink-0"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
              <button onClick={() => patch({ conditions: [...wf.conditions, { field: "leadScore", op: "gte", value: "50" }] })} className="text-[12px] text-[#9aa4f2] hover:text-white flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add condition</button>
            </div>
          </div>

          {/* Actions */}
          <div>
            <label className={labelCls}>③ Then do (actions — in order)</label>
            <div className="space-y-3">
              {wf.actions.map((a, i) => (
                <div key={i} className="rounded-lg border border-white/[0.06] bg-[#08090a] p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] text-[#62666d] w-4">{i + 1}</span>
                    <select className={`${inputCls} flex-1`} value={a.type} onChange={e => { const next = [...wf.actions]; next[i] = { type: e.target.value, config: {} }; patch({ actions: next }); }}>
                      {ACTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <button onClick={() => patch({ actions: wf.actions.filter((_, j) => j !== i) })} className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[#8a8f98] hover:text-red-400 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <ActionConfig action={a} sequences={sequences} templates={templates} onChange={cfg => { const next = [...wf.actions]; next[i] = { ...a, config: cfg }; patch({ actions: next }); }} />
                </div>
              ))}
              <button onClick={() => patch({ actions: [...wf.actions, { type: "create_task", config: {} }] })} className="text-[12px] text-[#9aa4f2] hover:text-white flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add action</button>
            </div>
          </div>

          {err && <div className="flex items-center gap-2 text-[12px] text-red-400"><AlertTriangle className="w-3.5 h-3.5" />{err}</div>}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06]">
          <label className="flex items-center gap-2 text-[12px] text-[#8a8f98] cursor-pointer">
            <input type="checkbox" checked={!!wf.allowReenrollment} onChange={e => patch({ allowReenrollment: e.target.checked } as any)} className="accent-[#5e6ad2]" />
            Allow re-enrollment (re-run for the same record)
          </label>
          <div className="flex items-center gap-2">
            <button onClick={() => save(false)} disabled={saving} className="h-9 px-4 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[#d0d6e0] text-[13px] font-medium hover:bg-white/[0.06] disabled:opacity-50">Save draft</button>
            <button onClick={() => save(true)} disabled={saving} className="h-9 px-4 rounded-lg bg-gradient-to-r from-[#5e6ad2] to-[#828fff] text-white text-[13px] font-medium flex items-center gap-2 hover:shadow-lg disabled:opacity-50">
              <CheckCircle2 className="w-4 h-4" /> {saving ? "Saving…" : "Save & activate"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ActionConfig({ action, sequences, templates, onChange }: { action: Act; sequences: any[]; templates: any[]; onChange: (cfg: Record<string, any>) => void; }) {
  const c = action.config || {};
  const set = (k: string, v: any) => onChange({ ...c, [k]: v });
  const small = "w-full h-8 px-2.5 rounded-md bg-[#0f1011] border border-white/[0.08] text-[12px] text-[#d0d6e0] placeholder-[#62666d] focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]/40";

  switch (action.type) {
    case "create_task":
      return (
        <div className="grid grid-cols-2 gap-2">
          <input className={small} placeholder="Task title (supports {{firstName}})" value={c.title || ""} onChange={e => set("title", e.target.value)} />
          <select className={small} value={c.priority || "medium"} onChange={e => set("priority", e.target.value)}>
            {["low", "medium", "high", "critical"].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      );
    case "add_tag":
      return <input className={small} placeholder="Tag name" value={c.tagName || ""} onChange={e => set("tagName", e.target.value)} />;
    case "enroll_sequence":
      return (
        <select className={small} value={c.sequenceId || ""} onChange={e => set("sequenceId", e.target.value)}>
          <option value="">Select a sequence…</option>
          {sequences.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      );
    case "send_email":
      return (
        <div className="space-y-2">
          <select className={small} value={c.templateId || ""} onChange={e => set("templateId", e.target.value)}>
            <option value="">Custom (write below)…</option>
            {templates.map(t => <option key={t.id} value={t.id}>Template: {t.name}</option>)}
          </select>
          {!c.templateId && <>
            <input className={small} placeholder="Subject (supports {{firstName}})" value={c.subject || ""} onChange={e => set("subject", e.target.value)} />
            <textarea className={`${small} h-16 py-2`} placeholder="Body" value={c.body || ""} onChange={e => set("body", e.target.value)} />
          </>}
        </div>
      );
    case "set_lifecycle":
      return (
        <select className={small} value={c.stage || ""} onChange={e => set("stage", e.target.value)}>
          <option value="">Select stage…</option>
          {LIFECYCLE.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      );
    case "adjust_score":
      return <input type="number" className={small} placeholder="Amount (+/-)" value={c.amount ?? ""} onChange={e => set("amount", Number(e.target.value))} />;
    case "update_field":
      return (
        <div className="grid grid-cols-2 gap-2">
          <input className={small} placeholder="field" value={c.field || ""} onChange={e => set("field", e.target.value)} />
          <input className={small} placeholder="value" value={c.value || ""} onChange={e => set("value", e.target.value)} />
        </div>
      );
    case "send_notification":
      return (
        <div className="grid grid-cols-2 gap-2">
          <input className={small} placeholder="Title" value={c.title || ""} onChange={e => set("title", e.target.value)} />
          <input className={small} placeholder="Body" value={c.body || ""} onChange={e => set("body", e.target.value)} />
        </div>
      );
    case "trigger_webhook":
      return <input className={small} placeholder="Event name (e.g. workflow.fired)" value={c.event || ""} onChange={e => set("event", e.target.value)} />;
    default:
      return null;
  }
}
