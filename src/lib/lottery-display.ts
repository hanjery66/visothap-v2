export const DEFAULT_LOTTERY_DISPLAY_SETTINGS = {
  splashMinutesBefore: 2,
  columnRevealIntervalMinutes: 1,
} as const;

export type LotteryDisplayConfig = {
  splashMinutesBefore: number;
  columnRevealIntervalMinutes: number;
};
