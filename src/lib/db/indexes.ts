// ── CRM-HUB Database Indexes ─────────────────────────────
// Add these indexes to improve query performance
// Run: drizzle-kit generate && drizzle-kit push

import { index } from "drizzle-orm/sqlite-core";
import {
  contacts,
  companies,
  deals,
  tasks,
  activities,
  sequenceEnrollments,
  customProperties,
  tagRelations,
} from "./schema";

// ── CONTACTS INDEXES ─────────────────────────────────────
// Composite index for workspace-scoped email lookups
export const contactsEmailWorkspaceIdx = index("contacts_email_workspace_idx").on(
  contacts.workspaceId,
  contacts.email
);

// Index for owner assignment queries
export const contactsOwnerIdx = index("contacts_owner_idx").on(
  contacts.ownerId,
  contacts.workspaceId
);

// Index for lifecycle stage filtering
export const contactsLifecycleIdx = index("contacts_lifecycle_idx").on(
  contacts.workspaceId,
  contacts.lifecycleStage
);

// Index for last activity sorting
export const contactsLastActivityIdx = index("contacts_last_activity_idx").on(
  contacts.workspaceId,
  contacts.lastActivityAt
);

// ── COMPANIES INDEXES ────────────────────────────────────
export const companiesOwnerIdx = index("companies_owner_idx").on(
  companies.ownerId,
  companies.workspaceId
);

export const companiesTypeIdx = index("companies_type_idx").on(
  companies.workspaceId,
  companies.type
);

// ── DEALS INDEXES ────────────────────────────────────────
// Pipeline + stage queries
export const dealsPipelineStageIdx = index("deals_pipeline_stage_idx").on(
  deals.workspaceId,
  deals.pipelineId,
  deals.stageId
);

// Status filtering (open/won/lost)
export const dealsStatusIdx = index("deals_status_idx").on(
  deals.workspaceId,
  deals.status
);

// Expected close date for forecasting
export const dealsCloseDateIdx = index("deals_close_date_idx").on(
  deals.workspaceId,
  deals.expectedCloseDate
);

// Owner pipeline queries
export const dealsOwnerIdx = index("deals_owner_idx").on(
  deals.ownerId,
  deals.workspaceId
);

// ── TASKS INDEXES ────────────────────────────────────────
// Status + priority filtering
export const tasksStatusPriorityIdx = index("tasks_status_priority_idx").on(
  tasks.workspaceId,
  tasks.status,
  tasks.priority
);

// Due date sorting (overdue tasks)
export const tasksDueDateIdx = index("tasks_due_date_idx").on(
  tasks.workspaceId,
  tasks.dueDate
);

// Owner task lists
export const tasksOwnerIdx = index("tasks_owner_idx").on(
  tasks.userId,
  tasks.workspaceId,
  tasks.status
);

// ── ACTIVITIES INDEXES ───────────────────────────────────
// Timeline queries (most recent first)
export const activitiesCreatedAtIdx = index("activities_created_at_idx").on(
  activities.workspaceId,
  activities.createdAt
);

// Entity-specific timelines
export const activitiesContactIdx = index("activities_contact_idx").on(
  activities.workspaceId,
  activities.contactId,
  activities.createdAt
);

export const activitiesDealIdx = index("activities_deal_idx").on(
  activities.workspaceId,
  activities.dealId,
  activities.createdAt
);

export const activitiesCompanyIdx = index("activities_company_idx").on(
  activities.workspaceId,
  activities.companyId,
  activities.createdAt
);

// ── SEQUENCE ENROLLMENTS INDEXES ─────────────────────────
export const sequenceEnrollmentsStatusIdx = index("sequence_enrollments_status_idx").on(
  sequenceEnrollments.sequenceId,
  sequenceEnrollments.status
);

export const sequenceEnrollmentsContactIdx = index("sequence_enrollments_contact_idx").on(
  sequenceEnrollments.contactId,
  sequenceEnrollments.status
);

// ── CUSTOM PROPERTIES INDEXES ────────────────────────────
export const customPropertiesEntityIdx = index("custom_properties_entity_idx").on(
  customProperties.workspaceId,
  customProperties.entityType
);

// ── TAG RELATIONS INDEXES ────────────────────────────────
export const tagRelationsEntityIdx = index("tag_relations_entity_idx").on(
  tagRelations.entityType,
  tagRelations.entityId
);

export const tagRelationsTagIdx = index("tag_relations_tag_idx").on(
  tagRelations.tagId,
  tagRelations.entityType
);
