/**
 * Single source of truth for whether auth is bypassed.
 *
 * Fail-secure: authentication is ALWAYS enforced in production. The dev bypass
 * (no login required) only applies to local/non-production runs. This prevents
 * the multi-tenant data-exposure footgun where a production deploy without
 * REQUIRE_AUTH set would serve every workspace's data to anyone.
 *
 *  - Local dev (NODE_ENV !== "production"): auth bypassed by default; set
 *    REQUIRE_AUTH=true to test the real login flow.
 *  - Production: auth required. To run an intentional no-auth demo you must
 *    explicitly opt in with ALLOW_INSECURE_NO_AUTH=true — it can never happen
 *    by accident.
 */
export function isAuthDisabled(): boolean {
  if (process.env.ALLOW_INSECURE_NO_AUTH === "true") return true;
  if (process.env.NODE_ENV === "production") return false;
  return process.env.REQUIRE_AUTH !== "true";
}

/** Convenience inverse, for the redirect/guard side of the middleware. */
export function isAuthRequired(): boolean {
  return !isAuthDisabled();
}
