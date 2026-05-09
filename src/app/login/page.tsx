"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Invalid credentials"); setLoading(false); return; }
      router.push(`/${json.data.workspace.slug}/dashboard`);
    } catch { setError("Network error. Try again."); setLoading(false); }
  }

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-zinc-950 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-[-30%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/8 blur-[100px]" />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-emerald-500/5 blur-[80px]" />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Login card */}
      <div className="relative w-full max-w-md mx-4">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-800/50 to-zinc-900/50 rounded-3xl blur-xl" />
        <div className="relative rounded-3xl border border-zinc-800/80 bg-zinc-900/90 backdrop-blur-2xl p-8 shadow-2xl shadow-black/40">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25 mb-5">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Welcome back</h1>
            <p className="text-sm text-zinc-400 mt-1.5">Sign in to your workspace</p>
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
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                required placeholder="you@company.com" autoComplete="email"
                className="w-full h-11 px-4 rounded-xl bg-zinc-800/50 border border-zinc-700/80 text-sm text-white placeholder-zinc-500 transition-all duration-200 focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                required placeholder="••••••••" autoComplete="current-password"
                className="w-full h-11 px-4 rounded-xl bg-zinc-800/50 border border-zinc-700/80 text-sm text-white placeholder-zinc-500 transition-all duration-200 focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/10"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-semibold transition-all duration-200 hover:from-violet-400 hover:to-indigo-500 hover:shadow-lg hover:shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : null}
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-500">
              Don't have a workspace?{" "}
              <Link href="/register" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
