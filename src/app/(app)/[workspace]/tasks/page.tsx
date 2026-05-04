"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Circle, CheckCircle2, Clock, AlertTriangle, PlayCircle, XCircle } from "lucide-react";

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
  low: "bg-slate-700 text-slate-300",
  medium: "bg-sky-900/40 text-sky-300",
  high: "bg-amber-900/40 text-amber-300",
  critical: "bg-red-900/40 text-red-300",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`/api/tasks`).then(r => r.json()).then(r => setTasks(r.data ?? []));
  }, []);

  async function toggleStatus(id: string, current: string) {
    const next = current === "done" ? "todo" : "done";
    const res = await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
    if (!res.ok) return;
    const { data } = await res.json();
    setTasks(prev => prev.map(t => t.id === id ? data : t));
  }

  const filtered = tasks.filter(t =>
    (t.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (t.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const grouped: Record<string, any[]> = {};
  STATUS_ORDER.forEach(s => grouped[s] = []);
  filtered.forEach(t => { (grouped[t.status] ?? grouped.todo).push(t); });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tasks</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your to-do list</p>
        </div>
        <button className="flex items-center gap-2 h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors">
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span> {tasks.filter(t => t.status === "done").length} done
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500 ml-2"></span> {tasks.filter(t => t.status === "in_progress").length} in progress
          <span className="inline-block w-2 h-2 rounded-full bg-slate-500 ml-2"></span> {tasks.filter(t => t.status === "todo").length} todo
        </div>
      </div>

      <div className="space-y-4">
        {STATUS_ORDER.map(status => {
          const list = grouped[status];
          if (!list.length) return null;
          const meta = STATUS_META[status];
          return (
            <div key={status} className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <div className={`px-4 py-2.5 flex items-center gap-2 text-sm font-medium border-b border-slate-800 ${meta.bg} ${meta.color}`}>
                {meta.icon}
                {meta.label}
                <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-xs text-slate-400">{list.length}</span>
              </div>
              <div className="divide-y divide-slate-800">
                {list.map(t => (
                  <div key={t.id} className="px-4 py-3 flex items-start gap-3 hover:bg-slate-800/30 transition-colors">
                    <button
                      onClick={() => toggleStatus(t.id, t.status)}
                      className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        t.status === "done"
                          ? "bg-emerald-500 border-emerald-500 text-emerald-950"
                          : "border-slate-600 hover:border-emerald-500"
                      }`}
                    >
                      {t.status === "done" && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm ${t.status === "done" ? "text-slate-500 line-through" : "text-slate-200"}`}>
                        {t.title}
                      </div>
                      {t.description && <div className="text-xs text-slate-500 mt-0.5 truncate">{t.description}</div>}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${PRIORITY_COLORS[t.priority] ?? PRIORITY_COLORS.medium}`}>
                          {t.priority}
                        </span>
                        {t.dueDate && (
                          <span className="text-[11px] text-slate-500">Due {new Date(t.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                        )}
                        {t.dealId && <span className="text-[11px] text-slate-600">• Linked to deal</span>}
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
            <button className="mt-2 text-sm text-emerald-400 hover:underline">Create your first task</button>
          </div>
        )}
      </div>
    </div>
  );
}
