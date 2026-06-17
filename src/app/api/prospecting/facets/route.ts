import { NextResponse } from "next/server";
import { ensureTables } from "@/lib/db";
import { getProvider } from "@/lib/prospecting";

// GET /api/prospecting/facets — filter options (industries, seniorities, countries)
export async function GET() {
  try {
    await ensureTables();
    const facets = await getProvider().facets();
    return NextResponse.json({ data: facets, provider: getProvider().name });
  } catch {
    return NextResponse.json({ error: "Failed to load facets" }, { status: 500 });
  }
}
