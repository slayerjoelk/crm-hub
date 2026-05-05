# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> CRM Hub Smoke >> register page renders
- Location: e2e/smoke.spec.ts:22:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /Create Workspace/i })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('heading', { name: /Create Workspace/i })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e7]: MintAgree
      - heading "Get started" [level=1] [ref=e8]
      - paragraph [ref=e9]: Enter your email to receive a magic link. No password needed.
    - generic [ref=e10]:
      - generic [ref=e11]:
        - generic [ref=e12]: Email
        - textbox "you@company.com" [ref=e13]
        - button "Send magic link" [ref=e14]
      - paragraph [ref=e15]:
        - text: Or
        - link "sign in" [ref=e16] [cursor=pointer]:
          - /url: /login
        - text: if you already have an account.
    - link "← Back to MintAgree" [ref=e18] [cursor=pointer]:
      - /url: /
  - button "Open Next.js Dev Tools" [ref=e24] [cursor=pointer]:
    - img [ref=e25]
  - alert [ref=e28]
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
> 24 |     await expect(page.getByRole("heading", { name: /Create Workspace/i })).toBeVisible({ timeout: 10_000 });
     |                                                                            ^ Error: expect(locator).toBeVisible() failed
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
  66 |     await page.fill('input[type="password"]', TEST_PASSWORD);
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