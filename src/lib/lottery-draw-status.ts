import dayjs from "dayjs";
import { parseDrawTime } from "@/lib/utils";
import type { LotteryDisplayConfig } from "@/lib/lottery-display";

export type DrawStatus = "empty" | "pending" | "spinning" | "done";

export function computeColumnDrawStatus(
  dateParam: string,
  drawTime: string | undefined,
  columnIndex: number,
  config: LotteryDisplayConfig,
): DrawStatus {
  if (!drawTime) return "done";

  const parsed = parseDrawTime(drawTime);
  if (!parsed) return "done";

  const drawMoment = dayjs(dateParam)
    .hour(parsed.hour)
    .minute(parsed.minute)
    .second(0);

  const totalOffsetMinutes =
    (config.splashMinutesBefore ?? 2) +
    (config.autoSeedMinutesBeforeSplash ?? 5);

  const spinnerStart = drawMoment.subtract(totalOffsetMinutes, "minute");
  const splashStart = drawMoment.subtract(config.splashMinutesBefore ?? 2, "minute");
  const columnReveal = drawMoment;
  const now = dayjs();

  if (now.isBefore(spinnerStart)) return "empty";
  if (now.isBefore(splashStart)) return "pending";
  if (now.isBefore(columnReveal)) return "spinning";
  return "done";
}

export function computePeriodDrawFlags(
  dateParam: string,
  drawTime: string | undefined,
  columnCount: number,
  config: LotteryDisplayConfig,
) {
  const columnStatuses = Array.from({ length: Math.max(columnCount, 1) }, (_, i) =>
    computeColumnDrawStatus(dateParam, drawTime, i, config),
  );

  const isPending = columnStatuses.every((status) => status === "pending" || status === "empty");
  const isSpinning =
    !isPending && !columnStatuses.every((status) => status === "done");

  return { columnStatuses, isPending, isSpinning };
}
