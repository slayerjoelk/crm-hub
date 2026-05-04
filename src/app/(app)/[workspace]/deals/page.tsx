"use client";

import { useEffect, useState } from "react";
import { DollarSign, Calendar, MoreHorizontal, Plus, X, Building2 } from "lucide-react";

export default function DealsPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [pipeline, setPipeline] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState<string|null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", amount: "", currency: "USD", stageId: "", pipelineId: "", contactId: "", expectedCloseDate: "", description: "" });
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    async function load() {
      const [dRes, pRes, cRes] = await Promise.all([fetch("/api/deals"), fetch("/api/pipelines"), fetch("/api/contacts")]);
      const d = await dRes.json(); const p = await pRes.json(); const c = await cRes.json();
      const plList = p.data ?? [];
      setDeals(d.data ?? []); setPipelines(plList); setContacts(c.data ?? []);
      setPipeline(plList[0] ?? null); setLoading(false);
      if (plList[0]?.stages?.[0]) setForm(prev => ({ ...prev, stageId: plList[0].stages[0].id, pipelineId: plList[0].id }));
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

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(null);
    const body: any = {
      name: form.name,
      amount: Number(form.amount) || 0,
      currency: form.currency || "USD",
      stageId: form.stageId,
      pipelineId: form.pipelineId || pipeline?.id,
      description: form.description || undefined,
      contactId: form.contactId || undefined,
      expectedCloseDate: form.expectedCloseDate || undefined,
    };
    const res = await fetch("/api/deals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json().catch(() => ({ error: "Unknown" }));
    setSaving(false);
    if (!res.ok) { setError(json.error || "Failed to create deal"); return; }
    setShowModal(false);
    setForm({ name: "", amount: "", currency: "USD", stageId: pipeline?.stages?.[0]?.id ?? "", pipelineId: pipeline?.id ?? "", contactId: "", expectedCloseDate: "", description: "" });
    setDeals(prev => [json.data, ...prev]);
  }

  const stages = pipeline?.stages ?? [];
  const inputCls = "w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/60";
  const labelCls = "block text-xs font-medium text-slate-400 mb-1";

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"/></div>;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div><h1 className="text-2xl font-bold text-white">Deals</h1><p className="text-slate-500 text-sm mt-1">Manage your sales pipeline</p></div>
        <button onClick={() => setShowModal(true)} className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors"><Plus className="w-4 h-4 inline mr-1"/> Add Deal</button>
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} onKeyDown={(e) => e.key==="Escape" && setShowModal(false)}>
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center"><Building2 className="w-4 h-4"/></div>
                <div><h2 className="text-sm font-semibold text-white">Add Deal</h2><p className="text-xs text-slate-500">New opportunity</p></div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-4 h-4"/></button>
            </div>
            <form onSubmit={save} className="p-5 space-y-4">
              {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2">{error}</div>}
              <div><label className={labelCls}>Deal name *</label><input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} className={inputCls} placeholder="Enterprise plan - Acme" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Amount *</label><input type="number" min="0" value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})} className={inputCls} placeholder="5000" required /></div>
                <div><label className={labelCls}>Currency</label>
                  <select value={form.currency} onChange={e=>setForm({...form, currency:e.target.value})} className={`${inputCls} appearance-none`}>
                    {["USD","EUR","GBP","ZAR","CAD","AUD"].map(c=> <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Stage</label>
                  <select value={form.stageId} onChange={e=>setForm({...form, stageId:e.target.value})} className={`${inputCls} appearance-none`} required>
                    {stages.map((s:any) => <option key={s.id} value={s.id} className="bg-slate-900">{s.name}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>Pipeline</label>
                  <select value={form.pipelineId} onChange={e=>setForm({...form, pipelineId:e.target.value})} className={`${inputCls} appearance-none`} required>
                    <option value="" className="bg-slate-900">-- Select --</option>
                    {pipelines.map((p:any) => <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Related contact</label>
                  <select value={form.contactId} onChange={e=>setForm({...form, contactId:e.target.value})} className={`${inputCls} appearance-none`}>
                    <option value="" className="bg-slate-900">-- Optional --</option>
                    {contacts.map((c:any) => <option key={c.id} value={c.id} className="bg-slate-900">{c.firstName} {c.lastName}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>Expected close date</label><input type="date" value={form.expectedCloseDate} onChange={e=>setForm({...form, expectedCloseDate:e.target.value})} className={`${inputCls} appearance-none`} /></div>
              </div>
              <div><label className={labelCls}>Description</label><textarea value={form.description} onChange={e=>setForm({...form, description:e.target.value})} className={`${inputCls} h-20 py-2 resize-none`} placeholder="Additional details about this deal..." rows={3} /></div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="h-9 px-4 rounded-lg border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors disabled:opacity-50 flex items-center gap-2">
                  {saving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>} Add Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
