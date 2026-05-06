"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, CheckSquare, Calendar, Clock, User, Building2, Briefcase,
  FileText, Activity, Flag, Pencil, Trash2, X, AlertTriangle, Plus, Tag
} from "lucide-react";
import { LogActivityModal } from "@/components/crm/log-activity-modal";
import { InlineEdit, RichTimeline } from "@/components/crm/detail-components";
import { GlassCard, PageFade } from "@/components/crm/motion";
import { useToast } from "@/components/crm/toast";

const TAB_STYLE = "px-4 py-2 text-[13px] font-medium transition-colors border-b-2 -mb-px";
const TAB_ACTIVE = "border-brand text-brand-light";
const TAB_INACTIVE = "border-transparent text-muted hover:text-secondary";

const STATUS_BADGE = (status: string) => {
  const map: Record<string, string> = {
    done: "bg-success/10 text-success border border-success/20",
    in_progress: "bg-warning/10 text-warning border border-warning/20",
    blocked: "bg-danger/10 text-danger border border-danger/20",
    in_review: "bg-info/10 text-info border border-info/20",
    todo: "bg-white/[0.04] text-muted border border-white/[0.06]",
  };
  return map[status] || map.todo;
};

const PRIORITY_BADGE = (p: string) => {
  const map: Record<string, string> = {
    critical: "bg-danger/10 text-danger border border-danger/20",
    high: "bg-warning/10 text-warning border border-warning/20",
    medium: "bg-info/10 text-info border border-info/20",
    low: "bg-white/[0.04] text-muted border border-white/[0.06]",
  };
  return map[p] || map.low;
};

