"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Briefcase, DollarSign, Calendar, User, Building2, BarChart3, Clock,
  Activity, FileText, Pencil, Trash2, X, Plus, ChevronRight, Tag, Target, TrendingUp,
  AlertTriangle, CheckSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TagManager } from "@/components/tag-manager";
import { LogActivityModal } from "@/components/crm/log-activity-modal";
import { InlineEdit, RichTimeline } from "@/components/crm/detail-components";
import { GlassCard, PageFade, AnimatedBadge } from "@/components/crm/motion";
import { useToast } from "@/components/crm/toast";

const TAB_STYLE = "px-4 py-2 text-[13px] font-medium transition-colors border-b-2 -mb-px";
const TAB_ACTIVE = "border-brand text-brand-light";
const TAB_INACTIVE = "border-transparent text-muted hover:text-secondary";

const STATUS_BADGE = (status: string) => {
  if (status === "won") return "bg-success/10 text-success border border-success/20";
  if (status === "lost") return "bg-danger/10 text-danger border border-danger/20";
  return "bg-warning/10 text-warning border border-warning/20";
};

export default function DealDetailPage() {
  const { id, workspace } = useParams<{ id: string; workspace: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [deal, setDeal] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [tab, setTab] = useState<"overview" | "activity" | "tasks">("overview");
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showLogActivity, setShowLogActivity] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [dRes, aRes, tRes, pRes] = await Promise.all([
        fetch(`/api/deals/${id}`),
        fetch(`/api/activities?entityType=deal&entityId=${id}`),
        fetch(`/api/tasks?dealId=${id}`),
        fetch(`/api/pipelines`, { credentials: "include" }),
      ]);
      setDeal((await dRes.json()).data || null);
      setActivities((await aRes.json()).data || []);
      setTasks((await tRes.json()).data || []);
      setPipelines((await pRes.json()).data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  useEffect(() => { if (id) load(); }, [id]);

  async function patchField(field: string, value: string | number) {
    const res = await fetch(`/api/deals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
      credentials: "include",
    });
    if (res.ok) {
      setDeal((prev: any) => prev ? { ...prev, [field]: value } : prev);
      toast("Deal updated", "success");
    } else {
      toast("Failed to update", "error");
    }
  }

  async function doDelete() {
    setDeleting(true);
    const res = await fetch(`/api/deals/${id}`, { credentials: "include", method: "DELETE" });
    setDeleting(false);
    if (res.ok) { toast("Deal deleted", "success"); router.push(`/${workspace}/deals`); }
    else toast("Failed to delete", "error");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-6 h-6 border-2 border-brand/20 border-t-brand rounded-full" />
      </div>
    );
  }

  if (!deal) return <div className="p-8 text-sm text-danger">Deal not found</div>;

  const currency = deal.currency || "USD";
  const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 });

  const timelineItems = activities.map((a: any) => ({
    id: a.id,
    type: a.type || "note",
    body: a.body || a.description || "Activity",
    createdAt: a.createdAt,
    author: a.author,
    metadata: a.metadata,
  }));

  return (
    <PageFade className="max-w-7xl mx-auto">
      {/* ─── HEADER ─── */}
      <div className="flex items-start gap-4 mb-6">
        <motion.button whileHover={{ x: -2 }} onClick={() => router.back()} className="mt-1 p-2 rounded-lg hover:bg-elevated text-muted transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
        </motion.button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-success/20 to-brand/20 flex items-center justify-center shadow-lg shadow-brand/5">
              <Briefcase className="w-6 h-6 text-brand" strokeWidth={1.5} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-primary-text">{deal.name}</h1>
                {deal.status && (
                  <span className={["px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wide", STATUS_BADGE(deal.status)].join(" ")}>
                    {deal.status}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[13px] font-semibold text-secondary tabular-nums">{fmt.format(deal.value || 0)}</span>
                <span className="text-faint">·</span>
                <span className="text-[12px] text-muted">{deal.probability || 0}% probability</span>
                <span className="text-faint">·</span>
                <span className="text-[12px] text-muted">{deal.stage || "No stage"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowLogActivity(true)} className="h-8 px-3 rounded-lg bg-brand text-white text-[12px] flex items-center gap-2 hover:bg-brand-light transition-colors">
            <Plus className="w-3.5 h-3.5" /> Log Activity
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowDelete(true)} className="h-8 px-3 rounded-lg bg-elevated border border-white/[0.06] text-danger text-[12px] flex items-center gap-2 hover:bg-danger/10 hover:border-danger/20 transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </motion.button>
        </div>
      </div>

      {/* ─── KPI ROW ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Value", value: fmt.format(deal.value || 0), icon: DollarSign, color: "text-brand" },
          { label: "Probability", value: `${deal.probability || 0}%`, icon: Target, color: "text-success" },
          { label: "Expected Close", value: deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : "—", icon: Calendar, color: "text-warning" },
          { label: "Priority", value: deal.priority || "medium", icon: TrendingUp, color: "text-info" },
        ].map((kpi, i) => (
          <GlassCard key={i} className="p-4" hover>
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} strokeWidth={1.5} />
              <span className="text-[11px] text-muted uppercase tracking-wider">{kpi.label}</span>
            </div>
            <div className="text-lg font-semibold text-secondary tabular-nums">{kpi.value}</div>
          </GlassCard>
        ))}
      </div>

      {/* ─── TABS ─── */}
      <div className="border-b border-white/[0.06] mb-6">
        <div className="flex gap-1">
          {(["overview", "activity", "tasks"] as const).map(t => (
            <motion.button key={t} whileTap={{ scale: 0.98 }} onClick={() => setTab(t)} className={`${TAB_STYLE} ${tab === t ? TAB_ACTIVE : TAB_INACTIVE}`}>
              {t}
              {t === "activity" && activities.length > 0 && <span className="ml-1.5 text-[10px] px-1 py-0 rounded-full bg-white/[0.06] text-muted">{activities.length}</span>}
              {t === "tasks" && tasks.length > 0 && <span className="ml-1.5 text-[10px] px-1 py-0 rounded-full bg-white/[0.06] text-muted">{tasks.length}</span>}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ─── CONTENT ─── */}
      <AnimatePresence mode="wait">
        {tab === "overview" && (
          <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <GlassCard className="p-5" hover>
                <h3 className="text-[12px] font-semibold text-muted uppercase tracking-wider mb-4">Deal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  <InlineEdit label="Deal Name" value={deal.name} onSave={v => patchField("name", v)} />
                  <InlineEdit label="Value" value={String(deal.value || 0)} type="number" onSave={v => patchField("value", Number(v))} />
                  <InlineEdit label="Currency" value={deal.currency || "USD"} onSave={v => patchField("currency", v)} />
                  <InlineEdit label="Probability (%)" value={String(deal.probability || 0)} type="number" onSave={v => patchField("probability", Number(v))} />
                  <InlineEdit label="Expected Close" value={deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toISOString().split("T")[0] : ""} type="text" onSave={v => patchField("expectedCloseDate", v)} />
                  <InlineEdit label="Priority" value={deal.priority || "medium"} onSave={v => patchField("priority", v)} />
                  <InlineEdit label="Status" value={deal.status || "open"} onSave={v => patchField("status", v)} />
                  <InlineEdit label="Stage" value={deal.stageId || deal.stage || ""} onSave={v => patchField("stageId", v)} />
                </div>
              </GlassCard>
            </div>

            <div className="space-y-4">
              <GlassCard className="p-5" hover>
                <h3 className="text-[12px] font-semibold text-muted uppercase tracking-wider mb-3">Tags</h3>
                <TagManager entityType="deal" entityId={id} />
              </GlassCard>

              {deal.contact && (
                <GlassCard className="p-4" hover onClick={() => router.push(`/${workspace}/contacts/${deal.contact.id}`)}>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-brand" strokeWidth={1.5} />
                    <span className="text-[13px] text-secondary">{deal.contact.firstName} {deal.contact.lastName}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-faint ml-auto" />
                  </div>
                </GlassCard>
              )}

              {deal.company && (
                <GlassCard className="p-4" hover onClick={() => router.push(`/${workspace}/companies/${deal.company.id}`)}>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-success" strokeWidth={1.5} />
                    <span className="text-[13px] text-secondary">{deal.company.name}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-faint ml-auto" />
                  </div>
                </GlassCard>
              )}
            </div>
          </motion.div>
        )}

        {tab === "activity" && (
          <motion.div key="activity" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <GlassCard className="p-5" hover>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[12px] font-semibold text-muted uppercase tracking-wider">Activity Timeline</h3>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowLogActivity(true)} className="h-7 px-3 rounded-md bg-brand text-white text-[11px] font-medium flex items-center gap-1.5 hover:bg-brand-light transition-colors">
                  <Plus className="w-3 h-3" /> Log Activity
                </motion.button>
              </div>
              <RichTimeline items={timelineItems} />
            </GlassCard>
          </motion.div>
        )}

        {tab === "tasks" && (
          <motion.div key="tasks" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-3">
            {tasks.length === 0 && (
              <GlassCard className="p-8 text-center" hover={false}>
                <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-3">
                  <CheckSquare className="w-5 h-5 text-muted" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-muted">No tasks linked to this deal.</p>
              </GlassCard>
            )}
            {tasks.map((task: any, i: number) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => router.push(`./tasks/${task.id}`)}
                className="group flex items-center justify-between p-4 rounded-xl bg-surface border border-white/[0.06] hover:border-white/[0.10] hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${task.status === "done" ? "bg-success/10" : "bg-warning/10"}`}>
                    <CheckSquare className={`w-4 h-4 ${task.status === "done" ? "text-success" : "text-warning"}`} strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-secondary">{task.title}</div>
                    <div className="text-[11px] text-muted">{task.status}</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-faint opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDelete && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDelete(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-2xl border border-white/[0.06] bg-elevated shadow-2xl p-6 z-50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-danger/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-danger" />
                </div>
                <h3 className="text-lg font-semibold text-primary-text">Delete Deal</h3>
              </div>
              <p className="text-[13px] text-muted mb-6">This will permanently delete {deal.name} and all associated activities. This cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={() => setShowDelete(false)} className="flex-1 h-9 rounded-lg bg-elevated border border-white/[0.06] text-muted text-[13px] hover:bg-hover transition-colors">Cancel</button>
                <button onClick={doDelete} disabled={deleting} className="flex-1 h-9 rounded-lg bg-danger text-white text-[13px] font-medium hover:bg-red-500 transition-colors disabled:opacity-50">{deleting ? "Deleting..." : "Delete"}</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Log Activity */}
      <AnimatePresence>
        {showLogActivity && <LogActivityModal entityType="deal" entityId={id} onClose={() => setShowLogActivity(false)} onCreated={() => { setShowLogActivity(false); load(); toast("Activity logged", "success"); }} />}
      </AnimatePresence>
    </PageFade>
  );
}
