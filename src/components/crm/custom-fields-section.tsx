"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface CustomFieldDef {
  id: string;
  label: string;
  name: string;
  type: string;
  options: string | null;
  isRequired: number;
  displayOrder: number | null;
  value?: string | null;
}

interface Props {
  entityType: "contact" | "company" | "deal";
  entityId?: string;
  mode: "form" | "display";
  values?: Record<string, string>;
  onChange?: (vals: Record<string, string>) => void;
}

export function CustomFieldsSection({ entityType, entityId, mode, values, onChange }: Props) {
  const { workspace } = useParams<{ workspace: string }>();
  const [fields, setFields] = useState<CustomFieldDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [localVals, setLocalVals] = useState<Record<string, string>>(values || {});

  useEffect(() => {
    setLocalVals(values || {});
  }, [values]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/custom-fields?entityType=${entityType}`, { credentials: "include",
      headers: { "x-workspace-id": workspace, "x-user-id": "system" },
    })
      .then((r) => r.json())
      .then(async (json) => {
        let defs: CustomFieldDef[] = json.data || [];
        if (entityId) {
          const vRes = await fetch(`/api/custom-values/${entityType}/${entityId}`, { credentials: "include",
            headers: { "x-workspace-id": workspace, "x-user-id": "system" },
          });
          const vJson = await vRes.json().catch(() => ({}));
          const valMap: Record<string, string> = {};
          (vJson.data || []).forEach((v: any) => {
            if (v.value != null) valMap[v.id] = v.value;
          });
          defs = defs.map((d) => ({ ...d, value: valMap[d.id] ?? null }));
          setLocalVals(valMap);
        }
        defs.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        setFields(defs);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [entityType, entityId, workspace]);

  function update(id: string, val: string) {
    const next = { ...localVals, [id]: val };
    setLocalVals(next);
    onChange?.(next);
  }

  function renderInput(f: CustomFieldDef) {
    const val = localVals[f.id] ?? "";
    const baseCls =
      "w-full px-3 rounded-lg bg-[#0f1011] border border-white/[0.06] text-sm text-[#d0d6e0] placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]/[0.3]";
    const labelCls = "block text-xs font-medium text-[#8a8f98] mb-1";
    const opts = f.options ? (JSON.parse(f.options) as string[]) : [];

    switch (f.type) {
      case "textarea":
        return (
          <div key={f.id}>
            <label className={labelCls}>{f.label}{f.isRequired ? " *" : ""}</label>
            <textarea
              value={val}
              onChange={(e) => update(f.id, e.target.value)}
              rows={3}
              className={`${baseCls} py-2`}
              placeholder={f.label}
            />
          </div>
        );
      case "select":
        return (
          <div key={f.id}>
            <label className={labelCls}>{f.label}{f.isRequired ? " *" : ""}</label>
            <select value={val} onChange={(e) => update(f.id, e.target.value)} className={`${baseCls} h-10`}>
              <option value="">--</option>
              {opts.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
        );
      case "multiselect":
        return (
          <div key={f.id}>
            <label className={labelCls}>{f.label}{f.isRequired ? " *" : ""}</label>
            <select
              multiple
              value={val ? val.split(",") : []}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
                update(f.id, selected.join(","));
              }}
              className={`${baseCls} py-2 h-24`}
            >
              {opts.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
        );
      case "boolean":
        return (
          <div key={f.id} className="flex items-center gap-2">
            <input
              id={f.id}
              type="checkbox"
              checked={val === "true" || val === "1"}
              onChange={(e) => update(f.id, e.target.checked ? "true" : "false")}
              className="rounded bg-[#191a1b] border-white/[0.08] text-[#10b981]"
            />
            <label htmlFor={f.id} className="text-sm text-[#8a8f98] cursor-pointer">
              {f.label}{f.isRequired ? " *" : ""}
            </label>
          </div>
        );
      case "number":
        return (
          <div key={f.id}>
            <label className={labelCls}>{f.label}{f.isRequired ? " *" : ""}</label>
            <input
              type="number"
              value={val}
              onChange={(e) => update(f.id, e.target.value)}
              className={`${baseCls} h-10`}
              placeholder={f.label}
            />
          </div>
        );
      case "date":
      case "datetime":
        return (
          <div key={f.id}>
            <label className={labelCls}>{f.label}{f.isRequired ? " *" : ""}</label>
            <input
              type={f.type === "datetime" ? "datetime-local" : "date"}
              value={val}
              onChange={(e) => update(f.id, e.target.value)}
              className={`${baseCls} h-10 [color-scheme:dark]`}
            />
          </div>
        );
      case "email":
        return (
          <div key={f.id}>
            <label className={labelCls}>{f.label}{f.isRequired ? " *" : ""}</label>
            <input
              type="email"
              value={val}
              onChange={(e) => update(f.id, e.target.value)}
              className={`${baseCls} h-10`}
              placeholder={f.label}
            />
          </div>
        );
      case "url":
        return (
          <div key={f.id}>
            <label className={labelCls}>{f.label}{f.isRequired ? " *" : ""}</label>
            <input
              type="url"
              value={val}
              onChange={(e) => update(f.id, e.target.value)}
              className={`${baseCls} h-10`}
              placeholder={f.label}
            />
          </div>
        );
      default:
        return (
          <div key={f.id}>
            <label className={labelCls}>{f.label}{f.isRequired ? " *" : ""}</label>
            <input
              type="text"
              value={val}
              onChange={(e) => update(f.id, e.target.value)}
              className={`${baseCls} h-10`}
              placeholder={f.label}
            />
          </div>
        );
    }
  }

  if (loading) return <div className="animate-pulse rounded-xl border border-white/[0.06] bg-[#0f1011]/40 h-24" />;
  if (fields.length === 0) return null;

  if (mode === "display") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fields.map((f) => (
          <div key={f.id}>
            <p className="text-xs font-medium text-[#62666d]">{f.label}</p>
            <p className="text-sm text-[#d0d6e0] mt-0.5">{f.value || <span className="text-[#62666d]">—</span>}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 border-t border-white/[0.06] pt-4 mt-2">
      <p className="text-xs font-semibold text-[#8a8f98] uppercase tracking-wider">Custom Fields</p>
      {fields.map((f) => renderInput(f))}
    </div>
  );
}
