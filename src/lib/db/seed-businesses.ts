import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

/**
 * Seed businesses and migrate existing workspaces.
 * Run once after deployment.
 */
export async function seedBusinesses() {
  const existing = await db.select().from(schema.businesses);
  if (existing.length > 0) {
    console.log("[seed] Businesses already seeded");
    return existing;
  }

  const [claraccord] = await db
    .insert(schema.businesses)
    .values({ slug: "claraccord", name: "ClarAccord", domain: "claraccord.com", plan: "pro", status: "active" })
    .returning();

  const [voxly] = await db
    .insert(schema.businesses)
    .values({ slug: "voxly", name: "Voxly", domain: "voxly.io", plan: "starter", status: "active" })
    .returning();

  // Migrate all existing workspaces to claraccord (first business)
  const workspaces = await db.select().from(schema.workspaces);
  if (workspaces.length > 0 && claraccord) {
    for (const ws of workspaces) {
      if (!ws.businessId) {
        await db
          .update(schema.workspaces)
          .set({ businessId: claraccord.id })
          .where(eq(schema.workspaces.id, ws.id));
      }
    }
  }

  console.log("[seed] Seeded claraccord and voxly businesses");
  return [claraccord, voxly];
}
