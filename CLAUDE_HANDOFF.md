# CRM-HUB — Claude Code Handoff Document

**Repo:** ~/Desktop/Coding Projects/SaaS/crm-hub
**Branch:** main (commit b51e295 — WIP Phase 3 detail pages)
**Build Status:** PASSES (npx next build exits 0)
**Stack:** Next.js 16 + Drizzle ORM + SQLite (local.db) + Tailwind CSS v4

---

## KNOWN BUGS TO FIX FIRST

### Bug 1: Login page has no workspace slug field
**File:** `src/app/login/page.tsx`
**Symptom:** Login form POSTs `{ email, password }` but the login API (`src/app/api/auth/login/route.ts`) expects `{ email, password, workspaceSlug? }`. On `/login` there is no workspace context, so workspaceSlug is undefined. The API then looks up the user by email across all workspaces. The demo user exists but login returns "Login failed".

**Fix options (pick one):**
- Option A: Add a workspace slug selector/dropdown to the login page, OR
- Option B: Make login work without workspaceSlug (find user by email only, auto-resolve workspace), OR
- Option C: Default to "demo" workspace when no slug provided

**Expected:** Click "Sign In" with `demo@example.com` / `demo123` → redirects to `/demo/dashboard`

### Bug 2: Detail page color scheme mismatch
**File:** `src/app/(app)/[workspace]/contacts/[id]/page.tsx`
**Symptom:** The app has a dark theme throughout (slate-900 bg, slate-200 text). But the contact detail page was started with light-theme classes in places (text-slate-800, bg-slate-50, etc). The companies/[id], deals/[id], tasks/[id] pages may have similar issues since they were patterned after it.

**Fix:** Audit all 4 detail pages. Replace light-theme colors with dark-theme equivalents:
- `text-slate-800` → `text-slate-200` or `text-white`
- `text-slate-600` → `text-slate-400`
- `bg-slate-50` → `bg-slate-800/40` or similar
- Match the dark card style (border border-slate-800 bg-slate-900/60)

### Bug 3: Detail pages use mock/fallback data instead of real relations
**Symptom:** The detail pages fetch activities via `?entityType=X&entityId=Y` which is good. But some fields like "linked deals" or "linked tasks" require specific APIs. Need to verify these queries return data.

**Fix:** Ensure each detail page:
1. Loads the record itself from `/api/{resource}/{id}`
2. Loads related activities from `/api/activities?entityType={type}&entityId={id}`
3. Loads related records where applicable (e.g., contact detail should show their deals via `/api/deals?contactId={id}` if that filter exists)

---

## WHAT STILL NEEDS TO BE BUILT

### Phase 3: Detail Pages — Navigation + Polish (CRITICAL)
Current: 4 detail pages exist but may have theme/color issues.

- [ ] Fix color scheme on all 4 detail pages
- [ ] Ensure each detail page shows:
  - Basic record fields (DONE — just verify)
  - Related activities timeline (DONE — verify it loads)
  - "Edit" button that opens an edit modal (TODO)
  - "Delete" button with confirmation dialog (TODO)
- [ ] Ensure navigation works:
  - Contacts list row click → contact detail ✓ (exists)
  - Companies list row click → company detail ✓ (exists)
  - Deals kanban card click → deal detail ✓ (exists)
  - Tasks list row click → task detail (VERIFY)
  - Activity timeline contact/deal names → detail (TODO)

### Phase 3e: Edit Modal on all 4 detail pages
Each detail page needs an "Edit" button that opens a pre-filled modal with PATCH support.

**Needed:**
- PATCH endpoint exists for contacts, companies, deals, tasks (verify)
- Edit modal UI on each detail page
- Pre-fill form with current values
- On save: PATCH → reload data

### Phase 3f: Delete Confirmation on all 4 detail pages
Each detail page needs a "Delete" button with confirmation, then DELETE + redirect.

**Needed:**
- DELETE endpoints exist for contacts, companies, deals, tasks... mostly. Need to verify.
- Confirm dialog component
- On delete: DELETE API → redirect back to list

### Phase 3i: Settings → Team Tab
**File:** `src/app/(app)/[workspace]/settings/page.tsx`
**Current:** Team tab is a shell showing placeholder text.

**Need:**
- `src/app/api/invites/route.ts` — POST to create an invite (email, role), GET to list
- `src/app/api/invites/[id]/route.ts` — DELETE to cancel an invite
- Team tab UI: list current workspace users + pending invites + "Invite" button

