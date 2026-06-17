import { db, schema } from "@/lib/db";
import { and, gte, lte, like, inArray, sql } from "drizzle-orm";

/* ────────────────────────────────────────────
   B2B Prospecting — pluggable provider seam.

   getProvider() returns the configured data provider.
   Today: LocalProvider (searches the seeded `prospects`
   table + heuristic enrichment). Swap in Apollo/Clearbit
   later by implementing ProspectingProvider and selecting
   it via PROSPECTING_PROVIDER env — no call-site changes.
   ─────────────────────────────────────────── */

export interface ProspectFilters {
  q?: string;            // name keyword
  title?: string;        // title keyword
  industry?: string[];
  seniority?: string[];
  country?: string[];
  employeeMin?: number;
  employeeMax?: number;
  technologies?: string[];
  limit?: number;
  offset?: number;
}

export interface Prospect {
  id: string;
  firstName: string; lastName: string; title?: string; seniority?: string;
  email?: string; companyName: string; domain?: string; industry?: string;
  employeeCount?: number; annualRevenue?: number; country?: string; city?: string;
  linkedinUrl?: string; technologies?: string[];
}

export interface EnrichmentInput { email?: string; domain?: string; firstName?: string; lastName?: string; companyName?: string; }

export interface Enrichment {
  provider: string;
  email?: string; emailConfidence?: number; guessedEmailPattern?: string;
  companyName?: string; domain?: string; industry?: string;
  employeeCount?: number; annualRevenue?: number; country?: string; linkedinUrl?: string;
  matched: boolean;
}

export interface ProspectingProvider {
  name: string;
  search(filters: ProspectFilters): Promise<{ prospects: Prospect[]; total: number; provider: string }>;
  enrich(input: EnrichmentInput): Promise<Enrichment>;
  facets(): Promise<{ industries: string[]; seniorities: string[]; countries: string[] }>;
}

function parseTech(raw: string | null): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

// ── Local provider: queries the seeded `prospects` table ──
class LocalProvider implements ProspectingProvider {
  name = "local";

  async search(f: ProspectFilters) {
    const conds: any[] = [];
    if (f.industry?.length) conds.push(inArray(schema.prospects.industry, f.industry));
    if (f.seniority?.length) conds.push(inArray(schema.prospects.seniority, f.seniority as any));
    if (f.country?.length) conds.push(inArray(schema.prospects.country, f.country));
    if (f.employeeMin != null) conds.push(gte(schema.prospects.employeeCount, f.employeeMin));
    if (f.employeeMax != null) conds.push(lte(schema.prospects.employeeCount, f.employeeMax));
    if (f.title) conds.push(like(schema.prospects.title, `%${f.title}%`));

    let rows = await db.select().from(schema.prospects)
      .where(conds.length ? and(...conds) : undefined);

    // Keyword (name/company) + technology filters in app layer
    if (f.q) {
      const q = f.q.toLowerCase();
      rows = rows.filter(r => `${r.firstName} ${r.lastName} ${r.companyName}`.toLowerCase().includes(q));
    }
    if (f.technologies?.length) {
      rows = rows.filter(r => {
        const t = parseTech(r.technologies).map(x => x.toLowerCase());
        return f.technologies!.some(want => t.includes(want.toLowerCase()));
      });
    }

    const total = rows.length;
    const offset = f.offset ?? 0;
    const limit = f.limit ?? 50;
    const page = rows.slice(offset, offset + limit);

    return {
      provider: this.name,
      total,
      prospects: page.map(r => ({
        id: r.id, firstName: r.firstName, lastName: r.lastName, title: r.title ?? undefined,
        seniority: r.seniority ?? undefined, email: r.email ?? undefined, companyName: r.companyName,
        domain: r.domain ?? undefined, industry: r.industry ?? undefined,
        employeeCount: r.employeeCount ?? undefined, annualRevenue: r.annualRevenue ?? undefined,
        country: r.country ?? undefined, city: r.city ?? undefined, linkedinUrl: r.linkedinUrl ?? undefined,
        technologies: parseTech(r.technologies),
      })),
    };
  }

  async enrich(input: EnrichmentInput): Promise<Enrichment> {
    // 1) Try to match a known prospect by email or domain+name
    let match: any = null;
    if (input.email) {
      const rows = await db.select().from(schema.prospects).where(like(schema.prospects.email, input.email.toLowerCase()));
      match = rows[0];
    }
    if (!match && input.domain) {
      const rows = await db.select().from(schema.prospects).where(like(schema.prospects.domain, input.domain.toLowerCase()));
      match = rows.find(r =>
        (!input.lastName || r.lastName.toLowerCase() === input.lastName.toLowerCase())) || rows[0];
    }

    // 2) Heuristic email guess from name + domain (first.last@domain)
    const domain = input.domain || match?.domain || (input.email?.split("@")[1]);
    const fn = (input.firstName || match?.firstName || "").toLowerCase().replace(/[^a-z]/g, "");
    const ln = (input.lastName || match?.lastName || "").toLowerCase().replace(/[^a-z]/g, "");
    let guessedEmail: string | undefined;
    let guessedPattern: string | undefined;
    if (domain && fn && ln) { guessedEmail = `${fn}.${ln}@${domain}`; guessedPattern = "{first}.{last}@domain"; }

    return {
      provider: this.name,
      matched: !!match,
      email: match?.email || guessedEmail,
      emailConfidence: match?.email ? 95 : guessedEmail ? 55 : 0,
      guessedEmailPattern: match?.email ? undefined : guessedPattern,
      companyName: match?.companyName || input.companyName,
      domain,
      industry: match?.industry,
      employeeCount: match?.employeeCount ?? undefined,
      annualRevenue: match?.annualRevenue ?? undefined,
      country: match?.country,
      linkedinUrl: match?.linkedinUrl ?? undefined,
    };
  }

  async facets() {
    const rows = await db.select({
      industry: schema.prospects.industry, seniority: schema.prospects.seniority, country: schema.prospects.country,
    }).from(schema.prospects);
    const uniq = (arr: (string | null)[]) => [...new Set(arr.filter(Boolean) as string[])].sort();
    return {
      industries: uniq(rows.map(r => r.industry)),
      seniorities: uniq(rows.map(r => r.seniority)),
      countries: uniq(rows.map(r => r.country)),
    };
  }
}

const providers: Record<string, () => ProspectingProvider> = {
  local: () => new LocalProvider(),
  // apollo: () => new ApolloProvider(),  // drop in later
};

export function getProvider(): ProspectingProvider {
  const name = process.env.PROSPECTING_PROVIDER || "local";
  return (providers[name] || providers.local)();
}
