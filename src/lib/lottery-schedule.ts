import dayjs from "dayjs";
import { parseDrawTime } from "@/lib/utils";

export const LOTTERY_DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
export type LotteryDayKey = (typeof LOTTERY_DAY_KEYS)[number];

export const LOTTERY_PERIODS = ["first", "second", "third", "fourth"] as const;
export type LotteryPeriodKey = (typeof LOTTERY_PERIODS)[number];

export const DEFAULT_PERIOD_SCHEDULE: Record<
  LotteryPeriodKey,
  { name: string; drawTime: string }
> = {
  first: { name: "Sổ Kết Quả Miền Trung", drawTime: "17:15" },
  second: { name: "Sổ Kết Quả Miền Đông", drawTime: "13:50" },
  third: { name: "Sổ Kết Quả Miền Nam", drawTime: "16:15" },
  fourth: { name: "Sổ Kết Quả Miền Bắc", drawTime: "18:15" },
};

export function getDayKeyFromDate(date: string): LotteryDayKey {
  const dayIndex = new Date(`${date}T12:00:00`).getDay();
  return LOTTERY_DAY_KEYS[dayIndex];
}

const SCHEDULE_WEEK_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export function buildDefaultScheduleRows() {
  const now = new Date();

  return SCHEDULE_WEEK_DAYS.flatMap((day) =>
    LOTTERY_PERIODS.map((period) => ({
      id: `${day}-${period}`,
      dayOfWeek: day,
      period,
      name: DEFAULT_PERIOD_SCHEDULE[period].name,
      drawTime: DEFAULT_PERIOD_SCHEDULE[period].drawTime,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    }))
  );
}

export interface ScheduleItem {
  dayOfWeek: string;
  period: string;
  drawTime: string;
  enabled: boolean;
}

/**
 * Calculates the default lottery date to display:
 * - If today's earliest draw/preparation has started, returns today (YYYY-MM-DD).
 * - If today's first draw/preparation has NOT started yet, returns yesterday (YYYY-MM-DD).
 */
export function getDefaultLotteryDate(
  schedule?: ScheduleItem[],
  displayConfig?: { splashMinutesBefore?: number; autoSeedMinutesBeforeSplash?: number },
  currentMoment = dayjs(),
): string | undefined {
  if (!schedule) return undefined;

  const todayStr = currentMoment.format("YYYY-MM-DD");
  const yesterdayStr = currentMoment.subtract(1, "day").format("YYYY-MM-DD");

  const dayKey = getDayKeyFromDate(todayStr);
  const splashMinutes = displayConfig?.splashMinutesBefore ?? 2;
  const autoSeedMinutes = displayConfig?.autoSeedMinutesBeforeSplash ?? 5;
  // Offset includes: empty cell window (autoSeedMinutes) + spinner window (autoSeedMinutes) + splash window (splashMinutes)
  const totalOffsetMinutes = splashMinutes + autoSeedMinutes * 2;

  const todayItems = schedule.filter((s) => s.dayOfWeek === dayKey && s.enabled);

  if (todayItems.length === 0) {
    return yesterdayStr;
  }

  // Find earliest preparation/draw moment among today's enabled draws
  let earliestStartMoment: dayjs.Dayjs | null = null;

  for (const item of todayItems) {
    const parsed = parseDrawTime(item.drawTime);
    if (!parsed) continue;

    const drawMoment = currentMoment
      .hour(parsed.hour)
      .minute(parsed.minute)
      .second(0);
    const startMoment = drawMoment.subtract(totalOffsetMinutes, "minute");

    if (!earliestStartMoment || startMoment.isBefore(earliestStartMoment)) {
      earliestStartMoment = startMoment;
    }
  }

  if (!earliestStartMoment) {
    return todayStr;
  }

  // If now is before the earliest draw start time of today, show yesterday's data
  if (currentMoment.isBefore(earliestStartMoment)) {
    return yesterdayStr;
  }

  return todayStr;
}
