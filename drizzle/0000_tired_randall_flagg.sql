CREATE TABLE `bets` (
	`id` text PRIMARY KEY NOT NULL,
	`wager_id` text NOT NULL,
	`user_id` text NOT NULL,
	`option_id` text NOT NULL,
	`plates_wagered` integer NOT NULL,
	`real_money_amount_cents` integer,
	`placed_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`locked_at` text,
	`resolved_at` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`deleted_at` text,
	`hlc` text NOT NULL,
	`last_modified_by_device_id` text,
	FOREIGN KEY (`wager_id`) REFERENCES `wagers`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`option_id`) REFERENCES `wager_options`(`id`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "bets_status_check" CHECK("bets"."status" in ('pending', 'locked', 'won', 'lost', 'void')),
	CONSTRAINT "bets_plates_wagered_positive" CHECK("bets"."plates_wagered" > 0),
	CONSTRAINT "bets_real_money_amount_cents_nonnegative" CHECK("bets"."real_money_amount_cents" is null or "bets"."real_money_amount_cents" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bets_wager_user_unique` ON `bets` (`wager_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `bets_wager_status_idx` ON `bets` (`wager_id`,`status`);--> statement-breakpoint
CREATE INDEX `bets_user_id_idx` ON `bets` (`user_id`);--> statement-breakpoint
CREATE INDEX `bets_option_id_idx` ON `bets` (`option_id`);--> statement-breakpoint
CREATE INDEX `bets_placed_at_idx` ON `bets` (`placed_at`);--> statement-breakpoint
CREATE TABLE `challenges` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`type` text NOT NULL,
	`reward_plates` integer NOT NULL,
	`deadline` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`creator_id` text NOT NULL,
	`completer_id` text,
	`proof_image_url` text,
	`proof_note` text,
	`claimed_at` text,
	`completed_at` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`deleted_at` text,
	`hlc` text NOT NULL,
	`last_modified_by_device_id` text
);
--> statement-breakpoint
CREATE INDEX `challenges_status_idx` ON `challenges` (`status`);--> statement-breakpoint
CREATE INDEX `challenges_creator_idx` ON `challenges` (`creator_id`);--> statement-breakpoint
CREATE INDEX `challenges_deadline_idx` ON `challenges` (`deadline`);--> statement-breakpoint
CREATE TABLE `ious` (
	`id` text PRIMARY KEY NOT NULL,
	`party_id` text NOT NULL,
	`from_user_id` text NOT NULL,
	`to_user_id` text NOT NULL,
	`wager_id` text,
	`dollar_amount_cents` integer NOT NULL,
	`payment_provider` text DEFAULT 'manual',
	`external_payment_ref` text,
	`settled` integer DEFAULT false NOT NULL,
	`settled_at` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`deleted_at` text,
	`hlc` text NOT NULL,
	`last_modified_by_device_id` text,
	FOREIGN KEY (`party_id`) REFERENCES `parties`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`from_user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`to_user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`wager_id`) REFERENCES `wagers`(`id`) ON UPDATE cascade ON DELETE set null,
	CONSTRAINT "ious_dollar_amount_cents_positive" CHECK("ious"."dollar_amount_cents" > 0),
	CONSTRAINT "ious_distinct_users_check" CHECK("ious"."from_user_id" <> "ious"."to_user_id"),
	CONSTRAINT "ious_payment_provider_check" CHECK("ious"."payment_provider" is null or "ious"."payment_provider" in ('venmo', 'cash_app', 'paypal', 'manual'))
);
--> statement-breakpoint
CREATE INDEX `ious_party_settled_idx` ON `ious` (`party_id`,`settled`);--> statement-breakpoint
CREATE INDEX `ious_from_user_id_idx` ON `ious` (`from_user_id`);--> statement-breakpoint
CREATE INDEX `ious_to_user_id_idx` ON `ious` (`to_user_id`);--> statement-breakpoint
CREATE INDEX `ious_wager_id_idx` ON `ious` (`wager_id`);--> statement-breakpoint
CREATE TABLE `ledger_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_id` text NOT NULL,
	`party_id` text NOT NULL,
	`wager_id` text,
	`bet_id` text,
	`pool_transaction_id` text,
	`iou_id` text,
	`source_table` text NOT NULL,
	`source_id` text NOT NULL,
	`account_type` text NOT NULL,
	`account_id` text NOT NULL,
	`plate_delta` integer NOT NULL,
	`memo` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`deleted_at` text,
	`hlc` text NOT NULL,
	`last_modified_by_device_id` text,
	FOREIGN KEY (`party_id`) REFERENCES `parties`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`wager_id`) REFERENCES `wagers`(`id`) ON UPDATE cascade ON DELETE set null,
	FOREIGN KEY (`bet_id`) REFERENCES `bets`(`id`) ON UPDATE cascade ON DELETE set null,
	FOREIGN KEY (`pool_transaction_id`) REFERENCES `pool_transactions`(`id`) ON UPDATE cascade ON DELETE set null,
	FOREIGN KEY (`iou_id`) REFERENCES `ious`(`id`) ON UPDATE cascade ON DELETE set null,
	CONSTRAINT "ledger_entries_plate_delta_nonzero" CHECK("ledger_entries"."plate_delta" <> 0),
	CONSTRAINT "ledger_entries_account_type_check" CHECK("ledger_entries"."account_type" in ('member_available', 'wager_escrow', 'charity_pool')),
	CONSTRAINT "ledger_entries_source_table_check" CHECK("ledger_entries"."source_table" in ('bets', 'pool_transactions', 'ious', 'manual_adjustments'))
);
--> statement-breakpoint
CREATE INDEX `ledger_entries_party_created_at_idx` ON `ledger_entries` (`party_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `ledger_entries_transaction_id_idx` ON `ledger_entries` (`transaction_id`);--> statement-breakpoint
CREATE INDEX `ledger_entries_source_idx` ON `ledger_entries` (`source_table`,`source_id`);--> statement-breakpoint
CREATE INDEX `ledger_entries_account_idx` ON `ledger_entries` (`account_type`,`account_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `ledger_entries_source_account_unique` ON `ledger_entries` (`source_table`,`source_id`,`account_type`,`account_id`);--> statement-breakpoint
CREATE TABLE `parties` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`invite_code` text NOT NULL,
	`charity_org_name` text NOT NULL,
	`charity_org_url` text,
	`charity_pool_plates` integer DEFAULT 0 NOT NULL,
	`real_money_enabled` integer DEFAULT false NOT NULL,
	`default_stake_plates` integer DEFAULT 1 NOT NULL,
	`created_by_user_id` text NOT NULL,
	`next_wager_picker_user_id` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`archived_at` text,
	`deleted_at` text,
	`hlc` text NOT NULL,
	`last_modified_by_device_id` text,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`next_wager_picker_user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE set null,
	CONSTRAINT "parties_charity_pool_plates_nonnegative" CHECK("parties"."charity_pool_plates" >= 0),
	CONSTRAINT "parties_default_stake_plates_positive" CHECK("parties"."default_stake_plates" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `parties_invite_code_unique` ON `parties` (`invite_code`);--> statement-breakpoint
CREATE INDEX `parties_created_by_user_id_idx` ON `parties` (`created_by_user_id`);--> statement-breakpoint
CREATE INDEX `parties_next_wager_picker_user_id_idx` ON `parties` (`next_wager_picker_user_id`);--> statement-breakpoint
CREATE INDEX `parties_archived_at_idx` ON `parties` (`archived_at`);--> statement-breakpoint
CREATE TABLE `party_members` (
	`party_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`plate_balance` integer DEFAULT 10 NOT NULL,
	`reserved_plate_balance` integer DEFAULT 0 NOT NULL,
	`current_streak` integer DEFAULT 0 NOT NULL,
	`longest_streak` integer DEFAULT 0 NOT NULL,
	`total_wins` integer DEFAULT 0 NOT NULL,
	`total_losses` integer DEFAULT 0 NOT NULL,
	`total_plates_wagered` integer DEFAULT 0 NOT NULL,
	`joined_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`left_at` text,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`deleted_at` text,
	`hlc` text NOT NULL,
	`last_modified_by_device_id` text,
	PRIMARY KEY(`party_id`, `user_id`),
	FOREIGN KEY (`party_id`) REFERENCES `parties`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade,
	CONSTRAINT "party_members_role_check" CHECK("party_members"."role" in ('host', 'member')),
	CONSTRAINT "party_members_plate_balance_nonnegative" CHECK("party_members"."plate_balance" >= 0),
	CONSTRAINT "party_members_reserved_plate_balance_nonnegative" CHECK("party_members"."reserved_plate_balance" >= 0),
	CONSTRAINT "party_members_current_streak_nonnegative" CHECK("party_members"."current_streak" >= 0),
	CONSTRAINT "party_members_longest_streak_nonnegative" CHECK("party_members"."longest_streak" >= 0)
);
--> statement-breakpoint
CREATE INDEX `party_members_user_id_idx` ON `party_members` (`user_id`);--> statement-breakpoint
CREATE INDEX `party_members_party_role_idx` ON `party_members` (`party_id`,`role`);--> statement-breakpoint
CREATE INDEX `party_members_party_balance_idx` ON `party_members` (`party_id`,`plate_balance`);--> statement-breakpoint
CREATE INDEX `party_members_left_at_idx` ON `party_members` (`left_at`);--> statement-breakpoint
CREATE TABLE `pool_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`party_id` text NOT NULL,
	`wager_id` text,
	`from_user_id` text,
	`plate_amount` integer NOT NULL,
	`reason` text DEFAULT 'wager_loss' NOT NULL,
	`note` text,
	`timestamp` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`deleted_at` text,
	`hlc` text NOT NULL,
	`last_modified_by_device_id` text,
	FOREIGN KEY (`party_id`) REFERENCES `parties`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`wager_id`) REFERENCES `wagers`(`id`) ON UPDATE cascade ON DELETE set null,
	FOREIGN KEY (`from_user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE set null,
	CONSTRAINT "pool_transactions_plate_amount_positive" CHECK("pool_transactions"."plate_amount" > 0),
	CONSTRAINT "pool_transactions_reason_check" CHECK("pool_transactions"."reason" in ('wager_loss', 'na_penalty', 'manual_adjustment'))
);
--> statement-breakpoint
CREATE INDEX `pool_transactions_party_timestamp_idx` ON `pool_transactions` (`party_id`,`timestamp`);--> statement-breakpoint
CREATE INDEX `pool_transactions_wager_id_idx` ON `pool_transactions` (`wager_id`);--> statement-breakpoint
CREATE INDEX `pool_transactions_from_user_id_idx` ON `pool_transactions` (`from_user_id`);--> statement-breakpoint
CREATE TABLE `sync_outbox` (
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
	CONSTRAINT "sync_outbox_table_name_check" CHECK("sync_outbox"."table_name" in ('users', 'parties', 'party_members', 'wagers', 'wager_options', 'bets', 'pool_transactions', 'ious', 'ledger_entries', 'challenges')),
	CONSTRAINT "sync_outbox_operation_check" CHECK("sync_outbox"."operation" in ('insert', 'update', 'delete', 'upsert')),
	CONSTRAINT "sync_outbox_status_check" CHECK("sync_outbox"."status" in ('pending', 'sending', 'sent', 'failed', 'conflicted')),
	CONSTRAINT "sync_outbox_attempts_nonnegative" CHECK("sync_outbox"."attempts" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sync_outbox_hlc_unique` ON `sync_outbox` (`hlc`);--> statement-breakpoint
CREATE INDEX `sync_outbox_status_created_at_idx` ON `sync_outbox` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `sync_outbox_table_record_idx` ON `sync_outbox` (`table_name`,`record_id`);--> statement-breakpoint
CREATE INDEX `sync_outbox_device_status_idx` ON `sync_outbox` (`device_id`,`status`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`avatar_color` text NOT NULL,
	`device_id` text NOT NULL,
	`venmo_handle` text,
	`cash_app_handle` text,
	`paypal_me_handle` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`deleted_at` text,
	`hlc` text NOT NULL,
	`last_modified_by_device_id` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_device_id_unique` ON `users` (`device_id`);--> statement-breakpoint
CREATE INDEX `users_display_name_idx` ON `users` (`display_name`);--> statement-breakpoint
CREATE INDEX `users_deleted_at_idx` ON `users` (`deleted_at`);--> statement-breakpoint
CREATE TABLE `wager_options` (
	`id` text PRIMARY KEY NOT NULL,
	`wager_id` text NOT NULL,
	`label` text NOT NULL,
	`sort_order` integer NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`deleted_at` text,
	`hlc` text NOT NULL,
	`last_modified_by_device_id` text,
	FOREIGN KEY (`wager_id`) REFERENCES `wagers`(`id`) ON UPDATE cascade ON DELETE cascade,
	CONSTRAINT "wager_options_sort_order_nonnegative" CHECK("wager_options"."sort_order" >= 0)
);
--> statement-breakpoint
CREATE INDEX `wager_options_wager_id_idx` ON `wager_options` (`wager_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `wager_options_wager_sort_order_unique` ON `wager_options` (`wager_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `wagers` (
	`id` text PRIMARY KEY NOT NULL,
	`party_id` text NOT NULL,
	`created_by_user_id` text NOT NULL,
	`question` text NOT NULL,
	`stake_plates` integer DEFAULT 1 NOT NULL,
	`deadline` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`winning_option_id` text,
	`real_money_amount_cents` integer,
	`oracle_type` text DEFAULT 'manual' NOT NULL,
	`oracle_config` text,
	`oracle_status` text DEFAULT 'not_required' NOT NULL,
	`oracle_result` text,
	`na_policy` text DEFAULT 'refund' NOT NULL,
	`na_penalty_plates` integer DEFAULT 0 NOT NULL,
	`resolution_kind` text,
	`resolution_note` text,
	`locked_at` text,
	`resolved_at` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`deleted_at` text,
	`hlc` text NOT NULL,
	`last_modified_by_device_id` text,
	FOREIGN KEY (`party_id`) REFERENCES `parties`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "wagers_status_check" CHECK("wagers"."status" in ('open', 'locked', 'resolved', 'void')),
	CONSTRAINT "wagers_stake_plates_positive" CHECK("wagers"."stake_plates" > 0),
	CONSTRAINT "wagers_real_money_amount_cents_nonnegative" CHECK("wagers"."real_money_amount_cents" is null or "wagers"."real_money_amount_cents" >= 0),
	CONSTRAINT "wagers_oracle_type_check" CHECK("wagers"."oracle_type" in ('manual', 'weather', 'crypto')),
	CONSTRAINT "wagers_oracle_status_check" CHECK("wagers"."oracle_status" in ('not_required', 'pending', 'validated', 'failed')),
	CONSTRAINT "wagers_na_policy_check" CHECK("wagers"."na_policy" in ('refund', 'send_to_pool')),
	CONSTRAINT "wagers_na_penalty_plates_nonnegative" CHECK("wagers"."na_penalty_plates" >= 0)
);
--> statement-breakpoint
CREATE INDEX `wagers_party_status_deadline_idx` ON `wagers` (`party_id`,`status`,`deadline`);--> statement-breakpoint
CREATE INDEX `wagers_created_by_user_id_idx` ON `wagers` (`created_by_user_id`);--> statement-breakpoint
CREATE INDEX `wagers_winning_option_id_idx` ON `wagers` (`winning_option_id`);--> statement-breakpoint
CREATE INDEX `wagers_deadline_idx` ON `wagers` (`deadline`);--> statement-breakpoint
CREATE UNIQUE INDEX `wagers_one_active_per_party_idx` ON `wagers` (`party_id`) WHERE "wagers"."status" in ('open', 'locked') and "wagers"."deleted_at" is null;