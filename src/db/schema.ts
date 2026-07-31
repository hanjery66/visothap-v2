import { pgTable, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),

  // Custom username credentials and permissions
  username: text("username").unique(),
  displayUsername: text("display_username").unique(),
  role: text("role").default("Staff").notNull(), // "Admin" | "Staff"
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const advertisement = pgTable("advertisement", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  position: text("position").$type<"Left" | "Right" | "Center">().notNull(),
  image: text("image").notNull(),
  status: boolean("status").default(true).notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const generalSetting = pgTable("general_setting", {
  id: text("id").primaryKey(),
  logo: text("logo").notNull(),
  fullLogo: text("full_logo").notNull(),
  leftFooterContent: text("left_footer_content").notNull(),
  rightFooterContent: text("right_footer_content").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});


export type Ads = typeof advertisement.$inferSelect & {
  createdAt: string
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Lottery tables
// ---------------------------------------------------------------------------

/**
 * One row per (date, period) pair.
 * period: "first" | "second" | "third" | "fourth"
 */
export const lotterySession = pgTable("lottery_session", {
  id: text("id").primaryKey(),           // e.g. "2026-07-04-first"
  date: text("date").notNull(),          // "YYYY-MM-DD"
  period: text("period").notNull(),      // "first" | "second" | "third" | "fourth"
  name: text("name").notNull(),          // "Sổ Kết Quả Miền Trung"
  displayTable: text("display_table").notNull(),
  displayNumber: text("display_number").notNull(),
  /** JSON: Record<string, string> — maps prize row index (as string) to display label override */
  prizeLabels: text("prize_labels"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

/**
 * One row per province/location within a session.
 * sortOrder controls the column order in the table UI.
 */
export const lotteryLocation = pgTable("lottery_location", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => lotterySession.id, { onDelete: "cascade" }),
  location: text("location").notNull(),  // "TP. Đà Nẵng"
  code: text("code").notNull(),          // "XSDNG"
  sortOrder: integer("sort_order").notNull().default(0),
});

/**
 * One row per individual lottery number value.
 * prizeKey: "gEight" | "gSeven" | "gSix" | "gFive" | "gFour" | "gThree" | "gTwo" | "gOne" | "db"
 * sortOrder: index within that prize group (e.g. gSix has 3 values → 0,1,2)
 */
export const lotteryPrize = pgTable("lottery_prize", {
  id: text("id").primaryKey(),
  locationId: text("location_id")
    .notNull()
    .references(() => lotteryLocation.id, { onDelete: "cascade" }),
  prizeKey: text("prize_key").notNull(),  // "gEight" | ... | "db"
  value: text("value").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const lotterySchedule = pgTable("lottery_schedule", {
  id: text("id").primaryKey(), // "mon-first", etc.
  dayOfWeek: text("day_of_week").notNull(), // "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"
  period: text("period").notNull(), // "first" | "second" | "third" | "fourth"
  name: text("name").notNull(),
  drawTime: text("draw_time").notNull(), // e.g. "17:15"
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

/** Global lottery UI timing — splash window, auto-seed trigger window, and staggered column reveal. */
export const lotteryDisplaySetting = pgTable("lottery_display_setting", {
  id: text("id").primaryKey(),
  splashMinutesBefore: integer("splash_minutes_before").notNull().default(2),
  autoSeedMinutesBeforeSplash: integer("auto_seed_minutes_before_splash")
    .notNull()
    .default(5),
  cellSplashDurationSeconds: integer("cell_splash_duration_seconds")
    .notNull()
    .default(10),
  cellPauseIntervalSeconds: integer("cell_pause_interval_seconds")
    .notNull()
    .default(5),
  updatedAt: timestamp("updated_at").notNull(),
});

export type LotterySession   = typeof lotterySession.$inferSelect;
export type LotteryLocation  = typeof lotteryLocation.$inferSelect;
export type LotteryPrize     = typeof lotteryPrize.$inferSelect;
export type LotterySchedule  = typeof lotterySchedule.$inferSelect;
export type LotteryDisplaySetting = typeof lotteryDisplaySetting.$inferSelect;