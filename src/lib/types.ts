// ── CRM-HUB TypeScript Interfaces ────────────────────────
// Type definitions to replace all `any` usage throughout the app
// Import these instead of using `any` for type safety

// ── DATABASE ENTITIES ────────────────────────────────────
export interface Contact {
  id: string;
  workspaceId: string;
  ownerId: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  avatarUrl: string | null;
  lifecycleStage: string;
  leadStatus: string;
  leadScore: number | null;
  companyId: string | null;
  streetAddress: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  website: string | null;
  lastActivityAt: Date | null;
  lastContactedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Company {
  id: string;
  workspaceId: string;
  ownerId: string | null;
  name: string;
  domain: string | null;
  description: string | null;
  industry: string | null;
  type: string;
  size: string | null;
  lifecycleStage: string | null;
  annualRevenue: number | null;
  employeeCount: number | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  facebookUrl: string | null;
  website: string | null;
  crunchbaseUrl: string | null;
  streetAddress: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  lastActivityAt: Date | null;
  lastContactedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Deal {
  id: string;
  workspaceId: string;
  pipelineId: string;
  stageId: string;
  ownerId: string | null;
  contactId: string | null;
  companyId: string | null;
  name: string;
  value: number;
  currency: string;
  status: string;
  probability: number | null;
  expectedCloseDate: Date | null;
  closedDate: Date | null;
  description: string | null;
  source: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DealStage {
  id: string;
  pipelineId: string;
  name: string;
  order: number;
  color: string | null;
  createdAt: Date;
}

export interface Pipeline {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  workspaceId: string;
  ownerId: string;
  contactId: string | null;
  companyId: string | null;
  dealId: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Activity {
  id: string;
  workspaceId: string;
  userId: string;
  type: string;
  contactId: string | null;
  dealId: string | null;
  companyId: string | null;
  taskId: string | null;
  body: string | null;
  subject: string | null;
  metadata: Record<string, unknown> | null;
  durationMinutes: number | null;
  createdAt: Date;
}

export interface Sequence {
  id: string;
  workspaceId: string;
  ownerId: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SequenceStep {
  id: string;
  sequenceId: string;
  type: string;
  delayDays: number;
  subject: string | null;
  body: string | null;
  taskId: string | null;
  order: number;
}

export interface SequenceEnrollment {
  id: string;
  sequenceId: string;
  contactId: string;
  status: string;
  currentStep: number;
  enrolledAt: Date;
  completedAt: Date | null;
}

export interface Tag {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
  description: string | null;
  createdAt: Date;
}

export interface EntityTag {
  id: string;
  workspaceId: string;
  tagId: string;
  entityType: string;
  entityId: string;
}

export interface User {
  id: string;
  workspaceId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: string;
  status: string;
  timezone: string | null;
  lastSeenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Workspace {
  id: string;
  slug: string;
  name: string;
  businessId: string | null;
  description: string | null;
  domain: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  plan: string;
  status: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  billingEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Business {
  id: string;
  slug: string;
  name: string;
  domain: string | null;
  plan: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── UI COMPONENT TYPES ───────────────────────────────────
export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

export interface ContactWithRelations extends Contact {
  company?: Company | null;
  owner?: User | null;
  tags?: Tag[];
}

export interface CompanyWithRelations extends Company {
  owner?: User | null;
  contacts?: Contact[];
  tags?: Tag[];
}

export interface DealWithRelations extends Deal {
  pipeline?: Pipeline;
  stage?: DealStage;
  contact?: Contact | null;
  company?: Company | null;
  owner?: User | null;
}

export interface TaskWithRelations extends Task {
  contact?: Contact | null;
  company?: Company | null;
  deal?: Deal | null;
  owner?: User | null;
}

export interface SequenceWithSteps extends Sequence {
  steps: SequenceStep[];
  enrollments?: SequenceEnrollment[];
}

export interface DashboardMetrics {
  totalContacts: number;
  totalCompanies: number;
  totalDeals: number;
  totalTasks: number;
  dealsWon: number;
  dealsLost: number;
  totalValue: number;
  wonValue: number;
  tasksCompleted: number;
  tasksPending: number;
}

export interface ActivityTimelineItem {
  id: string;
  type: string;
  subject: string | null;
  body: string | null;
  createdAt: Date;
  user?: User;
  contact?: Contact;
  company?: Company;
  deal?: Deal;
}

// ── API RESPONSE TYPES ───────────────────────────────────
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface AuthTokens {
  token: string;
  expiresAt: Date;
}

// ── FORM STATE TYPES ─────────────────────────────────────
export interface ContactFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  companyId: string | null;
  lifecycleStage: string;
  leadStatus: string;
  linkedinUrl: string;
  twitterUrl: string;
  website: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  notes: string;
}

export interface CompanyFormState {
  name: string;
  domain: string;
  description: string;
  industry: string;
  type: string;
  size: string;
  annualRevenue: string;
  employeeCount: string;
  linkedinUrl: string;
  twitterUrl: string;
  facebookUrl: string;
  website: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  notes: string;
}

export interface DealFormState {
  name: string;
  value: string;
  currency: string;
  pipelineId: string;
  stageId: string;
  contactId: string | null;
  companyId: string | null;
  status: string;
  expectedCloseDate: string;
  probability: string;
  description: string;
  source: string;
}

export interface TaskFormState {
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  contactId: string | null;
  companyId: string | null;
  dealId: string | null;
}
