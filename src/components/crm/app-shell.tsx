"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  BarChart3,
  CheckSquare,
  Activity,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Bell,
  Briefcase,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Contacts", icon: Users, href: "/contacts" },
  { label: "Companies", icon: Building2, href: "/companies" },
  { label: "Deals", icon: BarChart3, href: "/deals" },
  { label: "Tasks", icon: CheckSquare, href: "/tasks" },
  { label: "Activities", icon: Activity, href: "/activities" },
  { label: "Integrations", icon: Zap, href: "/settings/integrations" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

export function AppShell({ workspaceSlug, user, children }: {
  workspaceSlug: string;
  user: any;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    document.cookie = "session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push("/login");
  }

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden" suppressHydrationWarning>
      {/* ── SIDEBAR ── */}
      <aside
        className={cn(
          "flex flex-col border-r border-slate-800 bg-slate-900 transition-all duration-200",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="h-14 flex items-center px-4 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
            <Briefcase className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <span className="ml-3 font-semibold text-sm tracking-tight truncate">CRM Hub</span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-3">
          {nav.map((item) => {
            const isActive = pathname.includes(item.href);
            const href = `/${workspaceSlug}${item.href}`;
            return (
              <Link
                key={item.label}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 mx-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400 font-medium"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-4.5 h-4.5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>

        <div className="border-t border-slate-800 p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full h-9 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 mt-1 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors w-full"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950 shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search contacts, companies, deals..."
                className="w-80 h-8 pl-9 pr-4 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                readOnly
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${workspaceSlug}/contacts/new`}
              className="flex items-center gap-2 h-8 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Contact
            </Link>

            <button className="relative w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-300">
                {user?.name?.[0]?.toUpperCase?.() ?? "J"}
              </div>
              <div className="leading-tight">
                <div className="text-sm text-slate-200">{user?.name ?? "User"}</div>
                <div className="text-xs text-slate-500">{user?.role ?? "Member"}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
