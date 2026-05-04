"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Briefcase, DollarSign, Calendar, User, Building2, BarChart3, Clock, Activity, CheckCircle, FileText, Pencil, Trash2 } from "lucide-react";

export default function DealDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [deal, setDeal] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [dRes, aRes, tRes, pRes] = await Promise.all([
          fetch(`/api/deals/${id}`).then(r => r.json()),
          fetch(`/api/activities?entityType=deal&entityId=${id}`).then(r => r.json()),
          fetch(`/api/tasks?dealId=${id}`).then(r => r.json()),
          fetch(`/api/pipelines`).then(r => r.json()),
        ]);
        setDeal(dRes.data || null);
        setActivities(aRes.data || []);
        setTasks(tRes.data || []);
        setPipelines(pRes.data || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <div className="p-8 text-slate-400">Loading...</div>;
  if (!deal) return <div className="p-8 text-slate-400">Deal not found</div>;

  const pipeline = pipelines.find((p: any) => p.id === deal.pipelineId);
  const stageName = pipeline?.stages?.find((s: any) => s.id === deal.stageId)?.name || deal.stageId;

  const activityIcon = (type: string) => {
    const map: Record<string,string> = { email: "blue", call: "emerald", meeting: "amber", note: "slate", task: "orange", deal_created: "emerald", deal_stage_change: "amber", deal_won: "emerald", deal_lost: "red", contact_created: "blue", company_created: "indigo", sms: "purple", whatsapp: "green", integration: "cyan" };
    const color = map[type] || "slate";
    return <div className={`w-8 h-8 rounded-full bg-${color}-500/10 flex items-center justify-center`}><Activity className={`w-4 h-4 text-${color}-400`} /></div>;
  };

  const statusColor = (status: string) => {
    if (status === "won") return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    if (status === "lost") return "bg-red-500/10 text-red-400 border border-red-500/20";
    return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
  };

  const tabs = [
    { id: "overview", label: "Overview", count: null },
    { id: "activity", label: "Activity", count: activities.length },
    { id: "tasks", label: "Tasks", count: tasks.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"><ArrowLeft className="w-4 h-4" /> Back</button>
      </div>

      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-300"><Briefcase className="w-7 h-7" /></div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-white">{deal.name}</h1>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(deal.status)}`}>{deal.status}</span>
          </div>
          {pipeline && <div className="text-sm text-slate-500 mt-0.5">{pipeline.name} → {stageName}</div>}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"><div className="text-2xl font-bold text-white">{deal.value ? new Intl.NumberFormat("en-US", { style: "currency", currency: deal.currency || "USD", maximumFractionDigits: 0 }).format(deal.value) : "$0"}</div><div className="text-xs text-slate-500 mt-1">Value</div></div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"><div className="text-2xl font-bold text-white">{deal.probability || 0}%</div><div className="text-xs text-slate-500 mt-1">Probability</div></div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"><div className="text-2xl font-bold text-white">{deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : "-"}</div><div className="text-xs text-slate-500 mt-1">Expected Close</div></div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"><div className="text-2xl font-bold text-white capitalize">{deal.priority || "medium"}</div><div className="text-xs text-slate-500 mt-1">Priority</div></div>
      </div>

      <div className="flex gap-1 border-b border-slate-800">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${tab === t.id ? "text-emerald-400" : "text-slate-400 hover:text-slate-200"}`}>
            {t.label}
            {t.count !== null && <span className="ml-1.5 text-xs bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full">{t.count}</span>}
            {tab === t.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500/60 rounded-t-full" />}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-sm font-medium text-white mb-4">Deal Details</h3>
            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
              <div className="flex items-center gap-2 text-slate-400"><Briefcase className="w-4 h-4 text-slate-500" /><span className="text-slate-300">{deal.name}</span></div>
              <div className="flex items-center gap-2 text-slate-400"><DollarSign className="w-4 h-4 text-slate-500" /><span className="text-slate-300">{deal.value ? new Intl.NumberFormat("en-US", { style: "currency", currency: deal.currency || "USD" }).format(deal.value) : "-"}</span></div>
              <div className="flex items-center gap-2 text-slate-400"><BarChart3 className="w-4 h-4 text-slate-500" /><span className="text-slate-300">{deal.probability || 0}% probability</span></div>
              <div className="flex items-center gap-2 text-slate-400"><Calendar className="w-4 h-4 text-slate-500" /><span className="text-slate-300">Close: {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : "-"}</span></div>
              <div className="flex items-center gap-2 text-slate-400"><User className="w-4 h-4 text-slate-500" /><span className="text-slate-300">Contact: {deal.primaryContactId ? "Linked" : "-"}</span></div>
              <div className="flex items-center gap-2 text-slate-400"><Building2 className="w-4 h-4 text-slate-500" /><span className="text-slate-300">Company: {deal.companyId ? "Linked" : "-"}</span></div>
              <div className="flex items-center gap-2 text-slate-400"><Clock className="w-4 h-4 text-slate-500" /><span className="text-slate-300">Created: {deal.createdAt ? new Date(deal.createdAt).toLocaleDateString() : "-"}</span></div>
            </div>
            {deal.description && <div className="mt-4 pt-4 border-t border-slate-800 text-sm text-slate-400"><FileText className="w-4 h-4 text-slate-500 inline mr-2" />{deal.description}</div>}
            {deal.closeReason && <div className="mt-4 pt-4 border-t border-slate-800 text-sm text-red-400">{deal.status === "lost" ? "Lost reason" : "Close reason"}: {deal.closeReason}</div>}
          </div>
        </div>
      )}

      {tab === "activity" && (
        <div className="space-y-3">
          {activities.length === 0 && <div className="text-center text-slate-600 py-12 text-sm">No activity yet</div>}
          {activities.map((a, i) => (
            <div key={a.id || i} className="flex gap-4 items-start rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              {activityIcon(a.type)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1"><span className="text-sm font-medium text-slate-200 capitalize">{a.type.replace(/_/g, " ")}</span><span className="text-xs text-slate-500">{a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}</span></div>
                {a.subject && <div className="text-sm text-slate-300 mb-0.5">{a.subject}</div>}
                {a.body && <div className="text-sm text-slate-400">{a.body}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "tasks" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          {tasks.length === 0 ? <div className="px-4 py-12 text-center text-slate-600 text-sm">No tasks</div> : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-800/40"><tr><th className="px-4 py-3">Title</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Due</th></tr></thead>
              <tbody className="divide-y divide-slate-800">
                {tasks.map(t => (
                  <tr key={t.id} className="hover:bg-slate-800/30 cursor-pointer transition-colors" onClick={() => router.push(`./tasks/${t.id}`)}>
                    <td className="px-4 py-3 font-medium text-slate-200">{t.title}</td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${t.status === "done" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : t.status === "in_progress" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-slate-700/50 text-slate-300 border border-slate-600/30"}`}>{t.status.replace(/_/g, " ")}</span></td>
                    <td className="px-4 py-3 text-slate-400 capitalize">{t.priority}</td>
                    <td className="px-4 py-3 text-slate-400">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
