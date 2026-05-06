"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CommandPalette } from "@/components/crm/command-palette";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, Building2, BarChart3, CheckSquare, Activity, Settings, LogOut,
  ChevronLeft, Plus, Search, Bell, Briefcase, Tag, Mail, FolderOpen, Zap, Upload,
  Menu, X, KanbanSquare, Crown
} from "lucide-react";

const navSections = [
  {
    label: "CRM",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
      { label: "Contacts", icon: Users, href: "/contacts" },
      { label: "Companies", icon: Building2, href: "/companies" },
      { label: "Deals", icon: BarChart3, href: "/deals" },
      { label: "Pipelines", icon: KanbanSquare, href: "/pipelines" },
      { label: "Tasks", icon: CheckSquare, href: "/tasks" },
    ],
  },
  {
    label: "Engagement",
    items: [
      { label: "Activities", icon: Activity, href: "/activities" },
      { label: "Emails", icon: Mail, href: "/emails" },
      { label: "Sequences", icon: FolderOpen, href: "/sequences" },
    ],
  },
  {
    label: "Data",
    items: [
      { label: "Tags", icon: Tag, href: "/tags" },
      { label: "Import", icon: Upload, href: "/import" },
      { label: "Analytics", icon: BarChart3, href: "/analytics" },
    ],
  },
  {
    label: "Workspace",
    items: [
      { label: "Team", icon: Crown, href: "/settings/team" },
      { label: "Integrations", icon: Zap, href: "/settings/integrations" },
      { label: "Settings", icon: Settings, href: "/settings" },
    ],
  },
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
      const res = await fetch("/api/notifications", { credentials: "include" });
      if (!res.ok) return;
      const json = await res.json();
      setNotifications(json.data ?? []);
    } catch { /* ignore */ }
  }

  async function markRead(id: string) {
    await fetch("/api/notifications", { credentials: "include",
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
    await fetch("/api/auth/logout", { credentials: "include", method: "POST" });
    document.cookie = "session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push("/login");
  }

  const sidebarWidth = collapsed ? "w-14" : "w-56";

  function NavItem({ item }: { item: typeof navSections[0]["items"][0] }) {
    const isActive = pathname === `/${workspaceSlug}${item.href}` || pathname.startsWith(`/${workspaceSlug}${item.href}/`);
    const href = `/${workspaceSlug}${item.href}`;
    return (
      <Link
        key={item.label}
        href={href}
        onClick={() => setMobileMenu(false)}
        className={cn(
          "group flex items-center gap-2.5 h-8 px-3 mx-2 rounded-md text-[12px] font-medium transition-all duration-150",
          isActive
            ? "bg-[#5e6ad2]/10 text-[#5e6ad2]"
            : "text-[#8a8f98] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#d0d6e0]"
        )}
        title={collapsed ? item.label : undefined}
      >
        <item.icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
        {!collapsed && <span className="truncate">{item.label}</span>}
        {isActive && !collapsed && <span className="ml-auto w-1 h-1 rounded-full bg-[#5e6ad2]" />}
      </Link>
    );
  }

  return (
    <div className="flex h-screen bg-[#08090a] overflow-hidden" suppressHydrationWarning>
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className={cn("hidden md:flex flex-col bg-[#08090a] border-r border-white/[0.06] transition-all duration-200", sidebarWidth)}>
        <div className="h-12 flex items-center px-3 shrink-0">
          <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 bg-[#5e6ad2]">
            <Briefcase className="w-3.5 h-3.5 text-white" strokeWidth={1.5} />
          </div>
          {!collapsed && (
            <span className="ml-2.5 text-[13px] font-semibold text-[#f7f8f8] tracking-tight truncate">
              CRM Hub
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-2 space-y-4">
          {navSections.map(section => (
            <div key={section.label}>
              {!collapsed && (
                <div className="px-5 mb-1">
                  <span className="text-[10px] font-semibold text-[#62666d] uppercase tracking-wider">{section.label}</span>
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map(item => <NavItem key={item.label} item={item} />)}
              </div>
            </div>
          ))}
        </div>

        <div className="p-2 border-t border-white/[0.06]">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex items-center justify-center w-full h-8 rounded-md text-[#62666d] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#8a8f98] transition-all duration-150"
            title={collapsed ? "Expand" : "Collapse"}
          >
            <ChevronLeft className={cn("w-4 h-4 transition-transform duration-200", collapsed && "rotate-180")} />
          </button>
          <button
            onClick={logout}
            className={cn(
              "flex items-center gap-2.5 h-8 px-3 mx-2 mt-1 rounded-md text-[12px] font-medium text-[#8a8f98] hover:text-[#ef4444] hover:bg-red-500/5 transition-all duration-150",
              collapsed && "justify-center mx-0"
            )}
            title={collapsed ? "Logout" : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.5} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── MOBILE SIDEBAR OVERLAY ── */}
      {mobileMenu && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setMobileMenu(false)} />
      )}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-56 bg-[#0f1011] border-r border-white/[0.06] transform transition-transform md:hidden flex flex-col",
        mobileMenu ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-12 flex items-center justify-between px-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md flex items-center justify-center bg-[#5e6ad2]">
              <Briefcase className="w-3.5 h-3.5 text-white" strokeWidth={1.5} />
            </div>
            <span className="text-[13px] font-semibold text-[#f7f8f8]">CRM Hub</span>
          </div>
          <button onClick={() => setMobileMenu(false)} className="p-1.5 rounded-md hover:bg-[rgba(255,255,255,0.04)] text-[#62666d]">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2 space-y-4">
          {navSections.map(section => (
            <div key={section.label}>
              <div className="px-5 mb-1">
                <span className="text-[10px] font-semibold text-[#62666d] uppercase tracking-wider">{section.label}</span>
              </div>
              <div className="space-y-0.5">
                {section.items.map(item => <NavItem key={item.label} item={item} />)}
              </div>
            </div>
          ))}
        </div>
        <div className="p-2 border-t border-white/[0.06]">
          <button
            onClick={() => { setMobileMenu(false); logout(); }}
            className="flex items-center gap-2.5 h-8 px-3 mx-2 w-full rounded-md text-[12px] font-medium text-[#8a8f98] hover:text-[#ef4444] hover:bg-red-500/5 transition-all"
          >
            <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.5} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-12 flex items-center justify-between px-4 md:px-5 border-b border-white/[0.06] bg-[#08090a] shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenu(true)}
              className="md:hidden p-2 rounded-md hover:bg-[rgba(255,255,255,0.04)] text-[#62666d] transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => typeof window !== 'undefined' && window.dispatchEvent(new KeyboardEvent('keydown', { metaKey: true, key: 'k' }))}
              className="hidden md:flex items-center gap-2 h-8 px-3 rounded-md text-[12px] text-[#62666d] border border-white/[0.06] hover:border-white/[0.10] hover:text-[#8a8f98] transition-all"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
              <span className="text-[10px] font-medium text-[#62666d] border border-white/[0.08] bg-white/[0.02] rounded px-1.5 py-0.5 ml-1">⌘K</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/${workspaceSlug}/contacts/new`}
              className="hidden md:flex items-center gap-1.5 h-8 px-3 rounded-md text-[12px] font-medium text-white bg-[#5e6ad2] hover:bg-[#828fff] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Contact
            </Link>

            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(v => !v)}
                className="relative w-8 h-8 rounded-md flex items-center justify-center hover:bg-[rgba(255,255,255,0.04)] text-[#62666d] hover:text-[#8a8f98] transition-all"
              >
                <Bell className="w-4 h-4" strokeWidth={1.5} />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 min-w-[14px] h-3.5 px-1 flex items-center justify-center rounded-full text-[9px] font-bold text-white bg-[#ef4444]">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl overflow-hidden z-50 bg-[#0f1011] border border-white/[0.08] shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
                  <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-[#d0d6e0]">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={async () => {
                          await Promise.all(notifications.filter(n => !n.read).map(n => markRead(n.id)));
                          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                        }}
                        className="text-[11px] font-medium text-[#5e6ad2] hover:text-[#828fff] transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 && (
                      <div className="px-4 py-6 text-center text-[12px] text-[#62666d]">No notifications yet</div>
                    )}
                    {notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => { if (!n.read) markRead(n.id); if (n.link) router.push(n.link); }}
                        className={cn(
                          "px-4 py-2.5 border-b border-white/[0.04] cursor-pointer hover:bg-[rgba(255,255,255,0.02)] transition-colors",
                          !n.read && "bg-[rgba(255,255,255,0.02)]"
                        )}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className={cn("mt-1 w-1.5 h-1.5 rounded-full shrink-0", n.read ? "bg-[#62666d]" : "bg-[#5e6ad2]")} />
                          <div className="min-w-0">
                            <div className="text-[12px] font-medium text-[#d0d6e0]">{n.title}</div>
                            <div className="text-[11px] text-[#62666d] truncate">{n.message}</div>
                            <div className="text-[10px] text-[#62666d] mt-0.5">{new Date(n.createdAt).toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => router.push(`/${workspaceSlug}/settings/profile`)}
              className="flex items-center gap-2 hover:bg-[rgba(255,255,255,0.04)] rounded-md px-2 py-1 transition-colors"
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white bg-white/[0.06]">
                {user?.name?.[0]?.toUpperCase?.() ?? "U"}
              </div>
              <div className="hidden md:block leading-tight text-left">
                <div className="text-[12px] font-medium text-[#f7f8f8]">{user?.name ?? "User"}</div>
                <div className="text-[10px] text-[#62666d]">{user?.role ?? "Member"}</div>
              </div>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-5 bg-[#08090a]">{children}</main>
        <CommandPalette />
      </div>
    </div>
  );
}
