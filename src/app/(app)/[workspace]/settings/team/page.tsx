"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Users, Plus, Mail, Copy, Check, AlertTriangle, X, Trash2, Clock, UserCheck, LogIn } from "lucide-react";

export default function TeamSettingsPage() {
  const { workspace } = useParams<{ workspace: string }>();
  const router = useRouter();
  const [members, setMembers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [copied, setCopied] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [tRes, meRes] = await Promise.all([
        fetch("/api/team", { credentials: "include" }).then(r => r.json()),
        fetch("/api/auth/me", { credentials: "include" }).then(r => r.json()),
      ]);
      if (tRes.data) {
        setMembers(tRes.data.members ?? []);
        setInvites(tRes.data.invites ?? []);
      }
      const me = meRes.data?.user;
      const ws = meRes.data?.workspace;
      setIsOwner(me?.role === "owner" || ws?.createdBy === me?.id);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function sendInvite() {
    setSendError("");
    setSending(true);
    const res = await fetch("/api/invites", { credentials: "include",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), workspaceId: workspace, role }),
    });
    const body = await res.json();
    setSending(false);
    if (!body.success) { setSendError(body.error || "Failed"); return; }
    setShowInvite(false);
    setEmail("");
    setRole("member");
    load();
  }

  async function deleteMember(id: string) {
    if (!confirm("Remove this member?")) return;
    await fetch(`/api/workspaces/${workspace}/members/${id}`, { credentials: "include", method: "DELETE" });
    load();
  }

  async function revokeInvite(id: string) {
    if (!confirm("Revoke this invite?")) return;
    await fetch(`/api/invites/${id}`, { credentials: "include", method: "DELETE" });
    load();
  }

  async function copyInviteLink() {
    const link = `${window.location.origin}/join?workspace=${workspace}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div><h1 className="text-2xl font-bold text-[#f7f8f8]">Team Members</h1>
        <p className="text-[#62666d] text-sm mt-1">Manage who has access to this workspace.</p></div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-[#8a8f98]">{members.length} member{members.length !== 1 ? "s" : ""} <span className="text-[#62666d]">· {invites.length} pending invite{invites.length !== 1 ? "s" : ""}</span></div>
        {isOwner && (
          <button onClick={() => setShowInvite(true)} className="h-9 px-4 rounded-lg bg-[#5e6ad2] text-[#f7f8f8] text-sm font-medium hover:bg-[#5e6ad2] flex items-center gap-2">
            <Plus className="w-4 h-4" /> Invite
          </button>
        )}
      </div>

      {showInvite && (
        <div className="rounded-xl border border-white/[0.06] bg-[#0f1011] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#d0d6e0]">Invite a team member</h3>
            <button onClick={() => setShowInvite(false)} className="text-[#62666d] hover:text-[#8a8f98]"><X className="w-5 h-5" /></button>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#8a8f98] uppercase">Email</label>
              <input
                type="email"
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full bg-[#08090a] border border-white/[0.06] rounded-lg h-9 px-3 text-sm text-[#f7f8f8] placeholder-slate-600 focus:border-[#5e6ad2] outline-none"
                onKeyDown={e => { if (e.key === "Enter") sendInvite(); }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#8a8f98] uppercase">Role</label>
              <select value={role} onChange={e => setRole(e.target.value)} className="w-full bg-[#08090a] border border-white/[0.06] rounded-lg h-9 px-3 text-sm text-[#f7f8f8] focus:border-[#5e6ad2] outline-none">
                <option value="member">Member — can view and edit</option>
                <option value="viewer">Viewer — read-only</option>
                <option value="admin">Admin — full access except workspace deletion</option>
              </select>
            </div>
          </div>
          {sendError && <div className="text-sm text-red-400 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{sendError}</div>}
          <div className="flex items-center justify-between">
            <button onClick={copyInviteLink} className="flex items-center gap-2 text-sm text-[#8a8f98] hover:text-[#d0d6e0]">
              {copied ? <><Check className="w-4 h-4 text-[#10b981]" /> Copied</> : <><Copy className="w-4 h-4" /> Copy invite link</>}
            </button>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowInvite(false)} className="h-9 px-4 rounded-lg border border-white/[0.06] text-[#8a8f98] text-sm hover:bg-[#191a1b]">Cancel</button>
              <button onClick={sendInvite} disabled={!email.trim() || sending} className="h-9 px-4 rounded-lg bg-[#5e6ad2] text-[#f7f8f8] text-sm font-medium hover:bg-[#5e6ad2] disabled:opacity-50 flex items-center gap-2">
                {sending ? (<><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending</>) : (<><Mail className="w-4 h-4" /> Send Invite</>)}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-white/[0.06] bg-[#0f1011] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#0f1011]">
            <tr className="text-xs text-[#62666d] uppercase">
              <th className="px-4 py-3 text-left font-medium">User</th>
              <th className="px-4 py-3 text-left font-medium">Role</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {members.map((m: any) => (
              <tr key={m.id} className="text-[#d0d6e0] hover:bg-[#191a1b]/40 transition-colors">
                <td className="px-4 py-3">{m.email || m.userId}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-[#191a1b] border border-white/[0.06] capitalize">
                    {m.role === "owner" && <UserCheck className="w-3 h-3 text-[#10b981]" />}
                    {m.role === "admin" && <LogIn className="w-3 h-3 text-blue-400" />}
                    {m.role}
                  </span>
                </td>
                <td className="px-4 py-3"><span className="inline-flex items-center gap-1 text-xs text-[#10b981]"><tspan className="w-1.5 h-1.5 rounded-full bg-[#5e6ad2]" /> active</span></td>
                <td className="px-4 py-3 text-right">
                  {isOwner && m.role !== "owner" && (
                    <button onClick={() => deleteMember(m.id)} className="text-[#62666d] hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  )}
                </td>
              </tr>
            ))}
            {invites.map((inv: any) => (
              <tr key={inv.id} className="text-[#8a8f98] hover:bg-[#191a1b]/40">
                <td className="px-4 py-3">{inv.email}</td>
                <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full bg-[#191a1b] border border-white/[0.06] capitalize">{inv.role}</span></td>
                <td className="px-4 py-3"><span className="inline-flex items-center gap-1 text-xs text-amber-400"><Clock className="w-3 h-3" /> pending</span></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => revokeInvite(inv.id)} className="text-[#62666d] hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {members.length === 0 && invites.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-[#62666d]">No team members yet. Invite someone to get started.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
