import { type NextRequest, NextResponse } from "next/server";
import { ensureTables } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { runReport } from "@/lib/reporting";

// POST /api/reports/run — run an ad-hoc report config and return aggregated rows
export async function POST(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    try {
      await ensureTables();
      const cfg = await req.json();
      const result = await runReport(workspaceId, cfg);
      return NextResponse.json({ data: result });
    } catch {
      return NextResponse.json({ error: "Report failed" }, { status: 500 });
    }
  });
}
