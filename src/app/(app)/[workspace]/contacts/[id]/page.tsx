"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Mail, Phone, User, Building2, Activity, DollarSign, CheckSquare,
  Clock, FileText, Pencil, Trash2, X, Plus, ChevronRight, Tag, MapPin, Globe,
  CalendarDays, MessageSquare, Link as LinkIcon, Copy, ExternalLink, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TagManager } from "@/components/tag-manager";
import { LogActivityModal } from "@/components/crm/log-activity-modal";
import { CustomFieldsSection } from "@/components/crm/custom-fields-section";
import { InlineEdit, RichTimeline } from "@/components/crm/detail-components";
import { GlassCard, PageFade, AnimatedBadge } from "@/components/crm/motion";
import { useToast } from "@/components/crm/toast";

const TAB_STYLE = "px-4 py-2 text-[13px] font-medium transition-colors border-b-2 -mb-px";
const TAB_ACTIVE = "border-brand text-brand-light";
const TAB_INACTIVE = "border-transparent text-muted hover:text-secondary";

const LIFECYCLE_BADGE = (stage: string) => {
  const map: Record<string, string> = {
    subscriber: "bg-info/10 text-info border border-info/20",
    lead: "bg-warning/10 text-warning border border-warning/20",
    qualified: "bg-brand/10 text-brand-light border border-brand/20",
    opportunity: "bg-success/10 text-success border border-success/20",
    customer: "bg-success/10 text-success border border-success/20",
    champion: "bg-success/10 text-success border border-success/20",
    evangelist: "bg-brand/10 text-brand-light border border-brand/20",
    other: "bg-white/[0.04] text-muted border border-white/[0.06]",
  };
  return map[stage] || map.other;
};

