"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Briefcase, DollarSign, Calendar, User, Building2, BarChart3, Clock, Activity, FileText, Pencil, Trash2, X, AlertTriangle, Tag, Plus } from "lucide-react";
import { TagManager } from "@/components/tag-manager";
import { LogActivityModal } from "@/components/crm/log-activity-modal";

const TAB_STYLE = "px-4 py-2.5 text-sm font-medium transition-colors relative";
const TAB_ACTIVE = "text-emerald-400";
const TAB_INACTIVE = "text-slate-400 hover:text-slate-200";

const STATUS_BADGE = (status: string) => {
  if (status === "won") return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
  if (status === "lost") return "bg-red-500/10 text-red-400 border border-red-500/20";
  return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
};

const TASK_STATUS = (status: string) => {
  if (status === "done") return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
  if (status === "in_progress") return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
  return "bg-slate-700/50 text-slate-300 border border-slate-600/30";
};

export default function DealDetailPage() {
  const { id, workspace } = useParams<{ id: string; workspace: string }>();
  const router = useRouter();
  const [deal, setDeal] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [showLogActivity, setShowLogActivity] = useState(false);

  async function load() {
    setLoading(true);
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

  useEffect(() => { if (id) load(); }, [id]);

  function openEdit() {
    if (!deal) return;
    setEditForm({
      name: deal.name || "",
      value: deal.value || "",
      currency: deal.currency || "USD",
      probability: deal.probability || 50,
      priority: deal.priority || "medium",
      status: deal.status || "open",
      expectedCloseDate: deal.expectedCloseDate ? deal.expectedCloseDate.split("T")[0] : "",
      description: deal.description || "",
      closeReason: deal.closeReason || "",
    });
    setShowEdit(true);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = { ...editForm, value: editForm.value ? Number(editForm.value) : null };
    const res = await fetch(`/api/deals/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    if (res.ok) { setShowEdit(false); load(); }
  }

  async function doDelete() {
    setDeleting(true);
    const res = await fetch(`/api/deals/${id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) { router.push(`/${workspace}/deals`); }
  }

  const inputCls = "w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/60";
  const labelCls = "block text-xs font-medium text-slate-500 mb-1";

  if (loading) return <div className="p-8 text-slate-400">Loading...</div>;
  if (!deal) return <div className="p-8 text-slate-400">Deal not found</div>;

  const pipeline = pipelines.find((p: any) => p.id === deal.pipelineId);
  const stageName = pipeline?.stages?.find((s: any) => s.id === deal.stageId)?.name || deal.stageId;

  const activityIcon = (type: string) => {
    const map: Record<string,string> = { email: "blue", call: "emerald", meeting: "amber", note: "slate", task: "orange", deal_created: "emerald", deal_stage_change: "amber", deal_won: "emerald", deal_lost: "red", contact_created: "blue", company_created: "indigo", sms: "purple", whatsapp: "green", integration: "cyan" };
    const color = map[type] || "slate";
    return <div className={`w-8 h-8 rounded-full bg-${color}-500/10 flex items-center justify-center`}><Activity className={`w-4 h-4 text-${color}-400`} /></div>;
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
        <div className="flex items-center gap-2">
          <button onClick={openEdit} className="h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm flex items-center gap-2 hover:bg-slate-700 transition-colors"><Pencil size={14} /> Edit</button>
          <button onClick={() => setShowDelete(true)} className="h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-red-400 text-sm flex items-center gap-2 hover:bg-red-500/10 hover:border-red-500/30 transition-colors"><Trash2 size={14} /> Delete</button>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-300"><Briefcase className="w-7 h-7" /></div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-white">{deal.name}</h1>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE(deal.status)}`}>{deal.status}</span>
          </div>
          <div className="mt-2">
            <TagManager entityType="deal" entityId={id} />
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
          <button key={t.id} onClick={() => setTab(t.id)} className={`${TAB_STYLE} ${tab === t.id ? TAB_ACTIVE : TAB_INACTIVE}`}>
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
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Activity size={16} className="text-[#2B6ED2]" /> Activity Timeline</h3>
            <button onClick={() => setShowLogActivity(true)} className="h-8 px-3 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 flex items-center gap-1.5 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Log Activity
            </button>
          </div>
          {activities.length === 0 && <div className="text-center text-slate-600 py-12 text-sm">No activity yet</div>}
          <div className="space-y-3">
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
        </div>
      )}

      {tab === "tasks" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          {tasks.length === 0 ? <div className="px-4 py-12 text-center text-slate-600 text-sm">No tasks</div> : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-800/40"><tr><th className="px-4 py-3">Title</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Due</th></tr></thead>
              <tbody className="divide-y divide-slate-800">
                {tasks.map(t => (
                  <tr key={t.id} className="hover:bg-slate-800/30 cursor-pointer transition-colors" onClick={() => router.push(`/${workspace}/tasks/${t.id}`)}>
                    <td className="px-4 py-3 font-medium text-slate-200">{t.title}</td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TASK_STATUS(t.status)}`}>{t.status.replace(/_/g, " ")}</span></td>
                    <td className="px-4 py-3 text-slate-400 capitalize">{t.priority}</td>
                    <td className="px-4 py-3 text-slate-400">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowEdit(false); }}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center"><Pencil size={14} className="text-white" /></div>
              <h2 className="text-lg font-semibold text-white">Edit Deal</h2>
              <button onClick={() => setShowEdit(false)} className="ml-auto p-1.5 rounded-lg hover:bg-slate-800 text-slate-500"><X size={16} /></button>
            </div>
            <form onSubmit={saveEdit} className="p-6 space-y-4">
              <div><label className={labelCls}>Name</label><input type="text" value={editForm.name || ""} onChange={e => setEditForm({...editForm, name: e.target.value})} className={inputCls} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Value</label><input type="number" value={editForm.value || ""} onChange={e => setEditForm({...editForm, value: e.target.value})} className={inputCls} /></div>
                <div><label className={labelCls}>Currency</label><select value={editForm.currency || "USD"} onChange={e => setEditForm({...editForm, currency: e.target.value})} className={inputCls}><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option><option value="ZAR">ZAR</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Probability %</label><input type="number" min="0" max="100" value={editForm.probability || ""} onChange={e => setEditForm({...editForm, probability: e.target.value})} className={inputCls} /></div>
                <div><label className={labelCls}>Expected Close</label><input type="date" value={editForm.expectedCloseDate || ""} onChange={e => setEditForm({...editForm, expectedCloseDate: e.target.value})} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Status</label><select value={editForm.status || ""} onChange={e => setEditForm({...editForm, status: e.target.value})} className={inputCls}><option value="open">Open</option><option value="won">Won</option><option value="lost">Lost</option></select></div>
                <div><label className={labelCls}>Priority</label><select value={editForm.priority || ""} onChange={e => setEditForm({...editForm, priority: e.target.value})} className={inputCls}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></div>
              </div>
              <div><label className={labelCls}>Description</label><textarea value={editForm.description || ""} onChange={e => setEditForm({...editForm, description: e.target.value})} className={`${inputCls} h-20 resize-none`} /></div>
              {editForm.status === "lost" && <div><label className={labelCls}>Lost Reason</label><input type="text" value={editForm.closeReason || ""} onChange={e => setEditForm({...editForm, closeReason: e.target.value})} className={inputCls} /></div>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowEdit(false)} className="h-9 px-4 rounded-lg bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowDelete(false); }}>
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto"><AlertTriangle size={20} className="text-red-400" /></div>
            <h3 className="text-lg font-semibold text-white">Delete Deal</h3>
            <p className="text-sm text-slate-400">Are you sure you want to delete <span className="text-slate-200 font-medium">{deal.name}</span>? This cannot be undone.</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowDelete(false)} className="flex-1 h-9 rounded-lg bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={doDelete} disabled={deleting} className="flex-1 h-9 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-500 transition-colors disabled:opacity-50">{deleting ? "Deleting..." : "Delete"}</button>
            </div>
          </div>
        </div>
      )}
      {/* Log Activity Modal */}
      {showLogActivity && deal && (
        <LogActivityModal
          entityType="deal"
          entityId={id}
          entityName={deal.name}
          onClose={() => setShowLogActivity(false)}
          onCreated={load}
        />
      )}
    </div>
  );
}
