"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckSquare, Calendar, Clock, User, Building2, Briefcase, FileText, Activity, Flag, Pencil, Trash2, X, AlertTriangle, Plus } from "lucide-react";
import { LogActivityModal } from "@/components/crm/log-activity-modal";

const STATUS_BADGE = (status: string) => {
  if (status === "done") return "bg-[#10b981]/[0.12] text-[#10b981] border border-[#10b981]/[0.08]";
  if (status === "in_progress") return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
  if (status === "blocked") return "bg-red-500/10 text-red-400 border border-red-500/20";
  if (status === "in_review") return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
  return "bg-[#28282c]/50 text-[#8a8f98] border border-white/[0.08]/30";
};

const PRIORITY_COLOR = (p: string) => {
  if (p === "critical") return "text-red-400";
  if (p === "high") return "text-amber-400";
  if (p === "medium") return "text-blue-400";
  return "text-[#8a8f98]";
};

export default function TaskDetailPage() {
  const { id, workspace } = useParams<{ id: string; workspace: string }>();
  const router = useRouter();
  const [task, setTask] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
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
      const [tRes, aRes] = await Promise.all([
        fetch(`/api/tasks/${id}`).then(r => r.json()),
        fetch(`/api/activities?entityType=task&entityId=${id}`).then(r => r.json()),
      ]);
      setTask(tRes.data || null);
      setActivities(aRes.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  useEffect(() => { if (id) load(); }, [id]);

  function openEdit() {
    if (!task) return;
    setEditForm({
      title: task.title || "",
      description: task.description || "",
      priority: task.priority || "medium",
      status: task.status || "todo",
      dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
    });
    setShowEdit(true);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/tasks/${id}`, { credentials: "include", method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
    setSaving(false);
    if (res.ok) { setShowEdit(false); load(); }
  }

  async function doDelete() {
    setDeleting(true);
    const res = await fetch(`/api/tasks/${id}`, { credentials: "include", method: "DELETE" });
    setDeleting(false);
    if (res.ok) { router.push(`/${workspace}/tasks`); }
  }

  const inputCls = "w-full h-10 px-3 rounded-lg bg-[#0f1011] border border-white/[0.06] text-sm text-[#d0d6e0] placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]/[0.3]";
  const labelCls = "block text-xs font-medium text-[#62666d] mb-1";

  if (loading) return <div className="p-8 text-[#8a8f98]">Loading...</div>;
  if (!task) return <div className="p-8 text-[#8a8f98]">Task not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-[#8a8f98] hover:text-[#f7f8f8] transition-colors"><ArrowLeft className="w-4 h-4" /> Back</button>
        <div className="flex items-center gap-2">
          <button onClick={openEdit} className="h-9 px-3 rounded-lg bg-[#191a1b] border border-white/[0.06] text-[#8a8f98] text-sm flex items-center gap-2 hover:bg-[#28282c] transition-colors"><Pencil size={14} /> Edit</button>
          <button onClick={() => setShowDelete(true)} className="h-9 px-3 rounded-lg bg-[#191a1b] border border-white/[0.06] text-red-400 text-sm flex items-center gap-2 hover:bg-red-500/10 hover:border-red-500/30 transition-colors"><Trash2 size={14} /> Delete</button>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/20 flex items-center justify-center text-orange-300"><CheckSquare className="w-7 h-7" /></div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-[#f7f8f8]">{task.title}</h1>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE(task.status)}`}>{task.status.replace(/_/g, " ")}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-[#62666d]">
            <span className={`flex items-center gap-1 ${PRIORITY_COLOR(task.priority)}`}><Flag className="w-3.5 h-3.5" />{task.priority || "medium"} priority</span>
            {task.dueDate && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Due {new Date(task.dueDate).toLocaleDateString()}</span>}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-[#0f1011] p-5">
        <h3 className="text-sm font-medium text-[#f7f8f8] mb-4">Task Details</h3>
        <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
          <div className="flex items-center gap-2 text-[#8a8f98]"><CheckSquare className="w-4 h-4 text-[#62666d]" /><span className="text-[#8a8f98]">{task.title}</span></div>
          <div className="flex items-center gap-2 text-[#8a8f98]"><Flag className="w-4 h-4 text-[#62666d]" /><span className={PRIORITY_COLOR(task.priority)}>{task.priority || "medium"}</span></div>
          <div className="flex items-center gap-2 text-[#8a8f98]"><Clock className="w-4 h-4 text-[#62666d]" /><span className="text-[#8a8f98] capitalize">{task.status.replace(/_/g, " ")}</span></div>
          <div className="flex items-center gap-2 text-[#8a8f98]"><Calendar className="w-4 h-4 text-[#62666d]" /><span className="text-[#8a8f98]">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}</span></div>
          <div className="flex items-center gap-2 text-[#8a8f98]"><User className="w-4 h-4 text-[#62666d]" /><span className="text-[#8a8f98]">{task.userId || "Unassigned"}</span></div>
          <div className="flex items-center gap-2 text-[#8a8f98]"><Calendar className="w-4 h-4 text-[#62666d]" /><span className="text-[#8a8f98]">Created: {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : "-"}</span></div>
        </div>
        {task.description && <div className="mt-4 pt-4 border-t border-white/[0.06] text-sm text-[#8a8f98]"><FileText className="w-4 h-4 text-[#62666d] inline mr-2" />{task.description}</div>}
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-[#0f1011] p-5">
        <h3 className="text-sm font-medium text-[#f7f8f8] mb-4">Linked Records</h3>
        <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
          <div className="flex items-center gap-2 text-[#8a8f98]"><User className="w-4 h-4 text-[#62666d]" /><span className="text-[#8a8f98]">Contact: {task.contactId ? "Linked" : "-"}</span></div>
          <div className="flex items-center gap-2 text-[#8a8f98]"><Building2 className="w-4 h-4 text-[#62666d]" /><span className="text-[#8a8f98]">Company: {task.companyId ? "Linked" : "-"}</span></div>
          <div className="flex items-center gap-2 text-[#8a8f98]"><Briefcase className="w-4 h-4 text-[#62666d]" /><span className="text-[#8a8f98]">Deal: {task.dealId ? "Linked" : "-"}</span></div>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-[#0f1011] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-[#f7f8f8]">Activity <span className="text-xs text-[#62666d] font-normal">({activities.length})</span></h3>
          <button onClick={() => setShowLogActivity(true)} className="h-8 px-3 rounded-lg bg-[#5e6ad2] text-[#f7f8f8] text-xs font-medium hover:bg-[#5e6ad2] flex items-center gap-1.5 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Log Activity
          </button>
        </div>
        <div className="space-y-3">
          {activities.length === 0 && <div className="text-center text-[#62666d] py-8 text-sm">No activity yet</div>}
          {activities.map((a, i) => (
            <div key={a.id || i} className="flex gap-4 items-start rounded-lg bg-[#191a1b]/30 p-3">
              <div className="w-8 h-8 rounded-full bg-[#28282c]/50 flex items-center justify-center"><Activity className="w-4 h-4 text-[#8a8f98]" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5"><span className="text-sm font-medium text-[#d0d6e0] capitalize">{a.type.replace(/_/g, " ")}</span><span className="text-xs text-[#62666d]">{a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}</span></div>
                {a.body && <div className="text-sm text-[#8a8f98]">{a.body}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowEdit(false); }}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/[0.06] bg-[#0f1011] shadow-2xl">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center"><Pencil size={14} className="text-[#f7f8f8]" /></div>
              <h2 className="text-lg font-semibold text-[#f7f8f8]">Edit Task</h2>
              <button onClick={() => setShowEdit(false)} className="ml-auto p-1.5 rounded-lg hover:bg-[#191a1b] text-[#62666d]"><X size={16} /></button>
            </div>
            <form onSubmit={saveEdit} className="p-6 space-y-4">
              <div><label className={labelCls}>Title</label><input type="text" value={editForm.title || ""} onChange={e => setEditForm({...editForm, title: e.target.value})} className={inputCls} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Status</label><select value={editForm.status || ""} onChange={e => setEditForm({...editForm, status: e.target.value})} className={inputCls}><option value="todo">To Do</option><option value="in_progress">In Progress</option><option value="in_review">In Review</option><option value="blocked">Blocked</option><option value="done">Done</option></select></div>
                <div><label className={labelCls}>Priority</label><select value={editForm.priority || ""} onChange={e => setEditForm({...editForm, priority: e.target.value})} className={inputCls}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></div>
              </div>
              <div><label className={labelCls}>Due Date</label><input type="date" value={editForm.dueDate || ""} onChange={e => setEditForm({...editForm, dueDate: e.target.value})} className={inputCls} /></div>
              <div><label className={labelCls}>Description</label><textarea value={editForm.description || ""} onChange={e => setEditForm({...editForm, description: e.target.value})} className={`${inputCls} h-20 resize-none`} /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowEdit(false)} className="h-9 px-4 rounded-lg bg-[#191a1b] text-[#8a8f98] text-sm font-medium hover:bg-[#28282c] transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="h-9 px-4 rounded-lg bg-[#5e6ad2] text-[#f7f8f8] text-sm font-medium hover:bg-[#5e6ad2] transition-colors disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowDelete(false); }}>
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.06] bg-[#0f1011] shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto"><AlertTriangle size={20} className="text-red-400" /></div>
            <h3 className="text-lg font-semibold text-[#f7f8f8]">Delete Task</h3>
            <p className="text-sm text-[#8a8f98]">Are you sure you want to delete <span className="text-[#d0d6e0] font-medium">{task.title}</span>? This cannot be undone.</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowDelete(false)} className="flex-1 h-9 rounded-lg bg-[#191a1b] text-[#8a8f98] text-sm font-medium hover:bg-[#28282c] transition-colors">Cancel</button>
              <button onClick={doDelete} disabled={deleting} className="flex-1 h-9 rounded-lg bg-red-600 text-[#f7f8f8] text-sm font-medium hover:bg-red-500 transition-colors disabled:opacity-50">{deleting ? "Deleting..." : "Delete"}</button>
            </div>
          </div>
        </div>
      )}
      {/* Log Activity Modal */}
      {showLogActivity && task && (
        <LogActivityModal
          entityType="task"
          entityId={id}
          entityName={task.title}
          onClose={() => setShowLogActivity(false)}
          onCreated={load}
        />
      )}
    </div>
  );
}
