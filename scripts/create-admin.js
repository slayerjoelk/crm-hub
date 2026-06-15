#!/usr/bin/env node
/**
 * Create Master Admin User
 * Run: node scripts/create-admin.js <email> <password> [workspace-slug]
 */

const { execSync } = require("child_process");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

async function main() {
  console.log("🔐 CRM Hub — Create Master Admin\n");

  let email = process.argv[2];
  let password = process.argv[3];
  let workspaceSlug = process.argv[4] || "default";

  if (!email) {
    email = await question("Enter admin email: ");
  }

  if (!password) {
    password = await question("Enter admin password (min 8 chars): ", { hideEchoBack: true });
  }

  if (!workspaceSlug) {
    workspaceSlug = await question("Enter workspace slug (default: 'default'): ");
  }

  console.log(`\n📧 Email: ${email}`);
  console.log(`🔑 Password: ${"*".repeat(password.length)}`);
  console.log(`🏢 Workspace: ${workspaceSlug}\n`);

  // Create admin via API call
  const curlCmd = `curl -s -X POST https://crm-hub-ruby.vercel.app/api/auth/register \\
    -H "Content-Type: application/json" \\
    -d '${JSON.stringify({ email, password, workspaceSlug, role: "admin" })}'`;

  console.log("⏳ Creating admin account...\n");

  try {
    const result = execSync(curlCmd, { encoding: "utf-8" });
    const parsed = JSON.parse(result);

    if (parsed.success || parsed.data) {
      console.log("✅ Admin account created successfully!\n");
      console.log("📋 Login Credentials:");
      console.log(`   URL: https://crm-hub-ruby.vercel.app/login`);
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
      console.log("\n⚠️  IMPORTANT: Change your password after first login!\n");
    } else {
      console.log("❌ Failed to create admin:");
      console.log(result);
    }
  } catch (error) {
    console.log("❌ Error creating admin:");
    console.log(error.message);
    console.log("\nAlternative: Manually register at https://crm-hub-ruby.vercel.app/register\n");
  }

  rl.close();
}

main();
