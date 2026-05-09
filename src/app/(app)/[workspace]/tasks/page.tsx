"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Flag, Plus, Search, X, AlertTriangle, PlayCircle, XCircle, Circle, ListChecks, Calendar as CalendarIcon, LayoutGrid, Filter } from "lucide-react";
import { TaskCalendar } from "@/components/crm/task-calendar";

const STATUS_ORDER = ["todo","in_progress","blocked","in_review","done","cancelled"] as const;

const STATUS_META: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  todo: { label: "To Do", icon: <Circle className="w-4 h-4" />, color: "text-zinc-400", bg: "bg-zinc-800/40" },
  in_progress: { label: "In Progress", icon: <PlayCircle className="w-4 h-4" />, color: "text-amber-400", bg: "bg-amber-500/10" },
  blocked: { label: "Blocked", icon: <AlertTriangle className="w-4 h-4" />, color: "text-red-400", bg: "bg-red-500/10" },
  in_review: { label: "In Review", icon: <Clock className="w-4 h-4" />, color: "text-sky-400", bg: "bg-sky-500/10" },
  done: { label: "Done", icon: <CheckCircle2 className="w-4 h-4" />, color: "text-emerald-400", bg: "bg-violet-500/10" },
  cancelled: { label: "Cancelled", icon: <XCircle className="w-4 h-4" />, color: "text-zinc-500", bg: "bg-zinc-800/30" },
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-zinc-800/60 text-zinc-400", medium: "bg-sky-900/40 text-sky-300",
  high: "bg-amber-900/40 text-amber-300", critical: "bg-red-900/40 text-red-300",
};

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", status: "todo", dueDate: "" });
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "calendar" | "board">("list");
  const [filterStatus, setFilterStatus] = useState<string>("");

  useEffect(() => {
    fetch(`/api/tasks`, { credentials: "include" }).then(r => r.json()).then(r => { setTasks(r.data ?? []); setLoading(false); });
  }, []);

  async function toggleStatus(id: string, current: string) {
    const next = current === "done" ? "todo" : "done";
    const res = await fetch(`/api/tasks/${id}`, { credentials: "include", method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
    if (!res.ok) return;
    const { data } = await res.json();
    setTasks(prev => prev.map(t => t.id === id ? data : t));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(null);
    const body: any = { ...form };
    if (body.dueDate) body.dueDate = new Date(body.dueDate).toISOString();
    const res = await fetch("/api/tasks", { credentials: "include", method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json().catch(() => ({ error: "Unknown" }));
    setSaving(false);
    if (!res.ok) { setError(json.error || "Failed to create task"); return; }
    setShowModal(false);
    setForm({ title: "", description: "", priority: "medium", status: "todo", dueDate: "" });
    setTasks(prev => [json.data, ...prev]);
  }

  let filtered = tasks.filter(t => (t.title + " " + (t.description ?? "")).toLowerCase().includes(search.toLowerCase()));
  if (filterStatus) filtered = filtered.filter(t => t.status === filterStatus);

  const inputCls = "w-full h-10 px-3 rounded-xl bg-zinc-900 border border-zinc-700/80 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/10 transition-all";
  const labelCls = "text-xs font-medium text-zinc-400 mb-1";

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Tasks</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{tasks.filter(t=>t.status==="done").length} done · {tasks.filter(t=>t.status==="in_progress").length} in progress · {tasks.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center rounded-xl overflow-hidden border border-zinc-700/80">
            {(["list","calendar","board"] as const).map(v => (
              <button key={v} onClick={()=>setView(v)} className={`h-8 px-2.5 flex items-center gap-1 text-[11px] font-medium capitalize transition-colors ${view===v ? "bg-zinc-800/60 text-white" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40"}`}>
                {v==="list" && <ListChecks className="w-3.5 h-3.5" strokeWidth={1.5}/>}
                {v==="calendar" && <CalendarIcon className="w-3.5 h-3.5" strokeWidth={1.5}/>}
                {v==="board" && <LayoutGrid className="w-3.5 h-3.5" strokeWidth={1.5}/>}
                {v}
              </button>
            ))}
          </div>
          <button onClick={()=>setShowModal(true)} className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/20">
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5}/> New Task
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" strokeWidth={1.5} />
          <input type="text" placeholder="Search tasks..." value={search} onChange={e=>setSearch(e.target.value)}
            className="w-64 h-9 pl-9 pr-4 rounded-xl bg-zinc-900 border border-zinc-700/80 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/10 transition-all" />
        </div>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="h-9 px-3 rounded-xl bg-zinc-900 border border-zinc-700/80 text-xs text-zinc-400 focus:outline-none focus:border-violet-500/60">
          <option value="">All statuses</option>
          {STATUS_ORDER.map(s=><option key={s} value={s}>{STATUS_META[s].label}</option>)}
        </select>
      </div>

      {view === "calendar" && (
        <TaskCalendar tasks={filtered.map(t=>({ ...t, title: t.title, dueDate: t.dueDate, status: t.status, priority: t.priority }))} />
      )}

      {view === "board" && (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {STATUS_ORDER.map(status => {
            const list = filtered.filter((t: any) => t.status === status);
            const meta = STATUS_META[status];
            return (
              <div key={status} className="w-72 flex-shrink-0 rounded-2xl border border-zinc-800/60 bg-zinc-900/60 overflow-hidden">
                <div className={`px-4 py-2.5 flex items-center gap-2 text-sm font-medium border-b border-zinc-800/60 ${meta.bg} ${meta.color}`}>{meta.icon} {meta.label} <span className="ml-auto text-xs text-zinc-500 rounded-full bg-zinc-800/40 px-1.5 py-0.5">{list.length}</span></div>
                <div className="p-2 space-y-1.5 min-h-[120px]">
                  {list.map((t: any) => (
                    <div key={t.id} onClick={()=>router.push(`./tasks/${t.id}`)} className="p-2.5 rounded-xl border border-zinc-800/60 bg-zinc-800/30 hover:border-zinc-700/80 cursor-pointer transition-all">
                      <div className="flex items-center gap-2 mb-1">
                        <button onClick={e=>{ e.stopPropagation(); toggleStatus(t.id, t.status); }} className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${t.status==="done" ? "bg-violet-500 border-violet-400" : "border-zinc-600"}`}>{t.status==="done" && <CheckCircle2 className="w-3 h-3 text-white"/>}</button>
                        <span className={`text-xs font-medium ${t.status==="done" ? "text-zinc-500 line-through" : "text-zinc-300"}`}>{t.title}</span>
                      </div>
                      {t.priority && <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded ${PRIORITY_COLORS[t.priority] || "bg-zinc-800/60 text-zinc-400"}`}>{t.priority}</span>}
                      {t.dueDate && <span className="text-[10px] text-zinc-500 ml-2">{new Date(t.dueDate).toLocaleDateString()}</span>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === "list" && (
        <div className="space-y-4">
          {STATUS_ORDER.map(status => {
            const list = filtered.filter((t: any) => t.status === status);
            if (!list.length) return null;
            const meta = STATUS_META[status];
            return (
              <div key={status} className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 overflow-hidden">
                <div className={`px-4 py-2.5 flex items-center gap-2 text-sm font-medium border-b border-zinc-800/60 ${meta.bg} ${meta.color}`}>
                  {meta.icon} {meta.label}
                  <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800/40 text-xs text-zinc-400">{list.length}</span>
                </div>
                <div className="divide-y divide-zinc-800/60">
                  {list.map(t => (
                    <div key={t.id} className="px-4 py-3 flex items-start gap-3 hover:bg-zinc-800/40 transition-colors">
                      <button onClick={()=>toggleStatus(t.id, t.status)} className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${t.status==="done" ? "bg-violet-500 border-violet-400 text-white" : "border-zinc-600 hover:border-violet-400"}`}>{t.status==="done" && <CheckCircle2 className="w-3.5 h-3.5"/>}</button>
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={()=>router.push(`./tasks/${t.id}`)}>
                        <div className={`font-medium text-sm ${t.status==="done" ? "text-zinc-500 line-through" : "text-zinc-300"}`}>{t.title}</div>
                        {t.description && <div className="text-xs text-zinc-500 mt-0.5 truncate">{t.description}</div>}
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          {t.priority && <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${PRIORITY_COLORS[t.priority]}`}><Flag className="w-3 h-3"/>{t.priority}</span>}
                          {t.dueDate && <span className="text-[10px] text-zinc-500 flex items-center gap-1"><Clock className="w-3 h-3"/>{new Date(t.dueDate).toLocaleDateString()}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <CheckCircle2 className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-1">No tasks found</h3>
              <p className="text-sm text-zinc-500 mb-6">{search ? "Try a different search term." : "Create your first task to get started."}</p>
              <button onClick={()=>setShowModal(true)} className="h-9 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 transition-all">
                New Task
              </button>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={()=>setShowModal(false)}>
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-700/80 bg-zinc-900/95 shadow-2xl m-4" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/60">
              <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center"><ListChecks className="w-4 h-4"/></div><div><h2 className="text-sm font-semibold text-white">New Task</h2></div></div>
              <button onClick={()=>setShowModal(false)} className="p-1.5 rounded-lg hover:bg-zinc-800/40 text-zinc-400"><X className="w-4 h-4"/></button>
            </div>
            <form onSubmit={save} className="p-5 space-y-4">
              {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2">{error}</div>}
              <div><label className={labelCls}>Title *</label><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className={inputCls} placeholder="Follow up with lead" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Status</label>
                  <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className={`${inputCls} appearance-none`}>
                    {STATUS_ORDER.map(s=><option key={s} value={s} className="bg-zinc-900">{STATUS_META[s].label}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>Priority</label>
                  <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} className={`${inputCls} appearance-none`}>
                    {["low","medium","high","critical"].map(p=><option key={p} value={p} className="bg-zinc-900">{p}</option>)}
                  </select>
                </div>
              </div>
              <div><label className={labelCls}>Due date</label><input type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})} className={`${inputCls} appearance-none`} /></div>
              <div><label className={labelCls}>Description</label><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className={`${inputCls} h-20 py-2 resize-none`} placeholder="Details..." rows={3}/></div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button type="button" onClick={()=>setShowModal(false)} className="h-9 px-4 rounded-xl border border-zinc-700/80 text-zinc-400 text-sm font-medium hover:bg-zinc-800/40 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="h-9 px-4 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-semibold hover:from-violet-600 hover:to-indigo-700 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-violet-500/20 transition-all">{saving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>} Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
