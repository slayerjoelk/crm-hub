"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth()+1, 0); }
function addDays(d: Date, n: number) { const r=new Date(d); r.setDate(r.getDate()+n); return r; }
function isSameDay(a: Date, b: Date) { return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
function formatDate(d: Date) { return d.toISOString().split("T")[0]; }

export type CalendarTask = {
  id: string;
  title: string;
  status: string;
  priority?: string;
  dueDate?: string;
};

export function TaskCalendar({ tasks, onDateClick, onTaskClick }: {
  tasks: CalendarTask[];
  onDateClick?: (date: Date) => void;
  onTaskClick?: (task: CalendarTask) => void;
}) {
  const [view, setView] = useState<"month"|"week">("month");
  const [cursor, setCursor] = useState(new Date());

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const calendarStart = addDays(monthStart, -monthStart.getDay());
  const weeks = useMemo(() => {
    const rows: Date[][] = [];
    let day = calendarStart;
    for (let w = 0; w < 6; w++) {
      const row: Date[] = [];
      for (let d = 0; d < 7; d++) { row.push(day); day = addDays(day, 1); }
      rows.push(row);
    }
    return rows;
  }, [calendarStart.getMonth()]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, CalendarTask[]> = {};
    tasks.forEach(t => {
      if (!t.dueDate) return;
      const key = t.dueDate.split("T")[0];
      (map[key] = map[key] || []).push(t);
    });
    return map;
  }, [tasks]);

  const today = new Date();
  const inMonth = (d: Date) => d.getMonth() === cursor.getMonth();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={()=>setCursor(prev=>new Date(prev.getFullYear(), prev.getMonth()-1, 1))} className="p-1.5 rounded-md hover:bg-[#191a1b] text-[#8a8f98]"><ChevronLeft className="w-4 h-4"/></button>
          <h2 className="text-base font-semibold text-[#d0d6e0] w-40 text-center">{cursor.toLocaleDateString("en-US",{month:"long",year:"numeric"})}</h2>
          <button onClick={()=>setCursor(prev=>new Date(prev.getFullYear(), prev.getMonth()+1, 1))} className="p-1.5 rounded-md hover:bg-[#191a1b] text-[#8a8f98]"><ChevronRight className="w-4 h-4"/></button>
        </div>
        <div className="flex rounded-lg border border-white/[0.06] overflow-hidden bg-[#0f1011]">
          {(["month","week"] as const).map(v => (
            <button key={v} onClick={()=>setView(v)} className={`px-3 py-1.5 text-xs font-medium capitalize ${view===v ? "bg-[#10b981]/[0.12] text-[#10b981]" : "text-[#8a8f98] hover:text-[#8a8f98]"}`}>{v}</button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-[#0f1011] overflow-hidden">
        <div className="grid grid-cols-7 border-b border-white/[0.06] bg-[#191a1b]/40">
          {DAYS.map(d => <div key={d} className="py-2 text-xs font-medium text-[#62666d] text-center">{d}</div>)}
        </div>
        <div className="divide-y divide-slate-800">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 divide-x divide-slate-800">
              {week.map(day => {
                const key = formatDate(day);
                const dayTasks = tasksByDate[key] || [];
                const isToday = isSameDay(day, today);
                return (
                  <div key={key} onClick={()=>onDateClick?.(day)}
                    className={`min-h-[90px] p-1.5 cursor-pointer transition-colors hover:bg-[#191a1b]/30 ${inMonth(day) ? "" : "opacity-40"} ${isToday ? "ring-1 ring-inset ring-emerald-500/30 bg-[#5e6ad2]/5" : ""}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs w-5 h-5 flex items-center justify-center rounded-full ${isToday ? "bg-[#5e6ad2] text-[#08090a] font-semibold" : "text-[#8a8f98]"}`}>{day.getDate()}</span>
                      {dayTasks.length > 0 && <span className="text-[10px] text-[#62666d]">{dayTasks.length}</span>}
                    </div>
                    <div className="space-y-1">
                      {dayTasks.slice(0,3).map(t => (
                        <div key={t.id} onClick={(e)=>{ e.stopPropagation(); onTaskClick?.(t); }}
                          className={`px-1.5 py-0.5 rounded text-[11px] leading-tight truncate cursor-pointer ${
                            t.status==="done" ? "bg-[#10b981]/[0.12] text-[#10b981]" :
                            t.priority==="critical" ? "bg-red-500/10 text-red-400" :
                            t.priority==="high" ? "bg-amber-500/10 text-amber-400" :
                            "bg-[#191a1b] text-[#8a8f98]"
                          }`}>
                          {t.title}
                        </div>
                      ))}
                      {dayTasks.length > 3 && <div className="text-[10px] text-[#62666d] px-1.5">+{dayTasks.length-3} more</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
