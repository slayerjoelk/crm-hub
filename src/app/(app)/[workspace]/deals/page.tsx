"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, Calendar, MoreHorizontal, Plus, X, Building2, ChevronDown, User, Clock, LayoutGrid, List } from "lucide-react";
import { CsvExportButton } from "@/components/crm/csv-export-button";

export default function DealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<any[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [pipeline, setPipeline] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState<string|null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showPipelineMenu, setShowPipelineMenu] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban'|'list'>('kanban');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [form, setForm] = useState({ name: "", amount: "", currency: "USD", stageId: "", pipelineId: "", contactId: "", expectedCloseDate: "", description: "" });

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [dRes, pRes, cRes] = await Promise.all([fetch("/api/deals", { credentials: "include" }), fetch("/api/pipelines"), fetch("/api/contacts")]);
    const d = await dRes.json(); const p = await pRes.json(); const c = await cRes.json();
    const plList = p.data ?? [];
    const savedPipelineId = localStorage.getItem("crm_pipeline_id");
    const selected = plList.find((p: any) => p.id === savedPipelineId) || plList[0] || null;
    setDeals(d.data ?? []); setPipelines(plList); setContacts(c.data ?? []);
    selectPipeline(selected);
    setLoading(false);
  }

  function selectPipeline(p: any) {
    setPipeline(p);
    if (p?.id) localStorage.setItem("crm_pipeline_id", p.id);
    if (p?.stages?.[0]) setForm(prev => ({ ...prev, stageId: p.stages[0].id, pipelineId: p.id }));
  }

  async function dropDeal(stageId: string) {
    if (!dragging) return;
    const deal = deals.find(x => x.id === dragging);
    if (!deal || deal.stageId === stageId) return;
    await fetch(`/api/deals/${deal.id}`, { credentials: "include", method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ stageId }) });
    setDeals(prev => prev.map(d => d.id === deal.id ? { ...d, stageId, updatedAt: new Date().toISOString() } : d));
    setDragging(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(null);
    const body: any = { name: form.name, value: Number(form.amount)||0, currency: form.currency||"USD", stageId: form.stageId, pipelineId: form.pipelineId||pipeline?.id, description: form.description||undefined, primaryContactId: form.contactId||undefined, expectedCloseDate: form.expectedCloseDate||undefined };
    const res = await fetch("/api/deals", { credentials: "include", method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(body) });
    const json = await res.json().catch(()=>({error:"Unknown"}));
    setSaving(false);
    if (!res.ok) { setError(json.error||"Failed to create deal"); return; }
    setShowModal(false);
    setForm({ name:"", amount:"", currency:"USD", stageId: pipeline?.stages?.[0]?.id??"", pipelineId: pipeline?.id??"", contactId:"", expectedCloseDate:"", description:"" });
    setDeals(prev => [json.data, ...prev]);
  }

  function daysInStage(deal: any): number {
    if (!deal.updatedAt) return 0;
    const ms = Date.now() - new Date(deal.updatedAt).getTime();
    return Math.max(1, Math.floor(ms / 86400000));
  }

  function formatCurrency(v: number, c: string="USD"): string {
    return new Intl.NumberFormat("en-US", { style:"currency", currency: c, maximumFractionDigits: 0 }).format(v);
  }

  const stages = pipeline?.stages?.sort((a: any, b: any) => (a.displayOrder??0) - (b.displayOrder??0)) ?? [];
  const inputCls = "w-full h-9 px-3 rounded-md bg-[#0f1011] border border-white/[0.06] text-[13px] text-[#d0d6e0] placeholder-[#62666d] focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]/30 transition-all";
  const labelCls = "block text-[11px] font-semibold text-[#8a8f98] uppercase tracking-wider mb-1.5";

  const filteredDeals = pipeline ? deals.filter((d: any) => d.pipelineId === pipeline.id) : deals;
  const totalValue = filteredDeals.reduce((s, d) => s + (d.value??0), 0);

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-5 h-5 border-2 border-[#5e6ad2] border-t-transparent rounded-full animate-spin"/></div>;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold text-[#f7f8f8] tracking-tight">Deals</h1>
            <div className="relative">
              <button onClick={() => setShowPipelineMenu(!showPipelineMenu)} className="flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[12px] text-[#8a8f98] border border-white/[0.06] hover:border-white/[0.10] hover:text-[#d0d6e0] transition-all">
                <Building2 className="w-3 h-3" strokeWidth={1.5}/>
                {pipeline?.name ?? "Select Pipeline"}
                <ChevronDown className="w-3 h-3" strokeWidth={1.5}/>
              </button>
              {showPipelineMenu && (
                <div className="absolute left-0 top-full mt-1 w-56 rounded-lg overflow-hidden z-20 py-1 bg-[#191a1b] border border-white/[0.08] shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
                  {pipelines.map((p: any) => (
                    <button key={p.id} onClick={() => { selectPipeline(p); setShowPipelineMenu(false); }}
                      className={`w-full text-left px-3 py-2 text-[12px] hover:bg-white/[0.04] transition-colors flex items-center justify-between ${pipeline?.id===p.id ? "text-[#5e6ad2]" : "text-[#d0d6e0]"}`}>
                      {p.name}
                      <span className="text-[11px] text-[#62666d]">{deals.filter((d:any)=>d.pipelineId===p.id).length} deals</span>
                    </button>
                  ))}
                  {pipelines.length===0 && <div className="px-3 py-2 text-[12px] text-[#62666d]">No pipelines</div>}
                </div>
              )}
            </div>
          </div>
          <p className="text-[12px] text-[#62666d] mt-0.5">{filteredDeals.length} deals · {formatCurrency(totalValue)} total pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          <CsvExportButton
            data={filteredDeals.map(d => ({
              id: d.id, name: d.name || "", value: d.value || 0, currency: d.currency || "USD",
              stage: d.stageName || stages.find((s:any)=>s.id===d.stageId)?.name || "",
              pipeline: pipeline?.name || "", status: d.status || "", priority: d.priority || "",
              probability: d.probability || 0,
              expectedCloseDate: d.expectedCloseDate ? new Date(d.expectedCloseDate).toLocaleDateString() : "",
              primaryContact: d.primaryContactName || "", company: d.companyName || "",
              createdAt: d.createdAt ? new Date(d.createdAt).toLocaleString() : "",
            }))}
            filename={`deals_${new Date().toISOString().slice(0,10)}`}
            columns={[
              { key: "id", label: "ID" }, { key: "name", label: "Name" }, { key: "value", label: "Value" },
              { key: "currency", label: "Currency" }, { key: "stage", label: "Stage" }, { key: "pipeline", label: "Pipeline" },
              { key: "status", label: "Status" }, { key: "priority", label: "Priority" }, { key: "probability", label: "Probability" },
              { key: "expectedCloseDate", label: "Expected Close" }, { key: "primaryContact", label: "Primary Contact" },
              { key: "company", label: "Company" }, { key: "createdAt", label: "Created" },
            ]}
          />
          <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 h-8 px-3 rounded-md text-[12px] font-semibold text-[#f7f8f8] bg-[#5e6ad2] hover:bg-[#828fff] transition-colors">
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5}/> Add Deal
          </button>
          <div className="flex items-center rounded-md overflow-hidden border border-white/[0.06]">
            <button onClick={() => setViewMode('kanban')} className={`h-8 px-2.5 flex items-center gap-1 text-[11px] font-medium transition-colors ${viewMode==='kanban' ? 'bg-[#191a1b] text-[#f7f8f8]' : 'text-[#62666d] hover:text-[#d0d6e0] hover:bg-white/[0.04]'}`}>
              <LayoutGrid className="w-3.5 h-3.5" strokeWidth={1.5}/> Board
            </button>
            <button onClick={() => setViewMode('list')} className={`h-8 px-2.5 flex items-center gap-1 text-[11px] font-medium transition-colors ${viewMode==='list' ? 'bg-[#191a1b] text-[#f7f8f8]' : 'text-[#62666d] hover:text-[#d0d6e0] hover:bg-white/[0.04]'}`}>
              <List className="w-3.5 h-3.5" strokeWidth={1.5}/> List
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'kanban' ? (
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-2">
        <div className="flex gap-3 min-w-max h-full">
          {stages.map((stage: any) => {
            const stageDeals = filteredDeals.filter((d:any) => d.stageId === stage.id).sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            const total = stageDeals.reduce((s:number,d:any) => s + (d.value??0), 0);
            return (
              <div key={stage.id} className="w-72 flex flex-col rounded-lg h-full bg-white/[0.02] border border-white/[0.06]"
                onDragOver={(e)=>e.preventDefault()} onDrop={()=>dropDeal(stage.id)}>
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{backgroundColor:stage.color||"#62666d"}} />
                    <span className="text-[12px] font-medium text-[#d0d6e0]">{stage.name}</span>
                    <span className="text-[11px] text-[#62666d] bg-white/[0.04] px-1.5 py-0.5 rounded-full">{stageDeals.length}</span>
                  </div>
                  <div className="text-[11px] text-[#62666d] font-medium">{total>0 ? formatCurrency(total) : ""}</div>
                </div>
                <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
                  {stageDeals.map((deal: any) => {
                    const contact = contacts.find((c:any)=>c.id===deal.primaryContactId);
                    const dis = daysInStage(deal);
                    return (
                      <div key={deal.id} draggable onDragStart={()=>setDragging(deal.id)}
                        className={`p-2.5 rounded-md border cursor-grab active:cursor-grabbing transition-all ${dragging===deal.id ? "opacity-30" : ""} bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.10]`}
                        onClick={() => router.push(`./deals/${deal.id}`)}>
                        <div className="flex items-start justify-between mb-1.5">
                          <div className="text-[12px] font-medium text-[#f7f8f8] truncate pr-2">{deal.name}</div>
                          <button onClick={(e)=>{e.stopPropagation();}} className="p-0.5 rounded text-[#62666d] hover:text-[#d0d6e0]"><MoreHorizontal className="w-3.5 h-3.5"/></button>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#62666d] mb-1.5">
                          <span className="flex items-center gap-1 font-medium text-emerald-400"><DollarSign className="w-3 h-3"/>{deal.value ? formatCurrency(deal.value, deal.currency) : "—"}</span>
                          {deal.expectedCloseDate && (
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/>{new Date(deal.expectedCloseDate).toLocaleDateString(undefined,{month:"short",day:"numeric"})}</span>
                          )}
                        </div>
                        {(contact || dis) && (
                          <div className="flex items-center gap-2 text-[10px] text-[#62666d] pt-1 border-t border-white/[0.06]">
                            {contact && (
                              <span className="flex items-center gap-1"><User className="w-3 h-3" strokeWidth={1.5}/>{contact.firstName} {contact.lastName}</span>
                            )}
                            {dis > 0 && (
                              <span className="flex items-center gap-1 ml-auto"><Clock className="w-3 h-3" strokeWidth={1.5}/>{dis}d</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {stageDeals.length===0 && <div className="flex flex-col items-center justify-center py-8 text-[#62666d] text-[12px]">Drop deal here</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      ) : (
      <div className="flex-1 overflow-auto rounded-lg bg-white/[0.02] border border-white/[0.06]">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="text-[#8a8f98] border-b border-white/[0.06]">
              <th className="px-4 py-2.5 font-medium text-[11px] uppercase tracking-wider">Name</th>
              <th className="px-4 py-2.5 font-medium text-[11px] uppercase tracking-wider">Value</th>
              <th className="px-4 py-2.5 font-medium text-[11px] uppercase tracking-wider">Stage</th>
              <th className="px-4 py-2.5 font-medium text-[11px] uppercase tracking-wider">Contact</th>
              <th className="px-4 py-2.5 font-medium text-[11px] uppercase tracking-wider">Expected Close</th>
              <th className="px-4 py-2.5 font-medium text-[11px] uppercase tracking-wider text-right">Days</th>
            </tr>
          </thead>
          <tbody>
            {filteredDeals.map((deal: any) => {
              const contact = contacts.find((c:any)=>c.id===deal.primaryContactId);
              const stage = stages.find((s:any)=>s.id===deal.stageId);
              const dis = daysInStage(deal);
              return (
                <tr key={deal.id} onClick={() => router.push(`./deals/${deal.id}`)} className="text-[#d0d6e0] cursor-pointer transition-colors hover:bg-white/[0.04] border-b border-white/[0.04]">
                  <td className="px-4 py-2.5 font-medium text-[#f7f8f8]">{deal.name}</td>
                  <td className="px-4 py-2.5">{deal.value ? formatCurrency(deal.value, deal.currency) : "—"}</td>
                  <td className="px-4 py-2.5"><span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{backgroundColor:stage?.color||"#62666d"}} />{stage?.name || "—"}</span></td>
                  <td className="px-4 py-2.5">{contact ? `${contact.firstName} ${contact.lastName}` : "—"}</td>
                  <td className="px-4 py-2.5">{deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"}) : "—"}</td>
                  <td className="px-4 py-2.5 text-right text-[#62666d]">{dis > 0 ? `${dis}d` : "—"}</td>
                </tr>
              );
            })}
            {filteredDeals.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-[#62666d]">No deals in this pipeline.</td></tr>}
          </tbody>
        </table>
      </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={()=>setShowModal(false)}>
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl bg-[#0f1011] border border-white/[0.08] shadow-[0_24px_48px_rgba(0,0,0,0.4)]" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-white/[0.06] flex items-center justify-center text-[#d0d6e0]"><Building2 className="w-4 h-4" strokeWidth={1.5}/></div>
                <div>
                  <h2 className="text-[13px] font-semibold text-[#f7f8f8]">New Deal</h2>
                  <p className="text-[11px] text-[#62666d]">Add a new opportunity</p>
                </div>
              </div>
              <button onClick={()=>setShowModal(false)} className="p-1.5 rounded-md text-[#62666d] hover:text-[#d0d6e0] hover:bg-white/[0.04] transition-colors">
                <X className="w-4 h-4" strokeWidth={1.5}/>
              </button>
            </div>
            <form onSubmit={save} className="p-5 space-y-3.5">
              {error && <div className="rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-[12px] px-3 py-2">{error}</div>}
              <div><label className={labelCls}>Deal Name</label><input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} className={inputCls} placeholder="Enterprise plan - Acme" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Amount</label><input type="number" min="0" value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})} className={inputCls} placeholder="5000" required /></div>
                <div><label className={labelCls}>Currency</label>
                  <select value={form.currency} onChange={e=>setForm({...form, currency:e.target.value})} className={`${inputCls} appearance-none`}>
                    {["USD","EUR","GBP","ZAR","CAD","AUD"].map(c=> <option key={c} value={c} className="bg-[#0f1011]">{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Stage</label>
                  <select value={form.stageId} onChange={e=>setForm({...form, stageId:e.target.value})} className={`${inputCls} appearance-none`} required>
                    {stages.map((s:any) => <option key={s.id} value={s.id} className="bg-[#0f1011]">{s.name}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>Pipeline</label>
                  <select value={form.pipelineId} onChange={e=>setForm({...form, pipelineId:e.target.value})} className={`${inputCls} appearance-none`} required>
                    <option value="" className="bg-[#0f1011]">Select...</option>
                    {pipelines.map((p:any) => <option key={p.id} value={p.id} className="bg-[#0f1011]">{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Related Contact</label>
                  <select value={form.contactId} onChange={e=>setForm({...form, contactId:e.target.value})} className={`${inputCls} appearance-none`}>
                    <option value="" className="bg-[#0f1011]">Optional...</option>
                    {contacts.map((c:any) => <option key={c.id} value={c.id} className="bg-[#0f1011]">{c.firstName} {c.lastName}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>Expected Close</label><input type="date" value={form.expectedCloseDate} onChange={e=>setForm({...form, expectedCloseDate:e.target.value})} className={`${inputCls} appearance-none`} /></div>
              </div>
              <div><label className={labelCls}>Description</label><textarea value={form.description} onChange={e=>setForm({...form, description:e.target.value})} className={`${inputCls} h-20 py-2 resize-none`} placeholder="Additional details..." rows={3} /></div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button type="button" onClick={()=>setShowModal(false)} className="h-8 px-4 rounded-md text-[12px] font-medium text-[#d0d6e0] border border-white/[0.06] hover:bg-white/[0.04] transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="h-8 px-4 rounded-md text-[12px] font-semibold text-[#f7f8f8] bg-[#5e6ad2] hover:bg-[#828fff] transition-colors disabled:opacity-50 flex items-center gap-2">
                  {saving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
                  Add Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
