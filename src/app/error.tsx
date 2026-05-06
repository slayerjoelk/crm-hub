"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("App error:", error); }, [error]);
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "#08090a" }}>
      <div className="max-w-md w-full text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl text-[#ef4444] flex items-center justify-center mx-auto" style={{ backgroundColor: "rgba(239,68,68,0.10)" }}><AlertTriangle className="w-8 h-8"/></div>
        <h1 className="text-xl font-bold text-[#f7f8f8]">Something went wrong</h1>
        <p className="text-sm" style={{ color: "#62666d" }}>{error.message || "An unexpected error occurred."}</p>
        {error.digest && <p className="text-xs font-mono" style={{ color: "#62666d" }}>ID: {error.digest}</p>}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button onClick={reset} className="h-9 px-4 rounded-lg text-white text-sm font-medium flex items-center gap-2 transition-colors" style={{ backgroundColor: "#5e6ad2", fontWeight: 510 }} onMouseEnter={(e)=>(e.currentTarget.style.backgroundColor="#828fff")} onMouseLeave={(e)=>(e.currentTarget.style.backgroundColor="#5e6ad2")}><RefreshCw className="w-4 h-4"/> Try again</button>
          <Link href="/" className="h-9 px-4 rounded-lg text-[#d0d6e0] text-sm font-medium flex items-center gap-2 transition-colors" style={{ border: "1px solid rgba(255,255,255,0.06)" }} onMouseEnter={(e)=>(e.currentTarget.style.backgroundColor="rgba(255,255,255,0.02)")} onMouseLeave={(e)=>(e.currentTarget.style.backgroundColor="transparent")}><Home className="w-4 h-4"/> Home</Link>
        </div>
      </div>
    </div>
  );
}
