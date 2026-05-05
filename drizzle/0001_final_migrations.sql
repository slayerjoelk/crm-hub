CREATE TABLE `activities` (
	`id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`contact_id` text,
	`deal_id` text,
	`company_id` text,
	`body` text,
	`subject` text,
	`metadata` text,
	`duration_minutes` integer,
	`created_at` integer,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`deal_id`) REFERENCES `deals`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `activities_id_unique` ON `activities` (`id`);--> statement-breakpoint
CREATE TABLE `analytics_events` (
	`id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`event` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`metadata` text,
	`timestamp` integer,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `analytics_events_id_unique` ON `analytics_events` (`id`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`metadata` text,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `audit_logs_id_unique` ON `audit_logs` (`id`);--> statement-breakpoint
CREATE TABLE `companies` (
	`id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`owner_id` text,
	`name` text NOT NULL,
	`domain` text,
	`description` text,
	`industry` text,
	`type` text DEFAULT 'prospect',
	`size` text,
	`lifecycle_stage` text DEFAULT 'subscriber',
	`street_address` text,
	`city` text,
	`state` text,
	`postal_code` text,
	`country` text,
	`annual_revenue` real,
	`employee_count` integer,
	`linkedin_url` text,
	`twitter_url` text,
	`facebook_url` text,
	`website` text,
	`crunchbase_url` text,
	`last_activity_at` integer,
	`last_contacted_at` integer,
	`notes` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `companies_id_unique` ON `companies` (`id`);--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`owner_id` text,
	`first_name` text,
	`last_name` text,
	`email` text,
	`phone` text,
	`job_title` text,
	`avatar_url` text,
	`lifecycle_stage` text DEFAULT 'subscriber',
	`lead_status` text DEFAULT 'new',
	`lead_score` integer DEFAULT 0,
	`company_id` text,
	`street_address` text,
	`city` text,
	`state` text,
	`postal_code` text,
	`country` text,
	`linkedin_url` text,
	`twitter_url` text,
	`website` text,
	`source_type` text DEFAULT 'other',
	`source_detail` text,
	`last_activity_at` integer,
	`last_engagement_at` integer,
	`email_opt_out` integer DEFAULT false,
	`notes` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `contacts_id_unique` ON `contacts` (`id`);--> statement-breakpoint
CREATE TABLE `custom_properties` (
	`id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`name` text NOT NULL,
	`label` text NOT NULL,
	`type` text NOT NULL,
	`options` text,
	`is_required` integer DEFAULT false,
	`display_order` integer DEFAULT 0,
	`created_at` integer,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `custom_properties_id_unique` ON `custom_properties` (`id`);--> statement-breakpoint
CREATE TABLE `custom_property_values` (
	`property_id` text NOT NULL,
	`entity_id` text NOT NULL,
	`value` text NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	PRIMARY KEY(`property_id`, `entity_id`),
	FOREIGN KEY (`property_id`) REFERENCES `custom_properties`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `deals` (
	`id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`owner_id` text,
	`name` text NOT NULL,
	`description` text,
	`value` real DEFAULT 0,
	`currency` text DEFAULT 'USD',
	`pipeline_id` text NOT NULL,
	`stage_id` text NOT NULL,
	`priority` text DEFAULT 'medium',
	`probability` integer DEFAULT 0,
	`expected_close_date` integer,
	`actual_close_date` integer,
	`status` text DEFAULT 'open',
	`close_reason` text,
	`won_reason` text,
	`lost_reason` text,
	`source_type` text,
	`source_detail` text,
	`primary_contact_id` text,
	`company_id` text,
	`notes` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`pipeline_id`) REFERENCES `pipelines`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`stage_id`) REFERENCES `pipeline_stages`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`primary_contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `deals_id_unique` ON `deals` (`id`);--> statement-breakpoint
CREATE TABLE `emails` (
	`id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`from_email` text NOT NULL,
	`from_name` text,
	`to_email` text NOT NULL,
	`to_name` text,
	`cc` text,
	`bcc` text,
	`subject` text NOT NULL,
	`html_body` text,
	`text_body` text,
	`sent_at` integer,
	`opened_at` integer,
	`clicked_at` integer,
	`bounced_at` integer,
	`contact_id` text,
	`deal_id` text,
	`sequence_step_id` text,
	`direction` text DEFAULT 'outbound',
	`provider` text DEFAULT 'smtp',
	`provider_message_id` text,
	`created_at` integer,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`deal_id`) REFERENCES `deals`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `emails_id_unique` ON `emails` (`id`);--> statement-breakpoint
CREATE TABLE `integrations` (
	`id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`provider` text NOT NULL,
	`status` text DEFAULT 'pending',
	`config` text,
	`external_account_id` text,
	`last_sync_at` integer,
	`last_error` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `integrations_id_unique` ON `integrations` (`id`);--> statement-breakpoint
CREATE TABLE `invites` (
	`id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`token` text NOT NULL,
	`invited_by` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invited_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invites_id_unique` ON `invites` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `invites_token_unique` ON `invites` (`token`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`read` integer DEFAULT false,
	`created_at` integer,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notifications_id_unique` ON `notifications` (`id`);--> statement-breakpoint
CREATE TABLE `pipeline_stages` (
	`id` text NOT NULL,
	`pipeline_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`display_order` integer NOT NULL,
	`color` text DEFAULT '#94a3b8',
	`win_probability` integer DEFAULT 0,
	`is_archived` integer DEFAULT false,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`pipeline_id`) REFERENCES `pipelines`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pipeline_stages_id_unique` ON `pipeline_stages` (`id`);--> statement-breakpoint
CREATE TABLE `pipelines` (
	`id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`type` text DEFAULT 'deal' NOT NULL,
	`is_default` integer DEFAULT false,
	`color` text DEFAULT '#4f46e5',
	`display_order` integer DEFAULT 0,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pipelines_id_unique` ON `pipelines` (`id`);--> statement-breakpoint
CREATE TABLE `sequence_enrollments` (
	`id` text NOT NULL,
	`sequence_id` text NOT NULL,
	`contact_id` text NOT NULL,
	`status` text DEFAULT 'active',
	`current_step` integer DEFAULT 0,
	`enrolled_at` integer,
	`completed_at` integer,
	FOREIGN KEY (`sequence_id`) REFERENCES `sequences`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sequence_enrollments_id_unique` ON `sequence_enrollments` (`id`);--> statement-breakpoint
CREATE TABLE `sequence_steps` (
	`id` text NOT NULL,
	`sequence_id` text NOT NULL,
	`step_number` integer NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`delay_days` integer DEFAULT 1,
	`delay_hours` integer DEFAULT 0,
	`status` text DEFAULT 'draft',
	`created_at` integer,
	FOREIGN KEY (`sequence_id`) REFERENCES `sequences`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sequence_steps_id_unique` ON `sequence_steps` (`id`);--> statement-breakpoint
CREATE TABLE `sequences` (
	`id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'draft',
	`type` text DEFAULT 'cold_outreach',
	`sent_count` integer DEFAULT 0,
	`open_rate` integer DEFAULT 0,
	`click_rate` integer DEFAULT 0,
	`reply_rate` integer DEFAULT 0,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sequences_id_unique` ON `sequences` (`id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`device_info` text,
	`ip_address` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_id_unique` ON `sessions` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE TABLE `tag_relations` (
	`tag_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`created_at` integer,
	PRIMARY KEY(`tag_id`, `entity_type`, `entity_id`),
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '#3b82f6',
	`created_at` integer,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_id_unique` ON `tags` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `tags_workspace_id_name_unique` ON `tags` (`workspace_id`,`name`);--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`contact_id` text,
	`deal_id` text,
	`company_id` text,
	`status` text DEFAULT 'todo',
	`priority` text DEFAULT 'medium',
	`due_date` integer,
	`completed_at` integer,
	`remind_at` integer,
	`reminded` integer DEFAULT false,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`deal_id`) REFERENCES `deals`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tasks_id_unique` ON `tasks` (`id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`avatar_url` text,
	`role` text DEFAULT 'member' NOT NULL,
	`status` text DEFAULT 'invited' NOT NULL,
	`timezone` text DEFAULT 'UTC',
	`last_seen_at` integer,
	`password_hash` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_id_unique` ON `users` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_workspace_id_email_unique` ON `users` (`workspace_id`,`email`);--> statement-breakpoint
CREATE TABLE `webhooks` (
	`id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`secret` text,
	`events` text NOT NULL,
	`is_active` integer DEFAULT true,
	`last_triggered_at` integer,
	`last_status` text,
	`failure_count` integer DEFAULT 0,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `webhooks_id_unique` ON `webhooks` (`id`);--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` text NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`domain` text,
	`logo_url` text,
	`primary_color` text DEFAULT '#2563eb',
	`accent_color` text DEFAULT '#0d9488',
	`plan` text DEFAULT 'free' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`stripe_customer_id` text,
	`stripe_subscription_id` text,
	`billing_email` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workspaces_id_unique` ON `workspaces` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `workspaces_slug_unique` ON `workspaces` (`slug`);