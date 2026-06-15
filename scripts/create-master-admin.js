#!/usr/bin/env node
/**
 * Create Master Admin User - Direct Database Insert
 * Run: node scripts/create-master-admin.js
 */

const { execSync } = require("child_process");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

async function main() {
  console.log("🔐 CRM Hub — Create Master Admin\n");

  const email = "joel@crmhub.local";
  const password = "MasterAdmin2026!";
  const workspaceSlug = "default";

  console.log("📋 Creating admin account:");
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Workspace: ${workspaceSlug}\n`);

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);
  const userId = crypto.randomUUID();
  const workspaceId = crypto.randomUUID();
  const businessId = crypto.randomUUID();

  console.log("⏳ Inserting into database...\n");

  // Get DB URL from env
  let dbUrl = process.env.TURSO_DATABASE_URL;
  if (!dbUrl) {
    const env = execSync("cat .env.local .env.production 2>/dev/null", { encoding: "utf-8" });
    const match = env.match(/TURSO_DATABASE_URL=(.+)/);
    dbUrl = match ? match[1] : null;
  }

  if (!dbUrl || dbUrl.includes("your-db")) {
    console.log("❌ No valid TURSO_DATABASE_URL found.");
    console.log("\n📝 Set your Turso DB URL in .env.local first:\n");
    console.log("   TURSO_DATABASE_URL=libsql://your-db.turso.io");
    console.log("   TURSO_AUTH_TOKEN=your-token\n");
    console.log("Then run this script again.\n");
    process.exit(1);
  }

  // For local SQLite, use file path
  const localDb = "file:local.db";
  
  const queries = `
-- Create business
INSERT OR IGNORE INTO businesses (id, slug, name, created_at) 
VALUES ('${businessId}', '${workspaceSlug}', 'Default Business', datetime('now'));

-- Create workspace
INSERT OR IGNORE INTO workspaces (id, business_id, slug, name, created_at) 
VALUES ('${workspaceId}', '${businessId}', '${workspaceSlug}', 'Default Workspace', datetime('now'));

-- Create admin user
INSERT OR IGNORE INTO users (id, workspace_id, email, password_hash, role, status, created_at) 
VALUES ('${userId}', '${workspaceId}', '${email}', '${passwordHash}', 'admin', 'active', datetime('now'));

-- Select the user to confirm
SELECT id, email, role, status FROM users WHERE email='${email}';
`;

  try {
    const result = execSync(`sqlite3 ${localDb} "${queries}"`, { encoding: "utf-8" });
    console.log("✅ Master admin created successfully!\n");
    console.log("📋 Login Credentials:");
    console.log("┌─────────────────────────────────────────────────┐");
    console.log("│  URL:      https://crm-hub-ruby.vercel.app     │");
    console.log("│  Email:    joel@crmhub.local                    │");
    console.log("│  Password: MasterAdmin2026!                     │");
    console.log("└─────────────────────────────────────────────────┘");
    console.log("\n⚠️  IMPORTANT: Change your password after first login!\n");
    console.log("Database output:\n" + result);
  } catch (error) {
    console.log("❌ Error: " + error.message);
    console.log("\n💡 Try running migrations first: npm run db:push\n");
  }
}

main();
