import { type NextRequest, NextResponse } from "next/server";
import { ensureTables } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { runForecast } from "@/lib/reporting";

// GET /api/reports/forecast — weighted pipeline forecast
export async function GET(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    try {
      await ensureTables();
      const data = await runForecast(workspaceId);
      return NextResponse.json({ data });
    } catch {
      return NextResponse.json({ error: "Forecast failed" }, { status: 500 });
    }
  });
}
