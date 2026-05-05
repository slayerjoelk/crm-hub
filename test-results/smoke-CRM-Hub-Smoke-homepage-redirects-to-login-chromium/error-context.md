# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> CRM Hub Smoke >> homepage redirects to login
- Location: e2e/smoke.spec.ts:9:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*login.*/
Received string:  "http://localhost:3000/"
Timeout: 10000ms

Call log:
  - Expect "toHaveURL" with timeout 10000ms
    13 × unexpected value "http://localhost:3000/"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e6]:
      - generic [ref=e8]:
        - link "MintAgree" [ref=e9] [cursor=pointer]:
          - /url: /
        - navigation "Primary" [ref=e10]:
          - link "Features" [ref=e11] [cursor=pointer]:
            - /url: /#features
          - link "Solutions" [ref=e12] [cursor=pointer]:
            - /url: /#solutions
          - link "Pricing" [ref=e13] [cursor=pointer]:
            - /url: /#pricing
          - link "Demo" [ref=e14] [cursor=pointer]:
            - /url: /demo
          - link "Login" [ref=e15] [cursor=pointer]:
            - /url: /login
          - link "Start free" [ref=e16] [cursor=pointer]:
            - /url: /demo
      - generic [ref=e19]:
        - generic [ref=e20]:
          - generic [ref=e21]: Voice or WhatsApp → Signed Agreement
          - heading "Turn verbal agreements into signed receipts — in 90 seconds." [level=1] [ref=e23]
          - paragraph [ref=e24]: Scope creep kills projects. MintAgree turns every client call or WhatsApp conversation into a binding receipt — scope, budget, due dates, and client sign-off. No contracts. No confusion.
          - generic [ref=e25]:
            - link "Send your first receipt — free" [ref=e26] [cursor=pointer]:
              - /url: /demo
            - link "See pricing" [ref=e27] [cursor=pointer]:
              - /url: /pricing
          - generic [ref=e28]:
            - generic [ref=e29]:
              - generic [ref=e30]: 90s
              - generic [ref=e31]: To send
            - generic [ref=e32]:
              - generic [ref=e33]: 2.3×
              - generic [ref=e34]: Faster approvals
            - generic [ref=e35]:
              - generic [ref=e36]: −41%
              - generic [ref=e37]: Fewer disputes
          - generic [ref=e38]:
            - paragraph [ref=e39]: Early access — join the beta
            - generic [ref=e40]:
              - generic [ref=e41]: Northstar Creative
              - generic [ref=e42]: Atlas Design
              - generic [ref=e43]: Meridian Studio
              - generic [ref=e44]: Vertex Labs
        - generic [ref=e48]:
          - generic [ref=e49]:
            - generic [ref=e50]: Conversation Receipt
            - generic [ref=e51]: "#MRC-042"
          - generic [ref=e52]:
            - generic [ref=e53]: Client
            - text: Northstar Creative
          - generic [ref=e54]:
            - generic [ref=e55]: Scope
            - text: Q2 brand refresh — logo, guidelines, 12 templates
          - generic [ref=e57]:
            - generic [ref=e58]:
              - generic [ref=e59]: Budget
              - text: $8,500
            - generic [ref=e60]:
              - generic [ref=e61]: Due
              - text: Jun 15
          - generic [ref=e62]:
            - generic [ref=e64]: Client sign-off
            - generic [ref=e65]: "8392"
          - generic [ref=e66]:
            - generic [ref=e67]: Signed by
            - text: dana.h@northstar.co · 2min ago
      - generic [ref=e70]:
        - generic [ref=e71]:
          - generic [ref=e72]:
            - img [ref=e73]
            - img [ref=e75]
            - img [ref=e77]
            - img [ref=e79]
            - img [ref=e81]
          - generic [ref=e83]: 4.8/5 from 127 reviews
        - generic [ref=e85]: 2,300+ receipts sent this month
        - generic [ref=e87]: Used by 200+ agencies
      - generic [ref=e89]:
        - heading "Three steps. Two minutes. Zero scope creep." [level=2] [ref=e91]
        - generic [ref=e94]:
          - generic [ref=e95]:
            - img [ref=e97]
            - generic [ref=e99]: "01"
            - heading "Conversation done" [level=3] [ref=e100]
            - paragraph [ref=e101]: Client call ends or WhatsApp thread wraps. Open MintAgree — the conversation is already there.
          - generic [ref=e102]:
            - img [ref=e104]
            - generic [ref=e107]: "02"
            - heading "Receipt sent" [level=3] [ref=e108]
            - paragraph [ref=e109]: Fill scope, deliverables, budget, due dates. Hit send. Delivered by email or WhatsApp — your choice. 90 seconds.
          - generic [ref=e110]:
            - img [ref=e112]
            - generic [ref=e115]: "03"
            - heading "Client signs" [level=3] [ref=e116]
            - paragraph [ref=e117]: They get a link over email or WhatsApp. Enter the one-time code. Done — binding acknowledgment. Project aligned.
      - generic [ref=e118]:
        - generic [ref=e119]:
          - heading "Built to close the gap between spoken and signed" [level=2] [ref=e120]
          - paragraph [ref=e121]: Everything you need to turn verbal agreements into binding receipts — by email or WhatsApp, without contracts, without complexity.
        - generic [ref=e122]:
          - generic [ref=e124]:
            - generic [ref=e125]:
              - img [ref=e127]
              - heading "Conversation receipts" [level=3] [ref=e130]
              - paragraph [ref=e131]: After every call or WhatsApp thread, generate a structured receipt with scope, deliverables, budget, and due dates. Clients see exactly what was agreed — nothing more, nothing less.
            - generic [ref=e132]: "POST /v1/receipts { \"scope\", \"budget\" }"
          - generic [ref=e134]:
            - img [ref=e136]
            - heading "OTP sign-off" [level=3] [ref=e139]
            - paragraph [ref=e140]: Clients acknowledge with a one-time code — no accounts, no passwords, no friction. Binding confirmation in seconds.
          - generic [ref=e142]:
            - img [ref=e144]
            - heading "Scope & budget tracking" [level=3] [ref=e147]
            - paragraph [ref=e148]: Every receipt locks scope, deliverables, and budget in writing. Disputes drop. Projects start aligned.
          - generic [ref=e150]:
            - img [ref=e152]
            - heading "Visual attachments" [level=3] [ref=e156]
            - paragraph [ref=e157]: Attach screenshots, mockups, and reference files. Schedule delivery and keep everything in one thread.
          - generic [ref=e159]:
            - img [ref=e161]
            - heading "WhatsApp integration" [level=3] [ref=e163]
            - paragraph [ref=e164]: Clients text or voice-note you on WhatsApp? Turn those conversations into structured, AI-drafted receipts — same sign-off flow, zero friction.
      - generic [ref=e165]:
        - generic [ref=e166]:
          - heading "Built for every business that closes deals on calls" [level=2] [ref=e167]
          - paragraph [ref=e168]: Nine industries. One workflow. Call → Receipt → Sign-off.
        - generic [ref=e169]:
          - generic [ref=e170]:
            - generic [ref=e172]:
              - heading "Agencies" [level=3] [ref=e173]
              - link "See how →" [ref=e174] [cursor=pointer]:
                - /url: /solutions/agencies
            - paragraph [ref=e175]: Marketing, creative, and digital agencies. Confirm scope, budget, deliverables, and timelines after every client call or WhatsApp thread with a single receipt.
          - generic [ref=e176]:
            - generic [ref=e178]:
              - heading "Consultants" [level=3] [ref=e179]
              - link "See how →" [ref=e180] [cursor=pointer]:
                - /url: /solutions/consultants
            - paragraph [ref=e181]: Summarize discovery calls and WhatsApp conversations into OTP-signed receipts. Stakeholders approve next steps the same day.
          - generic [ref=e182]:
            - generic [ref=e184]:
              - heading "Freelancers" [level=3] [ref=e185]
              - link "See how →" [ref=e186] [cursor=pointer]:
                - /url: /solutions/freelancers
            - paragraph [ref=e187]: Turn voice notes and WhatsApp messages into client approvals. Capture OTP sign-off on scope and revisions to eliminate scope creep.
          - generic [ref=e188]:
            - generic [ref=e190]:
              - heading "SMBs" [level=3] [ref=e191]
              - link "See how →" [ref=e192] [cursor=pointer]:
                - /url: /solutions/smb
            - paragraph [ref=e193]: Standardize post-call documentation across teams. Attach visuals, set due dates, and build a searchable paper trail.
          - generic [ref=e194]:
            - generic [ref=e196]:
              - heading "MSPs & IT" [level=3] [ref=e197]
              - link "See how →" [ref=e198] [cursor=pointer]:
                - /url: /solutions/msp
            - paragraph [ref=e199]: Confirm tickets, changes, and budgets via receipts your clients sign with a one-time code. Lower churn.
          - generic [ref=e200]:
            - generic [ref=e202]:
              - heading "Construction" [level=3] [ref=e203]
              - link "See how →" [ref=e204] [cursor=pointer]:
                - /url: /solutions/construction
            - paragraph [ref=e205]: Lightweight change-order receipts with photos, dates, and OTP. Field-ready, office-backed.
          - generic [ref=e206]:
            - generic [ref=e208]:
              - heading "Legal & Intake" [level=3] [ref=e209]
              - link "See how →" [ref=e210] [cursor=pointer]:
                - /url: /solutions/legal
            - paragraph [ref=e211]: "Capture engagement terms post-intake: scope, fees, deadlines — archive the signed receipt as the record."
          - generic [ref=e212]:
            - generic [ref=e214]:
              - heading "Sales teams" [level=3] [ref=e215]
              - link "See how →" [ref=e216] [cursor=pointer]:
                - /url: /solutions/sales
            - paragraph [ref=e217]: Turn verbal "yes" into signed acknowledgement of commercials and next steps. Pipeline moves faster.
          - generic [ref=e218]:
            - generic [ref=e220]:
              - heading "Enterprise" [level=3] [ref=e221]
              - link "See how →" [ref=e222] [cursor=pointer]:
                - /url: /solutions/enterprise
            - paragraph [ref=e223]: Governance-ready receipts with SSO, audit trail, and compliance-grade document handling.
      - generic [ref=e224]:
        - generic [ref=e225]:
          - heading "Simple, transparent pricing" [level=2] [ref=e226]
          - paragraph [ref=e227]: Start free. Upgrade when you need more seats and power.
        - generic [ref=e228]:
          - generic [ref=e229]: Monthly
          - switch [ref=e230]
          - generic [ref=e232]: Annual Save 20%
        - generic [ref=e233]:
          - generic [ref=e234]:
            - generic [ref=e235]: Free
            - generic [ref=e236]:
              - generic [ref=e237]: $0
              - text: /mo
            - list [ref=e238]:
              - listitem [ref=e239]:
                - img [ref=e240]
                - text: 1 seat
              - listitem [ref=e242]:
                - img [ref=e243]
                - text: 5 receipts / month
              - listitem [ref=e245]:
                - img [ref=e246]
                - text: Basic OTP sign-off
              - listitem [ref=e248]:
                - img [ref=e249]
                - text: Client portal
            - link "Start free" [ref=e251] [cursor=pointer]:
              - /url: /demo
          - generic [ref=e252]:
            - generic [ref=e253]: Starter
            - generic [ref=e254]:
              - generic [ref=e255]: $19
              - text: /mo
            - list [ref=e256]:
              - listitem [ref=e257]:
                - img [ref=e258]
                - text: Up to 3 seats
              - listitem [ref=e260]:
                - img [ref=e261]
                - text: Unlimited receipts
              - listitem [ref=e263]:
                - img [ref=e264]
                - text: OTP sign-off
              - listitem [ref=e266]:
                - img [ref=e267]
                - text: Client portal
              - listitem [ref=e269]:
                - img [ref=e270]
                - text: Reminders
            - link "Subscribe" [ref=e272] [cursor=pointer]:
              - /url: /pricing?plan=starter
          - generic [ref=e273]:
            - generic [ref=e274]: Best value
            - generic [ref=e275]: Pro
            - generic [ref=e276]:
              - generic [ref=e277]: $39
              - text: /mo
            - list [ref=e278]:
              - listitem [ref=e279]:
                - img [ref=e280]
                - text: Up to 10 seats
              - listitem [ref=e282]:
                - img [ref=e283]
                - text: Unlimited receipts
              - listitem [ref=e285]:
                - img [ref=e286]
                - text: Assignments
              - listitem [ref=e288]:
                - img [ref=e289]
                - text: Advanced reminders
              - listitem [ref=e291]:
                - img [ref=e292]
                - text: Priority support
            - link "Start free trial" [ref=e294] [cursor=pointer]:
              - /url: /pricing?plan=pro
          - generic [ref=e295]:
            - generic [ref=e296]: Enterprise
            - generic [ref=e297]:
              - generic [ref=e298]: $149
              - text: /mo
            - list [ref=e299]:
              - listitem [ref=e300]:
                - img [ref=e301]
                - text: Unlimited seats
              - listitem [ref=e303]:
                - img [ref=e304]
                - text: SSO & audit trail
              - listitem [ref=e306]:
                - img [ref=e307]
                - text: Custom playbooks
              - listitem [ref=e309]:
                - img [ref=e310]
                - text: Dedicated support
              - listitem [ref=e312]:
                - img [ref=e313]
                - text: SLA guarantee
            - link "Subscribe" [ref=e315] [cursor=pointer]:
              - /url: /pricing?plan=enterprise
        - paragraph [ref=e316]: 14-day money-back guarantee. Cancel anytime.
        - generic [ref=e317]:
          - heading "Compare plans" [level=3] [ref=e318]
          - generic [ref=e320]:
            - generic [ref=e321]: Feature
            - generic [ref=e322]: Free
            - generic [ref=e323]: Starter
            - generic [ref=e324]: Pro
            - generic [ref=e325]: Enterprise
            - generic [ref=e326]:
              - generic [ref=e327]: Receipts
              - generic [ref=e328]: 5/mo
              - generic [ref=e329]: Unlimited
              - generic [ref=e330]: Unlimited
              - generic [ref=e331]: Unlimited
            - generic [ref=e332]:
              - generic [ref=e333]: Seats
              - generic [ref=e334]: "1"
              - generic [ref=e335]: "3"
              - generic [ref=e336]: "10"
              - generic [ref=e337]: Unlimited
            - generic [ref=e338]:
              - generic [ref=e339]: OTP sign-off
              - img [ref=e341]
              - img [ref=e344]
              - img [ref=e347]
              - img [ref=e350]
            - generic [ref=e352]:
              - generic [ref=e353]: Client portal
              - img [ref=e355]
              - img [ref=e358]
              - img [ref=e361]
              - img [ref=e364]
            - generic [ref=e366]:
              - generic [ref=e367]: Reminders
              - generic [ref=e368]: —
              - img [ref=e370]
              - img [ref=e373]
              - img [ref=e376]
            - generic [ref=e378]:
              - generic [ref=e379]: Assignments
              - generic [ref=e380]: —
              - generic [ref=e381]: —
              - img [ref=e383]
              - img [ref=e386]
            - generic [ref=e388]:
              - generic [ref=e389]: Priority support
              - generic [ref=e390]: —
              - generic [ref=e391]: —
              - img [ref=e393]
              - img [ref=e396]
            - generic [ref=e398]:
              - generic [ref=e399]: SSO & audit trail
              - generic [ref=e400]: —
              - generic [ref=e401]: —
              - generic [ref=e402]: —
              - img [ref=e404]
      - generic [ref=e406]:
        - heading "Frequently asked questions" [level=2] [ref=e407]
        - generic [ref=e408]:
          - button "What is a conversation receipt?" [ref=e410]:
            - text: What is a conversation receipt?
            - img [ref=e411]
          - button "How does OTP sign-off work?" [ref=e413]:
            - text: How does OTP sign-off work?
            - img [ref=e414]
          - button "Can I send receipts over WhatsApp?" [ref=e416]:
            - text: Can I send receipts over WhatsApp?
            - img [ref=e417]
          - button "Do I need a credit card?" [ref=e419]:
            - text: Do I need a credit card?
            - img [ref=e420]
          - button "Can I switch plans?" [ref=e422]:
            - text: Can I switch plans?
            - img [ref=e423]
          - button "Is this legally binding?" [ref=e425]:
            - text: Is this legally binding?
            - img [ref=e426]
          - button "Can I attach files to receipts?" [ref=e428]:
            - text: Can I attach files to receipts?
            - img [ref=e429]
          - button "What industries use MintAgree?" [ref=e431]:
            - text: What industries use MintAgree?
            - img [ref=e432]
          - button "Can I cancel anytime?" [ref=e434]:
            - text: Can I cancel anytime?
            - img [ref=e435]
      - generic [ref=e437]:
        - heading "Stop losing money to scope creep." [level=2] [ref=e438]
        - paragraph [ref=e439]: Your first receipt is free. No credit card required.
        - paragraph [ref=e440]: Get your clients aligned before the project starts. Not after it explodes.
        - generic [ref=e441]:
          - link "Start free" [ref=e442] [cursor=pointer]:
            - /url: /demo
          - link "Book a 15-min demo" [ref=e443] [cursor=pointer]:
            - /url: /demo
        - generic [ref=e444]:
          - generic [ref=e445]:
            - img [ref=e446]
            - text: SOC 2 Type II in progress
          - generic [ref=e448]:
            - img [ref=e449]
            - text: 99.9% uptime
          - generic [ref=e451]:
            - img [ref=e452]
            - text: End-to-end encrypted
      - generic [ref=e455]:
        - generic [ref=e456]:
          - generic [ref=e457]:
            - link "MintAgree" [ref=e458] [cursor=pointer]:
              - /url: /
            - paragraph [ref=e459]: Voice agreement & client sign-off software. Turn every call into a binding receipt.
            - generic [ref=e460]:
              - paragraph [ref=e461]: Get tips on client management
              - generic [ref=e462]:
                - textbox "you@company.com" [ref=e463]
                - button "Subscribe" [ref=e464]
          - generic [ref=e465]:
            - heading "Product" [level=4] [ref=e466]
            - list [ref=e467]:
              - listitem [ref=e468]:
                - link "Features" [ref=e469] [cursor=pointer]:
                  - /url: /#features
              - listitem [ref=e470]:
                - link "Pricing" [ref=e471] [cursor=pointer]:
                  - /url: /pricing
              - listitem [ref=e472]:
                - link "Live demo" [ref=e473] [cursor=pointer]:
                  - /url: /demo
              - listitem [ref=e474]:
                - link "Changelog" [ref=e475] [cursor=pointer]:
                  - /url: /#changelog
          - generic [ref=e476]:
            - heading "Company" [level=4] [ref=e477]
            - list [ref=e478]:
              - listitem [ref=e479]:
                - link "About" [ref=e480] [cursor=pointer]:
                  - /url: /about
              - listitem [ref=e481]:
                - link "Blog" [ref=e482] [cursor=pointer]:
                  - /url: /blog
              - listitem [ref=e483]:
                - link "Careers" [ref=e484] [cursor=pointer]:
                  - /url: /careers
              - listitem [ref=e485]:
                - link "Contact" [ref=e486] [cursor=pointer]:
                  - /url: mailto:support@mintagree.com
          - generic [ref=e487]:
            - heading "Legal" [level=4] [ref=e488]
            - list [ref=e489]:
              - listitem [ref=e490]:
                - link "Privacy Policy" [ref=e491] [cursor=pointer]:
                  - /url: /privacy
              - listitem [ref=e492]:
                - link "Terms of Service" [ref=e493] [cursor=pointer]:
                  - /url: /terms
              - listitem [ref=e494]:
                - link "Security" [ref=e495] [cursor=pointer]:
                  - /url: /security
          - generic [ref=e496]:
            - heading "Social" [level=4] [ref=e497]
            - list [ref=e498]:
              - listitem [ref=e499]:
                - link "Twitter / X" [ref=e500] [cursor=pointer]:
                  - /url: https://x.com/mintagree
              - listitem [ref=e501]:
                - link "LinkedIn" [ref=e502] [cursor=pointer]:
                  - /url: https://linkedin.com/company/mintagree
              - listitem [ref=e503]:
                - link "GitHub" [ref=e504] [cursor=pointer]:
                  - /url: https://github.com/slayerjoelk/mintagree
        - generic [ref=e505]:
          - paragraph [ref=e506]: © 2026 MintAgree. All rights reserved. Made in South Africa 🇿🇦
          - generic [ref=e507]:
            - link "X" [ref=e508] [cursor=pointer]:
              - /url: https://x.com/mintagree
            - link "LinkedIn" [ref=e509] [cursor=pointer]:
              - /url: https://linkedin.com/company/mintagree
            - link "GitHub" [ref=e510] [cursor=pointer]:
              - /url: https://github.com/slayerjoelk/mintagree
  - generic [ref=e515] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e516]:
      - img [ref=e517]
    - generic [ref=e520]:
      - button "Open issues overlay" [ref=e521]:
        - generic [ref=e522]:
          - generic [ref=e523]: "0"
          - generic [ref=e524]: "1"
        - generic [ref=e525]: Issue
      - button "Collapse issues badge" [ref=e526]:
        - img [ref=e527]
  - alert [ref=e529]
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
> 11 |     await expect(page).toHaveURL(/.*login.*/, { timeout: 10_000 });
     |                        ^ Error: expect(page).toHaveURL(expected) failed
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