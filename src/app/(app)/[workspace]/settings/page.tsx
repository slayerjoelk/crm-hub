"use client";

import { useEffect, useState } from "react";
import { Globe, Users, CreditCard, Palette, Mail, Clock, Hash, Building2, Shield } from "lucide-react";

const TABS = [
  { id: "general", label: "General", icon: <Globe className="w-4 h-4" /> },
  { id: "team", label: "Team", icon: <Users className="w-4 h-4" /> },
  { id: "billing", label: "Billing", icon: <CreditCard className="w-4 h-4" /> },
  { id: "appearance", label: "Appearance", icon: <Palette className="w-4 h-4" /> },
];

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
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-semibold text-white">Team Members</span>
              </div>
              <button className="h-8 px-3 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 transition-colors">
                Invite Member
              </button>
            </div>
            <div className="divide-y divide-slate-800">
              {data?.user && (
                <div className="px-5 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-semibold">
                    {(data.user.name?.[0] ?? data.user.email[0]).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-200">{data.user.name ?? data.user.email}</div>
                    <div className="text-xs text-slate-500">{data.user.email}</div>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Owner</span>
                </div>
              )}
            </div>
            <div className="px-5 py-3 bg-slate-950/50">
              <p className="text-xs text-slate-500"><Mail className="w-3 h-3 inline mr-1" /> Invited members will appear here once they accept.</p>
            </div>
          </div>
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
