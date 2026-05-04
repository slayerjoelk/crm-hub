"use client";

import { useState } from "react";
import { Upload, Download, Check, AlertCircle, FileSpreadsheet } from "lucide-react";

const IMPORT_TYPES = [
  { value: "contacts", label: "Contacts", headers: "first_name,last_name,email,phone,job_title,lifecycle_stage,lead_status,source_type" },
  { value: "companies", label: "Companies", headers: "name,domain,industry,employee_count,annual_revenue,website" },
  { value: "deals", label: "Deals", headers: "name,amount,currency,stage,contact_id,expected_close_date" },
  { value: "tasks", label: "Tasks", headers: "title,description,status,priority,due_date,contact_id" },
];

export default function ImportPage() {
  const [type, setType] = useState("contacts");
  const [csv, setCsv] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) {
      const reader = new FileReader();
      reader.onload = ev => setCsv(ev.target?.result as string);
      reader.readAsText(file);
    }
  }

  async function upload() {
    setLoading(true); setResult(null);
    const res = await fetch(`/api/import/${type}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ csv }) });
    const json = await res.json().catch(() => ({ error: "Failed to parse response" }));
    setLoading(false);
    setResult(json);
  }

  const selected = IMPORT_TYPES.find(t => t.value === type);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold text-white">Import Data</h1><p className="text-slate-500 text-sm mt-1">Upload CSV files to bulk-import records</p></div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <label className="block text-xs font-medium text-slate-400 mb-1">Import type</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {IMPORT_TYPES.map(t => (
            <button key={t.value} onClick={()=>setType(t.value)}
              className={`h-10 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${type===t.value ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "border-slate-800 text-slate-400 hover:bg-slate-800"}`}>
              <FileSpreadsheet className="w-3.5 h-3.5"/>{t.label}
            </button>
          ))}
        </div>

        <div><label className="block text-xs font-medium text-slate-400 mb-1">Expected columns:</label>
          <code className="block rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-[11px] text-slate-500 font-mono">{selected?.headers}</code>
        </div>

        <div
          onDragOver={e=>{ e.preventDefault(); setDragActive(true); }}
          onDragLeave={()=>setDragActive(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center py-10 space-y-2 transition-colors ${dragActive ? "border-emerald-500 bg-emerald-500/5" : "border-slate-700 bg-slate-900"}`}
        >
          <Upload className="w-8 h-8 text-slate-500"/>
          <p className="text-sm text-slate-400">Drag & drop your CSV file here</p>
          <p className="text-xs text-slate-600">or paste content below</p>
        </div>

        <textarea
          value={csv}
          onChange={e=>setCsv(e.target.value)}
          className="w-full h-40 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/60 font-mono leading-relaxed resize-none"
          placeholder={selected?.headers + "\nJohn,Doe,john@example.com,+2712345678,CEO,lead,new,referral"}
        />

        <div className="flex items-center gap-3 pt-1">
          <button onClick={()=>setCsv(selected?.headers?.replace(/,/g, "\n") + "\n")} className="h-9 px-3 rounded-lg bg-slate-800 text-slate-400 text-xs flex items-center gap-1.5 hover:bg-slate-700"><Download className="w-3.5 h-3.5"/> Template</button>
          <button onClick={upload} disabled={loading || !csv} className="h-9 px-5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-2 ml-auto">
            {loading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
            Import {selected?.label}
          </button>
        </div>

        {result && (
          <div className={`rounded-lg border p-3 space-y-1 ${result.error ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"}`}>
            <div className="flex items-center gap-2 text-sm font-medium">
              {result.error ? <AlertCircle className="w-4 h-4"/> : <Check className="w-4 h-4"/>}
              {result.error || `${result.imported} rows imported successfully`}
            </div>
            {result.errors && (
              <div className="text-xs text-red-400 max-h-40 overflow-y-auto">
                {result.errors.map((err:string, i:number) => <div key={i}>• {err}</div>)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
