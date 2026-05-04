import Link from "next/link";
import { Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="text-6xl font-black text-slate-800">404</div>
        <h1 className="text-xl font-bold text-white">Page not found</h1>
        <p className="text-sm text-slate-500">The page you are looking for does not exist or has been moved.</p>
        <Link href="/" className="inline-flex h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 items-center gap-2"><Search className="w-4 h-4"/> Go to Dashboard</Link>
      </div>
    </div>
  );
}
