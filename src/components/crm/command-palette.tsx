"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowRight, Command, Contact, Building2, Briefcase, CheckSquare, Tag, Settings, Activity, Mail, BarChart3, Users, FolderKanban, FileText, Zap, Sparkles } from "lucide-react";

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: any;
  shortcut?: string;
  action: () => void;
  category: string;
  keywords?: string[];
}

function useCommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { workspace } = useParams<{ workspace: string }>();

  const navigate = useCallback((path: string) => {
    router.push(`/${workspace}${path}`);
    setOpen(false);
  }, [router, workspace]);

  const commands: CommandItem[] = [
    // Navigation
    { id: "nav-dashboard", title: "Dashboard", subtitle: "Overview & analytics", icon: BarChart3, shortcut: "G D", category: "Navigation", action: () => navigate("/dashboard") },
    { id: "nav-contacts", title: "Contacts", subtitle: "All contacts & leads", icon: Contact, shortcut: "G C", category: "Navigation", action: () => navigate("/contacts") },
    { id: "nav-companies", title: "Companies", subtitle: "Organizations & accounts", icon: Building2, shortcut: "G O", category: "Navigation", action: () => navigate("/companies") },
    { id: "nav-deals", title: "Deals", subtitle: "Pipeline & opportunities", icon: Briefcase, shortcut: "G P", category: "Navigation", action: () => navigate("/deals") },
    { id: "nav-tasks", title: "Tasks", subtitle: "Todos & follow-ups", icon: CheckSquare, shortcut: "G T", category: "Navigation", action: () => navigate("/tasks") },
    { id: "nav-activities", title: "Activities", subtitle: "Timeline & history", icon: Activity, shortcut: "G A", category: "Navigation", action: () => navigate("/activities") },
    { id: "nav-emails", title: "Emails", subtitle: "Inbox & sequences", icon: Mail, shortcut: "G E", category: "Navigation", action: () => navigate("/emails") },
    { id: "nav-pipelines", title: "Pipelines", subtitle: "Stages & workflows", icon: FolderKanban, shortcut: "G L", category: "Navigation", action: () => navigate("/pipelines") },
    { id: "nav-sequences", title: "Sequences", subtitle: "Automated outreach", icon: Zap, shortcut: "G S", category: "Navigation", action: () => navigate("/sequences") },
    { id: "nav-analytics", title: "Analytics", subtitle: "Reports & insights", icon: BarChart3, shortcut: "G N", category: "Navigation", action: () => navigate("/analytics") },
    // Quick Actions
    { id: "qa-contact", title: "Create Contact", subtitle: "Add a new contact", icon: Contact, shortcut: "N C", category: "Create", action: () => navigate("/contacts?create=1") },
    { id: "qa-company", title: "Create Company", subtitle: "Add a new company", icon: Building2, shortcut: "N O", category: "Create", action: () => navigate("/companies?create=1") },
    { id: "qa-deal", title: "Create Deal", subtitle: "Add a new deal", icon: Briefcase, shortcut: "N D", category: "Create", action: () => navigate("/deals?create=1") },
    { id: "qa-task", title: "Create Task", subtitle: "Add a new task", icon: CheckSquare, shortcut: "N T", category: "Create", action: () => navigate("/tasks?create=1") },
    { id: "qa-email", title: "Compose Email", subtitle: "Send a new email", icon: Mail, shortcut: "N E", category: "Create", action: () => navigate("/emails?compose=1") },
    // Settings
    { id: "set-profile", title: "Profile Settings", subtitle: "Edit your profile", icon: Users, category: "Settings", action: () => navigate("/settings/profile") },
    { id: "set-team", title: "Team Members", subtitle: "Manage workspace team", icon: Users, category: "Settings", action: () => navigate("/settings/team") },
    { id: "set-fields", title: "Custom Fields", subtitle: "Configure custom properties", icon: FileText, category: "Settings", action: () => navigate("/settings/custom-fields") },
    { id: "set-integrations", title: "Integrations", subtitle: "Connect third-party tools", icon: Sparkles, category: "Settings", action: () => navigate("/settings/integrations") },
  ];

  const filtered = search.trim()
    ? commands.filter(c => {
        const q = search.toLowerCase();
        return (
          c.title.toLowerCase().includes(q) ||
          c.subtitle?.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.keywords?.some(k => k.toLowerCase().includes(q)) ||
          c.shortcut?.toLowerCase().replace(/\s/g, "").includes(q.replace(/\s/g, ""))
        );
      })
    : commands;

  // Group by category
  const grouped = filtered.reduce((acc: Record<string, CommandItem[]>, c) => {
    if (!acc[c.category]) acc[c.category] = [];
    acc[c.category].push(c);
    return acc;
  }, {});

  const flatItems = Object.values(grouped).flat();

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // Arrow navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected(s => Math.min(s + 1, flatItems.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected(s => Math.max(s - 1, 0));
      }
      if (e.key === "Enter" && flatItems[selected]) {
        e.preventDefault();
        flatItems[selected].action();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, flatItems, selected]);

  return { open, setOpen, search, setSearch, selected, setSelected, grouped, flatItems, inputRef };
}

