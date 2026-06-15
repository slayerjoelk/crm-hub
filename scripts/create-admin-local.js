#!/usr/bin/env node
/**
 * Create Master Admin - Direct Local Database Insert
 */

const { execSync } = require("child_process");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

async function main() {
  console.log("🔐 CRM Hub — Create Master Admin (Local DB)\n");

  const email = "joel@crmhub.local";
  const password = "MasterAdmin2026!";
  const workspaceSlug = "default";

  const passwordHash = await bcrypt.hash(password, 10);
  const userId = crypto.randomUUID();
  const workspaceId = crypto.randomUUID();
  const businessId = crypto.randomUUID();

  console.log("📋 Creating admin:");
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Workspace: ${workspaceSlug}\n`);

  const queries = [
    `INSERT OR IGNORE INTO businesses (id, slug, name, created_at) VALUES ('${businessId}', '${workspaceSlug}', 'Default Business', datetime('now'));`,
    `INSERT OR IGNORE INTO workspaces (id, business_id, slug, name, created_at) VALUES ('${workspaceId}', '${businessId}', '${workspaceSlug}', 'Default Workspace', datetime('now'));`,
    `INSERT OR IGNORE INTO users (id, workspace_id, email, password_hash, role, status, created_at) VALUES ('${userId}', '${workspaceId}', '${email}', '${passwordHash}', 'admin', 'active', datetime('now'));`,
    `SELECT id, email, role, status FROM users WHERE email='${email}';`
  ].join("\n");

  try {
    const result = execSync(`sqlite3 local.db "${queries}"`, { encoding: "utf-8" });
    
    console.log("✅ Master admin created in local database!\n");
    console.log("┌─────────────────────────────────────────────────────────┐");
    console.log("│  📋 LOGIN CREDENTIALS                                   │");
    console.log("├─────────────────────────────────────────────────────────┤");
    console.log("│  URL:      https://crm-hub-ruby.vercel.app/login       │");
    console.log("│  Email:    joel@crmhub.local                           │");
    console.log("│  Password: MasterAdmin2026!                            │");
    console.log("└─────────────────────────────────────────────────────────┘");
    console.log("\n⚠️  NOTE: This created the user in your LOCAL database.");
    console.log("    For production, you'll need to either:\n");
    console.log("    1. Manually register at: https://crm-hub-ruby.vercel.app/register");
    console.log("    2. Or set up your Turso DB and run migrations\n");
    console.log("Database output:\n" + result + "\n");
  } catch (error) {
    console.log("❌ Error: " + error.message);
    console.log("\n💡 Try running: npm run db:push\n");
  }
}

main();
