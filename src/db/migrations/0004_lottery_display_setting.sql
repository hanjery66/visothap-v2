CREATE TABLE "lottery_display_setting" (
	"id" text PRIMARY KEY NOT NULL,
	"splash_minutes_before" integer DEFAULT 2 NOT NULL,
	"column_reveal_interval_minutes" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp NOT NULL
);
