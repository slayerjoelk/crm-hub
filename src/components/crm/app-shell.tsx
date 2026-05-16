"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CommandPalette } from "@/components/crm/command-palette";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, Building2, BarChart3, CheckSquare, Activity, Settings, LogOut,
  ChevronLeft, Plus, Search, Bell, Zap, Mail, FolderOpen, Upload,
  Menu, X, KanbanSquare, Crown, Tag, Sparkles, ChevronDown, Building
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
      { label: "Automation", icon: Zap, href: "/automation" },
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

interface Business {
  id: string;
  slug: string;
  name: string;
  domain?: string | null;
}

function makePath(workspaceSlug: string, businessSlug: string | null, href: string) {
  if (businessSlug) {
    return `/${businessSlug}/${workspaceSlug}${href}`;
  }
  return `/${workspaceSlug}${href}`;
}

export function AppShell({ workspaceSlug, businessSlug, user, children }: { workspaceSlug: string; businessSlug?: string | null; user: any; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [bizOpen, setBizOpen] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const bizRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    fetch("/api/notifications", { credentials: "include" })
      .then(r => r.json()).then(j => setNotifications(j.data ?? [])).catch(() => {});
    const iv = setInterval(() => {
      fetch("/api/notifications", { credentials: "include" })
        .then(r => r.json()).then(j => setNotifications(j.data ?? [])).catch(() => {});
    }, 30000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    fetch("/api/businesses", { credentials: "include" })
      .then(r => r.json())
      .then(j => {
        const list = j.data ?? [];
        setBusinesses(list);
        if (businessSlug) {
          const match = list.find((b: Business) => b.slug === businessSlug);
          if (match) setCurrentBusiness(match);
        } else if (list.length > 0) {
          setCurrentBusiness(list[0]);
        }
      })
      .catch(() => {});
  }, [businessSlug]);

  async function markRead(id: string) {
    await fetch("/api/notifications", { credentials: "include", method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, read: true }) });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenu(false);
      if (bizRef.current && !bizRef.current.contains(e.target as Node)) setBizOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { credentials: "include", method: "POST" });
    document.cookie = "session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push("/login");
  }

  const isActive = (href: string) => {
    const base = businessSlug ? `/${businessSlug}/${workspaceSlug}` : `/${workspaceSlug}`;
    return pathname === `${base}${href}` || pathname.startsWith(`${base}${href}/`);
  };

  return (
    <div className="flex h-screen bg-[#0a0a0b] overflow-hidden" suppressHydrationWarning>
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className={cn("hidden md:flex flex-col bg-[#0a0a0b] border-r border-zinc-800/50 transition-all duration-300", collapsed ? "w-16" : "w-60")}>
        <div className={cn("flex items-center gap-3 px-4 shrink-0", collapsed ? "h-14 justify-center" : "h-14")}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          </div>
          {!collapsed && <span className="text-[15px] font-bold text-white tracking-tight">CRM Hub</span>}
        </div>

        <div className="flex-1 overflow-y-auto py-3 space-y-5">
          {navSections.map(section => (
            <div key={section.label}>
              {!collapsed && <div className="px-5 mb-1.5"><span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.12em]">{section.label}</span></div>}
              {collapsed && <div className="mb-2 border-t border-zinc-800/50 mx-4" />}
              <div className="space-y-0.5 px-2">
                {section.items.map(item => (
                  <Link key={item.label} href={makePath(workspaceSlug, businessSlug ?? null, item.href)} onClick={() => setMobileMenu(false)}
                    className={cn(
                      "group flex items-center gap-3 h-9 px-3 rounded-lg text-[13px] font-medium transition-all duration-200",
                      isActive(item.href)
                        ? "bg-violet-500/10 text-violet-400"
                        : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200",
                      collapsed && "justify-center px-0"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.5} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {isActive(item.href) && !collapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-zinc-800/50">
          <button onClick={() => setCollapsed(!collapsed)}
            className={cn("w-full h-9 rounded-lg flex items-center gap-2.5 text-zinc-500 hover:bg-zinc-800/40 hover:text-zinc-300 transition-all text-[13px] font-medium",
              collapsed ? "justify-center" : "px-3"
            )}>
            <ChevronLeft className={cn("w-4 h-4 transition-transform duration-300", collapsed && "rotate-180")} />
            {!collapsed && "Collapse"}
          </button>
          <button onClick={logout}
            className={cn("w-full h-9 rounded-lg flex items-center gap-2.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-all text-[13px] font-medium mt-1",
              collapsed ? "justify-center" : "px-3"
            )}>
            <LogOut className="w-4 h-4" strokeWidth={1.5} />
            {!collapsed && "Logout"}
          </button>
        </div>
      </aside>

      {/* ── MOBILE OVERLAY ── */}
      {mobileMenu && <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden" onClick={() => setMobileMenu(false)} />}
      <aside className={cn("fixed inset-y-0 left-0 z-50 w-60 bg-[#0f0f10] border-r border-zinc-800/50 transform transition-transform duration-300 md:hidden flex flex-col", mobileMenu ? "translate-x-0" : "-translate-x-full")}>
        <div className="h-14 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
            </div>
            <span className="text-[15px] font-bold text-white">CRM Hub</span>
          </div>
          <button onClick={() => setMobileMenu(false)} className="p-2 rounded-lg hover:bg-zinc-800/50 text-zinc-500"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto py-3 space-y-5">
          {navSections.map(section => (
            <div key={section.label}>
              <div className="px-5 mb-1.5"><span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.12em]">{section.label}</span></div>
              <div className="space-y-0.5 px-2">
                {section.items.map(item => {
                  const ItemIcon = item.icon;
                  return (
                    <Link key={item.label} href={makePath(workspaceSlug, businessSlug ?? null, item.href)} onClick={() => setMobileMenu(false)}
                      className={cn("flex items-center gap-3 h-9 px-3 rounded-lg text-[13px] font-medium transition-all", isActive(item.href) ? "bg-violet-500/10 text-violet-400" : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200")}>
                      <ItemIcon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.5} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center justify-between px-5 border-b border-zinc-800/50 bg-[#0a0a0b] shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenu(true)} className="md:hidden p-2 rounded-lg hover:bg-zinc-800/40 text-zinc-400">
              <Menu className="w-5 h-5" />
            </button>
            <button onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { metaKey: true, key: "k" }))}
              className="hidden md:flex items-center gap-2.5 h-9 px-4 rounded-xl bg-zinc-900/80 border border-zinc-800/50 text-sm text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition-all">
              <Search className="w-4 h-4" strokeWidth={1.5} />
              <span>Search anything...</span>
              <kbd className="ml-2 text-[11px] font-medium text-zinc-500 bg-zinc-800/80 rounded-md px-1.5 py-0.5 border border-zinc-700/50">⌘K</kbd>
            </button>

            {/* Business Switcher */}
            <div className="relative hidden md:block" ref={bizRef}>
              <button onClick={() => setBizOpen(v => !v)}
                className="flex items-center gap-2 h-9 px-3 rounded-xl bg-zinc-900/60 border border-zinc-800/50 text-[13px] text-zinc-300 hover:border-zinc-700 hover:text-zinc-100 transition-all">
                <Building className="w-4 h-4 text-zinc-500" />
                <span className="max-w-[140px] truncate">{currentBusiness?.name ?? "Select business"}</span>
                <ChevronDown className={cn("w-3.5 h-3.5 text-zinc-500 transition-transform", bizOpen && "rotate-180")} />
              </button>
              {bizOpen && (
                <div className="absolute left-0 mt-2 w-56 rounded-xl overflow-hidden z-50 border border-zinc-800/80 bg-zinc-900/95 backdrop-blur-xl shadow-2xl shadow-black/50 py-1">
                  <div className="px-3 py-2 border-b border-zinc-800/50">
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Businesses</span>
                  </div>
                  {businesses.map(b => (
                    <button
                      key={b.id}
                      onClick={() => {
                        setBizOpen(false);
                        if (b.slug !== currentBusiness?.slug) {
                          // Navigate to same workspace under new business, or default to first workspace in business
                          router.push(`/${b.slug}/${workspaceSlug}/dashboard`);
                        }
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-[13px] flex items-center gap-2 transition-colors",
                        b.id === currentBusiness?.id ? "bg-violet-500/10 text-violet-300" : "text-zinc-300 hover:bg-zinc-800/40"
                      )}
                    >
                      <div className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                        {b.name[0]}
                      </div>
                      <span className="truncate">{b.name}</span>
                      {b.id === currentBusiness?.id && <span className="ml-auto text-[10px] text-violet-400">●</span>}
                    </button>
                  ))}
                  {businesses.length === 0 && (
                    <div className="px-3 py-4 text-center text-[12px] text-zinc-500">No businesses yet</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href={makePath(workspaceSlug, businessSlug ?? null, "/contacts")}
              className="hidden md:flex items-center gap-2 h-9 px-4 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-[13px] font-semibold hover:from-violet-400 hover:to-indigo-500 hover:shadow-lg hover:shadow-violet-500/25 transition-all">
              <Plus className="w-4 h-4" />
              Add Contact
            </Link>

            <div className="relative" ref={notifRef}>
              <button onClick={() => setNotifOpen(v => !v)}
                className="relative w-9 h-9 rounded-xl flex items-center justify-center hover:bg-zinc-800/40 text-zinc-400 hover:text-zinc-200 transition-all">
                <Bell className="w-[18px] h-[18px]" strokeWidth={1.5} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-[10px] font-bold text-white bg-red-500 shadow-sm">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl overflow-hidden z-50 border border-zinc-800/80 bg-zinc-900/95 backdrop-blur-xl shadow-2xl shadow-black/50">
                  <div className="px-4 py-3 border-b border-zinc-800/50 flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-white">Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={async () => { await Promise.all(notifications.filter(n => !n.read).map(n => markRead(n.id))); setNotifications(prev => prev.map(n => ({ ...n, read: true }))); }}
                        className="text-[11px] font-medium text-violet-400 hover:text-violet-300">Mark all read</button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 && <div className="px-4 py-8 text-center text-[13px] text-zinc-500">No notifications</div>}
                    {notifications.map(n => (
                      <div key={n.id} onClick={() => { if (!n.read) markRead(n.id); }}
                        className={cn("px-4 py-3 border-b border-zinc-800/30 cursor-pointer hover:bg-zinc-800/30 transition-colors", !n.read && "bg-zinc-800/20")}>
                        <div className="flex items-start gap-3">
                          <span className={cn("mt-1.5 w-2 h-2 rounded-full shrink-0", n.read ? "bg-zinc-700" : "bg-violet-400")} />
                          <div className="min-w-0">
                            <div className="text-[13px] font-medium text-zinc-200">{n.title ?? n.type}</div>
                            <div className="text-[12px] text-zinc-500 mt-0.5">{n.body}</div>
                            <div className="text-[10px] text-zinc-600 mt-1">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={userRef}>
              <button onClick={() => setUserMenu(v => !v)}
                className="flex items-center gap-2.5 hover:bg-zinc-800/40 rounded-xl px-2 py-1.5 transition-all ml-1">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-700 flex items-center justify-center text-[12px] font-semibold text-white border border-zinc-600/50">
                  {(user?.name?.[0] ?? "U").toUpperCase()}
                </div>
                <div className="hidden md:block leading-tight text-left">
                  <div className="text-[13px] font-medium text-zinc-200">{user?.name ?? "User"}</div>
                  <div className="text-[11px] text-zinc-500">{user?.role ?? "Member"}</div>
                </div>
                <ChevronDown className="hidden md:block w-3.5 h-3.5 text-zinc-500" />
              </button>

              {userMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl overflow-hidden z-50 border border-zinc-800/80 bg-zinc-900/95 backdrop-blur-xl shadow-2xl shadow-black/50 py-1">
                  <button onClick={() => { router.push(makePath(workspaceSlug, businessSlug ?? null, "/settings")); setUserMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-[13px] text-zinc-300 hover:bg-zinc-800/40 transition-colors">Settings</button>
                  {user?.role === "owner" && (
                    <button onClick={() => { router.push("/owner/dashboard"); setUserMenu(false); }}
                      className="w-full text-left px-4 py-2.5 text-[13px] text-violet-300 hover:bg-violet-500/10 transition-colors">Owner Dashboard</button>
                  )}
                  <button onClick={() => { setUserMenu(false); logout(); }}
                    className="w-full text-left px-4 py-2.5 text-[13px] text-red-400 hover:bg-red-500/10 transition-colors">Log out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#0a0a0b]">
          <div className="p-6 md:p-8">{children}</div>
        </main>
        <CommandPalette />
      </div>
    </div>
  );
}
