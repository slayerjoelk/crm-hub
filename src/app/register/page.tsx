"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceSlug, setWorkspaceSlug] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email: email.trim(), password,
          workspaceName,
          workspaceSlug: workspaceSlug || workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Registration failed"); setLoading(false); return; }
      router.push(`/${json.workspace.slug || workspaceSlug}/dashboard`);
    } catch { setError("Network error. Try again."); setLoading(false); }
  }

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-zinc-950 overflow-hidden py-12">
      <div className="absolute inset-0">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-[-30%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-600/8 blur-[100px]" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative w-full max-w-md mx-4">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-800/50 to-zinc-900/50 rounded-3xl blur-xl" />
        <div className="relative rounded-3xl border border-zinc-800/80 bg-zinc-900/90 backdrop-blur-2xl p-8 shadow-2xl shadow-black/40">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25 mb-5">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Create workspace</h1>
            <p className="text-sm text-zinc-400 mt-1.5">Set up your CRM in seconds</p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-sm text-red-400">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Your name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Joel Bellas"
                className="w-full h-11 px-4 rounded-xl bg-zinc-800/50 border border-zinc-700/80 text-sm text-white placeholder-zinc-500 transition-all duration-200 focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/10" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@company.com" autoComplete="email"
                className="w-full h-11 px-4 rounded-xl bg-zinc-800/50 border border-zinc-700/80 text-sm text-white placeholder-zinc-500 transition-all duration-200 focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/10" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min 8 characters" autoComplete="new-password"
                className="w-full h-11 px-4 rounded-xl bg-zinc-800/50 border border-zinc-700/80 text-sm text-white placeholder-zinc-500 transition-all duration-200 focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/10" />
            </div>
            <div className="pt-2 border-t border-zinc-800">
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Workspace name</label>
              <input type="text" value={workspaceName} onChange={e => { setWorkspaceName(e.target.value); if (!workspaceSlug) setWorkspaceSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")); }} required placeholder="MintAgree"
                className="w-full h-11 px-4 rounded-xl bg-zinc-800/50 border border-zinc-700/80 text-sm text-white placeholder-zinc-500 transition-all duration-200 focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/10" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Workspace URL</label>
              <div className="flex items-center rounded-xl bg-zinc-800/50 border border-zinc-700/80 focus-within:border-violet-500/60 focus-within:ring-2 focus-within:ring-violet-500/10 transition-all">
                <span className="pl-4 text-sm text-zinc-500">crm-hub.app/</span>
                <input type="text" value={workspaceSlug} onChange={e => setWorkspaceSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} required placeholder="mintagree"
                  className="flex-1 h-11 px-2 bg-transparent border-0 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-0" />
              </div>
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold transition-all duration-200 hover:from-emerald-400 hover:to-teal-500 hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : null}
              {loading ? "Creating..." : "Create workspace"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-500">
              Already have a workspace?{" "}
              <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
