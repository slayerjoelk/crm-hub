"use client";

import { useState } from "react";
import { Download } from "lucide-react";

interface Props {
  data: any[];
  filename: string;
  columns?: { key: string; label: string }[];
}

export function CsvExportButton({ data, filename, columns }: Props) {
  const [exporting, setExporting] = useState(false);

  function escapeCsv(val: any): string {
    if (val === null || val === undefined) return "";
    const str = String(val).replace(/"/g, '""');
    if (str.includes(",") || str.includes("\n") || str.includes('"')) return `"${str}"`;
    return str;
  }

  function download() {
    setExporting(true);
    try {
      if (!data || data.length === 0) return;
      const keys = columns ? columns.map((c) => c.key) : Object.keys(data[0]);
      const headers = columns ? columns.map((c) => c.label) : keys;

      const rows = data.map((row) => keys.map((k) => escapeCsv(row[k])).join(","));
      const csv = [headers.join(","), ...rows].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setTimeout(() => setExporting(false), 500);
    }
  }

  return (
    <button
      onClick={download}
      disabled={exporting || !data || data.length === 0}
      className="h-9 px-3 rounded-md text-[13px] font-medium flex items-center gap-2 border transition-colors disabled:opacity-50 text-[#d0d6e0] hover:bg-[rgba(255,255,255,0.04)]"
      style={{
        backgroundColor: "rgba(255,255,255,0.02)",
        borderColor: "rgba(255,255,255,0.06)",
      }}
    >
      <Download className="w-3.5 h-3.5" />
      {exporting ? "Exporting..." : "Export CSV"}
    </button>
  );
}
