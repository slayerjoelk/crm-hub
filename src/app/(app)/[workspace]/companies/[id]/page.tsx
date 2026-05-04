"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Building2, Globe, Mail, Phone, MapPin, Calendar, Briefcase, FileText, Activity, Users, DollarSign } from "lucide-react";

export default function CompanyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [company, setCompany] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [cRes, conRes, dRes, aRes] = await Promise.all([
          fetch(`/api/companies/${id}`).then(r => r.json()),
          fetch(`/api/contacts?companyId=${id}`).then(r => r.json()),
          fetch(`/api/deals?companyId=${id}`).then(r => r.json()),
          fetch(`/api/activities?entityType=company&entityId=${id}`).then(r => r.json()),
        ]);
        setCompany(cRes.data || null);
        setContacts(conRes.data || []);
        setDeals(dRes.data || []);
        setActivities(aRes.data || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <div className="p-8 text-slate-400">Loading...</div>;
  if (!company) return <div className="p-8 text-slate-400">Company not found</div>;

  const initials = company.name?.split(" ").map((w:string) => w[0]).join("").slice(0,2).toUpperCase() || "C";

  const activityIcon = (type: string) => {
    const map: Record<string,string> = { email: "blue", call: "emerald", meeting: "amber", note: "slate", task: "orange", deal_created: "emerald", deal_stage_change: "amber", contact_created: "blue", company_created: "indigo", company_updated: "indigo", sms: "purple", whatsapp: "green", integration: "cyan" };
    const color = map[type] || "slate";
    return <div className={`w-8 h-8 rounded-full bg-${color}-500/10 flex items-center justify-center`}><Activity className={`w-4 h-4 text-${color}-400`} /></div>;
  };

  const tabs = [
    { id: "overview", label: "Overview", count: null },
    { id: "contacts", label: "Contacts", count: contacts.length },
    { id: "deals", label: "Deals", count: deals.length },
    { id: "activity", label: "Activity", count: activities.length },
  ];

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"><ArrowLeft className="w-4 h-4" /> Back</button>

      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-300 font-bold text-lg">{initials}</div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-white">{company.name}</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 capitalize">{company.lifecycleStage || "subscriber"}</span>
          </div>
          {company.domain && <a href={`https://${company.domain}`} target="_blank" rel="noreferrer" className="text-sm text-[#2B6ED2] hover:underline flex items-center gap-1 mt-1"><Globe className="w-3.5 h-3.5" />{company.domain}</a>}
        </div>
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
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"><div className="text-2xl font-bold text-white">{contacts.length}</div><div className="text-xs text-slate-500 mt-1">Linked Contacts</div></div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"><div className="text-2xl font-bold text-white">{deals.length}</div><div className="text-xs text-slate-500 mt-1">Related Deals</div></div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"><div className="text-2xl font-bold text-white">{activities.length}</div><div className="text-xs text-slate-500 mt-1">Activities</div></div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-sm font-medium text-white mb-4">Company Details</h3>
            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
              <div className="flex items-center gap-2 text-slate-400"><Building2 className="w-4 h-4 text-slate-500" /><span className="text-slate-300">{company.name}</span></div>
              <div className="flex items-center gap-2 text-slate-400"><Globe className="w-4 h-4 text-slate-500" /><span className="text-slate-300">{company.domain || "-"}</span></div>
              <div className="flex items-center gap-2 text-slate-400"><Briefcase className="w-4 h-4 text-slate-500" /><span className="text-slate-300">{company.industry || "-"}</span></div>
              <div className="flex items-center gap-2 text-slate-400"><Users className="w-4 h-4 text-slate-500" /><span className="text-slate-300 capitalize">{company.type || "prospect"}</span></div>
              <div className="flex items-center gap-2 text-slate-400"><Users className="w-4 h-4 text-slate-500" /><span className="text-slate-300">{company.size || "-"}</span></div>
              <div className="flex items-center gap-2 text-slate-400"><MapPin className="w-4 h-4 text-slate-500" /><span className="text-slate-300">{[company.city, company.country].filter(Boolean).join(", ") || "-"}</span></div>
              <div className="flex items-center gap-2 text-slate-400"><Calendar className="w-4 h-4 text-slate-500" /><span className="text-slate-300">{company.createdAt ? new Date(company.createdAt).toLocaleDateString() : "-"}</span></div>
            </div>
            {company.notes && <div className="mt-4 pt-4 border-t border-slate-800 text-sm text-slate-400"><FileText className="w-4 h-4 text-slate-500 inline mr-2" />{company.notes}</div>}
          </div>
        </div>
      )}

      {tab === "contacts" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          {contacts.length === 0 ? <div className="px-4 py-12 text-center text-slate-600 text-sm">No contacts linked</div> : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-800/40"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Lifecycle</th></tr></thead>
              <tbody className="divide-y divide-slate-800">
                {contacts.map(c => (
                  <tr key={c.id} className="hover:bg-slate-800/30 cursor-pointer transition-colors" onClick={() => router.push(`./contacts/${c.id}`)}>
                    <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-medium">{(c.firstName?.[0]||"")+(c.lastName?.[0]||"")}</div><span className="font-medium text-slate-200">{c.firstName} {c.lastName}</span></div></td>
                    <td className="px-4 py-3 text-slate-400">{c.email || "-"}</td>
                    <td className="px-4 py-3 text-slate-400">{c.phone || "-"}</td>
                    <td className="px-4 py-3"><span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 capitalize">{c.lifecycleStage || "subscriber"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "deals" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          {deals.length === 0 ? <div className="px-4 py-12 text-center text-slate-600 text-sm">No deals</div> : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-800/40"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Value</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Priority</th></tr></thead>
              <tbody className="divide-y divide-slate-800">
                {deals.map(d => (
                  <tr key={d.id} className="hover:bg-slate-800/30 cursor-pointer transition-colors" onClick={() => router.push(`./deals/${d.id}`)}>
                    <td className="px-4 py-3 font-medium text-slate-200">{d.name}</td>
                    <td className="px-4 py-3 text-slate-400">{d.value ? new Intl.NumberFormat("en-US", { style: "currency", currency: d.currency || "USD", maximumFractionDigits: 0 }).format(d.value) : "-"}</td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${d.status === "won" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : d.status === "lost" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>{d.status}</span></td>
                    <td className="px-4 py-3 text-slate-400 capitalize">{d.priority || "medium"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
    </div>
  );
}
