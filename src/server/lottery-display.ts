import { eq } from "drizzle-orm";
import { db } from "@/db";
import { lotteryDisplaySetting } from "@/db/schema";
import { DEFAULT_LOTTERY_DISPLAY_SETTINGS } from "@/lib/lottery-display";

const SETTINGS_ID = "default";

export async function ensureDisplaySettingsSeeded() {
  const [existing] = await db
    .select()
    .from(lotteryDisplaySetting)
    .where(eq(lotteryDisplaySetting.id, SETTINGS_ID))
    .limit(1);

  if (existing) {
    return existing;
  }

  const defaults = {
    id: SETTINGS_ID,
    splashMinutesBefore: DEFAULT_LOTTERY_DISPLAY_SETTINGS.splashMinutesBefore,
    autoSeedMinutesBeforeSplash:
      DEFAULT_LOTTERY_DISPLAY_SETTINGS.autoSeedMinutesBeforeSplash,
    spinnerMinutesBeforeSplash:
      DEFAULT_LOTTERY_DISPLAY_SETTINGS.spinnerMinutesBeforeSplash,
    cellSplashDurationSeconds:
      DEFAULT_LOTTERY_DISPLAY_SETTINGS.cellSplashDurationSeconds,
    cellPauseIntervalSeconds:
      DEFAULT_LOTTERY_DISPLAY_SETTINGS.cellPauseIntervalSeconds,
    updatedAt: new Date(),
  };

  await db.insert(lotteryDisplaySetting).values(defaults);
  return defaults;
}
