"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Flag, Plus, Search, X, AlertTriangle, PlayCircle, XCircle, Circle, ListChecks } from "lucide-react";

const STATUS_ORDER = ["todo","in_progress","blocked","in_review","done","cancelled"] as const;

const STATUS_META: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  todo: { label: "To Do", icon: <Circle className="w-4 h-4" />, color: "text-slate-400", bg: "bg-slate-800/40" },
  in_progress: { label: "In Progress", icon: <PlayCircle className="w-4 h-4" />, color: "text-amber-400", bg: "bg-amber-500/10" },
  blocked: { label: "Blocked", icon: <AlertTriangle className="w-4 h-4" />, color: "text-red-400", bg: "bg-red-500/10" },
  in_review: { label: "In Review", icon: <Clock className="w-4 h-4" />, color: "text-sky-400", bg: "bg-sky-500/10" },
  done: { label: "Done", icon: <CheckCircle2 className="w-4 h-4" />, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  cancelled: { label: "Cancelled", icon: <XCircle className="w-4 h-4" />, color: "text-slate-500", bg: "bg-slate-800/20" },
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-700 text-slate-300", medium: "bg-sky-900/40 text-sky-300",
  high: "bg-amber-900/40 text-amber-300", critical: "bg-red-900/40 text-red-300",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", status: "todo", dueDate: "" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetch(`/api/tasks`).then(r => r.json()).then(r => setTasks(r.data ?? [])); }, []);

  async function toggleStatus(id: string, current: string) {
    const next = current === "done" ? "todo" : "done";
    const res = await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
    if (!res.ok) return;
    const { data } = await res.json();
    setTasks(prev => prev.map(t => t.id === id ? data : t));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(null);
    const body: any = { ...form };
    if (body.dueDate) body.dueDate = new Date(body.dueDate).toISOString();
    const res = await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json().catch(() => ({ error: "Unknown" }));
    setSaving(false);
    if (!res.ok) { setError(json.error || "Failed to create task"); return; }
    setShowModal(false);
    setForm({ title: "", description: "", priority: "medium", status: "todo", dueDate: "" });
    setTasks(prev => [json.data, ...prev]);
  }

  const filtered = tasks.filter(t => (t.title + " " + (t.description ?? "")).toLowerCase().includes(search.toLowerCase()));
  const grouped: Record<string, any[]> = {}; STATUS_ORDER.forEach(s => grouped[s] = []);
  filtered.forEach(t => { (grouped[t.status] ?? grouped.todo).push(t); });

  const inputCls = "w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/60";
  const labelCls = "block text-xs font-medium text-slate-400 mb-1";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Tasks</h1><p className="text-slate-500 text-sm mt-1">Manage your to-do list</p></div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors">
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full h-9 pl-9 pr-4 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span> {tasks.filter(t => t.status === "done").length} done
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500 ml-2"></span> {tasks.filter(t => t.status === "in_progress").length} in progress
          <span className="inline-block w-2 h-2 rounded-full bg-slate-500 ml-2"></span> {tasks.filter(t => t.status === "todo").length} todo
        </div>
      </div>

      <div className="space-y-4">
        {STATUS_ORDER.map(status => {
          const list = grouped[status]; if (!list.length) return null;
          const meta = STATUS_META[status];
          return (
            <div key={status} className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <div className={`px-4 py-2.5 flex items-center gap-2 text-sm font-medium border-b border-slate-800 ${meta.bg} ${meta.color}`}>
                {meta.icon} {meta.label}
                <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-xs text-slate-400">{list.length}</span>
              </div>
              <div className="divide-y divide-slate-800">
                {list.map(t => (
                  <div key={t.id} className="px-4 py-3 flex items-start gap-3 hover:bg-slate-800/30 transition-colors">
                    <button onClick={() => toggleStatus(t.id, t.status)} className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${t.status === "done" ? "bg-emerald-500 border-emerald-500 text-emerald-950" : "border-slate-600 hover:border-emerald-500"}`}>
                      {t.status === "done" && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm ${t.status === "done" ? "text-slate-500 line-through" : "text-slate-200"}`}>{t.title}</div>
                      {t.description && <div className="text-xs text-slate-500 mt-0.5 truncate">{t.description}</div>}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${PRIORITY_COLORS[t.priority] ?? PRIORITY_COLORS.medium}`}>{t.priority}</span>
                        {t.dueDate && <span className="text-[11px] text-slate-500">Due {new Date(t.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-12 text-center">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-slate-200 font-medium">No tasks found.</div>
            <button onClick={() => setShowModal(true)} className="mt-2 text-sm text-emerald-400 hover:underline">Create your first task</button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center"><ListChecks className="w-4 h-4"/></div>
                <div><h2 className="text-sm font-semibold text-white">New Task</h2><p className="text-xs text-slate-500">Add a task to your list</p></div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-4 h-4"/></button>
            </div>
            <form onSubmit={save} className="p-5 space-y-4">
              {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2">{error}</div>}
              <div><label className={labelCls}>Title *</label><input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} className={inputCls} placeholder="Follow up with prospect" required /></div>
              <div><label className={labelCls}>Description</label><textarea value={form.description} onChange={e=>setForm({...form, description:e.target.value})} className={`${inputCls} h-20 py-2 resize-none`} placeholder="What needs to be done..." rows={3} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Priority</label>
                  <select value={form.priority} onChange={e=>setForm({...form, priority:e.target.value})} className={`${inputCls} appearance-none`}>
                    {["low","medium","high","critical"].map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>Status</label>
                  <select value={form.status} onChange={e=>setForm({...form, status:e.target.value})} className={`${inputCls} appearance-none`}>
                    {STATUS_ORDER.map(s => <option key={s} value={s} className="bg-slate-900">{STATUS_META[s].label}</option>)}
                  </select>
                </div>
              </div>
              <div><label className={labelCls}>Due date</label><input type="date" value={form.dueDate} onChange={e=>setForm({...form, dueDate:e.target.value})} className={`${inputCls} appearance-none`} /></div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="h-9 px-4 rounded-lg border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors disabled:opacity-50 flex items-center gap-2">
                  {saving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>} Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
