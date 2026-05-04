"use client";

import { useEffect, useState } from "react";
import { Search, Mail, Phone, CalendarDays, FileText, CheckSquare, TrendingUp, TrendingDown, User, Building2, MessageCircle, Plug, Activity as ActivityIcon, Plus } from "lucide-react";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  email: <Mail className="w-4 h-4" />,
  call: <Phone className="w-4 h-4" />,
  meeting: <CalendarDays className="w-4 h-4" />,
  note: <FileText className="w-4 h-4" />,
  task: <CheckSquare className="w-4 h-4" />,
  deal_created: <TrendingUp className="w-4 h-4" />,
  deal_stage_change: <TrendingUp className="w-4 h-4" />,
  deal_won: <TrendingUp className="w-4 h-4" />,
  deal_lost: <TrendingDown className="w-4 h-4" />,
  contact_created: <User className="w-4 h-4" />,
  contact_updated: <User className="w-4 h-4" />,
  company_created: <Building2 className="w-4 h-4" />,
  company_updated: <Building2 className="w-4 h-4" />,
  sms: <MessageCircle className="w-4 h-4" />,
  whatsapp: <MessageCircle className="w-4 h-4" />,
  integration: <Plug className="w-4 h-4" />,
};

const TYPE_COLORS: Record<string, string> = {
  email: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  call: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  meeting: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  note: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  task: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  deal_created: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  deal_stage_change: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  deal_won: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  deal_lost: "bg-red-500/10 text-red-400 border-red-500/20",
  contact_created: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  contact_updated: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  company_created: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  company_updated: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  sms: "bg-green-500/10 text-green-400 border-green-500/20",
  whatsapp: "bg-green-500/10 text-green-400 border-green-500/20",
  integration: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20",
};

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`/api/activities?q=${encodeURIComponent(search)}`).then(r => r.json()).then(r => setActivities(r.data ?? []));
  }, [search]);

  // Group by date
  const grouped: Record<string, any[]> = {};
  activities.forEach(a => {
    const key = formatDateLabel(a.createdAt);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(a);
  });
  const dateKeys = Object.keys(grouped);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Activities</h1>
          <p className="text-slate-500 text-sm mt-1">All interactions and events across your workspace</p>
        </div>
        <button className="flex items-center gap-2 h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors">
          <Plus className="w-4 h-4" /> Log Activity
        </button>
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" placeholder="Search activities..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
        </div>
      </div>

      <div className="space-y-6">
        {dateKeys.map(date => (
          <div key={date}>
            <div className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur py-2 mb-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{date}</h3>
            </div>
            <div className="relative pl-6">
              {/* Timeline line */}
              <div className="absolute left-2 top-0 bottom-0 w-px bg-slate-800"></div>
              <div className="space-y-3">
                {grouped[date].map(a => {
                  const icon = TYPE_ICONS[a.type] ?? <ActivityIcon className="w-4 h-4" />;
                  const color = TYPE_COLORS[a.type] ?? "bg-slate-500/10 text-slate-400 border-slate-500/20";
                  return (
                    <div key={a.id} className="relative flex gap-3 items-start">
                      {/* Dot */}
                      <div className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center z-10 ${color}`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></div>
                      </div>
                      <div className="flex-1 rounded-xl border border-slate-800 bg-slate-900/60 p-3 hover:bg-slate-800/40 transition-colors">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${color}`}>
                            {icon}
                            {a.type.replace(/_/g, " ")}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {new Date(a.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {a.durationMinutes && (
                            <span className="text-[11px] text-slate-500">{a.durationMinutes}m</span>
                          )}
                        </div>
                        <div className="text-sm text-slate-200">
                          {a.subject ? <span className="font-medium">{a.subject}</span> : a.body}
                        </div>
                        {a.subject && a.body && <div className="text-xs text-slate-500 mt-1">{a.body}</div>}
                        <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
                          {a.contactId && <span>👤 Contact</span>}
                          {a.dealId && <span>💰 Deal</span>}
                          {a.companyId && <span>🏢 Company</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-12 text-center">
            <div className="text-3xl mb-2">📋</div>
            <div className="text-slate-200 font-medium">No activities yet.</div>
            <button className="mt-2 text-sm text-emerald-400 hover:underline">Log your first activity</button>
          </div>
        )}
      </div>
    </div>
  );
}
