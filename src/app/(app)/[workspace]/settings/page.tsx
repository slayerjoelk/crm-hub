"use client";

import { useState } from "react";
import { Save, RefreshCw, AlertTriangle, Check, Palette, Globe, Bell, Shield, Users } from "lucide-react";

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ workspaceName: "My Company", primaryColor: "#10b981", accentColor: "#3b82f6", timezone: "UTC", language: "en", emailNotifications: true, inAppNotifications: true });

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    await new Promise(r=>setTimeout(r,800));
    setSaving(false); setSaved(true);
    setTimeout(()=>setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white">Settings</h1><p className="text-slate-500 text-sm mt-1">Configure your workspace preferences</p></div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2"><Palette className="w-4 h-4 text-slate-400"/><h2 className="text-sm font-semibold text-slate-200">Branding</h2></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-slate-400 mb-1">Workspace name</label><input value={form.workspaceName} onChange={e=>setForm({...form,workspaceName:e.target.value})} className="w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/60" /></div>
              <div><label className="block text-xs font-medium text-slate-400 mb-1">Primary color</label><div className="flex gap-2"><input type="color" value={form.primaryColor} onChange={e=>setForm({...form,primaryColor:e.target.value})} className="w-10 h-10 p-0.5 rounded-lg bg-slate-900 border border-slate-800" /><input value={form.primaryColor} onChange={e=>setForm({...form,primaryColor:e.target.value})} className="flex-1 h-10 px-3 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 font-mono" /></div></div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2"><Globe className="w-4 h-4 text-slate-400"/><h2 className="text-sm font-semibold text-slate-200">Regional</h2></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-slate-400 mb-1">Timezone</label>
                <select value={form.timezone} onChange={e=>setForm({...form,timezone:e.target.value})} className="w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 appearance-none">
                  {["UTC","America/New_York","America/Los_Angeles","Europe/London","Europe/Berlin","Asia/Tokyo","Australia/Sydney","Africa/Johannesburg"].map(t=><option key={t} value={t} className="bg-slate-900">{t}</option>)}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-slate-400 mb-1">Language</label>
                <select value={form.language} onChange={e=>setForm({...form,language:e.target.value})} className="w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 appearance-none">
                  {["en","es","fr","de","pt","zh","ja"].map(l=><option key={l} value={l} className="bg-slate-900">{l.toUpperCase()}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
            <div className="flex items-center gap-2 mb-2"><Bell className="w-4 h-4 text-slate-400"/><h2 className="text-sm font-semibold text-slate-200">Notifications</h2></div>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer"><input type="checkbox" checked={form.emailNotifications} onChange={e=>setForm({...form,emailNotifications:e.target.checked})} className="rounded bg-slate-800 border-slate-600 text-emerald-500" /> Email notifications</label>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer"><input type="checkbox" checked={form.inAppNotifications} onChange={e=>setForm({...form,inAppNotifications:e.target.checked})} className="rounded bg-slate-800 border-slate-600 text-emerald-500" /> In-app notifications</label>
          </div>

          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 space-y-3">
            <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-red-400"/><h2 className="text-sm font-semibold text-red-300">Danger Zone</h2></div>
            <button className="w-full h-9 rounded-lg border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors">Delete workspace data</button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4">
        {saved && <div className="flex items-center gap-1.5 text-sm text-emerald-400"><Check className="w-4 h-4"/> Saved</div>}
        <button onClick={save} disabled={saving} className="h-9 px-5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-2">
          {saving ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Save
        </button>
      </div>
    </div>
  );
}
