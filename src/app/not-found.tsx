"use client";

import Link from "next/link";
import { Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "#08090a" }}>
      <div className="max-w-md w-full text-center space-y-5">
        <div className="text-6xl font-black" style={{ color: "#0f1011" }}>404</div>
        <h1 className="text-xl font-bold text-[#f7f8f8]">Page not found</h1>
        <p className="text-sm" style={{ color: "#8a8f98" }}>The page you are looking for does not exist or has been moved.</p>
        <Link href="/portfolio" className="inline-flex h-9 px-4 rounded-lg text-white text-sm font-medium items-center gap-2 transition-colors" style={{ backgroundColor: "#5e6ad2", fontWeight: 510 }} onMouseEnter={(e)=>(e.currentTarget.style.backgroundColor="#828fff")} onMouseLeave={(e)=>(e.currentTarget.style.backgroundColor="#5e6ad2")}><Search className="w-4 h-4"/> Go to your companies</Link>
      </div>
    </div>
  );
}
