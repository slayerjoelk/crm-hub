# CRM Hub — Go-Live Checklist

Everything functional is built, tested, and deploys clean. The only remaining work is
configuration (keys + turning auth on). This doc lists exactly what to set and where.

## 1. Environment variables (set in Vercel → Project → Settings → Environment Variables)

| Variable | Purpose | Notes |
|---|---|---|
| `TURSO_DATABASE_URL` | Production database | libSQL URL (`libsql://...turso.io`). Without it the app uses a local SQLite file. |
| `TURSO_AUTH_TOKEN` | Production DB auth | From the Turso dashboard. |
| `JWT_SECRET` | Session signing | **Required when auth is on.** ≥32 random chars. |
| `RESEND_API_KEY` | Email send + tracking | Without it, sequence/workflow emails are *recorded* but not delivered (status `failed: "Resend not configured"`). |
| `EMAIL_FROM` / `FROM_EMAIL` | Sender identity | e.g. `CRM Hub <crm@yourdomain.com>`. Domain must be verified in Resend. |
| `CRON_SECRET` | Protects `/api/automation/cron` | Vercel Cron auto-sends this as the `Authorization: Bearer` header. Defaults to `crm-hub-cron-secret` if unset — **change it.** |
| `NEXT_PUBLIC_APP_URL` | Absolute links + tracking pixels | Your production URL, e.g. `https://crm.yourdomain.com`. |
| `REQUIRE_AUTH` | Re-enable authentication | Set to `true` for production. **Leave unset while building.** |
| `PROSPECTING_PROVIDER` | B2B data source | Optional. Defaults to the built-in `local` provider. Set to a real provider (`apollo`, etc.) once implemented + keyed. |
| `ROOT_DOMAIN` | Subdomain multi-tenant routing | Optional. Only if you serve companies on subdomains. |

## 2. Turn authentication back on

Auth is intentionally disabled in dev. To enable for production:
1. Set `REQUIRE_AUTH=true` and `JWT_SECRET` in the environment.
2. Create your first admin user — run one of `scripts/create-prod-admin.js` / `create-admin-prod.js`
   (or register via `/register`).
3. Verify: logged-out users hitting a workspace route are redirected to `/login`.

When `REQUIRE_AUTH` is on, the dev fallbacks in `src/lib/middleware.ts` and `/api/auth/me`
become no-ops automatically — no code changes needed.

## 3. Email automation

1. Add `RESEND_API_KEY` + verified `EMAIL_FROM` domain.
2. In the Resend dashboard → Webhooks, add an endpoint pointing at:
   `https://<your-app>/api/webhooks/resend`
   (delivered / opened / clicked / bounced / complained → updates tracking + auto-stops bounced sequences).
3. (Optional) Point an inbound-parse provider at `/api/webhooks/inbound-email` so replies auto-stop sequences.

## 4. Scheduled automation (scoring · sequences · tasks · workflows)

`vercel.json` runs `/api/automation/cron` daily. Vercel Hobby caps cron at once/day — for real
outreach cadence (every 15 min) use an external scheduler instead:
- Point cron-job.org (or a local crontab via `scripts/run-automation-cron.sh`) at
  `https://<your-app>/api/automation/cron` with header `Authorization: Bearer <CRON_SECRET>`.

## 5. Security hardening (review before public launch)

- [ ] `REQUIRE_AUTH=true`, strong `JWT_SECRET`, strong `CRON_SECRET`.
- [ ] Tighten CORS in `vercel.json` — currently `Access-Control-Allow-Origin: *` (fine for first-party
      capture widgets; restrict if you don't need cross-origin).
- [ ] The public lead-capture endpoint (`/api/capture`) is intentionally unauthenticated — consider an
      `x-api-key` check (the code already reads it) if you expose it widely.

## 6. Pre-deploy verification (all currently green)

```bash
npm run lint     # 0 errors
npx tsc --noEmit # clean
npm run build    # ✓ Compiled, 57 pages
npm test         # 23/23 integration + regression tests pass
```

## 7. Deploy

```bash
vercel --prod
```

That's it — set the keys, flip `REQUIRE_AUTH=true`, and ship.
