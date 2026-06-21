import { router, publicProcedure, authedProcedure } from "../trpc";
import { db } from "@/db";
import { user, advertisement, generalSetting } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import crypto from "crypto";
import { deleteFileFromS3 } from "@/lib/s3";
import { ensureError } from "@/lib/utils";

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
        email: z.string().email("Invalid email address"),
        username: z.string().min(2, "Username must be at least 2 characters long"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await db
          .update(user)
          .set({
            name: input.name,
            email: input.email.trim(),
            username: input.username.trim().toLowerCase(),
            displayUsername: input.username.trim(),
          })
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
          { id: "ads-1", title: "Bia Saigon Gold", position: "Left" as const, image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=400&q=80", status: true },
          { id: "ads-2", title: "Vé Số Kiến Thiết", position: "Left" as const, image: "https://images.unsplash.com/photo-1777896116711-837c58809f9c?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", status: true },
          { id: "ads-3", title: "Đông Á Bank", position: "Right" as const, image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=400&q=80", status: true },
          { id: "ads-4", title: "Trà Xanh Không Độ", position: "Right" as const, image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=400&q=80", status: true },
          { id: "ads-5", title: "Khuyến Mãi Lớn", position: "Center" as const, image: "https://images.unsplash.com/photo-1472851294608-062f824d296e?auto=format&fit=crop&w=800&q=80", status: true },
          { id: "ads-6", title: "Cơm Tấm Cali", position: "Center" as const, image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80", status: true }
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
        title: z.string().min(1, "Title is required"),
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
              title: input.title,
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
            title: input.title,
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
        logo: z.string().min(1, "Mini logo is required"),
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

        if (existing) {
          if (existing.logo !== input.logo) {
            await deleteFileFromS3(existing.logo);
          }
          if (existing.fullLogo !== input.fullLogo) {
            await deleteFileFromS3(existing.fullLogo);
          }

          await db
            .update(generalSetting)
            .set({
              logo: input.logo,
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
            logo: input.logo,
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
});

// Export only the type definition of the router for frontend client hook integrations
export type AppRouter = typeof appRouter;
