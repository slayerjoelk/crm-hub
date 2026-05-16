import { sqliteTable, text, integer, real, primaryKey, unique } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
// Simple CUID-like random ID (until @paralleldrive/cuid2 is installed)
function randId(): string {
const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
let id = "c";
for (let i = 0; i < 24; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
return id;
}
const createId = randId;
/* =========================================================
CRM-HUB Multi-Tenant Database Schema
Every table has a workspaceId FK. Row-level security
is enforced in application layer (middleware + RLS views).
========================================================= */
// ── BUSINESSES ────────────────────────────────────────────
export const businesses = sqliteTable("businesses", {
id: text("id").notNull().unique().$defaultFn(createId),
slug: text("slug").notNull().unique(),          // e.g. "claraccord"
name: text("name").notNull(),                  // e.g. "ClarAccord"
domain: text("domain"),                         // e.g. "claraccord.com"
plan: text("plan", { enum: ["free", "starter", "pro", "enterprise"] }).notNull().default("free"),
status: text("status", { enum: ["active", "suspended", "archived"] }).notNull().default("active"),
createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ── TENANT / WORKSPACE ────────────────────────────────────
export const workspaces = sqliteTable("workspaces", {
id: text("id").notNull().unique().$defaultFn(createId),
slug: text("slug").notNull().unique(),          // e.g. "mintagree"
name: text("name").notNull(),                  // e.g. "MintAgree"
// Multi-business support
businessId: text("business_id").references(() => businesses.id, { onDelete: "cascade" }),
description: text("description"),
domain: text("domain"),                         // custom domain for this workspace
logoUrl: text("logo_url"),
primaryColor: text("primary_color").default("#2563eb"),
accentColor: text("accent_color").default("#0d9488"),
plan: text("plan", { enum: ["free", "starter", "pro", "enterprise"] }).notNull().default("free"),
status: text("status", { enum: ["active", "suspended", "archived"] }).notNull().default("active"),
stripeCustomerId: text("stripe_customer_id"),
stripeSubscriptionId: text("stripe_subscription_id"),
billingEmail: text("billing_email"),
createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
// ── USER (belongs to workspace) ─────────────────────────
export const users = sqliteTable("users", {
id: text("id").notNull().unique().$defaultFn(createId),
workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
email: text("email").notNull(),
name: text("name"),
avatarUrl: text("avatar_url"),
role: text("role", { enum: ["owner", "admin", "member", "viewer"] }).notNull().default("member"),
status: text("status", { enum: ["active", "inactive", "invited"] }).notNull().default("invited"),
timezone: text("timezone").default("UTC"),
lastSeenAt: integer("last_seen_at", { mode: "timestamp" }),
passwordHash: text("password_hash"), // null for SSO
createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}, (t) => ({
uqEmailWorkspace: unique().on(t.workspaceId, t.email),
}));
// ── SESSIONS ────────────────────────────────────────────
export const sessions = sqliteTable("sessions", {
id: text("id").notNull().unique().$defaultFn(createId),
userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
token: text("token").notNull().unique(),
expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
deviceInfo: text("device_info"),
ipAddress: text("ip_address"),
createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
// ── CONTACTS ────────────────────────────────────────────
export const contacts = sqliteTable("contacts", {
id: text("id").notNull().unique().$defaultFn(createId),
workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
ownerId: text("owner_id").references(() => users.id, { onDelete: "set null" }),
// Identity
firstName: text("first_name"),
lastName: text("last_name"),
email: text("email"),
phone: text("phone"),
jobTitle: text("job_title"),
avatarUrl: text("avatar_url"),
// Lifecycle
lifecycleStage: text("lifecycle_stage", {
enum: ["subscriber", "lead", "qualified", "opportunity", "customer", "champion", "evangelist", "other"]
}).default("subscriber"),
leadStatus: text("lead_status", {
enum: ["new", "open", "in_progress", "open_deal", "unqualified", "attempted", "connected", "bad_timing"]
}).default("new"),
leadScore: integer("lead_score").default(0), // 0-100
// Company association
companyId: text("company_id").references(() => companies.id, { onDelete: "set null" }),
// Address
streetAddress: text("street_address"),
city: text("city"),
state: text("state"),
postalCode: text("postal_code"),
country: text("country"),
// Social
linkedinUrl: text("linkedin_url"),
twitterUrl: text("twitter_url"),
website: text("website"),
// Source tracking
sourceType: text("source_type", {
enum: ["organic", "paid", "referral", "social", "email", "event", "partner", "outbound", "other"]
}).default("other"),
sourceDetail: text("source_detail"),
// Engagement
lastActivityAt: integer("last_activity_at", { mode: "timestamp" }),
lastEngagementAt: integer("last_engagement_at", { mode: "timestamp" }),
emailOptOut: integer("email_opt_out", { mode: "boolean" }).default(false),
// Notes
notes: text("notes"),
createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
// ── COMPANIES (Account/Organization) ────────────────────
export const companies = sqliteTable("companies", {
id: text("id").notNull().unique().$defaultFn(createId),
workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
ownerId: text("owner_id").references(() => users.id, { onDelete: "set null" }),
name: text("name").notNull(),
domain: text("domain"), // e.g. "stripe.com"
description: text("description"),
industry: text("industry"),
type: text("type", { enum: ["prospect", "partner", "reseller", "vendor", "other"] }).default("prospect"),
size: text("size", { enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"] }),
// Lifecycle
lifecycleStage: text("lifecycle_stage", {
enum: ["subscriber", "lead", "qualified", "opportunity", "customer", "champion", "evangelist", "other"]
}).default("subscriber"),
// Address
streetAddress: text("street_address"),
city: text("city"),
state: text("state"),
postalCode: text("postal_code"),
country: text("country"),
// Revenue
annualRevenue: real("annual_revenue"),
employeeCount: integer("employee_count"),
// Social / Web
linkedinUrl: text("linkedin_url"),
twitterUrl: text("twitter_url"),
facebookUrl: text("facebook_url"),
website: text("website"),
crunchbaseUrl: text("crunchbase_url"),
// Engagement
lastActivityAt: integer("last_activity_at", { mode: "timestamp" }),
lastContactedAt: integer("last_contacted_at", { mode: "timestamp" }),
notes: text("notes"),
createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
// ── DEALS (Pipeline Opportunities) ──────────────────────
export const deals = sqliteTable("deals", {
id: text("id").notNull().unique().$defaultFn(createId),
workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
ownerId: text("owner_id").references(() => users.id, { onDelete: "set null" }),
name: text("name").notNull(),
description: text("description"),
value: real("value").default(0),
currency: text("currency").default("USD"),
// Pipeline
pipelineId: text("pipeline_id").notNull().references(() => pipelines.id, { onDelete: "cascade" }),
stageId: text("stage_id").notNull().references(() => pipelineStages.id, { onDelete: "cascade" }),
priority: text("priority", { enum: ["low", "medium", "high", "critical"] }).default("medium"),
probability: integer("probability").default(0), // 0-100
// Close date
expectedCloseDate: integer("expected_close_date", { mode: "timestamp" }),
actualCloseDate: integer("actual_close_date", { mode: "timestamp" }),
// Win/lose
status: text("status", { enum: ["open", "won", "lost", "deleted"] }).default("open"),
closeReason: text("close_reason"),
wonReason: text("won_reason"),
lostReason: text("lost_reason"),
// Source
sourceType: text("source_type"),
sourceDetail: text("source_detail"),
// Contact association
primaryContactId: text("primary_contact_id").references(() => contacts.id, { onDelete: "set null" }),
companyId: text("company_id").references(() => companies.id, { onDelete: "set null" }),
notes: text("notes"),
createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
// ── PIPELINES ─────────────────────────────────────────────
export const pipelines = sqliteTable("pipelines", {
id: text("id").notNull().unique().$defaultFn(createId),
workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
name: text("name").notNull(),
description: text("description"),
type: text("type", { enum: ["deal", "ticket", "custom"] }).notNull().default("deal"),
isDefault: integer("is_default", { mode: "boolean" }).default(false),
color: text("color").default("#4f46e5"),
displayOrder: integer("display_order").default(0),
createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
// ── PIPELINE STAGES ─────────────────────────────────────
export const pipelineStages = sqliteTable("pipeline_stages", {
id: text("id").notNull().unique().$defaultFn(createId),
pipelineId: text("pipeline_id").notNull().references(() => pipelines.id, { onDelete: "cascade" }),
name: text("name").notNull(),
description: text("description"),
displayOrder: integer("display_order").notNull(),
color: text("color").default("#94a3b8"),
winProbability: integer("win_probability").default(0),
isArchived: integer("is_archived", { mode: "boolean" }).default(false),
createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
// ── ACTIVITIES (timeline events) ────────────────────────
export const activities = sqliteTable("activities", {
id: text("id").notNull().unique().$defaultFn(createId),
workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
type: text("type", {
enum: ["email","call","meeting","note","task","deal_stage_change","deal_created","deal_won","deal_lost","contact_created","contact_updated","company_created","company_updated","sms","whatsapp","integration"]
}).notNull(),
// Association (polymorphic)
contactId: text("contact_id").references(() => contacts.id, { onDelete: "cascade" }),
dealId: text("deal_id").references(() => deals.id, { onDelete: "cascade" }),
companyId: text("company_id").references(() => companies.id, { onDelete: "cascade" }),
body: text("body"),
subject: text("subject"),
metadata: text("metadata"), // JSON string for flexible event data
durationMinutes: integer("duration_minutes"),
createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
// ── TASKS ───────────────────────────────────────────────
export const tasks = sqliteTable("tasks", {
id: text("id").notNull().unique().$defaultFn(createId),
workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
title: text("title").notNull(),
description: text("description"),
// Association
contactId: text("contact_id").references(() => contacts.id, { onDelete: "cascade" }),
dealId: text("deal_id").references(() => deals.id, { onDelete: "cascade" }),
companyId: text("company_id").references(() => companies.id, { onDelete: "cascade" }),
// Status
status: text("status", { enum: ["todo", "in_progress", "blocked", "in_review", "done", "cancelled"] }).default("todo"),
priority: text("priority", { enum: ["low", "medium", "high", "critical"] }).default("medium"),
// Scheduling
dueDate: integer("due_date", { mode: "timestamp" }),
completedAt: integer("completed_at", { mode: "timestamp" }),
// Reminders
remindAt: integer("remind_at", { mode: "timestamp" }),
reminded: integer("reminded", { mode: "boolean" }).default(false),
createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
// ── EMAILS (synced / sent) ──────────────────────────────
export const emails = sqliteTable("emails", {
id: text("id").notNull().unique().$defaultFn(createId),
workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
// Header
fromEmail: text("from_email").notNull(),
fromName: text("from_name"),
toEmail: text("to_email").notNull(),
toName: text("to_name"),
cc: text("cc"), // comma-separated
bcc: text("bcc"),
subject: text("subject").notNull(),
htmlBody: text("html_body"),
textBody: text("text_body"),
// Tracking
sentAt: integer("sent_at", { mode: "timestamp" }),
openedAt: integer("opened_at", { mode: "timestamp" }),
clickedAt: integer("clicked_at", { mode: "timestamp" }),
bouncedAt: integer("bounced_at", { mode: "timestamp" }),
// Delivery status
deliveryStatus: text("delivery_status", { enum: ["pending", "sent", "delivered", "bounced", "failed"] }).default("pending"),
error: text("error"),
// Association
contactId: text("contact_id").references(() => contacts.id, { onDelete: "set null" }),
dealId: text("deal_id").references(() => deals.id, { onDelete: "set null" }),
sequenceStepId: text("sequence_step_id"),
direction: text("direction", { enum: ["inbound", "outbound"] }).default("outbound"),
provider: text("provider", { enum: ["resend", "sendgrid", "postmark", "smtp", "gmail", "outlook", "other"] }).default("smtp"),
providerMessageId: text("provider_message_id"),
createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
// ── SEQUENCES (email campaigns / drip sequences) ────────
export const sequences = sqliteTable("sequences", {
id: text("id").notNull().unique().$defaultFn(createId),
workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
name: text("name").notNull(),
description: text("description"),
status: text("status", { enum: ["draft", "active", "paused", "archived"] }).default("draft"),
type: text("type", { enum: ["cold_outreach", "nurture", "onboarding", "follow_up", "custom"] }).default("cold_outreach"),
// Stats
sentCount: integer("sent_count").default(0),
openRate: integer("open_rate").default(0),
clickRate: integer("click_rate").default(0),
replyRate: integer("reply_rate").default(0),
createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
export const sequenceSteps = sqliteTable("sequence_steps", {
id: text("id").notNull().unique().$defaultFn(createId),
sequenceId: text("sequence_id").notNull().references(() => sequences.id, { onDelete: "cascade" }),
stepNumber: integer("step_number").notNull(),
subject: text("subject").notNull(),
body: text("body").notNull(),
delayDays: integer("delay_days").default(1), // days after previous step
delayHours: integer("delay_hours").default(0),
status: text("status", { enum: ["draft", "active"] }).default("draft"),
createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
// ── SEQUENCE ENROLLMENTS ────────────────────────────────
export const sequenceEnrollments = sqliteTable("sequence_enrollments", {
id: text("id").notNull().unique().$defaultFn(createId),
sequenceId: text("sequence_id").notNull().references(() => sequences.id, { onDelete: "cascade" }),
contactId: text("contact_id").notNull().references(() => contacts.id, { onDelete: "cascade" }),
status: text("status", { enum: ["active", "completed", "paused", "bounced", "unsubscribed", "replied"] }).default("active"),
currentStep: integer("current_step").default(0),
enrolledAt: integer("enrolled_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
completedAt: integer("completed_at", { mode: "timestamp" }),
});
// ── TAGS ────────────────────────────────────────────────
export const tags = sqliteTable("tags", {
id: text("id").notNull().unique().$defaultFn(createId),
workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
name: text("name").notNull(),
color: text("color").default("#3b82f6"),
createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}, (t) => ({
uqTagName: unique().on(t.workspaceId, t.name),
}));
// ── TAG RELATIONS (polymorphic many-to-many) ────────────
export const tagRelations = sqliteTable("tag_relations", {
tagId: text("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
entityType: text("entity_type", { enum: ["contact", "company", "deal"] }).notNull(),
entityId: text("entity_id").notNull(),
createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}, (t) => ({
pk: primaryKey({ columns: [t.tagId, t.entityType, t.entityId] }),
}));
// ── CUSTOM PROPERTIES (extend any object) ───────────────
export const customProperties = sqliteTable("custom_properties", {
id: text("id").notNull().unique().$defaultFn(createId),
workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
entityType: text("entity_type", { enum: ["contact", "company", "deal", "workspace"] }).notNull(),
name: text("name").notNull(),
label: text("label").notNull(),
type: text("type", { enum: ["text", "number", "boolean", "date", "datetime", "select", "multiselect", "email", "url", "textarea"] }).notNull(),
options: text("options"), // JSON array for select types
isRequired: integer("is_required", { mode: "boolean" }).default(false),
displayOrder: integer("display_order").default(0),
createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
export const customPropertyValues = sqliteTable("custom_property_values", {
propertyId: text("property_id").notNull().references(() => customProperties.id, { onDelete: "cascade" }),
entityId: text("entity_id").notNull(),
value: text("value").notNull(), // always stored as text, parsed by type
createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}, (t) => ({
pk: primaryKey({ columns: [t.propertyId, t.entityId] }),
}));
// ── WEBHOOKS (integration inbound) ──────────────────────
export const webhooks = sqliteTable("webhooks", {
id: text("id").notNull().unique().$defaultFn(createId),
workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
name: text("name").notNull(),
url: text("url").notNull(),
secret: text("secret"), // for signature verification
events: text("events").notNull(), // JSON array of event types
isActive: integer("is_active", { mode: "boolean" }).default(true),
lastTriggeredAt: integer("last_triggered_at", { mode: "timestamp" }),
lastStatus: text("last_status"),
failureCount: integer("failure_count").default(0),
createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
// ── INTEGRATIONS (connected apps) ──────────────────────
export const integrations = sqliteTable("integrations", {
id: text("id").notNull().unique().$defaultFn(createId),
workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
provider: text("provider", {
enum: ["stripe", "payfast", "resend", "sendgrid", "calendly", "slack", "zapier", "make", "hubspot", "salesforce", "gmail", "outlook", "notion", "linear", "custom"]
}).notNull(),
status: text("status", { enum: ["connected", "disconnected", "error", "pending"] }).default("pending"),
config: text("config"), // JSON: API keys, tokens, settings
externalAccountId: text("external_account_id"),
lastSyncAt: integer("last_sync_at", { mode: "timestamp" }),
lastError: text("last_error"),
createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
// ── ANALYTICS EVENTS ────────────────────────────────────
export const analyticsEvents = sqliteTable("analytics_events", {
id: text("id").notNull().unique().$defaultFn(createId),
workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
event: text("event").notNull(),
entityType: text("entity_type", { enum: ["contact", "company", "deal", "user", "workspace"] }).notNull(),
entityId: text("entity_id").notNull(),
metadata: text("metadata"),
timestamp: integer("timestamp", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
// ── INVITES ─────────────────────────────────────────────
export const invites = sqliteTable("invites", {
id: text("id").notNull().unique().$defaultFn(createId),
workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
email: text("email").notNull(),
role: text("role", { enum: ["admin", "member", "viewer"] }).notNull().default("member"),
token: text("token").notNull().unique(),
invitedBy: text("invited_by").notNull().references(() => users.id, { onDelete: "cascade" }),
expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
// ── NOTIFICATIONS ────────────────────────────────────────────
export const notifications = sqliteTable("notifications", {
id: text("id").notNull().unique().$defaultFn(createId),
workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
type: text("type", { enum: ["deal", "task", "contact", "company", "system"] }).notNull(),
title: text("title").notNull(),
body: text("body"),
read: integer("read", { mode: "boolean" }).default(false),
createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
// ── ACTIVITY LOGS (system-wide audit) ───────────────────
export const auditLogs = sqliteTable("audit_logs", {
id: text("id").notNull().unique().$defaultFn(createId),
workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
action: text("action").notNull(), // e.g. "contact.created", "deal.updated"
entityType: text("entity_type").notNull(),
entityId: text("entity_id").notNull(),
metadata: text("metadata"), // JSON: before/after values
ipAddress: text("ip_address"),
userAgent: text("user_agent"),
createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
