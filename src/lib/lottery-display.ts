export const DEFAULT_LOTTERY_DISPLAY_SETTINGS = {
  splashSecondsBefore: 60,
  spinnerSecondsBeforeSplash: 120,
  cellSplashDurationSeconds: 10,
  cellPauseIntervalSeconds: 5,
} as const;

export type LotteryDisplayConfig = {
  splashSecondsBefore: number;
  spinnerSecondsBeforeSplash?: number;
  cellSplashDurationSeconds: number;
  cellPauseIntervalSeconds: number;
  // Deprecated backward-compatibility aliases
  splashMinutesBefore?: number;
  spinnerMinutesBeforeSplash?: number;
  autoSeedMinutesBeforeSplash?: number;
};
