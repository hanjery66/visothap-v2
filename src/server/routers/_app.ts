import { router, publicProcedure, authedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import dayjs from "dayjs";
import { db } from "@/db";
import { user, advertisement, generalSetting, lotterySession, lotteryLocation, lotteryPrize, lotterySchedule, lotteryDisplaySetting } from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import crypto from "crypto";
import { deleteFileFromS3 } from "@/lib/s3";
import { ensureError } from "@/lib/utils";
import {
  ensureLotterySessionsForDate,
  ensureScheduleSeeded,
  getSchedulesForDate,
  getPeriodsReadyToSeed,
  LOTTERY_PERIODS,
  resolvePeriodSchedule,
} from "@/server/lottery-seed";
import { ensureDisplaySettingsSeeded } from "@/server/lottery-display";
import { DEFAULT_LOTTERY_DISPLAY_SETTINGS } from "@/lib/lottery-display";
import { DEFAULT_PERIOD_SCHEDULE, getDayKeyFromDate } from "@/lib/lottery-schedule";

export const appRouter = router({
  getUsers: publicProcedure.query(async () => {
    try {
      // Fetch all users sorted by creation date descending
      const usersList = await db
        .select()
        .from(user)
        .orderBy(desc(user.createdAt));
      return usersList;
    } catch (error) {
      console.error("tRPC getUsers database error:", error);
      throw new Error("Failed to fetch database users.");
    }
  }),

  // Get active user profile
  getProfile: authedProcedure.query(async ({ ctx }) => {
    // Re-fetch the fresh database record to ensure it is synchronized
    const [dbUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, ctx.user.id))
      .limit(1);

    if (!dbUser) {
      return ctx.user;
    }
    return dbUser;
  }),

  // Update profile details
  updateProfile: authedProcedure
    .input(
      z.object({
        name: z.string().min(2, "Name must be at least 2 characters long"),
        email: z.string().email("Invalid email address").optional(),
        username: z.string().min(2, "Username must be at least 2 characters long"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const updateData: Record<string, any> = {
          name: input.name,
          username: input.username.trim().toLowerCase(),
          displayUsername: input.username.trim(),
        };
        if (input.email) {
          updateData.email = input.email.trim();
        }
        await db
          .update(user)
          .set(updateData)
          .where(eq(user.id, ctx.user.id));
        return { success: true };
      } catch (err: unknown) {
        const error = ensureError(err);
        console.error("tRPC updateProfile database error:", error);
        if (error.message?.includes("unique") || (error as any).code?.includes("23505")) {
          throw new Error("Username or Email address already exists.");
        }
        throw new Error("Failed to update profile details.");
      }
    }),

  // Update encrypted password via Better Auth programmatic API actions
  updatePassword: authedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z.string().min(6, "New password must be at least 6 characters long"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await auth.api.changePassword({
          body: {
            currentPassword: input.currentPassword,
            newPassword: input.newPassword,
          },
          headers: ctx.headers,
        });
        return { success: true };
      } catch (err: unknown) {
        const error = ensureError(err);
        console.error("tRPC updatePassword Better Auth error:", error);
        throw new Error(error.message || "Failed to change password. Please verify your current password.");
      }
    }),

  // Get all advertisements
  getAdvertisements: publicProcedure.query(async () => {
    try {
      let adsList = await db
        .select()
        .from(advertisement)
        .orderBy(desc(advertisement.updatedAt));

      // Auto-seed if database is empty
      if (adsList.length === 0) {
        console.log("ℹ️ No advertisements found in database. Auto-seeding default advertisements...");
        const defaultAds = [
          { id: "ads-1", position: "Left" as const, image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=400&q=80", status: true },
          { id: "ads-2", position: "Left" as const, image: "https://images.unsplash.com/photo-1777896116711-837c58809f9c?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", status: true },
          { id: "ads-3", position: "Right" as const, image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=400&q=80", status: true },
          { id: "ads-4", position: "Right" as const, image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=400&q=80", status: true },
          { id: "ads-5", position: "Center" as const, image: "https://images.unsplash.com/photo-1472851294608-062f824d296e?auto=format&fit=crop&w=800&q=80", status: true },
          { id: "ads-6", position: "Center" as const, image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80", status: true }
        ];

        const seedData = defaultAds.map(ad => ({
          ...ad,
          createdAt: new Date(),
          updatedAt: new Date()
        }));

        await db.insert(advertisement).values(seedData);

        // Fetch again after seeding
        adsList = await db
          .select()
          .from(advertisement)
          .orderBy(desc(advertisement.updatedAt));
      }

      return adsList;
    } catch (error) {
      console.error("tRPC getAdvertisements database error:", error);
      throw new Error("Failed to fetch database advertisements.");
    }
  }),

  // Toggle advertisement visibility status
  toggleAdStatus: authedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await db
          .update(advertisement)
          .set({
            status: input.status,
          })
          .where(eq(advertisement.id, input.id));
        return { success: true };
      } catch (error) {
        console.error("tRPC toggleAdStatus database error:", error);
        throw new Error("Failed to update advertisement status.");
      }
    }),

  // Save advertisement (insert new or update existing)
  saveAdvertisement: authedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        position: z.enum(["Left", "Right", "Center"]),
        image: z.string().min(1, "Image URL is required"),
        status: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      try {
        if (input.id) {
          // Fetch existing record to check if image has changed
          const [oldAd] = await db
            .select()
            .from(advertisement)
            .where(eq(advertisement.id, input.id))
            .limit(1);

          if (oldAd && oldAd.image !== input.image) {
            await deleteFileFromS3(oldAd.image);
          }

          // Update
          await db
            .update(advertisement)
            .set({
              position: input.position,
              image: input.image,
              status: input.status,
              updatedAt: new Date(),
            })
            .where(eq(advertisement.id, input.id));
          return { success: true, id: input.id };
        } else {
          // Create
          const newId = `ads-${crypto.randomUUID()}`;
          await db.insert(advertisement).values({
            id: newId,
            position: input.position,
            image: input.image,
            status: input.status,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          return { success: true, id: newId };
        }
      } catch (error) {
        console.error("tRPC saveAdvertisement database error:", error);
        throw new Error("Failed to save advertisement.");
      }
    }),

  // Delete advertisement
  deleteAdvertisement: authedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Fetch existing record to get its image URL
        const [oldAd] = await db
          .select()
          .from(advertisement)
          .where(eq(advertisement.id, input.id))
          .limit(1);

        if (oldAd) {
          await deleteFileFromS3(oldAd.image);
        }

        await db
          .delete(advertisement)
          .where(eq(advertisement.id, input.id));
        return { success: true };
      } catch (error) {
        console.error("tRPC deleteAdvertisement database error:", error);
        throw new Error("Failed to delete advertisement.");
      }
    }),

  // Get dynamic general visual settings (with smart auto-seed)
  getGeneralSettings: publicProcedure.query(async () => {
    try {
      const [settings] = await db
        .select()
        .from(generalSetting)
        .limit(1);

      if (settings) {
        return settings;
      }

      // No settings found, auto-seed default brand details!
      const defaultSettings = {
        id: "general-1",
        logo: "/logo.png",
        fullLogo: "/full-logo.png",
        leftFooterContent: "<p>© 2026 VISOTHAP. All rights reserved.</p>",
        rightFooterContent: "<p>Contact: info@visothap.net | Hotline: 1900 6868</p>",
        updatedAt: new Date(),
      };

      await db.insert(generalSetting).values(defaultSettings);
      return defaultSettings;
    } catch (error) {
      console.error("tRPC getGeneralSettings error:", error);
      throw new Error("Failed to fetch general layout settings.");
    }
  }),

  // Save/update general visual settings
  saveGeneralSettings: authedProcedure
    .input(
      z.object({
        logo: z.string().optional(),
        fullLogo: z.string().min(1, "Full header logo is required"),
        leftFooterContent: z.string().min(1, "Left footer content is required"),
        rightFooterContent: z.string().min(1, "Right footer content is required"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const [existing] = await db
          .select()
          .from(generalSetting)
          .limit(1);

        const newLogo = input.logo ?? existing?.logo ?? "/logo.png";

        if (existing) {
          if (input.logo && existing.logo !== input.logo) {
            await deleteFileFromS3(existing.logo);
          }
          if (existing.fullLogo !== input.fullLogo) {
            await deleteFileFromS3(existing.fullLogo);
          }

          await db
            .update(generalSetting)
            .set({
              logo: newLogo,
              fullLogo: input.fullLogo,
              leftFooterContent: input.leftFooterContent,
              rightFooterContent: input.rightFooterContent,
              updatedAt: new Date(),
            })
            .where(eq(generalSetting.id, existing.id));
          return { success: true, id: existing.id };
        } else {
          const newId = "general-1";
          await db.insert(generalSetting).values({
            id: newId,
            logo: newLogo,
            fullLogo: input.fullLogo,
            leftFooterContent: input.leftFooterContent,
            rightFooterContent: input.rightFooterContent,
            updatedAt: new Date(),
          });
          return { success: true, id: newId };
        }
      } catch (error) {
        console.error("tRPC saveGeneralSettings error:", error);
        throw new Error("Failed to save general layout configuration.");
      }
    }),

  // Get dynamic lottery schedule (with smart auto-seed)
  getLotterySchedule: publicProcedure.query(async () => {
    try {
      return await ensureScheduleSeeded();
    } catch (error) {
      console.error("tRPC getLotterySchedule database error:", error);
      throw new Error("Failed to fetch lottery schedule.");
    }
  }),

  // Save/update entire weekly lottery schedule settings
  saveLotterySchedule: authedProcedure
    .input(
      z.array(
        z.object({
          id: z.string(),
          dayOfWeek: z.string(),
          period: z.string(),
          name: z.string(),
          drawTime: z.string(),
          enabled: z.boolean(),
        })
      )
    )
    .mutation(async ({ input }) => {
      try {
        for (const item of input) {
          const [existing] = await db
            .select()
            .from(lotterySchedule)
            .where(eq(lotterySchedule.id, item.id))
            .limit(1);

          if (existing) {
            await db
              .update(lotterySchedule)
              .set({
                name: item.name,
                drawTime: item.drawTime,
                enabled: item.enabled,
                updatedAt: new Date(),
              })
              .where(eq(lotterySchedule.id, item.id));
          } else {
            await db.insert(lotterySchedule).values({
              id: item.id,
              dayOfWeek: item.dayOfWeek,
              period: item.period,
              name: item.name,
              drawTime: item.drawTime,
              enabled: item.enabled,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        }

        // Keep all active sessions updated with the latest schedule draw times and names
        const allSessions = await db.select().from(lotterySession);
        for (const sess of allSessions) {
          const dayKey = getDayKeyFromDate(sess.date);
          const matchedSchedule = input.find(
            (item) => item.dayOfWeek === dayKey && item.period === sess.period
          );
          if (matchedSchedule) {
            await db
              .update(lotterySession)
              .set({
                name: matchedSchedule.name,
                displayNumber: matchedSchedule.drawTime,
                updatedAt: new Date(),
              })
              .where(eq(lotterySession.id, sess.id));
          }
        }

        return { success: true };
      } catch (error) {
        console.error("tRPC saveLotterySchedule database error:", error);
        throw new Error("Failed to save lottery schedule settings.");
      }
    }),

  getLotteryDisplaySettings: publicProcedure.query(async () => {
    try {
      const settings = await ensureDisplaySettingsSeeded();
      return {
        splashMinutesBefore: settings.splashMinutesBefore,
        autoSeedMinutesBeforeSplash: settings.autoSeedMinutesBeforeSplash,
        cellSplashDurationSeconds: settings.cellSplashDurationSeconds ?? DEFAULT_LOTTERY_DISPLAY_SETTINGS.cellSplashDurationSeconds,
        cellPauseIntervalSeconds: settings.cellPauseIntervalSeconds ?? DEFAULT_LOTTERY_DISPLAY_SETTINGS.cellPauseIntervalSeconds,
      };
    } catch (error) {
      console.error("tRPC getLotteryDisplaySettings error:", error);
      throw new Error("Failed to fetch lottery display settings.");
    }
  }),

  saveLotteryDisplaySettings: authedProcedure
    .input(
      z.object({
        splashMinutesBefore: z.number().int().min(0).max(60),
        autoSeedMinutesBeforeSplash: z.number().int().min(0).max(60),
        cellSplashDurationSeconds: z.number().int().min(1).max(300),
        cellPauseIntervalSeconds: z.number().int().min(0).max(300),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        await ensureDisplaySettingsSeeded();
        await db
          .update(lotteryDisplaySetting)
          .set({
            splashMinutesBefore: input.splashMinutesBefore,
            autoSeedMinutesBeforeSplash: input.autoSeedMinutesBeforeSplash,
            cellSplashDurationSeconds: input.cellSplashDurationSeconds,
            cellPauseIntervalSeconds: input.cellPauseIntervalSeconds,
            updatedAt: new Date(),
          })
          .where(eq(lotteryDisplaySetting.id, "default"));
        return { success: true };
      } catch (error) {
        console.error("tRPC saveLotteryDisplaySettings error:", error);
        throw new Error("Failed to save lottery display settings.");
      }
    }),

  // ---------------------------------------------------------------------------
  // LOTTERY PROCEDURES
  // ---------------------------------------------------------------------------

  /**
   * Public — fetch all lottery data for a given date.
   * Returns a LotteryState-shaped object (same shape as mockData)
   * so existing components (LotteryTableLayoutOne / Two) need zero changes.
   */
  getLotteryByDate: publicProcedure
    .input(z.object({ date: z.string() }))
    .query(async ({ input }) => {
      let effectiveDate = input.date;
      let daySchedules = await getSchedulesForDate(effectiveDate);

      let sessions = await db
        .select()
        .from(lotterySession)
        .where(eq(lotterySession.date, effectiveDate));

      // Always check if new periods have become ready to seed (each period has its own draw time)
      const displaySettings = await ensureDisplaySettingsSeeded();
      const readyPeriods = getPeriodsReadyToSeed(effectiveDate, daySchedules, displaySettings);
      if (readyPeriods.length > 0) {
        // ensureLotterySessionsForDate skips already-existing sessions, so this is safe to call always
        await ensureLotterySessionsForDate(effectiveDate, readyPeriods);
        sessions = await db
          .select()
          .from(lotterySession)
          .where(eq(lotterySession.date, effectiveDate));
      }

      // If requested date has no sessions (e.g. today before first draw),
      // automatically fall back to previous day's results so user always sees complete lottery data.
      if (sessions.length === 0) {
        const prevDate = dayjs(effectiveDate).subtract(1, "day").format("YYYY-MM-DD");
        const prevSchedules = await getSchedulesForDate(prevDate);
        const prevReadyPeriods = getPeriodsReadyToSeed(prevDate, prevSchedules, displaySettings);
        if (prevReadyPeriods.length > 0) {
          await ensureLotterySessionsForDate(prevDate, prevReadyPeriods);
        }
        sessions = await db
          .select()
          .from(lotterySession)
          .where(eq(lotterySession.date, prevDate));

        if (sessions.length > 0) {
          effectiveDate = prevDate;
          daySchedules = prevSchedules;
        }
      }

      if (sessions.length === 0) return null;

      // Fetch all locations and prizes for those sessions in bulk
      const sessionIds = sessions.map((s) => s.id);
      const locations = await db
        .select()
        .from(lotteryLocation)
        .where(inArray(lotteryLocation.sessionId, sessionIds))
        .orderBy(lotteryLocation.sortOrder);

      const locationIds = locations.map((l) => l.id);
      const prizes =
        locationIds.length > 0
          ? await db
            .select()
            .from(lotteryPrize)
            .where(inArray(lotteryPrize.locationId, locationIds))
            .orderBy(lotteryPrize.sortOrder)
          : [];

      // Assemble into LotteryState shape
      const PRIZE_KEYS = ["gEight", "gSeven", "gSix", "gFive", "gFour", "gThree", "gTwo", "gOne", "db"];
      const PERIOD_LABELS: Record<string, Record<string, string>> = {
        gEight: { label: "Giải Tám" },
        gSeven: { label: "Giải Bảy" },
        gSix: { label: "Giải Sáu" },
        gFive: { label: "Giải Năm" },
        gFour: { label: "Giải Tư" },
        gThree: { label: "Giải Ba" },
        gTwo: { label: "Giải Nhì" },
        gOne: { label: "Giải Nhất" },
        db: { label: "Đặc Biệt" },
      };

      const result: Record<string, any> = { _id: `lottery-${effectiveDate}`, date: effectiveDate };

      for (const period of LOTTERY_PERIODS) {
        const schedule = resolvePeriodSchedule(daySchedules, period);
        if (schedule && !schedule.enabled) {
          result[period] = null;
          continue;
        }

        const session = sessions.find((s) => s.period === period);
        if (!session) {
          result[period] = null;
          continue;
        }

        const sessionLocs = locations.filter((l) => l.sessionId === session.id);

        const locData = sessionLocs.map((loc) => {
          const locPrizes = prizes.filter((p) => p.locationId === loc.id);
          const entry: Record<string, any> = {
            _id: loc.id,
            location: loc.location,
            code: loc.code,
          };
          for (const key of PRIZE_KEYS) {
            const group = locPrizes
              .filter((p) => p.prizeKey === key)
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((p) => ({ id: p.id, value: p.value, type: key, status: "done" }));
            entry[key] = group;
          }
          return entry;
        });

        result[period] = {
          name: schedule?.name || session.name || DEFAULT_PERIOD_SCHEDULE[period].name,
          displayTable: session.displayTable,
          displayNumber: schedule?.drawTime || session.displayNumber || DEFAULT_PERIOD_SCHEDULE[period].drawTime,
          sessionId: session.id,
          prizeLabels: session.prizeLabels ? JSON.parse(session.prizeLabels) : null,
          ...Object.fromEntries(PRIZE_KEYS.map((k) => [k, PERIOD_LABELS[k].label])),
          data: locData,
        };
      }

      return result as any;
    }),

  /**
   * Authed — persist prize label overrides for a session.
   * labels: string[] ordered by display row index.
   */
  updatePrizeLabels: authedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        labels: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      await db
        .update(lotterySession)
        .set({ prizeLabels: JSON.stringify(input.labels), updatedAt: new Date() })
        .where(eq(lotterySession.id, input.sessionId));
      return { success: true };
    }),

  updateLotterySessionName: authedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        name: z.string().min(1, "Session name is required"),
      })
    )
    .mutation(async ({ input }) => {
      await db
        .update(lotterySession)
        .set({ name: input.name, updatedAt: new Date() })
        .where(eq(lotterySession.id, input.sessionId));
      return { success: true };
    }),

  /**
   * Authed — upsert a single prize value by its DB id.
   */
  upsertLotteryPrize: authedProcedure
    .input(
      z.object({
        prizeId: z.string(),
        value: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await db
        .update(lotteryPrize)
        .set({ value: input.value })
        .where(eq(lotteryPrize.id, input.prizeId));
      return { success: true };
    }),

  upsertLotteryPrizes: authedProcedure
    .input(
      z.array(
        z.object({
          prizeId: z.string(),
          value: z.string().regex(/^\d*$/, "Value must contain only digits").max(6, "Value is too long"),
        })
      )
    )
    .mutation(async ({ input }) => {
      if (input.length === 0) return { success: true };

      // 1. Fetch corresponding prizes from DB
      const prizeIds = input.map(item => item.prizeId);
      const dbPrizes = await db
        .select()
        .from(lotteryPrize)
        .where(inArray(lotteryPrize.id, prizeIds));

      // 2. Validate that all submitted prize IDs exist in the database
      if (dbPrizes.length !== input.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "One or more prize IDs are invalid.",
        });
      }

      // 3. For each location affected, check that updates count does not exceed max allowed count of prizes
      const locationUpdatesCount: Record<string, number> = {};
      const prizeLocationMap: Record<string, string> = {};

      for (const p of dbPrizes) {
        prizeLocationMap[p.id] = p.locationId;
      }

      for (const item of input) {
        const locId = prizeLocationMap[item.prizeId];
        locationUpdatesCount[locId] = (locationUpdatesCount[locId] ?? 0) + 1;
      }

      const locationIds = Object.keys(locationUpdatesCount);
      const dbLocationsPrizes = await db
        .select()
        .from(lotteryPrize)
        .where(inArray(lotteryPrize.locationId, locationIds));

      for (const locId of locationIds) {
        const expectedCount = dbLocationsPrizes.filter(p => p.locationId === locId).length;
        const requested = locationUpdatesCount[locId];
        if (requested !== expectedCount) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Incorrect number of updates submitted for location. Expected: ${expectedCount}, received: ${requested}.`,
          });
        }
      }

      // 4. Perform updates inside a transaction
      await db.transaction(async (tx) => {
        for (const item of input) {
          await tx
            .update(lotteryPrize)
            .set({ value: item.value })
            .where(eq(lotteryPrize.id, item.prizeId));
        }
      });
      return { success: true };
    }),

  /**
   * Authed — update a location's display name and code.
   */
  updateLotteryLocation: authedProcedure
    .input(
      z.object({
        locationId: z.string(),
        location: z.string().min(1, "Location name is required"),
        code: z.string().min(1, "Code is required"),
      })
    )
    .mutation(async ({ input }) => {
      await db
        .update(lotteryLocation)
        .set({ location: input.location, code: input.code })
        .where(eq(lotteryLocation.id, input.locationId));
      return { success: true };
    }),

  /**
   * Authed — create blank skeleton for a date (all 4 periods with empty prize values).
   * No-ops for periods that already exist.
   */
  seedLotteryDate: authedProcedure
    .input(z.object({ date: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await ensureLotterySessionsForDate(input.date);
        return { success: true };
      } catch (error) {
        console.error("tRPC seedLotteryDate database error:", error);
        throw new Error("Failed to initialize lottery date.");
      }
    }),

  /**
   * Authed — blank all prize values for every location in a date.
   */
  resetLotteryDate: authedProcedure
    .input(z.object({ date: z.string() }))
    .mutation(async ({ input }) => {
      const sessions = await db
        .select({ id: lotterySession.id })
        .from(lotterySession)
        .where(eq(lotterySession.date, input.date));

      if (sessions.length === 0) return { success: true };

      const sessionIds = sessions.map((s) => s.id);
      const locations = await db
        .select({ id: lotteryLocation.id })
        .from(lotteryLocation)
        .where(inArray(lotteryLocation.sessionId, sessionIds));

      if (locations.length === 0) return { success: true };

      const locationIds = locations.map((l) => l.id);
      await db
        .update(lotteryPrize)
        .set({ value: "" })
        .where(inArray(lotteryPrize.locationId, locationIds));

      return { success: true };
    }),
});

// Export only the type definition of the router for frontend client hook integrations
export type AppRouter = typeof appRouter;