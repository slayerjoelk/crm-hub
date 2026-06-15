import { z } from "zod";

// ── AUTH ───────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
  workspaceName: z.string().min(1, "Workspace name is required"),
  workspaceSlug: z.string().regex(/^[a-z0-9-]+$/, "Workspace slug must contain only lowercase letters, numbers, and hyphens"),
});

// ── CONTACTS ──────────────────────────────────────────────
export const contactSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  companyId: z.string().optional().nullable(),
  lifecycleStage: z.enum(["subscriber", "lead", "qualified", "opportunity", "customer", "champion", "evangelist", "other"]).default("subscriber"),
  leadStatus: z.enum(["new", "open", "in_progress", "open_deal", "unqualified", "attempted", "connected", "bad_timing"]).default("new"),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  twitterUrl: z.string().url().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  streetAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  leadScore: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
});

export const contactUpdateSchema = contactSchema.partial();

// ── COMPANIES ─────────────────────────────────────────────
export const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  domain: z.string().optional(),
  description: z.string().optional(),
  industry: z.string().optional(),
  type: z.enum(["prospect", "customer", "partner", "vendor"]).default("prospect"),
  size: z.string().optional(),
  lifecycleStage: z.string().optional(),
  annualRevenue: z.number().optional().nullable(),
  employeeCount: z.number().optional().nullable(),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  twitterUrl: z.string().url().optional().or(z.literal("")),
  facebookUrl: z.string().url().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  crunchbaseUrl: z.string().url().optional().or(z.literal("")),
  streetAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
});

export const companyUpdateSchema = companySchema.partial();

// ── DEALS ─────────────────────────────────────────────────
export const dealSchema = z.object({
  name: z.string().min(1, "Deal name is required"),
  value: z.number().min(0, "Value must be positive"),
  currency: z.string().default("USD"),
  pipelineId: z.string().min(1, "Pipeline is required"),
  stageId: z.string().min(1, "Stage is required"),
  contactId: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  ownerId: z.string().optional().nullable(),
  status: z.enum(["open", "won", "lost", "archived"]).default("open"),
  expectedCloseDate: z.string().optional().nullable(),
  closedDate: z.string().optional().nullable(),
  probability: z.number().min(0).max(100).optional(),
  description: z.string().optional(),
  source: z.string().optional(),
});

export const dealUpdateSchema = dealSchema.partial();

// ── TASKS ─────────────────────────────────────────────────
export const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["not_started", "in_progress", "completed", "archived"]).default("not_started"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  dueDate: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  dealId: z.string().optional().nullable(),
  ownerId: z.string().optional().nullable(),
  completedAt: z.string().optional().nullable(),
});

export const taskUpdateSchema = taskSchema.partial();

// ── SEQUENCES ─────────────────────────────────────────────
export const sequenceStepSchema = z.object({
  type: z.enum(["email", "task", "wait"]),
  delayDays: z.number().int().min(0).default(0),
  subject: z.string().optional(),
  body: z.string().optional(),
  taskId: z.string().optional(),
});

export const sequenceSchema = z.object({
  name: z.string().min(1, "Sequence name is required"),
  description: z.string().optional(),
  steps: z.array(sequenceStepSchema).min(1, "At least one step is required"),
});

export const sequenceUpdateSchema = sequenceSchema.partial();

// ── PIPELINES ─────────────────────────────────────────────
export const pipelineStageSchema = z.object({
  name: z.string().min(1, "Stage name is required"),
  order: z.number().int().min(0),
  color: z.string().optional(),
});

export const pipelineSchema = z.object({
  name: z.string().min(1, "Pipeline name is required"),
  description: z.string().optional(),
  stages: z.array(pipelineStageSchema).min(1, "At least one stage is required"),
});

export const pipelineUpdateSchema = pipelineSchema.partial();

// ── WORKSPACES ────────────────────────────────────────────
export const workspaceSchema = z.object({
  name: z.string().min(1, "Workspace name is required"),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().optional(),
  domain: z.string().optional(),
  primaryColor: z.string().optional(),
  accentColor: z.string().optional(),
});

export const workspaceUpdateSchema = workspaceSchema.partial();

// ── TAGS ──────────────────────────────────────────────────
export const tagSchema = z.object({
  name: z.string().min(1, "Tag name is required"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color").default("#808080"),
  description: z.string().optional(),
});

export const tagUpdateSchema = tagSchema.partial();

// ── EMAIL ─────────────────────────────────────────────────
export const emailSchema = z.object({
  to: z.string().email("Invalid email address"),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Email body is required"),
  attachments: z.array(z.object({
    filename: z.string(),
    content: z.string(),
  })).optional(),
});

// ── CUSTOM FIELDS ─────────────────────────────────────────
export const customFieldSchema = z.object({
  name: z.string().min(1, "Field name is required"),
  type: z.enum(["text", "number", "date", "select", "multiselect", "boolean", "url", "email", "phone"]),
  entityType: z.enum(["contacts", "companies", "deals", "tasks"]),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  defaultValue: z.string().optional(),
});

export const customFieldValueSchema = z.object({
  fieldId: z.string(),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
});

// ── ACTIVITIES ────────────────────────────────────────────
export const activitySchema = z.object({
  type: z.enum(["note", "call", "meeting", "email", "task", "system"]),
  subject: z.string().optional(),
  body: z.string().optional(),
  contactId: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  dealId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
  durationMinutes: z.number().int().min(0).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// ── WEBHOOKS ──────────────────────────────────────────────
export const webhookSchema = z.object({
  url: z.string().url("Invalid webhook URL"),
  events: z.array(z.string()).min(1, "At least one event is required"),
  active: z.boolean().default(true),
  secret: z.string().optional(),
});

// ── INVITES ───────────────────────────────────────────────
export const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["owner", "admin", "member", "viewer"]).default("member"),
  message: z.string().optional(),
});

// ── EXPORT TYPES ──────────────────────────────────────────
export type ContactInput = z.infer<typeof contactSchema>;
export type CompanyInput = z.infer<typeof companySchema>;
export type DealInput = z.infer<typeof dealSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type SequenceInput = z.infer<typeof sequenceSchema>;
export type PipelineInput = z.infer<typeof pipelineSchema>;
export type WorkspaceInput = z.infer<typeof workspaceSchema>;
export type TagInput = z.infer<typeof tagSchema>;
export type EmailInput = z.infer<typeof emailSchema>;
export type CustomFieldInput = z.infer<typeof customFieldSchema>;
export type ActivityInput = z.infer<typeof activitySchema>;
export type WebhookInput = z.infer<typeof webhookSchema>;
export type InviteInput = z.infer<typeof inviteSchema>;
