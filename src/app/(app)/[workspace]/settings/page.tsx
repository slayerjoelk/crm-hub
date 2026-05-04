"use client";

import { useEffect, useState } from "react";
import { Globe, Users, CreditCard, Palette, Mail, Clock, Hash, Building2, Shield, X, Send, Trash2, Tag } from "lucide-react";
import { TagManager } from "@/components/tag-manager";

const TABS = [
  { id: "general", label: "General", icon: <Globe className="w-4 h-4" /> },
  { id: "team", label: "Team", icon: <Users className="w-4 h-4" /> },
  { id: "tags", label: "Tags", icon: <Tag className="w-4 h-4" /> },
  { id: "billing", label: "Billing", icon: <CreditCard className="w-4 h-4" /> },
  { id: "appearance", label: "Appearance", icon: <Palette className="w-4 h-4" /> },
];

function TeamTab({ ws }: { ws: any }) {
  const [team, setTeam] = useState<{ members: any[]; invites: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ email: "", role: "member" });
  const [error, setError] = useState<string | null>(null);

  const inputCls = "w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/60";
  const labelCls = "block text-xs font-medium text-slate-400 mb-1";
  const roleBadge = (role: string) => {
    const cls: Record<string, string> = {
      owner: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      admin: "bg-sky-500/10 text-sky-400 border-sky-500/20",
      member: "bg-slate-500/10 text-slate-400 border-slate-500/20",
      viewer: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${cls[role] || cls.member}`}>
        {role}
      </span>
    );
  };

  async function load() {
    const res = await fetch("/api/team");
    const json = await res.json().catch(() => ({ data: { members: [], invites: [] } }));
    setTeam(json.data || { members: [], invites: [] });
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json().catch(() => ({ error: "Unknown" }));
    setSaving(false);
    if (!res.ok) { setError(json.error || "Failed to send invite"); return; }
    setShowModal(false);
    setForm({ email: "", role: "member" });
    load();
  }

  async function cancelInvite(id: string) {
    await fetch(`/api/invites/${id}`, { method: "DELETE" });
    load();
  }

  if (loading) return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-12 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold text-white">Team Members</span>
          </div>
          <button onClick={() => setShowModal(true)} className="h-8 px-3 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 transition-colors">
            Invite Member
          </button>
        </div>
        <div className="divide-y divide-slate-800">
          {(team?.members || []).map((u: any) => (
            <div key={u.id} className="px-5 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center text-xs font-semibold">{(u.name?.[0] || u.email?.[0] || "?").toUpperCase()}</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-200">{u.name || u.email}</div>
                <div className="text-xs text-slate-500">{u.email}</div>
              </div>
              {roleBadge(u.role)}
              <span className="text-[11px] text-slate-600">{u.status}</span>
            </div>
          ))}
          {(team?.invites || []).map((inv: any) => (
            <div key={inv.id} className="px-5 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center text-xs font-semibold">?</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-400">{inv.email}</div>
                <div className="text-[11px] text-slate-600">Expires {new Date(inv.expiresAt).toLocaleDateString()}</div>
              </div>
              {roleBadge(inv.role)}
              <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">Pending</span>
              <button onClick={() => cancelInvite(inv.id)} className="p-1.5 rounded hover:bg-red-500/10 text-slate-600 hover:text-red-400 transition-colors" title="Cancel invite">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {(!team?.members?.length && !team?.invites?.length) && (
            <div className="px-5 py-8 text-center text-sm text-slate-600">No team members yet.</div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center"><Send className="w-4 h-4" /></div>
                <div><h2 className="text-sm font-semibold text-white">Invite Member</h2><p className="text-xs text-slate-500">Send an email invitation</p></div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={sendInvite} className="p-5 space-y-4">
              {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2">{error}</div>}
              <div><label className={labelCls}>Email address *</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="colleague@company.com" required /></div>
              <div><label className={labelCls}>Role</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className={`${inputCls} appearance-none`}>
                  {[
                    { value: "admin", label: "Admin — full access" },
                    { value: "member", label: "Member — edit records" },
                    { value: "viewer", label: "Viewer — read-only" },
                  ].map(r => <option key={r.value} value={r.value} className="bg-slate-900">{r.label}</option>)}
                </select>
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="h-9 px-4 rounded-lg border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors disabled:opacity-50 flex items-center gap-2">
                  {saving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />} Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState("general");
  const [data, setData] = useState<{ user: any; workspace: any } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(r => setData(r.data ?? null));
  }, []);

  const ws = data?.workspace;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Configure your workspace</p>
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">Workspace Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Name</label>
                <div className="flex items-center gap-2 h-10 px-3 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200">
                  <Building2 className="w-4 h-4 text-slate-500" />
                  <span>{ws?.name ?? "-"}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Slug</label>
                <div className="flex items-center gap-2 h-10 px-3 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200">
                  <Hash className="w-4 h-4 text-slate-500" />
                  <span>{ws?.slug ?? "-"}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Timezone</label>
                <div className="flex items-center gap-2 h-10 px-3 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>{ws?.timezone ?? "UTC"}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Currency</label>
                <div className="flex items-center gap-2 h-10 px-3 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200">
                  <CreditCard className="w-4 h-4 text-slate-500" />
                  <span>{ws?.defaultCurrency ?? "USD"}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Industry</label>
                <div className="flex items-center gap-2 h-10 px-3 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200">
                  <Globe className="w-4 h-4 text-slate-500" />
                  <span>{ws?.industry ?? "-"}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Plan</label>
                <div className="flex items-center gap-2 h-10 px-3 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200">
                  <Shield className="w-4 h-4 text-slate-500" />
                  <span className="capitalize">{ws?.plan ?? "free"}</span>
                  {ws?.plan === "free" && <span className="ml-auto text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">Current</span>}
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">Workspace ID: <span className="font-mono text-slate-400">{ws?.id ?? "-"}</span></span>
              <span className="text-xs text-slate-500">Created {ws?.createdAt ? new Date(ws.createdAt).toLocaleDateString() : "-"}</span>
            </div>
          </div>
        </div>
      )}

      {tab === "team" && (
        <TeamTab ws={ws} />
      )}

      {tab === "tags" && (
        <div className="space-y-5">
          <TagManager />
        </div>
      )}

      {tab === "billing" && (
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Subscription</h3>
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-200 capitalize">{ws?.plan ?? "Free"} Plan</div>
                <div className="text-xs text-slate-500 mt-0.5">{ws?.plan === "free" ? "No billing information on file." : "Billed monthly."}</div>
              </div>
              <button className="h-8 px-3 rounded-lg border border-slate-700 text-slate-300 text-xs font-medium hover:bg-slate-800 transition-colors">
                Upgrade
              </button>
            </div>
            <div className="mt-4 text-xs text-slate-500">
              Stripe billing integration coming in a future update.
            </div>
          </div>
        </div>
      )}

      {tab === "appearance" && (
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Appearance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Primary Color</label>
                <div className="flex items-center gap-2 h-10 px-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
                  <span className="text-sm text-slate-200">Emerald</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Theme</label>
                <div className="flex items-center gap-2 h-10 px-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="w-4 h-4 rounded-full bg-slate-900 border border-slate-700"></div>
                  <span className="text-sm text-slate-200">Dark</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
