CREATE TABLE "lottery_schedule" (
	"id" text PRIMARY KEY NOT NULL,
	"day_of_week" text NOT NULL,
	"period" text NOT NULL,
	"name" text NOT NULL,
	"draw_time" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
