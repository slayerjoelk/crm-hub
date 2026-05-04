"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Building2, Globe, Mail, Phone, MapPin, Calendar, Briefcase, FileText, Activity, Users, DollarSign, Pencil, Trash2, X, AlertTriangle, Tag } from "lucide-react";
import { TagManager } from "@/components/tag-manager";

const TAB_STYLE = "px-4 py-2.5 text-sm font-medium transition-colors relative";
const TAB_ACTIVE = "text-emerald-400";
const TAB_INACTIVE = "text-slate-400 hover:text-slate-200";

const STATUS_BADGE = (status: string) => {
  if (status === "won") return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
  if (status === "lost") return "bg-red-500/10 text-red-400 border border-red-500/20";
  return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
};

export default function CompanyDetailPage() {
  const { id, workspace } = useParams<{ id: string; workspace: string }>();
  const router = useRouter();
  const [company, setCompany] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  async function load() {
    setLoading(true);
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

  useEffect(() => { if (id) load(); }, [id]);

  function openEdit() {
    if (!company) return;
    setEditForm({
      name: company.name || "",
      domain: company.domain || "",
      industry: company.industry || "",
      size: company.size || "",
      type: company.type || "prospect",
      lifecycleStage: company.lifecycleStage || "subscriber",
      city: company.city || "",
      country: company.country || "",
      phone: company.phone || "",
      email: company.email || "",
      notes: company.notes || "",
    });
    setShowEdit(true);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/companies/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
    setSaving(false);
    if (res.ok) { setShowEdit(false); load(); }
  }

  async function doDelete() {
    setDeleting(true);
    const res = await fetch(`/api/companies/${id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) { router.push(`/${workspace}/companies`); }
  }

  const inputCls = "w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/60";
  const labelCls = "block text-xs font-medium text-slate-500 mb-1";

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
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"><ArrowLeft className="w-4 h-4" /> Back</button>
        <div className="flex items-center gap-2">
          <button onClick={openEdit} className="h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm flex items-center gap-2 hover:bg-slate-700 transition-colors"><Pencil size={14} /> Edit</button>
          <button onClick={() => setShowDelete(true)} className="h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-red-400 text-sm flex items-center gap-2 hover:bg-red-500/10 hover:border-red-500/30 transition-colors"><Trash2 size={14} /> Delete</button>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-300 font-bold text-lg">{initials}</div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-white">{company.name}</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 capitalize">{company.lifecycleStage || "subscriber"}</span>
          </div>
          <div className="mt-2">
            <TagManager entityType="company" entityId={id} />
          </div>
          {company.domain && <a href={`https://${company.domain}`} target="_blank" rel="noreferrer" className="text-sm text-[#2B6ED2] hover:underline flex items-center gap-1 mt-1"><Globe className="w-3.5 h-3.5" />{company.domain}</a>}
        </div>
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
                  <tr key={c.id} className="hover:bg-slate-800/30 cursor-pointer transition-colors" onClick={() => router.push(`/${workspace}/contacts/${c.id}`)}>
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
                  <tr key={d.id} className="hover:bg-slate-800/30 cursor-pointer transition-colors" onClick={() => router.push(`/${workspace}/deals/${d.id}`)}>
                    <td className="px-4 py-3 font-medium text-slate-200">{d.name}</td>
                    <td className="px-4 py-3 text-slate-400">{d.value ? new Intl.NumberFormat("en-US", { style: "currency", currency: d.currency || "USD", maximumFractionDigits: 0 }).format(d.value) : "-"}</td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE(d.status)}`}>{d.status}</span></td>
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

      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowEdit(false); }}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center"><Pencil size={14} className="text-white" /></div>
              <h2 className="text-lg font-semibold text-white">Edit Company</h2>
              <button onClick={() => setShowEdit(false)} className="ml-auto p-1.5 rounded-lg hover:bg-slate-800 text-slate-500"><X size={16} /></button>
            </div>
            <form onSubmit={saveEdit} className="p-6 space-y-4">
              <div><label className={labelCls}>Name</label><input type="text" value={editForm.name || ""} onChange={e => setEditForm({...editForm, name: e.target.value})} className={inputCls} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Domain</label><input type="text" value={editForm.domain || ""} onChange={e => setEditForm({...editForm, domain: e.target.value})} className={inputCls} /></div>
                <div><label className={labelCls}>Industry</label><input type="text" value={editForm.industry || ""} onChange={e => setEditForm({...editForm, industry: e.target.value})} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Size</label><input type="text" value={editForm.size || ""} onChange={e => setEditForm({...editForm, size: e.target.value})} className={inputCls} placeholder="e.g. 11-50" /></div>
                <div><label className={labelCls}>Type</label><select value={editForm.type || ""} onChange={e => setEditForm({...editForm, type: e.target.value})} className={inputCls}><option value="prospect">Prospect</option><option value="customer">Customer</option><option value="partner">Partner</option><option value="vendor">Vendor</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>City</label><input type="text" value={editForm.city || ""} onChange={e => setEditForm({...editForm, city: e.target.value})} className={inputCls} /></div>
                <div><label className={labelCls}>Country</label><input type="text" value={editForm.country || ""} onChange={e => setEditForm({...editForm, country: e.target.value})} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Phone</label><input type="text" value={editForm.phone || ""} onChange={e => setEditForm({...editForm, phone: e.target.value})} className={inputCls} /></div>
                <div><label className={labelCls}>Email</label><input type="email" value={editForm.email || ""} onChange={e => setEditForm({...editForm, email: e.target.value})} className={inputCls} /></div>
              </div>
              <div><label className={labelCls}>Notes</label><textarea value={editForm.notes || ""} onChange={e => setEditForm({...editForm, notes: e.target.value})} className={`${inputCls} h-20 resize-none`} /></div>
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
            <h3 className="text-lg font-semibold text-white">Delete Company</h3>
            <p className="text-sm text-slate-400">Are you sure you want to delete <span className="text-slate-200 font-medium">{company.name}</span>? This cannot be undone.</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowDelete(false)} className="flex-1 h-9 rounded-lg bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={doDelete} disabled={deleting} className="flex-1 h-9 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-500 transition-colors disabled:opacity-50">{deleting ? "Deleting..." : "Delete"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
