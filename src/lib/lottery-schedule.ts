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
