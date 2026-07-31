import dayjs from "dayjs";
import { parseDrawTime } from "@/lib/utils";
import type { LotteryDisplayConfig } from "@/lib/lottery-display";

export type DrawStatus = "pending" | "spinning" | "done";

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
  const splashStart = drawMoment.subtract(config.splashMinutesBefore, "minute");
  const columnReveal = drawMoment.add(
    columnIndex * (config.cellPauseIntervalSeconds / 60),
    "minute",
  );
  const now = dayjs();

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

  const isPending = columnStatuses.every((status) => status === "pending");
  const isSpinning =
    !isPending && !columnStatuses.every((status) => status === "done");

  return { columnStatuses, isPending, isSpinning };
}
