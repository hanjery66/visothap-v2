import dayjs from "dayjs";
import { parseDrawTime } from "@/lib/utils";

export const LOTTERY_DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
export type LotteryDayKey = (typeof LOTTERY_DAY_KEYS)[number];

export const LOTTERY_PERIODS = ["first", "second", "third", "fourth"] as const;
export type LotteryPeriodKey = (typeof LOTTERY_PERIODS)[number];

export const DEFAULT_PERIOD_SCHEDULE: Record<
  LotteryPeriodKey,
  { name: string; drawTime: string; showTableTime: string; splashDelaySeconds: number }
> = {
  first: { name: "Sổ Kết Quả Miền Đông", drawTime: "10:50", showTableTime: "10:47", splashDelaySeconds: 60 },
  second: { name: "Sổ Kết Quả Miền Trung", drawTime: "13:50", showTableTime: "13:47", splashDelaySeconds: 60 },
  third: { name: "Sổ Kết Quả Miền Nam", drawTime: "16:50", showTableTime: "16:47", splashDelaySeconds: 60 },
  fourth: { name: "Sổ Kết Quả Miền Bắc", drawTime: "18:45", showTableTime: "18:42", splashDelaySeconds: 60 },
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
      showTableTime: DEFAULT_PERIOD_SCHEDULE[period].showTableTime,
      splashDelaySeconds: DEFAULT_PERIOD_SCHEDULE[period].splashDelaySeconds,
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
  showTableTime?: string | null;
  splashDelaySeconds?: number | null;
  enabled: boolean;
}

/**
 * Calculates the default lottery date to display:
 * - If today's earliest draw/preparation has started, returns today (YYYY-MM-DD).
 * - If today's first draw/preparation has NOT started yet, returns yesterday (YYYY-MM-DD).
 */
export function getDefaultLotteryDate(
  schedule?: ScheduleItem[],
  displayConfig?: {
    splashSecondsBefore?: number;
    spinnerSecondsBeforeSplash?: number;
    splashMinutesBefore?: number;
    spinnerMinutesBeforeSplash?: number;
    autoSeedMinutesBeforeSplash?: number;
  },
  currentMoment = dayjs(),
): string | undefined {
  if (!schedule) return undefined;

  const todayStr = currentMoment.format("YYYY-MM-DD");
  const yesterdayStr = currentMoment.subtract(1, "day").format("YYYY-MM-DD");

  const dayKey = getDayKeyFromDate(todayStr);
  const splashOffset =
    displayConfig?.splashSecondsBefore ??
    (displayConfig?.splashMinutesBefore ? -displayConfig.splashMinutesBefore * 60 : -60);
  const rawSpinner = displayConfig?.spinnerSecondsBeforeSplash ?? -180;

  const todayItems = schedule.filter((s) => s.dayOfWeek === dayKey && s.enabled);

  if (todayItems.length === 0) {
    return yesterdayStr;
  }

  // Find earliest preparation/draw moment among today's enabled draws
  let earliestStartMoment: dayjs.Dayjs | null = null;

  for (const item of todayItems) {
    let startMoment: dayjs.Dayjs | null = null;
    const parsedShow = item.showTableTime ? parseDrawTime(item.showTableTime) : null;
    if (parsedShow) {
      startMoment = currentMoment
        .hour(parsedShow.hour)
        .minute(parsedShow.minute)
        .second(parsedShow.second ?? 0);
    } else {
      const parsed = parseDrawTime(item.drawTime);
      if (!parsed) continue;

      const drawMoment = currentMoment
        .hour(parsed.hour)
        .minute(parsed.minute)
        .second(parsed.second ?? 0);
      const splashStart = drawMoment.add(splashOffset, "second");
      startMoment = rawSpinner < 0
        ? drawMoment.add(rawSpinner, "second")
        : splashStart.subtract(rawSpinner, "second");
    }

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
