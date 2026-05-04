"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Briefcase, Lock, Mail, User, AlertTriangle } from "lucide-react";

export default function InviteAcceptPage() {
  const { token } = useParams();
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [invite, setInvite] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/invites/${token}/check`)
      .then(r => r.json())
      .then(json => {
        if (json.error) { setError(json.error); }
        setInvite(json.data || null);
      })
      .catch(() => setError("Could not load invite"))
      .finally(() => setChecking(false));
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/invites/${token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Accept failed"); }
      else { router.push(`/${json.data.workspaceSlug}/dashboard`); }
    } catch { setError("Something went wrong"); }
    finally { setLoading(false); }
  }

  if (checking) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error && !invite) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-amber-400" />
        </div>
        <h1 className="text-lg font-semibold text-white mb-2">Invite Unavailable</h1>
        <p className="text-sm text-slate-500">{error}</p>
        <a href="/login" className="mt-4 inline-block text-sm text-emerald-400 hover:text-emerald-300">Go to Login</a>
      </div>
    </div>
  );

  const email = invite?.email || "";

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center mb-4">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Join Workspace</h1>
          <p className="text-slate-500 text-sm mt-1">Set your password to continue</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="email" value={email} disabled className="w-full h-10 pl-9 pr-4 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-400 cursor-not-allowed" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name"
                className="w-full h-10 pl-9 pr-4 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" minLength={6}
                className="w-full h-10 pl-9 pr-4 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full h-10 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 flex items-center justify-center">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Join Workspace"}
          </button>
        </form>
      </div>
    </div>
  );
}
