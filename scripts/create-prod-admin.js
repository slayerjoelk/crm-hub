#!/usr/bin/env node
/**
 * Create Master Admin in Production Turso Database
 */

const { createClient } = require("@libsql/client");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

async function main() {
  console.log("🔐 CRM Hub — Create Master Admin (Production Turso DB)\n");

  const email = "joel@crmhub.local";
  const password = "MasterAdmin2026!";
  const workspaceSlug = "default";

  // Get Turso credentials from Vercel
  const dbUrl = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!dbUrl || !authToken || dbUrl.includes("your-db")) {
    console.log("❌ No valid Turso credentials found.\n");
    console.log("Run this with Vercel env:");
    console.log("   vercel env pull && node scripts/create-prod-admin.js\n");
    process.exit(1);
  }

  console.log("📋 Creating admin:");
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Workspace: ${workspaceSlug}\n`);

  const client = createClient({
    url: dbUrl,
    authToken: authToken,
  });

  const passwordHash = await bcrypt.hash(password, 10);
  const userId = crypto.randomUUID();
  const workspaceId = crypto.randomUUID();
  const businessId = crypto.randomUUID();

  try {
    // Create business
    await client.execute(`
      INSERT OR IGNORE INTO businesses (id, slug, name, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `, [businessId, workspaceSlug, "Default Business"]);

    // Create workspace
    await client.execute(`
      INSERT OR IGNORE INTO workspaces (id, business_id, slug, name, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `, [workspaceId, businessId, workspaceSlug, "Default Workspace"]);

    // Create admin user
    await client.execute(`
      INSERT OR IGNORE INTO users (id, workspace_id, email, password_hash, role, status, created_at)
      VALUES (?, ?, ?, ?, 'admin', 'active', datetime('now'))
    `, [userId, workspaceId, email, passwordHash]);

    // Verify
    const result = await client.execute(`
      SELECT id, email, role, status FROM users WHERE email = ?
    `, [email]);

    if (result.rows.length > 0) {
      console.log("✅ Master admin created in PRODUCTION database!\n");
      console.log("┌─────────────────────────────────────────────────────────┐");
      console.log("│  📋 LOGIN CREDENTIALS                                   │");
      console.log("├─────────────────────────────────────────────────────────┤");
      console.log("│  URL:      https://crm-hub-ruby.vercel.app/login       │");
      console.log("│  Email:    joel@crmhub.local                           │");
      console.log("│  Password: MasterAdmin2026!                            │");
      console.log("└─────────────────────────────────────────────────────────┘");
      console.log("\n⚠️  SECURITY: Change your password after first login!\n");
    } else {
      console.log("❌ Failed to create user. Check database schema.\n");
    }
  } catch (error) {
    console.log("❌ Error: " + error.message);
    console.log("\n💡 Make sure database tables exist. Run migrations first.\n");
  } finally {
    client.close();
  }
}

main();
