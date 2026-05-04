"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Building2, BarChart3, CheckSquare, Activity, Settings, LogOut,
  ChevronLeft, ChevronRight, Plus, Search, Bell, Briefcase, Tag, Mail, FolderOpen, Zap, Upload,
  Menu, X, Home
} from "lucide-react";
import { cn } from "@/lib/utils";
import GlobalSearch from "@/components/global-search";

const nav = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Contacts", icon: Users, href: "/contacts" },
  { label: "Companies", icon: Building2, href: "/companies" },
  { label: "Deals", icon: BarChart3, href: "/deals" },
  { label: "Tasks", icon: CheckSquare, href: "/tasks" },
  { label: "Activities", icon: Activity, href: "/activities" },
  { label: "Tags", icon: Tag, href: "/tags" },
  { label: "Emails", icon: Mail, href: "/emails" },
  { label: "Sequences", icon: FolderOpen, href: "/sequences" },
  { label: "Import", icon: Upload, href: "/import" },
  { label: "Integrations", icon: Zap, href: "/settings/integrations" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

export function AppShell({ workspaceSlug, user, children }: { workspaceSlug: string; user: any; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

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
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2 mt-1 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-red-400 w-full"><LogOut className="w-4 h-4 shrink-0"/>{!collapsed && <span>Logout</span>}</button>
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
          <button onClick={()=>{ setMobileMenu(false); logout(); }} className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-red-400 w-full"><LogOut className="w-4 h-4 shrink-0"/><span>Logout</span></button>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-slate-800 bg-slate-950 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={()=>setMobileMenu(true)} className="md:hidden p-2 -ml-2 rounded-lg hover:bg-slate-800 text-slate-400"><Menu className="w-5 h-5"/></button>
            <GlobalSearch />
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Link href={`/${workspaceSlug}/contacts/new`} className="hidden md:flex items-center gap-2 h-8 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500"><Plus className="w-4 h-4"/>Add Contact</Link>
            <button className="relative w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400"><Bell className="w-4 h-4"/><span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"/></button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-300">{user?.name?.[0]?.toUpperCase?.() ?? "J"}</div>
              <div className="hidden md:block leading-tight"><div className="text-sm text-slate-200">{user?.name ?? "User"}</div><div className="text-xs text-slate-500">{user?.role ?? "Member"}</div></div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-950">{children}</main>
      </div>
    </div>
  );
}
