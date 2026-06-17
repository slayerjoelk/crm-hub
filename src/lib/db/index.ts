import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const isPlaceholder =
  !process.env.TURSO_DATABASE_URL ||
  process.env.TURSO_DATABASE_URL === "libsql://your-db.turso.io";

const dbUrl = isPlaceholder
  ? "file:./local.db"
  : process.env.TURSO_DATABASE_URL;

const client = createClient({
  url: dbUrl!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });

// Auto-create tables on every cold start (both local and production)
export async function ensureTables() {
  try {
    // executeMultiple runs ALL statements in the script (execute() only runs the first)
    await client.executeMultiple(`
      CREATE TABLE IF NOT EXISTS businesses (id text PRIMARY KEY, slug text UNIQUE NOT NULL, name text NOT NULL, domain text, plan text NOT NULL DEFAULT 'free', status text NOT NULL DEFAULT 'active', created_at integer, updated_at integer);
      CREATE TABLE IF NOT EXISTS workspaces (id text PRIMARY KEY, slug text UNIQUE NOT NULL, name text NOT NULL, business_id text REFERENCES businesses(id) ON DELETE CASCADE, description text, domain text, logo_url text, primary_color text DEFAULT '#2563eb', accent_color text DEFAULT '#0d9488', plan text NOT NULL DEFAULT 'free', status text NOT NULL DEFAULT 'active', stripe_customer_id text, stripe_subscription_id text, billing_email text, created_at integer, updated_at integer);
      CREATE TABLE IF NOT EXISTS users (id text PRIMARY KEY, workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, email text NOT NULL, name text, avatar_url text, role text NOT NULL DEFAULT 'member', status text NOT NULL DEFAULT 'invited', timezone text DEFAULT 'UTC', last_seen_at integer, password_hash text, created_at integer, updated_at integer, UNIQUE(workspace_id, email));
      CREATE TABLE IF NOT EXISTS sessions (id text PRIMARY KEY, user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE, token text UNIQUE NOT NULL, expires_at integer NOT NULL, device_info text, ip_address text, created_at integer, updated_at integer);
      CREATE TABLE IF NOT EXISTS contacts (id text PRIMARY KEY, workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, owner_id text REFERENCES users(id) ON DELETE SET NULL, first_name text, last_name text, email text, phone text, job_title text, avatar_url text, lifecycle_stage text DEFAULT 'subscriber', lead_status text DEFAULT 'new', lead_score integer DEFAULT 0, company_id text, street_address text, city text, state text, postal_code text, country text, linkedin_url text, twitter_url text, website text, source_type text DEFAULT 'other', source_detail text, last_activity_at integer, last_engagement_at integer, email_opt_out integer DEFAULT 0, notes text, created_at integer, updated_at integer);
      CREATE TABLE IF NOT EXISTS companies (id text PRIMARY KEY, workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, owner_id text REFERENCES users(id) ON DELETE SET NULL, name text NOT NULL, domain text, description text, industry text, type text DEFAULT 'prospect', size text, lifecycle_stage text DEFAULT 'subscriber', street_address text, city text, state text, postal_code text, country text, annual_revenue real, employee_count integer, linkedin_url text, twitter_url text, facebook_url text, website text, crunchbase_url text, last_activity_at integer, last_contacted_at integer, notes text, created_at integer, updated_at integer);
      CREATE TABLE IF NOT EXISTS deals (id text PRIMARY KEY, workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, owner_id text REFERENCES users(id) ON DELETE SET NULL, name text NOT NULL, description text, value real DEFAULT 0, currency text DEFAULT 'USD', pipeline_id text NOT NULL, stage_id text NOT NULL, priority text DEFAULT 'medium', probability integer DEFAULT 0, expected_close_date integer, actual_close_date integer, status text DEFAULT 'open', close_reason text, won_reason text, lost_reason text, source_type text, source_detail text, primary_contact_id text, company_id text, notes text, created_at integer, updated_at integer);
      CREATE TABLE IF NOT EXISTS pipelines (id text PRIMARY KEY, workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, name text NOT NULL, description text, type text NOT NULL DEFAULT 'deal', is_default integer DEFAULT 0, color text DEFAULT '#4f46e5', display_order integer DEFAULT 0, created_at integer, updated_at integer);
      CREATE TABLE IF NOT EXISTS pipeline_stages (id text PRIMARY KEY, pipeline_id text NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE, name text NOT NULL, description text, display_order integer NOT NULL, color text DEFAULT '#94a3b8', win_probability integer DEFAULT 0, is_archived integer DEFAULT 0, created_at integer, updated_at integer);
      CREATE TABLE IF NOT EXISTS activities (id text PRIMARY KEY, workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, user_id text REFERENCES users(id) ON DELETE CASCADE, type text NOT NULL, contact_id text REFERENCES contacts(id) ON DELETE CASCADE, deal_id text REFERENCES deals(id) ON DELETE CASCADE, company_id text, body text, subject text, metadata text, duration_minutes integer, created_at integer);
      CREATE TABLE IF NOT EXISTS tasks (id text PRIMARY KEY, workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE, title text NOT NULL, description text, contact_id text REFERENCES contacts(id) ON DELETE CASCADE, deal_id text REFERENCES deals(id) ON DELETE CASCADE, company_id text, status text DEFAULT 'todo', priority text DEFAULT 'medium', due_date integer, completed_at integer, remind_at integer, reminded integer DEFAULT 0, created_at integer, updated_at integer);
      CREATE TABLE IF NOT EXISTS emails (id text PRIMARY KEY, workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, from_email text NOT NULL, from_name text, to_email text NOT NULL, to_name text, cc text, bcc text, subject text NOT NULL, html_body text, text_body text, sent_at integer, opened_at integer, clicked_at integer, bounced_at integer, delivery_status text DEFAULT 'pending', error text, contact_id text REFERENCES contacts(id) ON DELETE SET NULL, deal_id text REFERENCES deals(id) ON DELETE SET NULL, sequence_step_id text, direction text DEFAULT 'outbound', provider text DEFAULT 'smtp', provider_message_id text, created_at integer);
      CREATE TABLE IF NOT EXISTS sequences (id text PRIMARY KEY, workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE, name text NOT NULL, description text, status text DEFAULT 'draft', type text DEFAULT 'cold_outreach', sent_count integer DEFAULT 0, open_rate integer DEFAULT 0, click_rate integer DEFAULT 0, reply_rate integer DEFAULT 0, created_at integer, updated_at integer);
      CREATE TABLE IF NOT EXISTS sequence_steps (id text PRIMARY KEY, sequence_id text NOT NULL REFERENCES sequences(id) ON DELETE CASCADE, step_number integer NOT NULL, subject text NOT NULL, body text NOT NULL, delay_days integer DEFAULT 1, delay_hours integer DEFAULT 0, status text DEFAULT 'draft', created_at integer);
      CREATE TABLE IF NOT EXISTS sequence_enrollments (id text PRIMARY KEY, sequence_id text NOT NULL REFERENCES sequences(id) ON DELETE CASCADE, contact_id text NOT NULL REFERENCES contacts(id) ON DELETE CASCADE, status text DEFAULT 'active', current_step integer DEFAULT 0, enrolled_at integer, completed_at integer);
      CREATE TABLE IF NOT EXISTS tags (id text PRIMARY KEY, workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, name text NOT NULL, color text DEFAULT '#3b82f6', created_at integer, UNIQUE(workspace_id, name));
      CREATE TABLE IF NOT EXISTS tag_relations (tag_id text NOT NULL REFERENCES tags(id) ON DELETE CASCADE, entity_type text NOT NULL, entity_id text NOT NULL, created_at integer, PRIMARY KEY(tag_id, entity_type, entity_id));
      CREATE TABLE IF NOT EXISTS webhooks (id text PRIMARY KEY, workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, name text NOT NULL, url text NOT NULL, secret text, events text NOT NULL, is_active integer DEFAULT 1, last_triggered_at integer, last_status text, failure_count integer DEFAULT 0, created_at integer, updated_at integer);
      CREATE TABLE IF NOT EXISTS integrations (id text PRIMARY KEY, workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, provider text NOT NULL, status text DEFAULT 'pending', config text, external_account_id text, last_sync_at integer, last_error text, created_at integer, updated_at integer);
      CREATE TABLE IF NOT EXISTS analytics_events (id text PRIMARY KEY, workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, event text NOT NULL, entity_type text NOT NULL, entity_id text NOT NULL, metadata text, timestamp integer);
      CREATE TABLE IF NOT EXISTS invites (id text PRIMARY KEY, workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, email text NOT NULL, role text NOT NULL DEFAULT 'member', token text UNIQUE NOT NULL, invited_by text NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at integer NOT NULL, created_at integer);
      CREATE TABLE IF NOT EXISTS notifications (id text PRIMARY KEY, workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE, type text NOT NULL, title text NOT NULL, body text, read integer DEFAULT 0, created_at integer);
      CREATE TABLE IF NOT EXISTS audit_logs (id text PRIMARY KEY, workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, user_id text REFERENCES users(id) ON DELETE SET NULL, action text NOT NULL, entity_type text NOT NULL, entity_id text NOT NULL, metadata text, ip_address text, user_agent text, created_at integer);
      CREATE TABLE IF NOT EXISTS custom_properties (id text PRIMARY KEY, workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, entity_type text NOT NULL, name text NOT NULL, label text NOT NULL, type text NOT NULL, options text, is_required integer DEFAULT 0, display_order integer DEFAULT 0, created_at integer);
      CREATE TABLE IF NOT EXISTS custom_property_values (property_id text NOT NULL REFERENCES custom_properties(id) ON DELETE CASCADE, entity_id text NOT NULL, value text NOT NULL, created_at integer, updated_at integer, PRIMARY KEY(property_id, entity_id));
      CREATE TABLE IF NOT EXISTS workflows (id text PRIMARY KEY, workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, name text NOT NULL, description text, status text NOT NULL DEFAULT 'draft', trigger_type text NOT NULL, trigger_config text, conditions text DEFAULT '[]', actions text NOT NULL DEFAULT '[]', allow_reenrollment integer DEFAULT 0, enrolled_count integer DEFAULT 0, completed_count integer DEFAULT 0, last_run_at integer, created_by text, created_at integer, updated_at integer);
      CREATE TABLE IF NOT EXISTS workflow_executions (id text PRIMARY KEY, workflow_id text NOT NULL REFERENCES workflows(id) ON DELETE CASCADE, workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, entity_type text NOT NULL, entity_id text NOT NULL, status text NOT NULL, actions_run text, error text, created_at integer);
      CREATE TABLE IF NOT EXISTS email_templates (id text PRIMARY KEY, workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, name text NOT NULL, subject text NOT NULL, body text NOT NULL, category text DEFAULT 'custom', use_count integer DEFAULT 0, created_by text, created_at integer, updated_at integer);
      CREATE TABLE IF NOT EXISTS leads (id text PRIMARY KEY, workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, owner_id text, first_name text, last_name text, email text, phone text, job_title text, company text, website text, industry text, employee_count integer, annual_revenue real, status text NOT NULL DEFAULT 'new', rating text DEFAULT 'cold', lead_score integer DEFAULT 0, source text DEFAULT 'other', source_detail text, city text, state text, country text, linkedin_url text, notes text, is_converted integer DEFAULT 0, converted_at integer, converted_contact_id text, converted_company_id text, converted_deal_id text, last_activity_at integer, created_at integer, updated_at integer);
      CREATE TABLE IF NOT EXISTS prospects (id text PRIMARY KEY, first_name text NOT NULL, last_name text NOT NULL, title text, seniority text DEFAULT 'other', email text, company_name text NOT NULL, domain text, industry text, employee_count integer, annual_revenue real, country text, city text, linkedin_url text, technologies text, created_at integer);
      CREATE TABLE IF NOT EXISTS cases (id text PRIMARY KEY, workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, case_number integer NOT NULL, subject text NOT NULL, description text, status text NOT NULL DEFAULT 'new', priority text NOT NULL DEFAULT 'medium', type text DEFAULT 'question', origin text DEFAULT 'web', contact_id text, company_id text, owner_id text, resolved_at integer, created_at integer, updated_at integer);
      CREATE TABLE IF NOT EXISTS campaigns (id text PRIMARY KEY, workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, name text NOT NULL, type text DEFAULT 'email', status text NOT NULL DEFAULT 'planned', description text, start_date integer, end_date integer, budgeted_cost real DEFAULT 0, actual_cost real DEFAULT 0, expected_revenue real DEFAULT 0, owner_id text, created_at integer, updated_at integer);
      CREATE TABLE IF NOT EXISTS campaign_members (id text PRIMARY KEY, campaign_id text NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE, contact_id text, lead_id text, status text DEFAULT 'targeted', responded_at integer, created_at integer);
      CREATE TABLE IF NOT EXISTS products (id text PRIMARY KEY, workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, name text NOT NULL, sku text, description text, unit_price real DEFAULT 0, currency text DEFAULT 'USD', category text, billing_period text DEFAULT 'one_time', is_active integer DEFAULT 1, created_at integer, updated_at integer);
      CREATE TABLE IF NOT EXISTS quotes (id text PRIMARY KEY, workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, quote_number integer NOT NULL, name text NOT NULL, deal_id text, contact_id text, company_id text, status text NOT NULL DEFAULT 'draft', currency text DEFAULT 'USD', subtotal real DEFAULT 0, discount_percent real DEFAULT 0, tax_percent real DEFAULT 0, total real DEFAULT 0, valid_until integer, notes text, created_at integer, updated_at integer);
      CREATE TABLE IF NOT EXISTS quote_line_items (id text PRIMARY KEY, quote_id text NOT NULL REFERENCES quotes(id) ON DELETE CASCADE, product_id text, name text NOT NULL, quantity real DEFAULT 1, unit_price real DEFAULT 0, discount_percent real DEFAULT 0, line_total real DEFAULT 0, display_order integer DEFAULT 0);
      CREATE TABLE IF NOT EXISTS reports (id text PRIMARY KEY, workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, name text NOT NULL, description text, config text NOT NULL, created_by text, created_at integer, updated_at integer);
    `);

    // Self-heal: add columns that pre-date the current schema.
    // CREATE TABLE IF NOT EXISTS won't alter an existing table, so older
    // deployments (incl. the prod Turso DB) can be missing newer columns.
    const columnMigrations: Array<[string, string, string]> = [
      ["emails", "delivery_status", "text DEFAULT 'pending'"],
      ["emails", "error", "text"],
      ["companies", "parent_company_id", "text"],
    ];
    for (const [table, column, def] of columnMigrations) {
      try {
        const info = await client.execute(`PRAGMA table_info(${table})`);
        const exists = info.rows.some((r: any) => r.name === column);
        if (!exists) {
          await client.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`);
          if (process.env.NODE_ENV === "development") {
            console.log(`[DB] Added missing column ${table}.${column}`);
          }
        }
      } catch {
        // column already present or table missing — safe to ignore
      }
    }

    if (process.env.NODE_ENV === "development") {
      console.log("[DB] Tables ensured");
    }
  } catch (e) { console.error("[DB] Table creation failed:", e); }
}

export { schema };
