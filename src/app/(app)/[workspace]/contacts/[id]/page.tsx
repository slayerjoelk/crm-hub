"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone, User, Building2, Activity, DollarSign, ListChecks, Clock, Mail as MailIcon, FileText, Phone as PhoneIcon, CalendarDays, MessageCircle, CheckSquare, TrendingUp, TrendingDown, Tag, Pencil, Trash2, X, AlertTriangle, Plus } from "lucide-react";
import { TagManager } from "@/components/tag-manager";
import { LogActivityModal } from "@/components/crm/log-activity-modal";
import { CustomFieldsSection } from "@/components/crm/custom-fields-section";

const TYPE_ICON: Record<string, any> = { email: MailIcon, call: PhoneIcon, meeting: CalendarDays, note: FileText, task: CheckSquare, deal_created: TrendingUp, deal_won: TrendingUp, deal_lost: TrendingDown, deal_stage_changed: Activity, deal_updated: Activity, system: MessageCircle, contact_created: User, contact_updated: User, company_created: Building2, company_updated: Building2, integration: MessageCircle };

const TAB_STYLE = "px-4 py-2.5 text-sm font-medium capitalize border-b-2 -mb-px transition-colors";
const TAB_ACTIVE = "border-[#5e6ad2] text-[#5e6ad2]";
const TAB_INACTIVE = "border-transparent text-[#62666d] hover:text-[#8a8f98]";

const BADGE = (stage: string) => {
  if (stage === "customer") return "bg-[#10b981]/[0.12] text-[#10b981] border border-[#10b981]/[0.08]";
  if (stage === "lead") return "bg-orange-500/10 text-orange-400 border border-orange-500/20";
  return "bg-[#28282c] text-[#8a8f98] border border-white/[0.08]";
};

const STATUS_BADGE = (status: string) => {
  if (status === "won" || status === "done") return "bg-[#10b981]/[0.12] text-[#10b981] border border-[#10b981]/[0.08]";
  if (status === "lost") return "bg-red-500/10 text-red-400 border border-red-500/20";
  if (status === "in_progress") return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
  return "bg-[#28282c] text-[#8a8f98] border border-white/[0.08]";
};

