"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Building2, Globe, Briefcase, Users, MapPin, CalendarDays,
  Mail, Phone, Pencil, Trash2, X, Plus, Activity, AlertTriangle,
  ChevronRight, Link as LinkIcon, ExternalLink, BarChart3, DollarSign
} from "lucide-react";
import { TagManager } from "@/components/tag-manager";
import { LogActivityModal } from "@/components/crm/log-activity-modal";
import { InlineEdit, RichTimeline } from "@/components/crm/detail-components";
import { GlassCard, PageFade } from "@/components/crm/motion";
import { useToast } from "@/components/crm/toast";

const TAB_STYLE = "px-4 py-2 text-[13px] font-medium transition-colors border-b-2 -mb-px";
const TAB_ACTIVE = "border-brand text-brand-light";
const TAB_INACTIVE = "border-transparent text-muted hover:text-secondary";

const TYPE_BADGE = (type: string) => {
  const map: Record<string, string> = {
    prospect: "bg-brand/10 text-brand-light border border-brand/20",
    customer: "bg-success/10 text-success border border-success/20",
    partner: "bg-info/10 text-info border border-info/20",
    vendor: "bg-warning/10 text-warning border border-warning/20",
  };
  return map[type] || map.prospect;
};

const LIFECYCLE_BADGE = (stage: string) => {
  const map: Record<string, string> = {
    subscriber: "bg-info/10 text-info border border-info/20",
    lead: "bg-warning/10 text-warning border border-warning/20",
    qualified: "bg-brand/10 text-brand-light border border-brand/20",
    opportunity: "bg-success/10 text-success border border-success/20",
    customer: "bg-success/10 text-success border border-success/20",
    other: "bg-white/[0.04] text-muted border border-white/[0.06]",
  };
  return map[stage] || map.other;
};

