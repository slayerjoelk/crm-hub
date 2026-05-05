"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useParams } from "next/navigation";
import { User, Users, Puzzle, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "", label: "General", icon: SlidersHorizontal },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/team", label: "Team", icon: Users },
  { href: "/integrations", label: "Integrations", icon: Puzzle },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { workspace } = useParams<{ workspace: string }>();
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-1">
        {TABS.map(tab => {
          const fullPath = `/${workspace}/settings${tab.href}`;
          const isActive = pathname === fullPath || (tab.href === "" && pathname === `/${workspace}/settings`);
          return (
            <Link
              key={tab.href}
              href={fullPath}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-[1px]",
                isActive
                  ? "text-emerald-400 border-emerald-500"
                  : "text-slate-400 border-transparent hover:text-slate-200 hover:border-slate-700"
              )}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </Link>
          );
        })}
      </div>
      <div>{children}</div>
    </div>
  );
}
