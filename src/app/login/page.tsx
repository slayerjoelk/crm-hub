
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Lock, Mail, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", { credentials: "include", method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Login failed"); }
      else { router.push(`/${json.data.workspace.slug}/dashboard`); }
    } catch { setError("Something went wrong"); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-[#08090a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#5e6ad2] flex items-center justify-center mb-4"><Briefcase className="w-6 h-6 text-white" /></div>
          <h1 className="text-2xl font-bold text-white">CRM Hub</h1>
          <p className="text-[#62666d] text-sm mt-1">Sign in to your workspace</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
          <div>
            <label className="block text-xs font-medium text-[#8a8f98] mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#62666d]" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@company.com"
                className="w-full h-10 pl-9 pr-4 rounded-lg bg-[#0f1011] border border-white/[0.06] text-sm text-[#d0d6e0] placeholder-[#62666d] focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]/50" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#8a8f98] mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#62666d]" />
              <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••"
                className="w-full h-10 pl-9 pr-10 rounded-lg bg-[#0f1011] border border-white/[0.06] text-sm text-[#d0d6e0] placeholder-[#62666d] focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]/50" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#62666d] hover:text-[#8a8f98]">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full h-10 rounded-lg bg-[#5e6ad2] text-white text-sm font-medium hover:bg-[#5e6ad2] transition-colors disabled:opacity-50 flex items-center justify-center">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Sign In"}
          </button>
        </form>
        <div className="mt-6 text-center"><a href="/register" className="text-sm text-[#10b981] hover:underline">Create a new workspace</a></div>
      </div>
    </div>
  );
}
