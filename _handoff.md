# CRM Hub - Tier 2 Build — Stage 1 Done, Stage 2 In Progress

## Context Window Handoff — Next turn resumes Stage 2 activity logging + CSV export

## Completed (Stage 1: Pipelines Management)
- **API Routes** (all green, verified build):
  - `src/app/api/pipelines/route.ts` — list + create (with default stages)
  - `src/app/api/pipelines/[id]/route.ts` — get + patch + delete
  - `src/app/api/pipelines/[id]/stages/route.ts` — list stages + create stage + reorder
  - `src/app/api/pipelines/[id]/stages/[stageId]/route.ts` — patch stage + delete stage
- **UI**:
  - `src/app/(app)/[workspace]/pipelines/page.tsx` — 465 lines. Full CRUD: pipeline cards with stage counts, create modal with color picker + stage builder, detail view with stage management (reorder arrows, edit color/probability, delete), pipeline edit inline + delete. Design matches system (emerald CTAs, slate cards, dark theme).
  - `src/components/crm/app-shell.tsx` — added "Pipelines" nav item with `KanbanSquare` icon between Deals and Tasks.
- **Build**: `npx next build` green (exit 0)

## In Progress (Stage 2: Activity Logging + Export)
### Done so far:
- `src/components/crm/log-activity-modal.tsx` — reusable modal for logging activities. Supports types: email, call, meeting, note, task. Posts to `/api/activities`. Dark-theme styled.
- `src/app/(app)/[workspace]/contacts/[id]/page.tsx` — patched with "Log Activity" button on Activity Timeline tab + `<LogActivityModal>` at bottom.

### Remaining to complete Stage 2:
1. Patch `src/app/(app)/[workspace]/companies/[id]/page.tsx` — add Log Activity button + modal (same pattern as contacts)
2. Patch `src/app/(app)/[workspace]/deals/[id]/page.tsx` — add Log Activity button + modal
3. CSV export component — `src/components/crm/csv-export.tsx` (takes data + filename)
4. Add export buttons to list pages:
   - `src/app/(app)/[workspace]/contacts/page.tsx`
   - `src/app/(app)/[workspace]/companies/page.tsx`
   - `src/app/(app)/[workspace]/deals/page.tsx`
5. Build + verify

## Key Decisions
- All detail pages get a "Log Activity" button in their Activity Timeline section header ( emerald CTA, small size)
- CSV export is client-side (no new API routes needed) — format headers from visible columns, trigger download
- Build must stay green after every stage

## Resuming From
Next turn starts with patching company and deal detail pages, then CSV export, then build.
