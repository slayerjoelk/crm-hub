"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Plus, Trash2, Pencil, Database, GripVertical, ChevronDown } from "lucide-react";

interface CustomField {
  id: string;
  entityType: "contact" | "company" | "deal" | "workspace";
  name: string;
  label: string;
  type: string;
  options: string | null;
  isRequired: number;
  displayOrder: number | null;
}

const ENTITY_OPTIONS: { label: string; value: CustomField["entityType"] }[] = [
  { label: "Contact", value: "contact" },
  { label: "Company", value: "company" },
  { label: "Deal", value: "deal" },
];

const TYPE_OPTIONS = [
  { label: "Text", value: "text" },
  { label: "Number", value: "number" },
  { label: "Boolean", value: "boolean" },
  { label: "Date", value: "date" },
  { label: "DateTime", value: "datetime" },
  { label: "Select", value: "select" },
  { label: "Multi-select", value: "multiselect" },
  { label: "Email", value: "email" },
  { label: "URL", value: "url" },
  { label: "Textarea", value: "textarea" },
];

export default function CustomFieldsPage() {
  const { workspace } = useParams<{ workspace: string }>();
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEntity, setFilterEntity] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CustomField | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    entityType: "contact" as CustomField["entityType"],
    label: "",
    name: "",
    type: "text",
    options: "",
    isRequired: false,
    displayOrder: 0,
  });

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/custom-fields?entityType=${filterEntity !== "all" ? filterEntity : ""}`, {
      headers: { "x-workspace-id": workspace, "x-user-id": "system" },
    });
    const json = await res.json();
    setFields(json.data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filterEntity, workspace]);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const payload = {
      entityType: form.entityType,
      label: form.label,
      name: form.name || form.label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, ""),
      type: form.type,
      options: ["select", "multiselect"].includes(form.type) ? JSON.stringify(form.options.split(",").map(s => s.trim()).filter(Boolean)) : null,
      isRequired: form.isRequired ? 1 : 0,
      displayOrder: form.displayOrder,
    };
    try {
      const url = editing ? `/api/custom-fields/${editing.id}` : `/api/custom-fields`;
      const method = editing ? "PATCH" : "POST";
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "x-workspace-id": workspace, "x-user-id": "system" },
        body: JSON.stringify(payload),
      });
      setShowModal(false); setEditing(null); setForm({ entityType:"contact", label:"", name:"", type:"text", options:"", isRequired:false, displayOrder:0 });
      load();
    } finally { setSaving(false); }
  }

  async function remove(id: string) {
    if (!confirm("Delete this custom field?")) return;
    await fetch(`/api/custom-fields/${id}`, {
      method: "DELETE",
      headers: { "x-workspace-id": workspace, "x-user-id": "system" },
    });
    load();
  }

  function openEdit(f: CustomField) {
    setEditing(f);
    setForm({
      entityType: f.entityType,
      label: f.label,
      name: f.name,
      type: f.type,
      options: f.options ? JSON.parse(f.options).join(", ") : "",
      isRequired: !!f.isRequired,
      displayOrder: f.displayOrder ?? 0,
    });
    setShowModal(true);
  }

  const filtered = filterEntity === "all" ? fields : fields.filter(f => f.entityType === filterEntity);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Custom Fields</h1>
          <p className="text-slate-500 text-sm mt-1">Add custom properties to contacts, companies and deals</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ entityType:"contact", label:"", name:"", type:"text", options:"", isRequired:false, displayOrder:0 }); setShowModal(true); }}
          className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> New Field
        </button>
      </div>

      <div className="flex items-center gap-2">
        <select value={filterEntity} onChange={e=>setFilterEntity(e.target.value)} className="h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200">
          <option value="all">All entities</option>
          {ENTITY_OPTIONS.map(e=><option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
        <span className="text-xs text-slate-500 ml-2">{filtered.length} fields</span>
      </div>

      {loading ? (
        <div className="animate-pulse rounded-xl border border-slate-800 bg-slate-900/60 h-32" />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-center">
          <Database className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No custom fields yet.</p>
          <p className="text-slate-600 text-xs mt-1">Click "New Field" to create one.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="px-4 py-3 w-8"></th>
                <th className="px-4 py-3">Label</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Required</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f.id} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3"><GripVertical className="w-4 h-4 text-slate-600 cursor-grab" /></td>
                  <td className="px-4 py-3 font-medium text-slate-200">{f.label}</td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">{f.name}</td>
                  <td className="px-4 py-3 text-slate-400 capitalize">{f.type}</td>
                  <td className="px-4 py-3 text-slate-400 capitalize">{f.entityType}</td>
                  <td className="px-4 py-3">{f.isRequired ? <span className="text-emerald-400">Yes</span> : <span className="text-slate-500">No</span>}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={()=>openEdit(f)} className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200"><Pencil className="w-4 h-4" /></button>
                      <button onClick={()=>remove(f.id)} className="p-1.5 rounded-md hover:bg-red-500/10 text-slate-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{editing ? "Edit Custom Field" : "New Custom Field"}</h2>
              <button onClick={()=>setShowModal(false)} className="text-slate-400 hover:text-slate-200 text-xl">×</button>
            </div>
            <form onSubmit={save} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Entity Type</label>
                  <select value={form.entityType} onChange={e=>setForm({...form,entityType:e.target.value as any})} className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 appearance-none">
                    {ENTITY_OPTIONS.map(e=><option key={e.value} value={e.value}>{e.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Field Type</label>
                  <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 appearance-none">
                    {TYPE_OPTIONS.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Label</label>
                <input required value={form.label} onChange={e=>setForm({...form,label:e.target.value})} className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/60" placeholder="e.g. LinkedIn URL" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">API Name (optional)</label>
                <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/60 font-mono" placeholder="Auto-generated from label" />
              </div>
              {["select","multiselect"].includes(form.type) && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Options (comma-separated)</label>
                  <input value={form.options} onChange={e=>setForm({...form,options:e.target.value})} className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/60" placeholder="Option 1, Option 2, Option 3" />
                </div>
              )}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={form.isRequired} onChange={e=>setForm({...form,isRequired:e.target.checked})} className="rounded bg-slate-800 border-slate-600 text-emerald-500" /> Required
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <span className="text-xs text-slate-500">Order</span>
                  <input type="number" value={form.displayOrder} onChange={e=>setForm({...form,displayOrder:parseInt(e.target.value)||0})} className="w-16 h-8 px-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200" />
                </label>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={()=>setShowModal(false)} className="flex-1 h-9 rounded-lg border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 h-9 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors disabled:opacity-50">{saving ? "Saving..." : (editing ? "Update" : "Create")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
