
"use client";

import { useEffect, useState } from "react";
import { Search, Filter, Plus, MoreHorizontal } from "lucide-react";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  useEffect(() => {
    fetch(`/api/contacts?q=${encodeURIComponent(search)}`).then(r => r.json()).then(r => setContacts(r.data ?? []));
  }, [search]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Contacts</h1><p className="text-slate-500 text-sm mt-1">Manage your leads and customers</p></div>
        <button className="flex items-center gap-2 h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors">
          <Plus className="w-4 h-4" /> New Contact
        </button>
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
        </div>
        <button className="h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-sm flex items-center gap-2 hover:bg-slate-800">
          <Filter className="w-4 h-4" /> Filters
        </button>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-800/40">
              <tr>
                {["Name","Email","Phone","Lifecycle","Lead Status","Last Activity",""].map((h,i) => <th key={i} className="px-4 py-3 font-medium whitespace-nowrap">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {contacts.map(c => (
                <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-semibold">
                        {(c.firstName?.[0] ?? "") + (c.lastName?.[0] ?? "")}
                      </div>
                      <div><div className="font-medium text-slate-200">{c.firstName} {c.lastName}</div><div className="text-xs text-slate-500">{c.jobTitle ?? "-"}</div></div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{c.email ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-400">{c.phone ?? "-"}</td>
                  <td className="px-4 py-3"><span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">{c.lifecycleStage}</span></td>
                  <td className="px-4 py-3 text-slate-400">{c.leadStatus}</td>
                  <td className="px-4 py-3 text-slate-500">{c.lastActivityAt ? new Date(c.lastActivityAt).toLocaleDateString() : "-"}</td>
                  <td className="px-4 py-3"><button className="p-1 rounded hover:bg-slate-800 text-slate-500"><MoreHorizontal className="w-4 h-4"/></button></td>
                </tr>
              ))}
              {contacts.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-600">No contacts found. <button className="mt-1 text-sm text-emerald-400 hover:underline inline">Create your first contact</button></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