export default function TaskDetailPage() {
  const { id, workspace } = useParams<{ id: string; workspace: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [task, setTask] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [tab, setTab] = useState<"overview" | "activity">("overview");
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showLogActivity, setShowLogActivity] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [tRes, aRes] = await Promise.all([
        fetch(`/api/tasks/${id}`),
        fetch(`/api/activities?entityType=task&entityId=${id}`),
      ]);
      const tData = await tRes.json().catch(() => ({}));
      const aData = await aRes.json().catch(() => ({}));
      setTask(tData.data || null);
      setActivities(aData.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  useEffect(() => { if (id) load(); }, [id]);

  async function patchField(field: string, value: string | number) {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
      credentials: "include",
    });
    if (res.ok) {
      setTask((prev: any) => prev ? { ...prev, [field]: value } : prev);
      toast("Task updated", "success");
    } else {
      toast("Failed to update", "error");
    }
  }

  async function doDelete() {
    setDeleting(true);
    const res = await fetch(`/api/tasks/${id}`, { credentials: "include", method: "DELETE" });
    setDeleting(false);
    if (res.ok) { toast("Task deleted", "success"); router.push(`/${workspace}/tasks`); }
    else toast("Failed to delete", "error");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-6 h-6 border-2 border-brand/20 border-t-brand rounded-full" />
      </div>
    );
  }
  if (!task) return <div className="p-8 text-sm text-danger">Task not found</div>;

  const timelineItems = activities.map((a: any) => ({
    id: a.id,
    type: a.type || "note",
    body: a.body || a.description || `${a.type.replace(/_/g, " ")}`,
    createdAt: a.createdAt,
    author: a.user ? { name: a.user.name || a.user.email } : undefined,
    metadata: a.subject ? { Subject: a.subject } : undefined,
  }));

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "activity", label: "Activity", count: activities.length },
  ];

  return (
    <PageFade className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted hover:text-secondary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowDelete(true)} className="h-9 px-3 rounded-lg bg-elevated border border-white/[0.06] text-danger text-sm flex items-center gap-2 hover:bg-danger/10 hover:border-danger/30 transition-colors">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* Identity */}
      <div className="flex items-start gap-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/10 flex items-center justify-center text-orange-300"
        >
          <CheckSquare className="w-7 h-7" />
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-semibold text-[#f7f8f8]">{task.title}</h1>
            <span className={["px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wide", STATUS_BADGE(task.status)].join(" ")}>
              {task.status.replace(/_/g, " ")}
            </span>
            <span className={["px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wide", PRIORITY_BADGE(task.priority)].join(" ")}>
              {task.priority || "medium"}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted">
            {task.dueDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Due {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/[0.06]">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)} className={`${TAB_STYLE} ${tab === t.id ? TAB_ACTIVE : TAB_INACTIVE}`}>
            {t.label}
            {t.count !== undefined && <span className="ml-1.5 text-xs bg-elevated text-muted px-1.5 py-0.5 rounded-full">{t.count}</span>}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "overview" && (
          <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Info + Inline Edit + Linked Records */}
            <div className="lg:col-span-2 space-y-4">
              <GlassCard>
                <div className="p-5">
                  <h3 className="text-sm font-semibold text-[#f7f8f8] mb-4">Task Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                    <InlineEdit label="Title" value={task.title} onSave={v => patchField("title", v)} />
                    <InlineEdit label="Due Date" value={task.dueDate ? task.dueDate.split("T")[0] : ""} onSave={v => patchField("dueDate", v)} type="text" />
                    <div>
                      <span className="block text-[11px] font-medium text-muted uppercase tracking-wider mb-1">Status</span>
                      <select
                        value={task.status || "todo"}
                        onChange={e => patchField("status", e.target.value)}
                        className="h-8 px-2 rounded-md bg-elevated border border-white/[0.08] text-[13px] text-secondary focus:outline-none focus:ring-1 focus:ring-brand/30"
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="in_review">In Review</option>
                        <option value="blocked">Blocked</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                    <div>
                      <span className="block text-[11px] font-medium text-muted uppercase tracking-wider mb-1">Priority</span>
                      <select
                        value={task.priority || "medium"}
                        onChange={e => patchField("priority", e.target.value)}
                        className="h-8 px-2 rounded-md bg-elevated border border-white/[0.08] text-[13px] text-secondary focus:outline-none focus:ring-1 focus:ring-brand/30"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>
                  {task.description && (
                    <div className="mt-4 pt-4 border-t border-white/[0.06]">
                      <span className="block text-[11px] font-medium text-muted uppercase tracking-wider mb-1">Description</span>
                      <p className="text-[13px] text-muted leading-relaxed">{task.description}</p>
                    </div>
                  )}
                </div>
              </GlassCard>

              {/* Linked Records */}
              <GlassCard className="p-5">
                <h3 className="text-sm font-semibold text-[#f7f8f8] mb-3">Linked Records</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <User className="w-4 h-4 text-faint" />
                    <span>Contact: {task.contactId ? "Linked" : "-"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Building2 className="w-4 h-4 text-faint" />
                    <span>Company: {task.companyId ? "Linked" : "-"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Briefcase className="w-4 h-4 text-faint" />
                    <span>Deal: {task.dealId ? "Linked" : "-"}</span>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Right: Metadata */}
            <div className="space-y-4">
              <GlassCard className="p-5">
                <h3 className="text-sm font-semibold text-[#f7f8f8] mb-3">Metadata</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted">
                    <Calendar className="w-4 h-4 text-faint" />
                    <span>Created {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : "-"}</span>
                  </div>
                  {task.updatedAt && (
                    <div className="flex items-center gap-2 text-muted">
                      <Calendar className="w-4 h-4 text-faint" />
                      <span>Updated {new Date(task.updatedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted">
                    <User className="w-4 h-4 text-faint" />
                    <span>{task.userId || "Unassigned"}</span>
                  </div>
                </div>
              </GlassCard>
            </div>
          </motion.div>
        )}

        {tab === "activity" && (
          <motion.div key="activity" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-[#f7f8f8] flex items-center gap-2">
                    <Activity size={16} className="text-brand" /> Activity Timeline
                  </h3>
                  <button onClick={() => setShowLogActivity(true)} className="h-8 px-3 rounded-lg bg-brand text-[#f7f8f8] text-xs font-medium hover:bg-brand flex items-center gap-1.5 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Log Activity
                  </button>
                </div>
                <RichTimeline items={timelineItems} />
              </GlassCard>
            </div>
            <div className="space-y-4">
              <GlassCard className="p-5">
                <h3 className="text-sm font-semibold text-[#f7f8f8] mb-3">Stats</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between text-muted">
                    <span>Total activities</span>
                    <span className="font-medium text-secondary">{activities.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted">
                    <span>Last activity</span>
                    <span className="font-medium text-secondary">
                      {activities[0]?.createdAt ? new Date(activities[0].createdAt).toLocaleDateString() : "-"}
                    </span>
                  </div>
                </div>
              </GlassCard>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDelete && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowDelete(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl border border-white/[0.06] bg-elevated shadow-2xl p-6 text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center mx-auto">
                <AlertTriangle size={20} className="text-danger" />
              </div>
              <h3 className="text-lg font-semibold text-[#f7f8f8]">Delete Task</h3>
              <p className="text-sm text-muted">Are you sure you want to delete <span className="text-secondary font-medium">{task.title}</span>? This cannot be undone.</p>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowDelete(false)} className="flex-1 h-9 rounded-lg bg-surface text-muted text-sm font-medium hover:bg-elevated transition-colors">Cancel</button>
                <button onClick={doDelete} disabled={deleting} className="flex-1 h-9 rounded-lg bg-danger text-[#f7f8f8] text-sm font-medium hover:bg-red-500 transition-colors disabled:opacity-50">
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
    </PageFade>
  );
}
