"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CommandPalette } from "@/components/crm/command-palette";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, Building2, BarChart3, CheckSquare, Activity, Settings, LogOut,
  ChevronLeft, ChevronRight, Plus, Search, Bell, Briefcase, Tag, Mail, FolderOpen, Zap, Upload,
  Menu, X, Home, KanbanSquare
} from "lucide-react";

const nav = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Contacts", icon: Users, href: "/contacts" },
  { label: "Companies", icon: Building2, href: "/companies" },
  { label: "Deals", icon: BarChart3, href: "/deals" },
  { label: "Pipelines", icon: KanbanSquare, href: "/pipelines" },
  { label: "Tasks", icon: CheckSquare, href: "/tasks" },
  { label: "Activities", icon: Activity, href: "/activities" },
  { label: "Tags", icon: Tag, href: "/tags" },
  { label: "Emails", icon: Mail, href: "/emails" },
  { label: "Sequences", icon: FolderOpen, href: "/sequences" },
  { label: "Import", icon: Upload, href: "/import" },
  { label: "Analytics", icon: BarChart3, href: "/analytics" },
  { label: "Integrations", icon: Zap, href: "/settings/integrations" },
  { label: "Team", icon: Users, href: "/settings/team" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

export function AppShell({ workspaceSlug, user, children }: { workspaceSlug: string; user: any; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  const unreadCount = notifications.filter(n => !n.read).length;

  async function loadNotifications() {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const json = await res.json();
      setNotifications(json.data ?? []);
    } catch { /* ignore */ }
  }

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, read: true }),
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  useEffect(() => {
    loadNotifications();
    const iv = setInterval(loadNotifications, 30_000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    if (notifOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [notifOpen]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    document.cookie = "session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push("/login");
  }

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden" suppressHydrationWarning>
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className={cn("hidden md:flex flex-col border-r border-slate-800 bg-slate-900 transition-all duration-200", collapsed ? "w-16" : "w-64")}>
        <div className="h-14 flex items-center px-4 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0"><Briefcase className="w-4 h-4 text-white"/></div>
          {!collapsed && <span className="ml-3 font-semibold text-sm tracking-tight truncate">CRM Hub</span>}
        </div>
        <div className="flex-1 overflow-y-auto py-3">
          {nav.map(item => {
            const isActive = pathname.includes(item.href);
            const href = `/${workspaceSlug}${item.href}`;
            return (
              <Link key={item.label} href={href}
                className={cn("flex items-center gap-3 px-3 py-2 mx-2 rounded-lg text-sm transition-colors", isActive ? "bg-emerald-500/10 text-emerald-400 font-medium" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200")}
                title={collapsed ? item.label : undefined}>
                <item.icon className="w-4.5 h-4.5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>
        <div className="border-t border-slate-800 p-2">
          <button onClick={()=>setCollapsed(!collapsed)} className="hidden md:flex items-center justify-center w-full h-9 rounded-lg hover:bg-slate-800 text-slate-400"><ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")}/></button>
          <button onClick={logout} aria-label="Logout" className="flex items-center gap-3 px-3 py-2 mt-1 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-red-400 w-full"><LogOut className="w-4 h-4 shrink-0"/>{!collapsed && <span>Logout</span>}</button>
        </div>
      </aside>

      {/* ── MOBILE SIDEBAR OVERLAY ── */}
      {mobileMenu && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={()=>setMobileMenu(false)}/>}
      <aside className={cn("fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform md:hidden flex flex-col", mobileMenu ? "translate-x-0" : "-translate-x-full")}>
        <div className="h-14 flex items-center justify-between px-4 border-b border-slate-800">
          <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center"><Briefcase className="w-4 h-4 text-white"/></div><span className="font-semibold text-sm">CRM Hub</span></div>
          <button onClick={()=>setMobileMenu(false)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-5 h-5"/></button>
        </div>
        <div className="flex-1 overflow-y-auto py-3">
          {nav.map(item => {
            const isActive = pathname.includes(item.href);
            const href = `/${workspaceSlug}${item.href}`;
            return (
              <Link key={item.label} href={href} onClick={()=>setMobileMenu(false)}
                className={cn("flex items-center gap-3 px-4 py-3 text-sm transition-colors", isActive ? "bg-emerald-500/10 text-emerald-400 font-medium border-r-2 border-emerald-500" : "text-slate-400")}>
                <item.icon className="w-5 h-5 shrink-0" /><span>{item.label}</span>
              </Link>
            );
          })}
        </div>
        <div className="border-t border-slate-800 p-3">
          <button onClick={()=>{ setMobileMenu(false); logout(); }} aria-label="Logout" className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-red-400 w-full"><LogOut className="w-4 h-4 shrink-0"/><span>Logout</span></button>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-slate-800 bg-slate-950 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={()=>setMobileMenu(true)} className="md:hidden p-2 -ml-2 rounded-lg hover:bg-slate-800 text-slate-400"><Menu className="w-5 h-5"/></button>
            <button onClick={()=>typeof window !== 'undefined' && window.dispatchEvent(new KeyboardEvent('keydown', {metaKey:true, key:'k'}))} className="hidden md:flex items-center gap-2 h-8 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-sm hover:bg-slate-800"><Search className="w-4 h-4"/> Search <span className="text-[10px] text-slate-500 border border-slate-800 rounded px-1.5 py-0.5">⌘K</span></button>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Link href={`/${workspaceSlug}/contacts/new`} className="hidden md:flex items-center gap-2 h-8 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500"><Plus className="w-4 h-4"/>Add Contact</Link>
            <div className="relative" ref={notifRef}>
              <button onClick={() => setNotifOpen(v => !v)} className="relative w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-700 bg-slate-900 shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-200">Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={async () => {
                        await Promise.all(notifications.filter(n => !n.read).map(n => markRead(n.id)));
                        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                      }} className="text-xs text-emerald-400 hover:text-emerald-300">Mark all read</button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 && (
                      <div className="px-4 py-6 text-center text-sm text-slate-500">No notifications yet</div>
                    )}
                    {notifications.map(n => (
                      <div key={n.id} onClick={() => { if (!n.read) markRead(n.id); if (n.link) router.push(n.link); }} className={cn("px-4 py-3 border-b border-slate-800/50 cursor-pointer hover:bg-slate-800/40", !n.read && "bg-slate-800/20")}>
                        <div className="flex items-start gap-2">
                          <span className={cn("mt-1.5 w-2 h-2 rounded-full shrink-0", n.read ? "bg-slate-600" : "bg-emerald-500")} />
                          <div className="min-w-0">
                            <div className="text-sm text-slate-200 truncate">{n.title}</div>
                            <div className="text-xs text-slate-500 truncate">{n.message}</div>
                            <div className="text-[10px] text-slate-600 mt-0.5">{new Date(n.createdAt).toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-800/50 rounded-lg px-2 py-1 transition-colors" onClick={()=>router.push(`/${workspaceSlug}/settings/profile`)}>
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-300">{user?.name?.[0]?.toUpperCase?.() ?? "J"}</div>
              <div className="hidden md:block leading-tight"><div className="text-sm text-slate-200">{user?.name ?? "User"}</div><div className="text-xs text-slate-500">{user?.role ?? "Member"}</div></div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-950">{children}</main>
        <CommandPalette />
      </div>
    </div>
  );
}
