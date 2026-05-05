# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> CRM Hub Smoke >> logout flow
- Location: e2e/smoke.spec.ts:62:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[type="password"]')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e7]: AgreeMint
      - heading "Sign in" [level=1] [ref=e8]
      - paragraph [ref=e9]: Enter your email to receive a magic link.
    - generic [ref=e11]:
      - generic [ref=e12]: Email
      - textbox "you@company.com" [active] [ref=e13]: e2e-1777962874780@test.local
      - button "Send magic link" [ref=e14]
    - link "← Back to AgreeMint" [ref=e16] [cursor=pointer]:
      - /url: /
  - button "Open Next.js Dev Tools" [ref=e22] [cursor=pointer]:
    - img [ref=e23]
  - alert [ref=e26]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | const TEST_EMAIL = `e2e-${Date.now()}@test.local`;
  4  | const TEST_PASSWORD = "TestPass123!";
  5  | const TEST_NAME = "E2E User";
  6  | const TEST_WORKSPACE = `test-ws-${Date.now()}`;
  7  | 
  8  | test.describe("CRM Hub Smoke", () => {
  9  |   test("homepage redirects to login", async ({ page }) => {
  10 |     await page.goto("/", { waitUntil: "networkidle", timeout: 15_000 });
  11 |     await expect(page).toHaveURL(/.*login.*/, { timeout: 10_000 });
  12 |   });
  13 | 
  14 |   test("login page renders", async ({ page }) => {
  15 |     await page.goto("/login", { waitUntil: "networkidle", timeout: 15_000 });
  16 |     await expect(page.getByRole("heading", { name: /CRM Hub/i })).toBeVisible({ timeout: 10_000 });
  17 |     await expect(page.locator('input[type="email"]')).toBeVisible();
  18 |     await expect(page.locator('input[type="password"]')).toBeVisible();
  19 |     await expect(page.getByRole("button", { name: /Sign In/i })).toBeVisible();
  20 |   });
  21 | 
  22 |   test("register page renders", async ({ page }) => {
  23 |     await page.goto("/register", { waitUntil: "networkidle", timeout: 15_000 });
  24 |     await expect(page.getByRole("heading", { name: /Create Workspace/i })).toBeVisible({ timeout: 10_000 });
  25 |     await expect(page.locator('input[placeholder="Joel"]')).toBeVisible();
  26 |     await expect(page.locator('input[placeholder="you@company.com"]')).toBeVisible();
  27 |     await expect(page.getByRole("button", { name: /Create Workspace/i })).toBeVisible();
  28 |   });
  29 | 
  30 |   test("register, login, and open dashboard", async ({ page }) => {
  31 |     // Register
  32 |     await page.goto("/register", { waitUntil: "networkidle", timeout: 15_000 });
  33 |     await page.fill('input[placeholder="Joel"]', TEST_NAME);
  34 |     await page.fill('input[placeholder="you@company.com"]', TEST_EMAIL);
  35 |     await page.fill('input[placeholder="••••••••"]', TEST_PASSWORD);
  36 |     await page.fill('input[placeholder="MintAgree"]', TEST_WORKSPACE);
  37 |     await page.getByRole("button", { name: /Create Workspace/i }).click();
  38 |     await page.waitForURL(new RegExp(`/${TEST_WORKSPACE}/dashboard`), { timeout: 15_000 });
  39 | 
  40 |     // Verify dashboard KPIs render
  41 |     await expect(page.getByText("Contacts")).toBeVisible();
  42 |     await expect(page.getByText("Companies")).toBeVisible();
  43 |     await expect(page.getByText("Deals")).toBeVisible();
  44 |     await expect(page.getByText("Revenue (Closed)")).toBeVisible();
  45 | 
  46 |     // Navigate to Contacts via sidebar
  47 |     await page.getByText("Contacts").click();
  48 |     await page.waitForURL(/.*\/contacts.*/, { timeout: 10_000 });
  49 |     await expect(page.getByRole("heading", { name: /Contacts/i })).toBeVisible();
  50 | 
  51 |     // Command palette opens
  52 |     await page.keyboard.press("Control+k");
  53 |     await expect(page.locator('input[placeholder="Search CRM..."]')).toBeVisible();
  54 |     await page.keyboard.press("Escape");
  55 |   });
  56 | 
  57 |   test("unauthenticated dashboard redirects to login", async ({ page }) => {
  58 |     await page.goto("/some-workspace/dashboard", { waitUntil: "networkidle", timeout: 15_000 });
  59 |     await expect(page).toHaveURL(/.*login.*/, { timeout: 10_000 });
  60 |   });
  61 | 
  62 |   test("logout flow", async ({ page }) => {
  63 |     // Log in fresh
  64 |     await page.goto("/login", { waitUntil: "networkidle", timeout: 15_000 });
  65 |     await page.fill('input[type="email"]', TEST_EMAIL);
> 66 |     await page.fill('input[type="password"]', TEST_PASSWORD);
     |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  67 |     await page.getByRole("button", { name: /Sign In/i }).click();
  68 |     await page.waitForURL(/.*\/dashboard.*/, { timeout: 15_000 });
  69 | 
  70 |     // Logout via sidebar
  71 |     await page.getByRole("button", { name: /Logout/i }).click();
  72 |     await expect(page).toHaveURL(/.*login.*/, { timeout: 10_000 });
  73 |   });
  74 | });
  75 | 
```