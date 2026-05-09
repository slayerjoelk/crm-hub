import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

// GET /api/sequences/enrollments — list all enrollments (or filter by contact/sequence)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get("contactId");
    const sequenceId = searchParams.get("sequenceId");

    let enrollments = await db.select().from(schema.sequenceEnrollments);
    
    if (contactId) enrollments = enrollments.filter(e => e.contactId === contactId);
    if (sequenceId) enrollments = enrollments.filter(e => e.sequenceId === sequenceId);

    // Enrich with contact email
    const allContacts = await db.select({ id: schema.contacts.id, email: schema.contacts.email }).from(schema.contacts);
    const contactMap: Record<string, string> = {};
    for (const c of allContacts) contactMap[c.id] = c.email || "";

    const data = enrollments.map(e => ({ ...e, contactEmail: contactMap[e.contactId] || "" }));

    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to load enrollments" }, { status: 500 });
  }
}
