"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileSpreadsheet, Plus, X, CheckCircle2, AlertTriangle, Trash2, Package, ShoppingCart } from "lucide-react";

function money(n: number) { return `$${(Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`; }
const STATUS: Record<string, string> = {
  draft: "bg-white/[0.05] text-[#8a8f98] border-white/[0.08]",
  sent: "bg-[#3b82f6]/10 text-[#60a5fa] border-[#3b82f6]/20",
  accepted: "bg-[#10b981]/10 text-[#34d399] border-[#10b981]/20",
  declined: "bg-[#ef4444]/10 text-[#f87171] border-[#ef4444]/20",
  expired: "bg-white/[0.05] text-[#62666d] border-white/[0.08]",
};
const input = "w-full h-9 px-3 rounded-lg bg-[#08090a] border border-white/[0.08] text-[13px] text-[#d0d6e0] placeholder-[#62666d] focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]/40";
const lbl = "text-[11px] font-medium text-[#8a8f98] uppercase tracking-wide mb-1.5 block";

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [managingProducts, setManagingProducts] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [q, p] = await Promise.all([
        fetch("/api/quotes", { credentials: "include" }).then(r => r.json()),
        fetch("/api/products", { credentials: "include" }).then(r => r.json()),
      ]);
      setQuotes(q.data || []); setProducts(p.data || []);
    } catch {}
    setLoading(false);
  }
  useEffect(() => { load(); }, []);
  async function setStatus(q: any, status: string) { await fetch(`/api/quotes/${q.id}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); load(); }
  async function remove(q: any) { if (!confirm(`Delete quote ${q.name}?`)) return; await fetch(`/api/quotes/${q.id}`, { method: "DELETE", credentials: "include" }); load(); }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5e6ad2] to-[#828fff] flex items-center justify-center"><FileSpreadsheet className="w-4 h-4 text-white" /></div><h1 className="text-2xl font-semibold text-[#f7f8f8] tracking-tight">Quotes</h1></div>
          <p className="text-[13px] text-[#8a8f98]">{quotes.length} quote{quotes.length !== 1 ? "s" : ""} · {products.length} product{products.length !== 1 ? "s" : ""} in catalog.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setManagingProducts(true)} className="h-9 px-4 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[#d0d6e0] text-[13px] font-medium flex items-center gap-2 hover:bg-white/[0.06]"><Package className="w-4 h-4" /> Products</button>
          <button onClick={() => setCreating(true)} className="h-9 px-4 rounded-lg bg-gradient-to-r from-[#5e6ad2] to-[#828fff] text-white text-[13px] font-medium flex items-center gap-2 hover:shadow-lg"><Plus className="w-4 h-4" /> New quote</button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/[0.07] bg-gradient-to-b from-[#141517] to-[#0f1011]">
        <table className="w-full text-left">
          <thead><tr className="bg-white/[0.02]" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            {["#", "Quote", "Status", "Items", "Total", ""].map((h, i) => <th key={i} className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.04em] text-[#8a8f98] whitespace-nowrap">{h}</th>)}
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="px-4 py-12 text-center text-[13px] text-[#62666d]">Loading…</td></tr>
            : quotes.length === 0 ? <tr><td colSpan={6} className="px-4 py-12 text-center text-[13px] text-[#62666d]">No quotes yet. Add products, then build a quote.</td></tr>
            : quotes.map(q => (
              <tr key={q.id} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td className="px-4 py-3 text-[12px] tabular-nums text-[#62666d]">#{q.quoteNumber}</td>
                <td className="px-4 py-3 text-[13px] font-medium text-[#f7f8f8]">{q.name}</td>
                <td className="px-4 py-3">
                  <select value={q.status} onChange={e => setStatus(q, e.target.value)} className={`px-2 py-1 rounded-md text-[10px] font-medium border capitalize bg-transparent ${STATUS[q.status] || STATUS.draft}`}>
                    {["draft","sent","accepted","declined","expired"].map(s => <option key={s} value={s} className="bg-[#16171a] text-[#d0d6e0]">{s}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-[13px] tabular-nums text-[#8a8f98]">{q.lineCount}</td>
                <td className="px-4 py-3 text-[13px] tabular-nums font-medium text-[#34d399]">{money(q.total)}</td>
                <td className="px-4 py-3 text-right"><button onClick={() => remove(q)} className="w-7 h-7 rounded-md flex items-center justify-center text-[#62666d] hover:text-red-400 hover:bg-red-500/10 ml-auto"><Trash2 className="w-3.5 h-3.5" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {creating && <CreateQuote products={products} onClose={() => setCreating(false)} onSaved={() => { setCreating(false); load(); }} />}
        {managingProducts && <ManageProducts products={products} onClose={() => setManagingProducts(false)} onChanged={load} />}
      </AnimatePresence>
    </div>
  );
}

function CreateQuote({ products, onClose, onSaved }: { products: any[]; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [lines, setLines] = useState<any[]>([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [saving, setSaving] = useState(false); const [err, setErr] = useState("");

  function addProduct(pid: string) {
    const p = products.find(x => x.id === pid); if (!p) return;
    setLines(l => [...l, { productId: p.id, name: p.name, quantity: 1, unitPrice: p.unitPrice, discountPercent: 0 }]);
  }
  function addCustom() { setLines(l => [...l, { name: "", quantity: 1, unitPrice: 0, discountPercent: 0 }]); }
  function upd(i: number, k: string, v: any) { setLines(l => l.map((x, j) => j === i ? { ...x, [k]: v } : x)); }
  function rm(i: number) { setLines(l => l.filter((_, j) => j !== i)); }

  const subtotal = lines.reduce((s, l) => s + Number(l.quantity || 0) * Number(l.unitPrice || 0) * (1 - Number(l.discountPercent || 0) / 100), 0);
  const total = subtotal * (1 - discountPercent / 100) * (1 + taxPercent / 100);

  async function save() {
    if (!name.trim()) { setErr("Quote name required"); return; }
    if (lines.length === 0) { setErr("Add at least one line item"); return; }
    setSaving(true); setErr("");
    const res = await fetch("/api/quotes", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, lineItems: lines, discountPercent, taxPercent }) });
    if (!res.ok) { setErr("Failed to create"); setSaving(false); return; }
    onSaved();
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-10 px-4">
      <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }} className="w-full max-w-2xl rounded-2xl bg-[#0f1011] border border-white/[0.08] shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]"><h2 className="text-[15px] font-semibold text-[#f7f8f8]">New quote</h2><button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#8a8f98] hover:bg-white/[0.06]"><X className="w-4 h-4" /></button></div>
        <div className="p-6 space-y-4">
          <div><label className={lbl}>Quote name</label><input className={input} value={name} onChange={e => setName(e.target.value)} placeholder="Acme — Annual Plan" autoFocus /></div>

          <div>
            <div className="flex items-center justify-between mb-2"><label className={lbl}>Line items</label>
              <div className="flex items-center gap-2">
                <select className="h-8 px-2.5 rounded-md bg-[#08090a] border border-white/[0.08] text-[12px] text-[#d0d6e0]" value="" onChange={e => { if (e.target.value) addProduct(e.target.value); e.target.value = ""; }}>
                  <option value="">+ Add product…</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} — {money(p.unitPrice)}</option>)}
                </select>
                <button onClick={addCustom} className="h-8 px-2.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-[12px] text-[#d0d6e0] hover:bg-white/[0.06]">+ Custom</button>
              </div>
            </div>
            {lines.length === 0 ? <div className="text-[12px] text-[#62666d] py-4 text-center rounded-lg bg-white/[0.02]">No line items yet.</div> : (
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr,56px,84px,56px,72px,28px] gap-2 text-[10px] text-[#62666d] uppercase tracking-wide px-1"><span>Item</span><span>Qty</span><span>Price</span><span>Disc%</span><span>Total</span><span /></div>
                {lines.map((l, i) => (
                  <div key={i} className="grid grid-cols-[1fr,56px,84px,56px,72px,28px] gap-2 items-center">
                    <input className="h-8 px-2.5 rounded-md bg-[#08090a] border border-white/[0.08] text-[12px] text-[#d0d6e0]" value={l.name} onChange={e => upd(i, "name", e.target.value)} placeholder="Item name" />
                    <input type="number" className="h-8 px-2 rounded-md bg-[#08090a] border border-white/[0.08] text-[12px] text-[#d0d6e0] tabular-nums" value={l.quantity} onChange={e => upd(i, "quantity", e.target.value)} />
                    <input type="number" className="h-8 px-2 rounded-md bg-[#08090a] border border-white/[0.08] text-[12px] text-[#d0d6e0] tabular-nums" value={l.unitPrice} onChange={e => upd(i, "unitPrice", e.target.value)} />
                    <input type="number" className="h-8 px-2 rounded-md bg-[#08090a] border border-white/[0.08] text-[12px] text-[#d0d6e0] tabular-nums" value={l.discountPercent} onChange={e => upd(i, "discountPercent", e.target.value)} />
                    <span className="text-[12px] tabular-nums text-[#d0d6e0]">{money(Number(l.quantity || 0) * Number(l.unitPrice || 0) * (1 - Number(l.discountPercent || 0) / 100))}</span>
                    <button onClick={() => rm(i)} className="w-7 h-7 rounded-md flex items-center justify-center text-[#62666d] hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-start justify-between gap-6 pt-2 border-t border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div><label className={lbl}>Discount %</label><input type="number" className={`${input} w-24`} value={discountPercent} onChange={e => setDiscountPercent(Number(e.target.value) || 0)} /></div>
              <div><label className={lbl}>Tax %</label><input type="number" className={`${input} w-24`} value={taxPercent} onChange={e => setTaxPercent(Number(e.target.value) || 0)} /></div>
            </div>
            <div className="text-right">
              <div className="text-[12px] text-[#8a8f98]">Subtotal {money(subtotal)}</div>
              <div className="text-[22px] font-semibold text-[#34d399] tabular-nums mt-1">{money(total)}</div>
            </div>
          </div>
          {err && <div className="flex items-center gap-2 text-[12px] text-red-400"><AlertTriangle className="w-3.5 h-3.5" />{err}</div>}
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-white/[0.06]">
          <button onClick={onClose} className="h-9 px-4 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[#d0d6e0] text-[13px] font-medium hover:bg-white/[0.06]">Cancel</button>
          <button onClick={save} disabled={saving} className="h-9 px-4 rounded-lg bg-gradient-to-r from-[#5e6ad2] to-[#828fff] text-white text-[13px] font-medium flex items-center gap-2 disabled:opacity-50"><CheckCircle2 className="w-4 h-4" />{saving ? "Saving…" : "Create quote"}</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ManageProducts({ products, onClose, onChanged }: { products: any[]; onClose: () => void; onChanged: () => void }) {
  const [name, setName] = useState(""); const [price, setPrice] = useState(""); const [period, setPeriod] = useState("one_time");
  const [saving, setSaving] = useState(false);
  async function add() {
    if (!name.trim()) return;
    setSaving(true);
    await fetch("/api/products", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, unitPrice: Number(price) || 0, billingPeriod: period }) });
    setName(""); setPrice(""); setSaving(false); onChanged();
  }
  async function del(id: string) { await fetch(`/api/products/${id}`, { method: "DELETE", credentials: "include" }); onChanged(); }
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-10 px-4">
      <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }} className="w-full max-w-lg rounded-2xl bg-[#0f1011] border border-white/[0.08] shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]"><h2 className="text-[15px] font-semibold text-[#f7f8f8] flex items-center gap-2"><Package className="w-4 h-4 text-[#9aa4f2]" /> Product catalog</h2><button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#8a8f98] hover:bg-white/[0.06]"><X className="w-4 h-4" /></button></div>
        <div className="p-6 space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1"><label className={lbl}>Product</label><input className={input} value={name} onChange={e => setName(e.target.value)} placeholder="Pro Plan" /></div>
            <div className="w-28"><label className={lbl}>Price</label><input type="number" className={input} value={price} onChange={e => setPrice(e.target.value)} placeholder="0" /></div>
            <div className="w-28"><label className={lbl}>Billing</label><select className={input} value={period} onChange={e => setPeriod(e.target.value)}>{["one_time","monthly","annually"].map(p => <option key={p} value={p}>{p.replace(/_/g," ")}</option>)}</select></div>
            <button onClick={add} disabled={saving} className="h-9 px-3 rounded-lg bg-gradient-to-r from-[#5e6ad2] to-[#828fff] text-white text-[13px] font-medium flex items-center gap-1.5 disabled:opacity-50"><Plus className="w-4 h-4" /></button>
          </div>
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {products.length === 0 ? <div className="text-[12px] text-[#62666d] text-center py-6">No products yet.</div> : products.map(p => (
              <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03]">
                <div className="flex items-center gap-2.5"><ShoppingCart className="w-4 h-4 text-[#62666d]" /><div><div className="text-[13px] text-[#f7f8f8]">{p.name}</div><div className="text-[11px] text-[#62666d] capitalize">{(p.billingPeriod || "one_time").replace(/_/g," ")}</div></div></div>
                <div className="flex items-center gap-3"><span className="text-[13px] tabular-nums text-[#d0d6e0]">{money(p.unitPrice)}</span><button onClick={() => del(p.id)} className="w-6 h-6 rounded flex items-center justify-center text-[#62666d] hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button></div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