export default function ContactDetailPage() {
  const { id, workspace } = useParams<{ id: string; workspace: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [contact, setContact] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [tab, setTab] = useState<"overview" | "activity" | "deals" | "tasks">("overview");
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showLogActivity, setShowLogActivity] = useState(false);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);

  async function load() {
    setLoading(true);
    const [cRes, aRes, dRes, tRes] = await Promise.all([
      fetch(`/api/contacts/${id}`),
      fetch(`/api/activities?entityType=contact&entityId=${id}`),
      fetch(`/api/deals?contactId=${id}`),
      fetch(`/api/tasks?contactId=${id}`),
    ]);
    const cData = await cRes.json().catch(() => ({}));
    const aData = await aRes.json().catch(() => ({}));
    const dData = await dRes.json().catch(() => ({}));
    const tData = await tRes.json().catch(() => ({}));
    setContact(cData.data);
    setActivities(aData.data || []);
    setDeals(dData.data || []);
    setTasks(tData.data || []);
    setLoading(false);
  }

  useEffect(() => { if (id) load(); }, [id]);

  async function patchField(field: string, value: string) {
    const res = await fetch(`/api/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
      credentials: "include",
    });
    if (res.ok) {
      setContact((prev: any) => prev ? { ...prev, [field]: value } : prev);
      toast("Contact updated", "success");
    } else {
      toast("Failed to update", "error");
    }
  }

  async function doDelete() {
    setDeleting(true);
    const res = await fetch(`/api/contacts/${id}`, { credentials: "include", method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      toast("Contact deleted", "success");
      router.push(`/${workspace}/contacts`);
    } else {
      toast("Failed to delete", "error");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-6 h-6 border-2 border-brand/20 border-t-brand rounded-full"
        />
      </div>
    );
  }

  if (!contact) return <div className="p-8 text-sm text-danger">Contact not found</div>;

  const initials = `${contact.firstName?.[0] || ""}${contact.lastName?.[0] || ""}`;
  const fullName = `${contact.firstName || ""} ${contact.lastName || ""}`.trim() || "Unnamed Contact";

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
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand to-brand-light flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-brand/10">
              {initials || "?"}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-primary-text">{fullName}</h1>
              <div className="flex items-center gap-2 mt-1">
                {contact.lifecycleStage && (
                  <span className={["px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wide", LIFECYCLE_BADGE(contact.lifecycleStage)].join(" ")}>
                    {contact.lifecycleStage}
                  </span>
                )}
                {contact.leadStatus && <span className="text-[11px] text-muted">{contact.leadStatus}</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setSidePanelOpen(true)} className="h-8 px-3 rounded-lg bg-elevated border border-white/[0.06] text-muted text-[12px] flex items-center gap-2 hover:bg-hover transition-colors">
            <Pencil className="w-3.5 h-3.5" /> Edit
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowDelete(true)} className="h-8 px-3 rounded-lg bg-elevated border border-white/[0.06] text-danger text-[12px] flex items-center gap-2 hover:bg-danger/10 hover:border-danger/20 transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </motion.button>
        </div>
      </div>

      {/* ─── TABS ─── */}
      <div className="border-b border-white/[0.06] mb-6">
        <div className="flex gap-1">
          {(["overview", "activity", "deals", "tasks"] as const).map(t => (
            <motion.button
              key={t}
              whileTap={{ scale: 0.98 }}
              onClick={() => setTab(t)}
              className={`${TAB_STYLE} ${tab === t ? TAB_ACTIVE : TAB_INACTIVE}`}
            >
              {t}
              {t === "activity" && activities.length > 0 && <span className="ml-1.5 text-[10px] px-1 py-0 rounded-full bg-white/[0.06] text-muted">{activities.length}</span>}
              {t === "deals" && deals.length > 0 && <span className="ml-1.5 text-[10px] px-1 py-0 rounded-full bg-white/[0.06] text-muted">{deals.length}</span>}
              {t === "tasks" && tasks.length > 0 && <span className="ml-1.5 text-[10px] px-1 py-0 rounded-full bg-white/[0.06] text-muted">{tasks.length}</span>}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ─── CONTENT ─── */}
      <AnimatePresence mode="wait">
        {tab === "overview" && (
          <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Details */}
            <div className="lg:col-span-2 space-y-4">
              <GlassCard className="p-5" hover>
                <h3 className="text-[12px] font-semibold text-muted uppercase tracking-wider mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  <InlineEdit label="First Name" value={contact.firstName} onSave={v => patchField("firstName", v)} />
                  <InlineEdit label="Last Name" value={contact.lastName} onSave={v => patchField("lastName", v)} />
                  <InlineEdit label="Email" value={contact.email} type="email" onSave={v => patchField("email", v)} />
                  <InlineEdit label="Phone" value={contact.phone} type="tel" onSave={v => patchField("phone", v)} />
                  <InlineEdit label="Job Title" value={contact.jobTitle} onSave={v => patchField("jobTitle", v)} />
                  <InlineEdit label="Company" value={contact.company?.name} onSave={v => patchField("companyName", v)} />
                  <InlineEdit label="Source" value={contact.sourceType || contact.source} onSave={v => patchField("sourceType", v)} />
                  <InlineEdit label="Lead Status" value={contact.leadStatus} onSave={v => patchField("leadStatus", v)} />
                </div>
              </GlassCard>

              <GlassCard className="p-5" hover>
                <CustomFieldsSection entityType="contact" entityId={id} mode="display" />
              </GlassCard>
            </div>

            {/* Right: Summary + Tags */}
            <div className="space-y-4">
              <GlassCard className="p-5" hover>
                <h3 className="text-[12px] font-semibold text-muted uppercase tracking-wider mb-4">Summary</h3>
                <div className="grid grid-cols-3 gap-3">
                  <motion.div whileHover={{ scale: 1.02 }} className="text-center p-3 rounded-lg bg-white/[0.02]">
                    <p className="text-2xl font-bold text-brand tabular-nums">{activities.length}</p>
                    <p className="text-[11px] text-muted mt-0.5">Activities</p>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} className="text-center p-3 rounded-lg bg-white/[0.02]">
                    <p className="text-2xl font-bold text-brand tabular-nums">{deals.length}</p>
                    <p className="text-[11px] text-muted mt-0.5">Deals</p>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} className="text-center p-3 rounded-lg bg-white/[0.02]">
                    <p className="text-2xl font-bold text-brand tabular-nums">{tasks.length}</p>
                    <p className="text-[11px] text-muted mt-0.5">Tasks</p>
                  </motion.div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2 text-[11px] text-muted">
                    <Clock className="w-3 h-3" />
                    Last activity: {activities[0] ? new Date(activities[0].createdAt).toLocaleDateString() : "None"}
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-5" hover>
                <h3 className="text-[12px] font-semibold text-muted uppercase tracking-wider mb-3">Tags</h3>
                <TagManager entityType="contact" entityId={id} />
              </GlassCard>

              {contact.email && (
                <GlassCard className="p-4" hover>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-brand" strokeWidth={1.5} />
                    <a href={`mailto:${contact.email}`} className="text-[13px] text-secondary hover:text-brand transition-colors truncate">{contact.email}</a>
                  </div>
                </GlassCard>
              )}

              {contact.phone && (
                <GlassCard className="p-4" hover>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-success" strokeWidth={1.5} />
                    <a href={`tel:${contact.phone}`} className="text-[13px] text-secondary hover:text-success transition-colors truncate">{contact.phone}</a>
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
              <RichTimeline items={timelineItems} onItemClick={(item) => console.log("Clicked", item)} />
            </GlassCard>
          </motion.div>
        )}

        {tab === "deals" && (
          <motion.div key="deals" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-3">
            {deals.length === 0 && (
              <GlassCard className="p-8 text-center" hover={false}>
                <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="w-5 h-5 text-muted" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-muted">No deals linked yet.</p>
                <button onClick={() => router.push(`/${workspace}/deals?contactId=${id}`)} className="mt-2 text-[12px] text-brand hover:underline">Create a deal →</button>
              </GlassCard>
            )}
            {deals.map((deal: any, i: number) => (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => router.push(`./deals/${deal.id}`)}
                className="group flex items-center justify-between p-4 rounded-xl bg-surface border border-white/[0.06] hover:border-white/[0.10] hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-brand" strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-secondary">{deal.name}</div>
                    <div className="text-[11px] text-muted">{deal.stage || "No stage"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-[13px] font-semibold text-secondary tabular-nums">{deal.value ? "$" + deal.value.toLocaleString() : "—"}</div>
                    <div className="text-[11px] text-muted">{deal.probability || 0}% probability</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-faint opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {tab === "tasks" && (
          <motion.div key="tasks" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-3">
            {tasks.length === 0 && (
              <GlassCard className="p-8 text-center" hover={false}>
                <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-3">
                  <CheckSquare className="w-5 h-5 text-muted" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-muted">No tasks linked yet.</p>
                <button onClick={() => router.push(`/${workspace}/tasks?contactId=${id}`)} className="mt-2 text-[12px] text-brand hover:underline">Create a task →</button>
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
                <div className="flex items-center gap-4">
                  {task.dueDate && <div className="text-[11px] text-muted">{new Date(task.dueDate).toLocaleDateString()}</div>}
                  <ChevronRight className="w-4 h-4 text-faint opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── DELETE MODAL ─── */}
      <AnimatePresence>
        {showDelete && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDelete(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-2xl border border-white/[0.06] bg-elevated shadow-2xl p-6 z-50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-danger/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-danger" />
                </div>
                <h3 className="text-lg font-semibold text-primary-text">Delete Contact</h3>
              </div>
              <p className="text-[13px] text-muted mb-6">This will permanently delete {fullName} and all associated activities, deals, and tasks. This cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={() => setShowDelete(false)} className="flex-1 h-9 rounded-lg bg-elevated border border-white/[0.06] text-muted text-[13px] hover:bg-hover transition-colors">Cancel</button>
                <button onClick={doDelete} disabled={deleting} className="flex-1 h-9 rounded-lg bg-danger text-white text-[13px] font-medium hover:bg-red-500 transition-colors disabled:opacity-50">{deleting ? "Deleting..." : "Delete"}</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── LOG ACTIVITY MODAL ─── */}
      <AnimatePresence>
        {showLogActivity && (
          <LogActivityModal
            entityType="contact"
            entityId={id}
            onClose={() => setShowLogActivity(false)}
            onCreated={() => { setShowLogActivity(false); load(); toast("Activity logged", "success"); }}
          />
        )}
      </AnimatePresence>
    </PageFade>
  );
}