export function CommandPalette() {
  const { open, setOpen, search, setSearch, selected, grouped, flatItems, inputRef } = useCommandPalette();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="fixed left-1/2 top-[15%] -translate-x-1/2 w-[640px] max-w-[90vw] bg-elevated border border-white/[0.08] rounded-xl shadow-[0_24px_80px_rgba(0,0,0,0.6)] z-50 overflow-hidden"
          >
            {/* Search bar */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]">
              <Search className="w-5 h-5 text-muted" strokeWidth={1.5} />
              <input
                ref={inputRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search commands, pages, actions..."
                className="flex-1 bg-transparent text-[15px] text-secondary placeholder-faint focus:outline-none"
                autoFocus
              />
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono text-faint bg-white/[0.04] border border-white/[0.06]">ESC</kbd>
              </div>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto py-2">
              {Object.entries(grouped).length === 0 ? (
                <div className="py-8 text-center">
                  <Search className="w-6 h-6 text-faint mx-auto mb-2" />
                  <p className="text-sm text-muted">No commands found</p>
                  <p className="text-[11px] text-faint mt-1">Try "contacts", "create", or "settings"</p>
                </div>
              ) : (
                Object.entries(grouped).map(([category, items]) => (
                  <div key={category}>
                    <div className="px-4 py-1.5 text-[11px] font-semibold text-faint uppercase tracking-wider">{category}</div>
                    <div className="px-2">
                      {items.map((item) => {
                        const idx = flatItems.indexOf(item);
                        const isSelected = idx === selected;
                        const Icon = item.icon;
                        return (
                          <motion.button
                            key={item.id}
                            onClick={item.action}
                            onMouseEnter={() => setSearch(s => { /* keep search */ return s; })}
                            className={[
                              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                              isSelected ? "bg-brand/10 border border-brand/20" : "hover:bg-white/[0.03] border border-transparent",
                            ].join(" ")}
                          >
                            <div className={["w-8 h-8 rounded-md flex items-center justify-center shrink-0", isSelected ? "bg-brand/15" : "bg-white/[0.04]"].join(" ")}>
                              <Icon className={["w-4 h-4", isSelected ? "text-brand" : "text-muted"].join(" ")} strokeWidth={1.5} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-[13px] font-medium text-secondary">{highlightMatch(item.title, search)}</div>
                              <div className="text-[11px] text-faint">{item.subtitle}</div>
                            </div>
                            {item.shortcut && (
                              <div className="flex items-center gap-0.5 shrink-0">
                                {item.shortcut.split(" ").map((k, i) => (
                                  <kbd key={i} className={["px-1 py-0.5 rounded text-[10px] font-mono border", isSelected ? "text-brand border-brand/20 bg-brand/5" : "text-faint border-white/[0.06] bg-white/[0.02]"].join(" ")}>{k}</kbd>
                                ))}
                              </div>
                            )}
                            {isSelected && <ArrowRight className="w-4 h-4 text-brand shrink-0" />}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.06] bg-white/[0.01]">
              <div className="flex items-center gap-3 text-[11px] text-faint">
                <span className="flex items-center gap-1"><kbd className="px-1 rounded border border-white/[0.06]">↑↓</kbd> Navigate</span>
                <span className="flex items-center gap-1"><kbd className="px-1 rounded border border-white/[0.06]">↵</kbd> Select</span>
              </div>
              <span className="text-[11px] text-faint">{flatItems.length} commands</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <span key={i} className="text-brand font-semibold">{part}</span>
      : part
  );
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$\u0026");
}