export default function ContactDetailPage() {
  const { id, workspace } = useParams<{ id: string; workspace: string }>();
  const router = useRouter();
  const [contact, setContact] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [tab, setTab] = useState<"overview" | "activity" | "deals" | "tasks">("overview");
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
const [customValues, setCustomValues] = useState<Record<string, string>>({});
const [showLogActivity, setShowLogActivity] = useState(false);

  async function load() {
    setLoading(true);
    const [cRes, aRes, dRes, tRes] = await Promise.all([
      fetch(`/api/contacts/${id}`),
      fetch(`/api/activities?entityType=contact&entityId=${id}`),
      fetch(`/api/deals?contactId=${id}`),
      fetch(`/api/tasks?contactId=${id}`),
    ]);
    const cData = await cRes.json().catch(()=>({}));
    const aData = await aRes.json().catch(()=>({}));
    const dData = await dRes.json().catch(()=>({}));
    const tData = await tRes.json().catch(()=>({}));
    setContact(cData.data);
    setActivities(aData.data || []);
    setDeals(dData.data || []);
    setTasks(tData.data || []);
    setLoading(false);
  }

  useEffect(() => { if (id) load(); }, [id]);

  function openEdit() {
    if (!contact) return;
    setEditForm({
      firstName: contact.firstName || "",
      lastName: contact.lastName || "",
      email: contact.email || "",
      phone: contact.phone || "",
      jobTitle: contact.jobTitle || "",
      lifecycleStage: contact.lifecycleStage || "subscriber",
      leadStatus: contact.leadStatus || "new",
      sourceType: contact.sourceType || "other",
      companyId: contact.companyId || "",
    });
    setShowEdit(true);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/contacts/${id}`, { credentials: "include",
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok && Object.keys(customValues).length > 0) {
      await fetch(`/api/custom-values/contact/${id}`, { credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customValues),
      });
    }
    setSaving(false);
    if (res.ok) { setShowEdit(false); load(); }
  }

  async function doDelete() {
    setDeleting(true);
    const res = await fetch(`/api/contacts/${id}`, { credentials: "include", method: "DELETE" });
    setDeleting(false);
    if (res.ok) { router.push(`/${workspace}/contacts`); }
  }

  const inputCls = "w-full h-10 px-3 rounded-lg bg-[#0f1011] border border-white/[0.06] text-sm text-[#d0d6e0] placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]/[0.3]";
  const labelCls = "block text-xs font-medium text-[#62666d] mb-1";

  if (loading) return <div className="p-8 text-sm text-[#62666d]">Loading contact...</div>;
  if (!contact) return <div className="p-8 text-sm text-red-400">Contact not found</div>;

  const initials = `${contact.firstName?.[0] || ""}${contact.lastName?.[0] || ""}`;
  const fullName = `${contact.firstName || ""} ${contact.lastName || ""}`.trim();

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => router.back()} className="mt-2 p-2 rounded-lg hover:bg-[#191a1b] text-[#8a8f98] transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#4B8BF5] to-[#7C5BF2] flex items-center justify-center text-[#f7f8f8] font-bold text-lg shadow-sm">
          {initials || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-[#f7f8f8] flex items-center gap-3">
            {fullName || "Unnamed Contact"}
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${BADGE(contact.lifecycleStage)}`}>{contact.lifecycleStage}</span>
          </h1>
          <p className="text-sm text-[#8a8f98] mt-0.5">{contact.jobTitle}{contact.company?.name ? ` at ${contact.company.name}` : ""}</p>
          <div className="mt-3"><TagManager entityType="contact" entityId={id} /></div>
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-[#8a8f98]">
            {contact.email && <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 hover:text-blue-400 transition-colors"><Mail size={14} /> {contact.email}</a>}
            {contact.phone && <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 hover:text-blue-400 transition-colors"><Phone size={14} /> {contact.phone}</a>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openEdit} className="h-9 px-3 rounded-lg bg-[#191a1b] border border-white/[0.06] text-[#8a8f98] text-sm flex items-center gap-2 hover:bg-[#28282c] transition-colors">
            <Pencil size={14} /> Edit
          </button>
          <button onClick={() => setShowDelete(true)} className="h-9 px-3 rounded-lg bg-[#191a1b] border border-white/[0.06] text-red-400 text-sm flex items-center gap-2 hover:bg-red-500/10 hover:border-red-500/30 transition-colors">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/[0.06]">
        <div className="flex gap-1">
          {(["overview","activity","deals","tasks"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`${TAB_STYLE} ${tab === t ? TAB_ACTIVE : TAB_INACTIVE}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="space-y-6">
        {tab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0f1011] rounded-xl border border-white/[0.06] p-6 space-y-4">
              <h3 className="text-sm font-semibold text-[#f7f8f8] flex items-center gap-2"><User size={16} className="text-[#5e6ad2]" /> Contact Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ["First name", contact.firstName],
                  ["Last name", contact.lastName],
                  ["Email", contact.email],
                  ["Phone", contact.phone],
                  ["Job title", contact.jobTitle],
                  ["Company", contact.company?.name],
                  ["Source", contact.sourceType || contact.source],
                  ["Lead status", contact.leadStatus],
                  ["Lifecycle", contact.lifecycleStage],
                  ["Created", contact.createdAt ? new Date(contact.createdAt).toLocaleDateString() : null],
                ].map(([label, value]) => (
                  <div key={label}><span className="text-xs text-[#62666d]">{label}</span><p className="font-medium text-[#d0d6e0]">{value || "—"}</p></div>
                ))}
              </div>
              <CustomFieldsSection entityType="contact" entityId={id} mode="display" />
            </div>
            <div className="bg-[#0f1011] rounded-xl border border-white/[0.06] p-6 space-y-4">
              <h3 className="text-sm font-semibold text-[#f7f8f8] flex items-center gap-2"><Activity size={16} className="text-[#5e6ad2]" /> Summary</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-white/[0.03]"><p className="text-2xl font-bold text-[#5e6ad2]">{activities.length}</p><p className="text-xs text-[#62666d]">Activities</p></div>
                <div className="text-center p-3 rounded-lg bg-white/[0.03]"><p className="text-2xl font-bold text-[#5e6ad2]">{deals.length}</p><p className="text-xs text-[#62666d]">Deals</p></div>
                <div className="text-center p-3 rounded-lg bg-white/[0.03]"><p className="text-2xl font-bold text-[#5e6ad2]">{tasks.length}</p><p className="text-xs text-[#62666d]">Tasks</p></div>
              </div>
              <div className="text-sm text-[#62666d]">Last activity: {activities[0] ? new Date(activities[0].createdAt).toLocaleDateString() : "None"}</div>
            </div>
          </div>
        )}

        {tab === "activity" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#f7f8f8] flex items-center gap-2"><Activity size={16} className="text-[#5e6ad2]" /> Activity Timeline</h3>
              <button onClick={() => setShowLogActivity(true)} className="h-8 px-3 rounded-lg bg-[#5e6ad2] text-[#f7f8f8] text-xs font-medium hover:bg-[#5e6ad2] flex items-center gap-1.5 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Log Activity
              </button>
            </div>
            {activities.length === 0 ? (
              <div className="text-center py-12 text-[#62666d]"><Activity size={32} className="mx-auto mb-2 opacity-50"/><p>No activity yet</p></div>
            ) : (
              <div className="space-y-3">
                {activities.map((a) => {
                  const Icon = TYPE_ICON[a.type] || MessageCircle;
                  return (
                    <div key={a.id} className="flex gap-3 p-3 rounded-lg hover:bg-white/[0.03] border border-transparent hover:border-white/[0.06]/50 transition-colors">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${a.type.startsWith("deal") ? "bg-blue-500/10 text-blue-400" : a.type === "email" ? "bg-purple-500/10 text-purple-400" : a.type === "call" ? "bg-[#10b981]/[0.12] text-[#10b981]" : a.type === "meeting" ? "bg-amber-500/10 text-amber-400" : "bg-[#28282c] text-[#8a8f98]"}`}>
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#d0d6e0]">{a.subject || `${a.type.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}`}</p>
                        {a.body && <p className="text-sm text-[#62666d] mt-0.5 line-clamp-2">{a.body}</p>}
                        <p className="text-xs text-[#62666d] mt-1">{new Date(a.createdAt).toLocaleDateString()} · {new Date(a.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} {a.durationMinutes ? `· ${a.durationMinutes} min` : ""}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "deals" && (
          <div className="bg-[#0f1011] rounded-xl border border-white/[0.06] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-2"><DollarSign size={16} className="text-[#5e6ad2]"/><h3 className="text-sm font-semibold text-[#f7f8f8]">Related Deals</h3></div>
            {deals.length === 0 ? (
              <div className="text-center py-12 text-[#62666d]"><DollarSign size={32} className="mx-auto mb-2 opacity-50"/><p>No deals linked</p></div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-white/[0.03] text-[#8a8f98]"><tr><th className="px-4 py-2 text-left font-medium">Name</th><th className="px-4 py-2 text-left font-medium">Value</th><th className="px-4 py-2 text-left font-medium">Status</th><th className="px-4 py-2 text-left font-medium">Stage</th></tr></thead>
                <tbody>
                  {deals.map(d => (
                    <tr key={d.id} className="border-t border-white/[0.06]/50 hover:bg-[#191a1b]/30 cursor-pointer transition-colors" onClick={() => router.push(`/${workspace}/deals/${d.id}`)}>
                      <td className="px-4 py-3 font-medium text-[#d0d6e0]">{d.name}</td>
                      <td className="px-4 py-3 text-[#8a8f98]">{d.value?.toLocaleString?.()} {d.currency}</td>
                      <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE(d.status)}`}>{d.status}</span></td>
                      <td className="px-4 py-3 text-[#62666d]">{d.stageId || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === "tasks" && (
          <div className="bg-[#0f1011] rounded-xl border border-white/[0.06] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-2"><ListChecks size={16} className="text-[#5e6ad2]"/><h3 className="text-sm font-semibold text-[#f7f8f8]">Related Tasks</h3></div>
            {tasks.length === 0 ? (
              <div className="text-center py-12 text-[#62666d]"><ListChecks size={32} className="mx-auto mb-2 opacity-50"/><p>No tasks assigned</p></div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {tasks.map(t => (
                  <div key={t.id} className="px-6 py-3 flex items-center gap-3 hover:bg-[#191a1b]/30 cursor-pointer transition-colors" onClick={() => router.push(`/${workspace}/tasks/${t.id}`)}>
                    <div className={`w-2 h-2 rounded-full ${t.priority === "critical" ? "bg-red-500" : t.priority === "high" ? "bg-orange-500" : t.priority === "medium" ? "bg-blue-500" : "bg-[#8a8f98]"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#d0d6e0]">{t.title}</p>
                      {t.dueDate && <p className="text-xs text-[#62666d] flex items-center gap-1"><Clock size={10} /> Due {new Date(t.dueDate).toLocaleDateString()}</p>}
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE(t.status)}`}>{t.status?.replace(/_/g, " ")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowEdit(false); }}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/[0.06] bg-[#0f1011] shadow-2xl">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4B8BF5] to-[#7C5BF2] flex items-center justify-center"><Pencil size={14} className="text-[#f7f8f8]" /></div>
              <h2 className="text-lg font-semibold text-[#f7f8f8]">Edit Contact</h2>
              <button onClick={() => setShowEdit(false)} className="ml-auto p-1.5 rounded-lg hover:bg-[#191a1b] text-[#62666d]"><X size={16} /></button>
            </div>
            <form onSubmit={saveEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>First name</label><input type="text" value={editForm.firstName || ""} onChange={e => setEditForm({...editForm, firstName: e.target.value})} className={inputCls} /></div>
                <div><label className={labelCls}>Last name</label><input type="text" value={editForm.lastName || ""} onChange={e => setEditForm({...editForm, lastName: e.target.value})} className={inputCls} /></div>
              </div>
              <div><label className={labelCls}>Email</label><input type="email" value={editForm.email || ""} onChange={e => setEditForm({...editForm, email: e.target.value})} className={inputCls} /></div>
              <div><label className={labelCls}>Phone</label><input type="text" value={editForm.phone || ""} onChange={e => setEditForm({...editForm, phone: e.target.value})} className={inputCls} /></div>
              <div><label className={labelCls}>Job title</label><input type="text" value={editForm.jobTitle || ""} onChange={e => setEditForm({...editForm, jobTitle: e.target.value})} className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Lifecycle stage</label><select value={editForm.lifecycleStage || ""} onChange={e => setEditForm({...editForm, lifecycleStage: e.target.value})} className={inputCls}><option value="subscriber">Subscriber</option><option value="lead">Lead</option><option value="opportunity">Opportunity</option><option value="customer">Customer</option><option value="evangelist">Evangelist</option><option value="other">Other</option></select></div>
                <div><label className={labelCls}>Lead status</label><select value={editForm.leadStatus || ""} onChange={e => setEditForm({...editForm, leadStatus: e.target.value})} className={inputCls}><option value="new">New</option><option value="contacted">Contacted</option><option value="qualified">Qualified</option><option value="unqualified">Unqualified</option></select></div>
              </div>
              <CustomFieldsSection entityType="contact" entityId={id} mode="form" onChange={setCustomValues} />
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
            <h3 className="text-lg font-semibold text-[#f7f8f8]">Delete Contact</h3>
            <p className="text-sm text-[#8a8f98]">Are you sure you want to delete <span className="text-[#d0d6e0] font-medium">{fullName}</span>? This cannot be undone.</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowDelete(false)} className="flex-1 h-9 rounded-lg bg-[#191a1b] text-[#8a8f98] text-sm font-medium hover:bg-[#28282c] transition-colors">Cancel</button>
              <button onClick={doDelete} disabled={deleting} className="flex-1 h-9 rounded-lg bg-red-600 text-[#f7f8f8] text-sm font-medium hover:bg-red-500 transition-colors disabled:opacity-50">{deleting ? "Deleting..." : "Delete"}</button>
            </div>
          </div>
        </div>
      )}
      {/* Log Activity Modal */}
      {showLogActivity && contact && (
        <LogActivityModal
          entityType="contact"
          entityId={id}
          entityName={`${contact.firstName || ""} ${contact.lastName || ""}`.trim()}
          onClose={() => setShowLogActivity(false)}
          onCreated={load}
        />
      )}
    </div>
  );
}
