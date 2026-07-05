CREATE TABLE "lottery_location" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"location" text NOT NULL,
	"code" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lottery_prize" (
	"id" text PRIMARY KEY NOT NULL,
	"location_id" text NOT NULL,
	"prize_key" text NOT NULL,
	"value" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lottery_session" (
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"period" text NOT NULL,
	"name" text NOT NULL,
	"display_table" text NOT NULL,
	"display_number" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lottery_location" ADD CONSTRAINT "lottery_location_session_id_lottery_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."lottery_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lottery_prize" ADD CONSTRAINT "lottery_prize_location_id_lottery_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."lottery_location"("id") ON DELETE cascade ON UPDATE no action;