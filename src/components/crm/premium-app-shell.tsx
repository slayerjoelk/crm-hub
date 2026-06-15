"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Building2, BarChart3, CheckSquare, Activity, Settings,
  Zap, Mail, FolderOpen, Upload, Tag, Crown, KanbanSquare,
  ChevronLeft, ChevronRight, Search, Bell, Plus, LogOut, Menu, X
} from "lucide-react";
import { cn } from "@/lib/utils";

const navSections = [
  {
    label: "CRM",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
      { label: "Contacts", icon: Users, href: "/contacts" },
      { label: "Companies", icon: Building2, href: "/companies" },
      { label: "Deals", icon: KanbanSquare, href: "/deals" },
      { label: "Pipelines", icon: BarChart3, href: "/pipelines" },
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

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

interface AppShellProps {
  children: React.ReactNode;
  workspaceName?: string;
  userName?: string;
  userRole?: string;
}

export function AppShell({ children, workspaceName = "Workspace", userName = "User", userRole = "member" }: AppShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <div className="min-h-screen bg-[#08090a] flex">
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 64 : 240 }}
        className={cn(
          "fixed left-0 top-0 h-screen bg-[#08090a] border-r border-white/[0.06] z-50 transition-all duration-300",
          "lg:flex flex-col hidden"
        )}
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5e6ad2] to-[#828fff] flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[#f7f8f8] font-medium"
              >
                CRM Hub
              </motion.span>
            )}
          </div>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-16 w-6 h-6 rounded-full bg-[#191a1b] border border-white/[0.06] flex items-center justify-center hover:bg-[#5e6ad2] transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3 text-[#8a8f98]" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-[#8a8f98]" />
          )}
        </button>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {navSections.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <h3 className="px-3 text-[10px] font-medium text-[#62666d] uppercase tracking-wider mb-2">
                  {section.label}
                </h3>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={`/${workspaceName}${item.href}`}
                      className={cn(
                        "flex items-center gap-3 px-3 h-8 rounded-lg transition-all duration-150",
                        active
                          ? "bg-[#5e6ad2]/10 text-[#5e6ad2] border-l-2 border-[#5e6ad2]"
                          : "text-[#8a8f98] hover:text-[#d0d6e0] hover:bg-white/[0.02]"
                      )}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {!collapsed && (
                        <span className="text-sm font-medium truncate">{item.label}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-white/[0.06]">
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5e6ad2] to-[#828fff] flex items-center justify-center">
              <span className="text-white text-xs font-medium">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#f7f8f8] truncate">{userName}</p>
                <p className="text-xs text-[#62666d] capitalize">{userRole}</p>
              </div>
            )}
            {!collapsed && (
              <button className="p-1.5 text-[#62666d] hover:text-[#ef4444] transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className={cn("flex-1 flex flex-col min-h-screen", collapsed ? "lg:ml-16" : "lg:ml-60")}>
        {/* Top Bar */}
        <header className="h-14 border-b border-white/[0.06] bg-[#08090a] flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-[#8a8f98] hover:text-[#d0d6e0]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 px-3 h-9 rounded-lg bg-[#0f1011] border border-white/[0.06] text-[#62666d] text-sm hover:border-white/[0.10] transition-colors"
              >
                <Search className="w-4 h-4" />
                <span>Search...</span>
                <kbd className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-white/[0.04] rounded">
                  ⌘K
                </kbd>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 text-[#8a8f98] hover:text-[#d0d6e0] transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ef4444]" />
            </button>
            <button className="hidden sm:flex items-center gap-2 px-3 h-9 rounded-lg bg-[#5e6ad2] text-white text-sm font-medium hover:bg-[#828fff] transition-colors">
              <Plus className="w-4 h-4" />
              <span>New</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-screen w-72 bg-[#08090a] border-r border-white/[0.06] z-50 lg:hidden"
          >
            <div className="h-14 flex items-center justify-between px-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5e6ad2] to-[#828fff] flex items-center justify-center">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <span className="text-[#f7f8f8] font-medium">CRM Hub</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-2 text-[#8a8f98]">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Mobile nav would go here - same as desktop */}
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
