"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckSquare, Calendar, Clock, User, Building2, Briefcase, FileText, Activity, Tag, Flag } from "lucide-react";

export default function TaskDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [task, setTask] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [tRes, aRes] = await Promise.all([
          fetch(`/api/tasks/${id}`).then(r => r.json()),
          fetch(`/api/activities?entityType=task&entityId=${id}`).then(r => r.json()),
        ]);
        setTask(tRes.data || null);
        setActivities(aRes.data || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <div className="p-8 text-slate-400">Loading...</div>;
  if (!task) return <div className="p-8 text-slate-400">Task not found</div>;

  const statusColor = (status: string) => {
    if (status === "done") return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    if (status === "in_progress") return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    if (status === "blocked") return "bg-red-500/10 text-red-400 border border-red-500/20";
    if (status === "in_review") return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
    return "bg-slate-700/50 text-slate-300 border border-slate-600/30";
  };

  const priorityColor = (p: string) => {
    if (p === "critical") return "text-red-400";
    if (p === "high") return "text-amber-400";
    if (p === "medium") return "text-blue-400";
    return "text-slate-400";
  };

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"><ArrowLeft className="w-4 h-4" /> Back</button>

      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/20 flex items-center justify-center text-orange-300"><CheckSquare className="w-7 h-7" /></div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-white">{task.title}</h1>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(task.status)}`}>{task.status.replace(/_/g, " ")}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
            <span className={`flex items-center gap-1 ${priorityColor(task.priority)}`}><Flag className="w-3.5 h-3.5" />{task.priority || "medium"} priority</span>
            {task.dueDate && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Due {new Date(task.dueDate).toLocaleDateString()}</span>}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="text-sm font-medium text-white mb-4">Task Details</h3>
        <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
          <div className="flex items-center gap-2 text-slate-400"><CheckSquare className="w-4 h-4 text-slate-500" /><span className="text-slate-300">{task.title}</span></div>
          <div className="flex items-center gap-2 text-slate-400"><Flag className="w-4 h-4 text-slate-500" /><span className={`${priorityColor(task.priority)}`}>{task.priority || "medium"}</span></div>
          <div className="flex items-center gap-2 text-slate-400"><Clock className="w-4 h-4 text-slate-500" /><span className="text-slate-300 capitalize">{task.status.replace(/_/g, " ")}</span></div>
          <div className="flex items-center gap-2 text-slate-400"><Calendar className="w-4 h-4 text-slate-500" /><span className="text-slate-300">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}</span></div>
          <div className="flex items-center gap-2 text-slate-400"><User className="w-4 h-4 text-slate-500" /><span className="text-slate-300">{task.userId || "Unassigned"}</span></div>
          <div className="flex items-center gap-2 text-slate-400"><Calendar className="w-4 h-4 text-slate-500" /><span className="text-slate-300">Created: {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : "-"}</span></div>
        </div>
        {task.description && <div className="mt-4 pt-4 border-t border-slate-800 text-sm text-slate-400"><FileText className="w-4 h-4 text-slate-500 inline mr-2" />{task.description}</div>}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="text-sm font-medium text-white mb-4">Linked Records</h3>
        <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
          <div className="flex items-center gap-2 text-slate-400"><User className="w-4 h-4 text-slate-500" /><span className="text-slate-300">Contact: {task.contactId ? "Linked" : "-"}</span></div>
          <div className="flex items-center gap-2 text-slate-400"><Building2 className="w-4 h-4 text-slate-500" /><span className="text-slate-300">Company: {task.companyId ? "Linked" : "-"}</span></div>
          <div className="flex items-center gap-2 text-slate-400"><Briefcase className="w-4 h-4 text-slate-500" /><span className="text-slate-300">Deal: {task.dealId ? "Linked" : "-"}</span></div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="text-sm font-medium text-white mb-4">Activity <span className="text-xs text-slate-500 font-normal">({activities.length})</span></h3>
        <div className="space-y-3">
          {activities.length === 0 && <div className="text-center text-slate-600 py-8 text-sm">No activity yet</div>}
          {activities.map((a, i) => (
            <div key={a.id || i} className="flex gap-4 items-start rounded-lg bg-slate-800/30 p-3">
              <div className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center"><Activity className="w-4 h-4 text-slate-400" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5"><span className="text-sm font-medium text-slate-200 capitalize">{a.type.replace(/_/g, " ")}</span><span className="text-xs text-slate-500">{a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}</span></div>
                {a.body && <div className="text-sm text-slate-400">{a.body}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
