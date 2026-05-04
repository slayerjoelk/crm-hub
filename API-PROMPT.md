
# Build ALL CRM-HUB API Routes

**Root:** ~/Desktop/Coding Projects/SaaS/crm-hub
**Schema:** src/lib/db/schema.ts defines: workspaces, users, contacts, companies, deals, pipelines, pipelineStages, activities, tasks, emails, sequences, tags, webhooks, integrations.
**Auth:** src/lib/auth/index.ts has hashPassword, verifyPassword, createToken, verifyToken.
**Database:** src/lib/db/index.ts exports db (drizzle client) and schema.
**Middleware:** src/lib/middleware.ts exports withWorkspace(req, handler) that reads x-workspace-id, x-user-id, x-user-role headers.

## Rules

1. Every route MUST use `withWorkspace(req, async ({ workspaceId }) => {...})` wrapper.
2. Every query MUST filter by `eq(table.workspaceId, workspaceId)`.
3. Return consistent shape: success → `NextResponse.json({ data })`, error → `NextResponse.json({ error }, { status })`.
4. Use `.select()`, `.insert()`, `.update()`, `.delete()` with eq from drizzle-orm.
5. Add try/catch with console.error and return 500 on error.

## Files to Create

### Auth
`src/app/api/auth/me/route.ts` — GET:
- Read 'session' cookie
- verifyToken → return user + workspace info
- If invalid → 401

### Contacts
`src/app/api/contacts/route.ts` — GET list, POST create:
- GET: `q` search param, filter by workspace, optional search on name/email/phone, join companies.name
- POST: body = { firstName, lastName, email, phone, jobTitle, companyId, lifecycleStage, leadStatus, sourceType, sourceDetail, city, state, country, notes }, return created contact

`src/app/api/contacts/[id]/route.ts` — PATCH, DELETE:
- Filter: id + workspaceId
- PATCH: update any field, return updated
- DELETE: delete contact, return { success: true }

### Companies
`src/app/api/companies/route.ts` — GET list, POST create:
- GET: workspace filter, optional search on name/domain
- POST: body = { name, domain, description, industry, size, type, lifecycleStage, annualRevenue, employeeCount, website, city, state, country, notes }

`src/app/api/companies/[id]/route.ts` — PATCH, DELETE

### Deals
`src/app/api/deals/route.ts` — GET list, POST create:
- GET: workspace filter, join companies.name, contacts.firstName+lastName, pipelines.name, pipelineStages.name
- POST: body = { name, value, currency, pipelineId, stageId, primaryContactId, companyId, priority, probability, expectedCloseDate, notes }
- On POST: create activity "deal_created" automatically

`src/app/api/deals/[id]/route.ts` — PATCH, DELETE
- PATCH: check if stageId changed → create activity "deal_stage_change" with old/new stage names
- return updated deal

### Pipelines
`src/app/api/pipelines/route.ts` — GET list, POST create:
- GET: workspace filter, include stages array (relation query)
- POST: body = { name, type, color }, also create default stages

### Stages (nested under pipeline)
`src/app/api/pipelines/[id]/stages/route.ts` — GET, POST
`src/app/api/pipelines/[id]/stages/[stageId]/route.ts` — PATCH, DELETE

### Tasks
`src/app/api/tasks/route.ts` — GET list, POST create
- GET: workspace filter, optional status/priority filters, joined contact name + deal name
- POST: body = { title, description, contactId, dealId, companyId, status, priority, dueDate }

`src/app/api/tasks/[id]/route.ts` — PATCH, DELETE
- PATCH: if status changes to "done", set completedAt = new Date()

### Activities
`src/app/api/activities/route.ts` — GET list, POST create
- GET: workspace filter, optional entityType + entityId filter, order by createdAt desc
- POST: body = { type, contactId, dealId, companyId, body, subject, durationMinutes }

## Important Notes
- drizzle-orm select returns arrays. .get() exists on some calls but use .select().where().orderBy().limit() pattern.
- For insert → use .insert().values().returning().then(rows => rows[0])
- Do NOT use --full-auto. Review generated files.
- ALL imports must be relative: from "../../../lib/db", from "../../../lib/middleware"
- The schema table names are: schema.contacts, schema.companies, schema.deals, schema.pipelines, schema.pipelineStages, schema.activities, schema.tasks, schema.users, schema.workspaces
