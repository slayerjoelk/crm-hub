
"use client";

import { useEffect, useState } from "react";
import { DollarSign, Calendar, MoreHorizontal, Plus } from "lucide-react";

export default function DealsPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [pipeline, setPipeline] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState<string|null>(null);

  useEffect(() => {
    async function load() {
      const [dRes, pRes] = await Promise.all([fetch("/api/deals"), fetch("/api/pipelines")]);
      const d = await dRes.json(); const p = await pRes.json();
      setDeals(d.data ?? []); setPipeline((p.data ?? [])[0] ?? null); setLoading(false);
    }
    load();
  }, []);

  async function dropDeal(stageId: string) {
    if (!dragging) return;
    const deal = deals.find(x => x.id === dragging);
    if (!deal || deal.stageId === stageId) return;
    await fetch(`/api/deals/${deal.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ stageId }) });
    setDeals(prev => prev.map(d => d.id === deal.id ? { ...d, stageId } : d));
    setDragging(null);
  }

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"/></div>;

  const stages = pipeline?.stages ?? [];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div><h1 className="text-2xl font-bold text-white">Deals</h1><p className="text-slate-500 text-sm mt-1">Manage your sales pipeline</p></div>
        <button className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors"><Plus className="w-4 h-4 inline mr-1"/> Add Deal</button>
      </div>
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-2">
        <div className="flex gap-4 min-w-max h-full">
          {stages.map((stage: any) => {
            const stageDeals = deals.filter((d:any) => d.stageId === stage.id);
            const total = stageDeals.reduce((s:number,d:any) => s + (d.value ?? 0), 0);
            return (
              <div key={stage.id} className="w-80 flex flex-col rounded-xl border border-slate-800 bg-slate-900/60 h-full"
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={() => dropDeal(stage.id)}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-800/40">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                    <span className="text-sm font-semibold text-slate-200">{stage.name}</span>
                    <span className="text-xs text-slate-500 bg-slate-700/40 px-1.5 py-0.5 rounded-full">{stageDeals.length}</span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium">{total > 0 ? "$"+total.toLocaleString() : ""}</div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {stageDeals.map((deal: any) => (
                    <div key={deal.id} draggable onDragStart={() => setDragging(deal.id)}
                      className={`p-3 rounded-lg border border-slate-700/50 bg-slate-800/40 cursor-grab active:cursor-grabbing hover:border-slate-600 transition-all ${dragging === deal.id ? "opacity-30" : ""}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-sm font-medium text-slate-200 truncate">{deal.name}</div>
                        <button className="p-0.5 rounded hover:bg-slate-700 text-slate-600"><MoreHorizontal className="w-3.5 h-3.5"/></button>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><DollarSign className="w-3 h-3"/>{deal.value ? "$"+deal.value.toLocaleString() : "-"}</span>
                        {deal.expectedCloseDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/>{new Date(deal.expectedCloseDate).toLocaleDateString(undefined,{month:"short",day:"numeric"})}</span>}
                      </div>
                    </div>
                  ))}
                  {stageDeals.length === 0 && <div className="flex flex-col items-center justify-center py-8 text-slate-600 text-sm">Drop deal here</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
