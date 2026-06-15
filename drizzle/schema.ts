// ── CRM-HUB Database Schema Exports ───────────────────────
// Re-export schema tables from the main schema file

export {
  // Core
  businesses,
  workspaces,
  users,
  sessions,
  
  // CRM Entities
  contacts,
  companies,
  deals,
  pipelines,
  pipelineStages,
  
  // Activities & Tasks
  tasks,
  activities,
  emails,
  
  // Sequences
  sequences,
  sequenceSteps,
  sequenceEnrollments,
  
  // Organization
  tags,
  tagRelations,
  customProperties,
  customPropertyValues,
  
  // System
  webhooks,
  integrations,
  analyticsEvents,
  invites,
  notifications,
  auditLogs,
} from "../src/lib/db/schema";

// Re-export everything else (relations, types, etc.)
export * from "../src/lib/db/schema";
