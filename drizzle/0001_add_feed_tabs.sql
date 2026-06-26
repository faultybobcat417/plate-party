CREATE TABLE `meat_interactions` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`user_id` text NOT NULL,
	`interaction_type` text NOT NULL,
	`plates_paid` integer NOT NULL,
	`comment_text` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`hlc` text NOT NULL,
	`last_modified_by_device_id` text
);
--> statement-breakpoint
CREATE INDEX `meat_interactions_post_idx` ON `meat_interactions` (`post_id`);--> statement-breakpoint
CREATE INDEX `meat_interactions_user_idx` ON `meat_interactions` (`user_id`);--> statement-breakpoint
CREATE TABLE `meat_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`creator_id` text NOT NULL,
	`caption` text NOT NULL,
	`bio_snippet` text,
	`plate_cost` integer NOT NULL,
	`image_url` text,
	`likes` integer DEFAULT 0 NOT NULL,
	`comments` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`deleted_at` text,
	`hlc` text NOT NULL,
	`last_modified_by_device_id` text
);
--> statement-breakpoint
CREATE INDEX `meat_posts_creator_idx` ON `meat_posts` (`creator_id`);--> statement-breakpoint
CREATE INDEX `meat_posts_status_idx` ON `meat_posts` (`status`);--> statement-breakpoint
CREATE INDEX `meat_posts_created_at_idx` ON `meat_posts` (`created_at`);--> statement-breakpoint
CREATE TABLE `stake_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`user_id` text NOT NULL,
	`option_index` integer NOT NULL,
	`plates_staked` integer NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`hlc` text NOT NULL,
	`last_modified_by_device_id` text
);
--> statement-breakpoint
CREATE INDEX `stake_entries_post_idx` ON `stake_entries` (`post_id`);--> statement-breakpoint
CREATE INDEX `stake_entries_user_idx` ON `stake_entries` (`user_id`);--> statement-breakpoint
CREATE TABLE `stake_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`creator_id` text NOT NULL,
	`content` text NOT NULL,
	`target_plates` integer NOT NULL,
	`total_staked` integer DEFAULT 0 NOT NULL,
	`participant_count` integer DEFAULT 0 NOT NULL,
	`deadline` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`options_json` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`deleted_at` text,
	`hlc` text NOT NULL,
	`last_modified_by_device_id` text
);
--> statement-breakpoint
CREATE INDEX `stake_posts_creator_idx` ON `stake_posts` (`creator_id`);--> statement-breakpoint
CREATE INDEX `stake_posts_status_idx` ON `stake_posts` (`status`);--> statement-breakpoint
CREATE INDEX `stake_posts_deadline_idx` ON `stake_posts` (`deadline`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_sync_outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`table_name` text NOT NULL,
	`record_id` text NOT NULL,
	`operation` text NOT NULL,
	`payload` text NOT NULL,
	`base_hlc` text,
	`hlc` text NOT NULL,
	`device_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`sent_at` text,
	CONSTRAINT "sync_outbox_table_name_check" CHECK("__new_sync_outbox"."table_name" in ('users', 'parties', 'party_members', 'wagers', 'wager_options', 'bets', 'pool_transactions', 'ious', 'ledger_entries', 'challenges', 'meat_posts', 'meat_interactions', 'stake_posts', 'stake_entries')),
	CONSTRAINT "sync_outbox_operation_check" CHECK("__new_sync_outbox"."operation" in ('insert', 'update', 'delete', 'upsert')),
	CONSTRAINT "sync_outbox_status_check" CHECK("__new_sync_outbox"."status" in ('pending', 'sending', 'sent', 'failed', 'conflicted')),
	CONSTRAINT "sync_outbox_attempts_nonnegative" CHECK("__new_sync_outbox"."attempts" >= 0)
);
--> statement-breakpoint
INSERT INTO `__new_sync_outbox`("id", "table_name", "record_id", "operation", "payload", "base_hlc", "hlc", "device_id", "status", "attempts", "last_error", "created_at", "updated_at", "sent_at") SELECT "id", "table_name", "record_id", "operation", "payload", "base_hlc", "hlc", "device_id", "status", "attempts", "last_error", "created_at", "updated_at", "sent_at" FROM `sync_outbox`;--> statement-breakpoint
DROP TABLE `sync_outbox`;--> statement-breakpoint
ALTER TABLE `__new_sync_outbox` RENAME TO `sync_outbox`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `sync_outbox_hlc_unique` ON `sync_outbox` (`hlc`);--> statement-breakpoint
CREATE INDEX `sync_outbox_status_created_at_idx` ON `sync_outbox` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `sync_outbox_table_record_idx` ON `sync_outbox` (`table_name`,`record_id`);--> statement-breakpoint
CREATE INDEX `sync_outbox_device_status_idx` ON `sync_outbox` (`device_id`,`status`);