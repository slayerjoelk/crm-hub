import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, and, asc } from "drizzle-orm";
import { runWorkflows } from "@/lib/automation/workflow-engine";

/* ────────────────────────────────────────────
   Lead Conversion  (Salesforce-style)
   Lead → Account (company) + Contact + (optional) Opportunity (deal)

   POST /api/leads/:id/convert
   body: { createDeal?: bool, dealName?, dealValue?, pipelineId?, stageId? }
   ─────────────────────────────────────────── */

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withWorkspace(req, async ({ workspaceId, userId }) => {
    const id = (await params).id;
    const uid = userId === "dev-user" ? null : userId;
    const body = await req.json().catch(() => ({}));

    const [lead] = await db.select().from(schema.leads)
      .where(and(eq(schema.leads.id, id), eq(schema.leads.workspaceId, workspaceId)));
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    if (lead.isConverted) return NextResponse.json({ error: "Lead already converted" }, { status: 400 });

    try {
      // 1) Account — find existing company by name, else create
      let companyId: string | null = null;
      let company: any = null;
      if (lead.company) {
        const existing = await db.select().from(schema.companies)
          .where(and(eq(schema.companies.workspaceId, workspaceId), eq(schema.companies.name, lead.company)));
        company = existing[0];
        if (!company) {
          [company] = await db.insert(schema.companies).values({
            workspaceId, ownerId: uid, name: lead.company,
            domain: lead.website || null, industry: lead.industry || null,
            website: lead.website || null, employeeCount: lead.employeeCount || null,
            annualRevenue: lead.annualRevenue || null, type: "prospect",
            lifecycleStage: "qualified", city: lead.city || null, state: lead.state || null, country: lead.country || null,
          }).returning();
        }
        companyId = company.id;
      }

      // 2) Contact — create from the lead's person details
      const [contact] = await db.insert(schema.contacts).values({
        workspaceId, ownerId: uid,
        firstName: lead.firstName, lastName: lead.lastName, email: lead.email,
        phone: lead.phone, jobTitle: lead.jobTitle, companyId,
        lifecycleStage: "qualified", leadStatus: "connected",
        leadScore: lead.leadScore || 0,
        sourceType: (lead.source as any) || "other", sourceDetail: lead.sourceDetail || "Converted from lead",
        linkedinUrl: lead.linkedinUrl, website: lead.website,
        city: lead.city, state: lead.state, country: lead.country,
        notes: lead.notes, lastActivityAt: new Date(),
      }).returning();

      // 3) Opportunity (deal) — optional
      let deal: any = null;
      if (body.createDeal) {
        const [pipeline] = await db.select().from(schema.pipelines)
          .where(and(eq(schema.pipelines.workspaceId, workspaceId),
            body.pipelineId ? eq(schema.pipelines.id, body.pipelineId) : eq(schema.pipelines.isDefault, true)))
          .limit(1);
        const pipe = pipeline || (await db.select().from(schema.pipelines).where(eq(schema.pipelines.workspaceId, workspaceId)).limit(1))[0];
        if (pipe) {
          const stages = await db.select().from(schema.pipelineStages)
            .where(eq(schema.pipelineStages.pipelineId, pipe.id)).orderBy(asc(schema.pipelineStages.displayOrder));
          const stage = body.stageId ? stages.find(s => s.id === body.stageId) : stages[0];
          if (stage) {
            [deal] = await db.insert(schema.deals).values({
              workspaceId, ownerId: uid,
              name: body.dealName || `${lead.company || lead.firstName || "New"} opportunity`,
              value: body.dealValue ? Number(body.dealValue) : 0,
              pipelineId: pipe.id, stageId: stage.id, status: "open",
              primaryContactId: contact.id, companyId,
              sourceType: (lead.source as any) || "other", sourceDetail: "Converted from lead",
            }).returning();
          }
        }
      }

      // 4) Mark lead converted
      await db.update(schema.leads).set({
        isConverted: true, status: "converted", convertedAt: new Date(),
        convertedContactId: contact.id, convertedCompanyId: companyId, convertedDealId: deal?.id || null,
        updatedAt: new Date(),
      }).where(eq(schema.leads.id, lead.id));

      // 5) Activity log + workflow trigger
      await db.insert(schema.activities).values({
        workspaceId, userId: uid || "system", type: "contact_created", contactId: contact.id,
        body: `Lead converted → ${company ? `account "${company.name}", ` : ""}contact${deal ? `, opportunity "${deal.name}"` : ""}.`,
      }).catch(() => {});
      await runWorkflows(workspaceId, "contact_created", "contact", { ...contact, company: lead.company }, { score: contact.leadScore || 0 }).catch(() => {});

      return NextResponse.json({ data: { contact, company, deal } }, { status: 201 });
    } catch (e: any) {
      return NextResponse.json({ error: "Conversion failed" }, { status: 500 });
    }
  });
}
