import { test, expect } from "@playwright/test";

const TEST_EMAIL = `e2e-${Date.now()}@test.local`;
const TEST_PASSWORD = "TestPass123!";
const TEST_NAME = "E2E User";
const TEST_WORKSPACE = `test-ws-${Date.now()}`;

test.describe("CRM Hub Smoke", () => {
  test("homepage redirects to login", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle", timeout: 15_000 });
    await expect(page).toHaveURL(/.*login.*/, { timeout: 10_000 });
  });

  test("login page renders", async ({ page }) => {
    await page.goto("/login", { waitUntil: "networkidle", timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /CRM Hub/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign In/i })).toBeVisible();
  });

  test("register page renders", async ({ page }) => {
    await page.goto("/register", { waitUntil: "networkidle", timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /Create Workspace/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('input[placeholder="Joel"]')).toBeVisible();
    await expect(page.locator('input[placeholder="you@company.com"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /Create Workspace/i })).toBeVisible();
  });

  test("register, login, and open dashboard", async ({ page }) => {
    // Register
    await page.goto("/register", { waitUntil: "networkidle", timeout: 15_000 });
    await page.fill('input[placeholder="Joel"]', TEST_NAME);
    await page.fill('input[placeholder="you@company.com"]', TEST_EMAIL);
    await page.fill('input[placeholder="••••••••"]', TEST_PASSWORD);
    await page.fill('input[placeholder="MintAgree"]', TEST_WORKSPACE);
    await page.getByRole("button", { name: /Create Workspace/i }).click();
    await page.waitForURL(new RegExp(`/${TEST_WORKSPACE}/dashboard`), { timeout: 15_000 });

    // Verify dashboard KPIs render
    await expect(page.getByText("Contacts")).toBeVisible();
    await expect(page.getByText("Companies")).toBeVisible();
    await expect(page.getByText("Deals")).toBeVisible();
    await expect(page.getByText("Revenue (Closed)")).toBeVisible();

    // Navigate to Contacts via sidebar
    await page.getByText("Contacts").click();
    await page.waitForURL(/.*\/contacts.*/, { timeout: 10_000 });
    await expect(page.getByRole("heading", { name: /Contacts/i })).toBeVisible();

    // Command palette opens
    await page.keyboard.press("Control+k");
    await expect(page.locator('input[placeholder="Search CRM..."]')).toBeVisible();
    await page.keyboard.press("Escape");
  });

  test("unauthenticated dashboard redirects to login", async ({ page }) => {
    await page.goto("/some-workspace/dashboard", { waitUntil: "networkidle", timeout: 15_000 });
    await expect(page).toHaveURL(/.*login.*/, { timeout: 10_000 });
  });

  test("logout flow", async ({ page }) => {
    // Log in fresh
    await page.goto("/login", { waitUntil: "networkidle", timeout: 15_000 });
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.getByRole("button", { name: /Sign In/i }).click();
    await page.waitForURL(/.*\/dashboard.*/, { timeout: 15_000 });

    // Logout via sidebar
    await page.getByRole("button", { name: /Logout/i }).click();
    await expect(page).toHaveURL(/.*login.*/, { timeout: 10_000 });
  });
});