### Phase 4: Polish Features (P2)
- Tags API + UI (tag creation, assignment to contacts/companies/deals)
- Sequences API + UI (email drip campaigns)
- CSV import for contacts
- Search command palette (Cmd+K)
- Email composer
- AnalyticsEvents → wire to dashboard

### Phase 5: Deploy
- Vercel setup
- Turso database migration
- Environment variable config
- Domain setup

---

## DESIGN SYSTEM REFERENCE

The CRM uses a consistent dark theme:
- Background: `bg-slate-950` (app shell), `bg-slate-900/60` (cards)
- Card border: `border border-slate-800`
- Text primary: `text-white` or `text-slate-200`
- Text secondary: `text-slate-400`
- Text muted: `text-slate-500`
- Accent: `bg-emerald-600` / `text-emerald-400` / `border-emerald-500/20`
- Icon gradients: each page has a unique gradient orb (contact = blue, company = violet, deal = amber, task = orange)
- Input style: `w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/60`
- Modal overlay: `fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm`
- Modal card: `w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl`

**Reference pages for correct styling:**
- `src/app/(app)/[workspace]/contacts/page.tsx` — the list view is correct
- `src/app/(app)/[workspace]/companies/page.tsx` — correct
- `src/app/(app)/[workspace]/deals/page.tsx` — correct
- `src/app/(app)/[workspace]/tasks/page.tsx` — correct

---

## HOW TO TEST

1. **Start dev server:** `cd "~/Desktop/Coding Projects/SaaS/crm-hub" && npx next dev -p 3000`
2. **Seed data:** `cd "~/Desktop/Coding Projects/SaaS/crm-hub" && npx tsx scripts/seed.ts`
3. **Login:** Navigate to `http://localhost:3000/login`, login with `demo@example.com` / `demo123`
4. **Verify detail pages:**
   - Go to `/demo/contacts` → click a row → verify detail page renders with correct dark theme
   - Go to `/demo/companies` → click a row → verify
   - Go to `/demo/deals` → click a kanban card → verify
   - Go to `/demo/tasks` → click a task → verify
5. **Run build after every significant change:** `npx next build`

---

## KEY FILES REFERENCE

**Detail pages (new — need fixing/polish):**
- `src/app/(app)/[workspace]/contacts/[id]/page.tsx`
- `src/app/(app)/[workspace]/companies/[id]/page.tsx`
- `src/app/(app)/[workspace]/deals/[id]/page.tsx`
- `src/app/(app)/[workspace]/tasks/[id]/page.tsx`

**List pages (working — reference for styling):**
- `src/app/(app)/[workspace]/contacts/page.tsx`
- `src/app/(app)/[workspace]/companies/page.tsx`
- `src/app/(app)/[workspace]/deals/page.tsx`
- `src/app/(app)/[workspace]/tasks/page.tsx`

**API routes:**
- `src/app/api/contacts/[id]/route.ts` — GET, PATCH, DELETE
- `src/app/api/companies/[id]/route.ts` — GET, PATCH, DELETE
- `src/app/api/deals/[id]/route.ts` — GET, PATCH, DELETE
- `src/app/api/tasks/[id]/route.ts` — GET, PATCH, DELETE
- `src/app/api/activities/route.ts` — GET with query params (entityType, entityId), POST
- `src/app/api/auth/login/route.ts` — POST

**Schema:**
- `src/lib/db/schema.ts` — all 19 tables
- `src/lib/db/index.ts` — db client setup

**Auth:**
- `src/lib/auth.ts` — hashPassword, verifyPassword, createToken
- `src/app/api/auth/login/route.ts` — login handler
- `src/middleware.ts` — workspace/auth middleware

---

## IMPORTANT RULES

1. **Verify build after every change.** Run `npx next build` and do NOT proceed until it exits 0.
2. **Never break existing working pages.** The list views (contacts, companies, deals, tasks, activities, dashboard) all work. Do not regress them.
3. **Dark theme only.** Use the existing color system. Do NOT introduce light-theme colors.
4. **Use existing API patterns.** Follow the exact same pattern as existing POST endpoints when creating new ones.
5. **Test in browser.** After fixing login, actually click through the app to verify visually.

---

## CURRENT COMMIT
Commit: `b51e295` — "WIP: Phase 3 detail pages (broken build - handoff to Claude Code)"
This is on main branch. The detail pages were written but had build errors. Those build errors have since been fixed (the commit was made, then fixes were applied on top). Build passes now.
