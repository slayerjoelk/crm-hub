import { type NextRequest, NextResponse } from "next/server";
import { ensureTables } from "@/lib/db";
import { getProvider } from "@/lib/prospecting";

// POST /api/prospecting/search — search the B2B prospect database
export async function POST(req: NextRequest) {
  try {
    await ensureTables();
    const filters = await req.json().catch(() => ({}));
    const result = await getProvider().search(filters);
    return NextResponse.json({ data: result });
  } catch (e: any) {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