export default function CompanyDetailPage() {
  const { id, workspace } = useParams<{ id: string; workspace: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [company, setCompany] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [tab, setTab] = useState<"overview" | "contacts" | "deals" | "activity">("overview");
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showLogActivity, setShowLogActivity] = useState(false);
  const [allCompanies, setAllCompanies] = useState<any[]>([]);

  async function load() {
    setLoading(true);
    try {
      const [cRes, conRes, dRes, aRes, allRes] = await Promise.all([
        fetch(`/api/companies/${id}`),
        fetch(`/api/contacts?companyId=${id}`),
        fetch(`/api/deals?companyId=${id}`),
        fetch(`/api/activities?entityType=company&entityId=${id}`),
        fetch(`/api/companies`),
      ]);
      const cData = await cRes.json().catch(() => ({}));
      const conData = await conRes.json().catch(() => ({}));
      const dData = await dRes.json().catch(() => ({}));
      const aData = await aRes.json().catch(() => ({}));
      const allData = await allRes.json().catch(() => ({}));
      setCompany(cData.data || null);
      setContacts(conData.data || []);
      setDeals(dData.data || []);
      setActivities(aData.data || []);
      setAllCompanies(allData.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  useEffect(() => { if (id) load(); }, [id]);

  async function patchField(field: string, value: string | number) {
    const res = await fetch(`/api/companies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
      credentials: "include",
    });
    if (res.ok) {
      setCompany((prev: any) => prev ? { ...prev, [field]: value } : prev);
      toast("Company updated", "success");
    } else {
      toast("Failed to update", "error");
    }
  }

  async function doDelete() {
    setDeleting(true);
    const res = await fetch(`/api/companies/${id}`, { credentials: "include", method: "DELETE" });
    setDeleting(false);
    if (res.ok) { toast("Company deleted", "success"); router.push(`/${workspace}/companies`); }
    else toast("Failed to delete", "error");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-6 h-6 border-2 border-brand/20 border-t-brand rounded-full" />
      </div>
    );
  }
  if (!company) return <div className="p-8 text-sm text-danger">Company not found</div>;

  const initials = company.name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "C";
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
    { id: "contacts", label: "Contacts", count: contacts.length },
    { id: "deals", label: "Deals", count: deals.length },
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
          className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/10 flex items-center justify-center text-emerald-300 font-bold text-lg"
        >
          {initials}
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-semibold text-[#f7f8f8]">{company.name}</h1>
            <span className={["px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wide", LIFECYCLE_BADGE(company.lifecycleStage || "subscriber")].join(" ")}>
              {company.lifecycleStage || "subscriber"}
            </span>
            <span className={["px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wide", TYPE_BADGE(company.type || "prospect")].join(" ")}>
              {company.type || "prospect"}
            </span>
          </div>
          <div className="mt-2">
            <TagManager entityType="company" entityId={id} />
          </div>
          {company.domain && (
            <a href={`https://${company.domain}`} target="_blank" rel="noreferrer" className="text-sm text-brand hover:underline flex items-center gap-1 mt-1">
              <Globe className="w-3.5 h-3.5" />{company.domain}
            </a>
          )}
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
            {/* Left: Info + Inline Edit */}
            <div className="lg:col-span-2 space-y-4">
              <GlassCard>
                <div className="p-5">
                  <h3 className="text-sm font-semibold text-[#f7f8f8] mb-4">Company Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                    <InlineEdit label="Name" value={company.name} onSave={v => patchField("name", v)} />
                    <InlineEdit label="Domain" value={company.domain} onSave={v => patchField("domain", v)} type="url" />
                    <InlineEdit label="Industry" value={company.industry} onSave={v => patchField("industry", v)} />
                    <InlineEdit label="Size" value={company.size} onSave={v => patchField("size", v)} />
                    <InlineEdit label="City" value={company.city} onSave={v => patchField("city", v)} />
                    <InlineEdit label="Country" value={company.country} onSave={v => patchField("country", v)} />
                    <InlineEdit label="Phone" value={company.phone} onSave={v => patchField("phone", v)} type="tel" />
                    <InlineEdit label="Email" value={company.email} onSave={v => patchField("email", v)} type="email" />
                  </div>
                  {company.notes && (
                    <div className="mt-4 pt-4 border-t border-white/[0.06]">
                      <span className="block text-[11px] font-medium text-muted uppercase tracking-wider mb-1">Notes</span>
                      <p className="text-[13px] text-muted leading-relaxed">{company.notes}</p>
                    </div>
                  )}
                </div>
              </GlassCard>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <GlassCard className="p-4 text-center">
                  <div className="text-2xl font-bold text-[#f7f8f8]">{contacts.length}</div>
                  <div className="text-xs text-muted mt-1">Contacts</div>
                </GlassCard>
                <GlassCard className="p-4 text-center">
                  <div className="text-2xl font-bold text-[#f7f8f8]">{deals.length}</div>
                  <div className="text-xs text-muted mt-1">Deals</div>
                </GlassCard>
                <GlassCard className="p-4 text-center">
                  <div className="text-2xl font-bold text-[#f7f8f8]">{activities.length}</div>
                  <div className="text-xs text-muted mt-1">Activities</div>
                </GlassCard>
              </div>
            </div>

            {/* Right: Metadata */}
            <div className="space-y-4">
              <GlassCard className="p-5">
                <h3 className="text-sm font-semibold text-[#f7f8f8] mb-3">Metadata</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted">
                    <CalendarDays className="w-4 h-4 text-faint" />
                    <span>Created {company.createdAt ? new Date(company.createdAt).toLocaleDateString() : "-"}</span>
                  </div>
                  {company.updatedAt && (
                    <div className="flex items-center gap-2 text-muted">
                      <CalendarDays className="w-4 h-4 text-faint" />
                      <span>Updated {new Date(company.updatedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted">
                    <Building2 className="w-4 h-4 text-faint" />
                    <span className="capitalize">{company.type || "prospect"}</span>
                  </div>
                </div>
              </GlassCard>

              {/* Account hierarchy (parent / child accounts) */}
              <GlassCard className="p-5">
                <h3 className="text-sm font-semibold text-[#f7f8f8] mb-3 flex items-center gap-2"><Building2 className="w-4 h-4 text-faint" /> Account hierarchy</h3>
                <span className="block text-[11px] font-medium text-muted uppercase tracking-wider mb-1.5">Parent account</span>
                <select
                  value={company.parentCompanyId || ""}
                  onChange={e => patchField("parentCompanyId", e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg bg-[#08090a] border border-white/[0.08] text-[13px] text-[#d0d6e0] focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]/40"
                >
                  <option value="">— None —</option>
                  {allCompanies.filter((c: any) => c.id !== company.id).map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {(() => {
                  const children = allCompanies.filter((c: any) => c.parentCompanyId === company.id);
                  return children.length > 0 ? (
                    <div className="mt-4 pt-3 border-t border-white/[0.06]">
                      <span className="block text-[11px] font-medium text-muted uppercase tracking-wider mb-2">Child accounts ({children.length})</span>
                      <div className="space-y-1.5">
                        {children.map((c: any) => (
                          <a key={c.id} href={`/${workspace}/companies/${c.id}`} className="flex items-center gap-2 text-[13px] text-[#d0d6e0] hover:text-[#9aa4f2] transition-colors">
                            <Building2 className="w-3.5 h-3.5 text-faint" /> {c.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}
              </GlassCard>
            </div>
          </motion.div>
        )}

        {tab === "contacts" && (
          <motion.div key="contacts" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
            <GlassCard className="overflow-hidden">
              {contacts.length === 0 ? (
                <div className="px-4 py-12 text-center text-muted text-sm">No contacts linked</div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-faint uppercase bg-elevated/40">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Lifecycle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {contacts.map(c => (
                      <tr key={c.id} className="hover:bg-elevated/30 cursor-pointer transition-colors" onClick={() => router.push(`/${workspace}/contacts/${c.id}`)}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xs font-medium">
                              {(c.firstName?.[0] || "") + (c.lastName?.[0] || "")}
                            </div>
                            <span className="font-medium text-secondary">{c.firstName} {c.lastName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted">{c.email || "-"}</td>
                        <td className="px-4 py-3 text-muted">{c.phone || "-"}</td>
                        <td className="px-4 py-3">
                          <span className={["px-2 py-0.5 rounded-full text-xs font-medium capitalize bg-elevated text-muted border border-white/[0.06]"].join(" ")}>
                            {c.lifecycleStage || "subscriber"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </GlassCard>
          </motion.div>
        )}

        {tab === "deals" && (
          <motion.div key="deals" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
            <GlassCard className="overflow-hidden">
              {deals.length === 0 ? (
                <div className="px-4 py-12 text-center text-muted text-sm">No deals</div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-faint uppercase bg-elevated/40">
                    <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Value</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Priority</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {deals.map(d => (
                      <tr key={d.id} className="hover:bg-elevated/30 cursor-pointer transition-colors" onClick={() => router.push(`/${workspace}/deals/${d.id}`)}>
                        <td className="px-4 py-3 font-medium text-secondary">{d.name}</td>
                        <td className="px-4 py-3 text-muted">{d.value ? new Intl.NumberFormat("en-US", { style: "currency", currency: d.currency || "USD", maximumFractionDigits: 0 }).format(d.value) : "-"}</td>
                        <td className="px-4 py-3">
                          <span className={["px-2 py-0.5 rounded-full text-xs font-medium capitalize", d.status === "won" ? "bg-success/10 text-success border border-success/20" : d.status === "lost" ? "bg-danger/10 text-danger border border-danger/20" : "bg-warning/10 text-warning border border-warning/20"].join(" ")}>
                            {d.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted capitalize">{d.priority || "medium"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </GlassCard>
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
              <h3 className="text-lg font-semibold text-[#f7f8f8]">Delete Company</h3>
              <p className="text-sm text-muted">Are you sure you want to delete <span className="text-secondary font-medium">{company.name}</span>? This cannot be undone.</p>
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
      {showLogActivity && company && (
        <LogActivityModal
          entityType="company"
          entityId={id}
          entityName={company.name}
          onClose={() => setShowLogActivity(false)}
          onCreated={load}
        />
      )}
    </PageFade>
  );
}
