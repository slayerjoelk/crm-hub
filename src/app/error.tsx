"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("App error:", error); }, [error]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto"><AlertTriangle className="w-8 h-8"/></div>
        <h1 className="text-xl font-bold text-white">Something went wrong</h1>
        <p className="text-sm text-slate-500">{error.message || "An unexpected error occurred."}</p>
        {error.digest && <p className="text-xs text-slate-600 font-mono">ID: {error.digest}</p>}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button onClick={reset} className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 flex items-center gap-2"><RefreshCw className="w-4 h-4"/> Try again</button>
          <Link href="/" className="h-9 px-4 rounded-lg border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 flex items-center gap-2"><Home className="w-4 h-4"/> Home</Link>
        </div>
      </div>
    </div>
  );
}
