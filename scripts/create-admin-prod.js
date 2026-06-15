#!/usr/bin/env node
/**
 * Create Master Admin via Production API
 * Uses the deployed Vercel app's registration endpoint
 */

const { execSync } = require("child_process");

async function main() {
  console.log("🔐 CRM Hub — Create Master Admin (via Production API)\n");

  const email = "joel@crmhub.local";
  const password = "MasterAdmin2026!";
  const workspaceSlug = "default";

  console.log("📋 Admin credentials:");
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Workspace: ${workspaceSlug}\n`);

  const payload = JSON.stringify({
    email,
    password,
    workspaceSlug,
    role: "admin",
  });

  console.log("⏳ Calling registration API...\n");

  try {
    const cmd = `curl -s -X POST https://crm-hub-ruby.vercel.app/api/auth/register \\
      -H "Content-Type: application/json" \\
      -d '${payload}'`;

    const result = execSync(cmd, { encoding: "utf-8" });
    const parsed = JSON.parse(result);

    console.log("📡 API Response:");
    console.log(JSON.stringify(parsed, null, 2));

    if (parsed.success || parsed.data) {
      console.log("\n✅ Master admin created successfully!\n");
      console.log("┌─────────────────────────────────────────────────────────┐");
      console.log("│  📋 LOGIN CREDENTIALS                                   │");
      console.log("├─────────────────────────────────────────────────────────┤");
      console.log("│  URL:      https://crm-hub-ruby.vercel.app/login       │");
      console.log("│  Email:    joel@crmhub.local                           │");
      console.log("│  Password: MasterAdmin2026!                            │");
      console.log("└─────────────────────────────────────────────────────────┘");
      console.log("\n⚠️  SECURITY: Change your password after first login!\n");
    } else if (parsed.error) {
      console.log("\n⚠️  Account may already exist or error occurred:");
      console.log(`   ${parsed.error}\n`);
      console.log("Try logging in directly at: https://crm-hub-ruby.vercel.app/login\n");
    }
  } catch (error) {
    console.log("❌ Error: " + error.message);
    console.log("\n💡 You can also register manually at: https://crm-hub-ruby.vercel.app/register\n");
  }
}

main();
