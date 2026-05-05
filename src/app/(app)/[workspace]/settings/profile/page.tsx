"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { User, Mail, Globe, Camera, Save, RefreshCw, Check, Shield, Key } from "lucide-react";

const TIMEZONES = [
  "UTC","America/New_York","America/Los_Angeles","America/Chicago","America/Denver",
  "Europe/London","Europe/Berlin","Europe/Paris","Europe/Madrid","Europe/Rome",
  "Asia/Tokyo","Asia/Shanghai","Asia/Singapore","Asia/Dubai","Asia/Mumbai",
  "Australia/Sydney","Australia/Melbourne","Africa/Johannesburg","Africa/Lagos",
];

export default function ProfileSettingsPage() {
  const { workspace } = useParams<{ workspace: string }>();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({ name: "", email: "", timezone: "UTC", avatarUrl: "" });

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me");
      const json = await res.json();
      if (json.data?.user) {
        setUser(json.data.user);
        setForm({
          name: json.data.user.name || "",
          email: json.data.user.email || "",
          timezone: json.data.user.timezone || "UTC",
          avatarUrl: json.data.user.avatarUrl || "",
        });
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(""); setSaved(false);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          timezone: form.timezone,
          avatarUrl: form.avatarUrl,
        }),
      });
      const json = await res.json();
      if (json.data) {
        setUser(json.data);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError(json.error || "Update failed");
      }
    } catch (e: any) {
      setError(e.message || "Network error");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const initials = (form.name || user?.name || "User").split(" ").map((w: string) => w[0]).join("").slice(0,2).toUpperCase();

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your personal account settings</p>
      </div>

      {/* Avatar Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-lg font-semibold text-slate-200 shrink-0">
          {form.avatarUrl ? (
            <img src={form.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-200">{form.name || user?.name || "User"}</div>
          <div className="text-xs text-slate-500">{form.email || user?.email}</div>
          <div className="text-xs text-slate-500 capitalize mt-0.5">{user?.role || "member"}</div>
        </div>
      </div>

      <form onSubmit={save} className="space-y-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-200">Personal Info</h2>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Full name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full h-10 pl-9 pr-3 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/60"
                  placeholder="Your name"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full h-10 pl-9 pr-3 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/60"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Timezone</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select
                  value={form.timezone}
                  onChange={e => setForm({ ...form, timezone: e.target.value })}
                  className="w-full h-10 pl-9 pr-3 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 appearance-none focus:outline-none focus:ring-1 focus:ring-emerald-500/60"
                >
                  {TIMEZONES.map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Avatar URL</label>
              <div className="relative">
                <Camera className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  value={form.avatarUrl}
                  onChange={e => setForm({ ...form, avatarUrl: e.target.value })}
                  className="w-full h-10 pl-9 pr-3 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/60"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
            <Shield className="w-4 h-4" /> {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          {saved && (
            <div className="flex items-center gap-1.5 text-sm text-emerald-400">
              <Check className="w-4 h-4" /> Saved
            </div>
          )}
          <button type="submit" disabled={saving} className="h-9 px-5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-2">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Profile
          </button>
        </div>
      </form>

      {/* Password placeholder */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Key className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-200">Password</h2>
        </div>
        <p className="text-xs text-slate-500">Password management coming soon.</p>
        <button disabled className="h-9 px-4 rounded-lg border border-slate-700 text-slate-400 text-sm disabled:opacity-40">
          Change Password
        </button>
      </div>
    </div>
  );
}
