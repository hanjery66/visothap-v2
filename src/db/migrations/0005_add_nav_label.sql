CREATE TABLE "lottery_display_setting" (
	"id" text PRIMARY KEY NOT NULL,
	"splash_seconds_before" integer DEFAULT 60 NOT NULL,
	"auto_seed_minutes_before_splash" integer DEFAULT 0 NOT NULL,
	"spinner_seconds_before_splash" integer DEFAULT 120 NOT NULL,
	"cell_splash_duration_seconds" integer DEFAULT 10 NOT NULL,
	"cell_pause_interval_seconds" integer DEFAULT 5 NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nav_label" (
	"id" text PRIMARY KEY NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"label" text NOT NULL,
	"value" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "advertisement" DROP COLUMN "title";