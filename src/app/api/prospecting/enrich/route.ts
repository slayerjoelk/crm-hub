import { type NextRequest, NextResponse } from "next/server";
import { ensureTables } from "@/lib/db";
import { getProvider } from "@/lib/prospecting";

// POST /api/prospecting/enrich — enrich a contact/company from { email | domain | name + company }
export async function POST(req: NextRequest) {
  try {
    await ensureTables();
    const input = await req.json().catch(() => ({}));
    const enrichment = await getProvider().enrich(input);
    return NextResponse.json({ data: enrichment });
  } catch {
    return NextResponse.json({ error: "Enrichment failed" }, { status: 500 });
  }
}
