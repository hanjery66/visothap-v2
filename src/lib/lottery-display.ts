export const DEFAULT_LOTTERY_DISPLAY_SETTINGS = {
  splashMinutesBefore: 2,
  autoSeedMinutesBeforeSplash: 5,
  cellSplashDurationSeconds: 10,
  cellPauseIntervalSeconds: 5,
} as const;

export type LotteryDisplayConfig = {
  splashMinutesBefore: number;
  autoSeedMinutesBeforeSplash: number;
  cellSplashDurationSeconds: number;
  cellPauseIntervalSeconds: number;
};
