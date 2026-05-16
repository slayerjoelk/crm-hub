"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { AppShell } from "@/components/crm/app-shell";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const workspaceSlug = params?.workspace as string;
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Detect business slug from path: /:businessSlug/:workspaceSlug/...
  const businessSlug = (() => {
    if (!pathname || !workspaceSlug) return null;
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length >= 2 && segments[1] === workspaceSlug) {
      return segments[0];
    }
    return null;
  })();

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) { router.push("/login"); return; }
        const json = await res.json();
        setUser(json.data);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    check();
  }, [router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#08090a]">
        <div className="w-8 h-8 border-2 border-[#5e6ad2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AppShell workspaceSlug={workspaceSlug ?? "default"} businessSlug={businessSlug} user={user}>
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </AppShell>
  );
}
