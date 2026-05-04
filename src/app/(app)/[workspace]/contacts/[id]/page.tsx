"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone, User, Building2, Activity, DollarSign, ListChecks, Clock, Calendar, Mail as MailIcon, FileText, Phone as PhoneIcon, CalendarDays, MessageCircle, CheckSquare, TrendingUp, TrendingDown, Tag } from "lucide-react";

const TYPE_ICON: Record<string, any> = { email: MailIcon, call: PhoneIcon, meeting: CalendarDays, note: FileText, task: CheckSquare, deal_created: TrendingUp, deal_won: TrendingUp, deal_lost: TrendingDown, deal_stage_changed: Activity, deal_updated: Activity, system: MessageCircle, contact_created: User, contact_updated: User, company_created: Building2, company_updated: Building2, integration: MessageCircle };

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [contact, setContact] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [tab, setTab] = useState<"overview" | "activity" | "deals" | "tasks">("overview");
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="p-8 text-sm text-slate-500">Loading contact...</div>;
  if (!contact) return <div className="p-8 text-sm text-red-500">Contact not found</div>;

  const initials = `${contact.firstName?.[0] || ""}${contact.lastName?.[0] || ""}`;
  const fullName = `${contact.firstName || ""} ${contact.lastName || ""}`.trim();

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => router.back()} className="mt-2 p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <ArrowLeft size={18} />
        </button>
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
          {initials || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            {fullName || "Unnamed Contact"}
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${contact.lifecycleStage === "customer" ? "bg-green-100 text-green-700" : contact.lifecycleStage === "lead" ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-700"}`}>{contact.lifecycleStage}</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{contact.jobTitle}{contact.company?.name ? ` at ${contact.company.name}` : ""}</p>
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-600">
            {contact.email && <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 hover:text-indigo-600"><Mail size={14} /> {contact.email}</a>}
            {contact.phone && <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 hover:text-indigo-600"><Phone size={14} /> {contact.phone}</a>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-1">
          {(["overview","activity","deals","tasks"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${tab === t ? "border-indigo-500 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="space-y-6">
        {tab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-[#2B6ED2] shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><User size={16} className="text-[#2B6ED2]" /> Contact Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-400">First name</span><p className="font-medium text-slate-800">{contact.firstName || "—"}</p></div>
                <div><span className="text-slate-400">Last name</span><p className="font-medium text-slate-800">{contact.lastName || "—"}</p></div>
                <div><span className="text-slate-400">Email</span><p className="font-medium text-slate-800">{contact.email || "—"}</p></div>
                <div><span className="text-slate-400">Phone</span><p className="font-medium text-slate-800">{contact.phone || "—"}</p></div>
                <div><span className="text-slate-400">Job title</span><p className="font-medium text-slate-800">{contact.jobTitle || "—"}</p></div>
                <div><span className="text-slate-400">Company</span><p className="font-medium text-slate-800">{contact.company?.name || "—"}</p></div>
                <div><span className="text-slate-400">Source</span><p className="font-medium text-slate-800">{contact.source || "—"}</p></div>
                <div><span className="text-slate-400">Lead status</span><p className="font-medium text-slate-800">{contact.leadStatus || "—"}</p></div>
                <div><span className="text-slate-400">Lifecycle</span><p className="font-medium text-slate-800">{contact.lifecycleStage || "—"}</p></div>
                <div><span className="text-slate-400">Created</span><p className="font-medium text-slate-800">{contact.createdAt ? new Date(contact.createdAt).toLocaleDateString() : "—"}</p></div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-[#2B6ED2] shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><Activity size={16} className="text-[#2B6ED2]" /> Summary</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-slate-50"><p className="text-2xl font-bold text-[#2B6ED2]">{activities.length}</p><p className="text-xs text-slate-500">Activities</p></div>
                <div className="text-center p-3 rounded-lg bg-slate-50"><p className="text-2xl font-bold text-[#2B6ED2]">{deals.length}</p><p className="text-xs text-slate-500">Deals</p></div>
                <div className="text-center p-3 rounded-lg bg-slate-50"><p className="text-2xl font-bold text-[#2B6ED2]">{tasks.length}</p><p className="text-xs text-slate-500">Tasks</p></div>
              </div>
              <div className="text-sm text-slate-500">Last activity: {activities[0] ? new Date(activities[0].createdAt).toLocaleDateString() : "None"}</div>
            </div>
          </div>
        )}

        {tab === "activity" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2"><Activity size={16} className="text-[#2B6ED2]" /> Activity Timeline</h3>
            {activities.length === 0 ? (
              <div className="text-center py-12 text-slate-400"><Activity size={32} className="mx-auto mb-2 opacity-50"/><p>No activity yet</p></div>
            ) : (
              <div className="space-y-3">
                {activities.map((a) => {
                  const Icon = TYPE_ICON[a.type] || MessageCircle;
                  return (
                    <div key={a.id} className="flex gap-3 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${a.type.startsWith("deal") ? "bg-blue-50 text-blue-600" : a.type === "email" ? "bg-purple-50 text-purple-600" : a.type === "call" ? "bg-green-50 text-green-600" : a.type === "meeting" ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-600"}`}>
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800">{a.subject || `${a.type.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}`}</p>
                        {a.body && <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{a.body}</p>}
                        <p className="text-xs text-slate-400 mt-1">{new Date(a.createdAt).toLocaleDateString()} · {new Date(a.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} {a.durationMinutes ? `· ${a.durationMinutes} min` : ""}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "deals" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2"><DollarSign size={16} className="text-[#2B6ED2]"/><h3 className="text-sm font-semibold text-slate-900">Related Deals</h3></div>
            {deals.length === 0 ? (
              <div className="text-center py-12 text-slate-400"><DollarSign size={32} className="mx-auto mb-2 opacity-50"/><p>No deals linked</p></div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500"><tr><th className="px-4 py-2 text-left font-medium">Name</th><th className="px-4 py-2 text-left font-medium">Value</th><th className="px-4 py-2 text-left font-medium">Status</th><th className="px-4 py-2 text-left font-medium">Stage</th></tr></thead>
                <tbody>
                  {deals.map(d => (
                    <tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => router.push(`./${d.id}`)}>
                      <td className="px-4 py-3 font-medium text-slate-800">{d.name}</td>
                      <td className="px-4 py-3 text-slate-600">{d.value?.toLocaleString?.()} {d.currency}</td>
                      <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${d.status === "won" ? "bg-green-100 text-green-700" : d.status === "lost" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>{d.status}</span></td>
                      <td className="px-4 py-3 text-slate-500">{d.stageId || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === "tasks" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2"><ListChecks size={16} className="text-[#2B6ED2]"/><h3 className="text-sm font-semibold text-slate-900">Related Tasks</h3></div>
            {tasks.length === 0 ? (
              <div className="text-center py-12 text-slate-400"><ListChecks size={32} className="mx-auto mb-2 opacity-50"/><p>No tasks assigned</p></div>
            ) : (
              <div className="divide-y divide-slate-100">
                {tasks.map(t => (
                  <div key={t.id} className="px-6 py-3 flex items-center gap-3 hover:bg-slate-50">
                    <div className={`w-2 h-2 rounded-full ${t.priority === "critical" ? "bg-red-500" : t.priority === "high" ? "bg-orange-500" : t.priority === "medium" ? "bg-blue-500" : "bg-slate-300"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">{t.title}</p>
                      {t.dueDate && <p className="text-xs text-slate-400 flex items-center gap-1"><Clock size={10} /> Due {new Date(t.dueDate).toLocaleDateString()}</p>}
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.status === "done" ? "bg-green-100 text-green-700" : t.status === "in_progress" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>{t.status.replace(/_/g, " ")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
