import dayjs from "dayjs";
import { parseDrawTime } from "@/lib/utils";
import type { LotteryDisplayConfig } from "@/lib/lottery-display";

export type DrawStatus = "empty" | "pending" | "spinning" | "done";

export function computeColumnDrawStatus(
  dateParam: string,
  drawTime: string | undefined,
  columnIndex: number,
  config: LotteryDisplayConfig,
  showTableTime?: string | null,
  splashDelaySeconds?: number | null,
): DrawStatus {
  if (!drawTime) return "done";

  const parsed = parseDrawTime(drawTime);
  if (!parsed) return "done";

  const drawMoment = dayjs(dateParam)
    .hour(parsed.hour)
    .minute(parsed.minute)
    .second(parsed.second ?? 0);

  let spinnerStart: dayjs.Dayjs;
  const parsedShow = showTableTime ? parseDrawTime(showTableTime) : null;
  if (parsedShow) {
    spinnerStart = dayjs(dateParam)
      .hour(parsedShow.hour)
      .minute(parsedShow.minute)
      .second(parsedShow.second ?? 0);
  } else {
    const tableOffset = config.spinnerSecondsBeforeSplash ?? -180;
    spinnerStart = drawMoment.add(tableOffset, "second");
  }

  const splashDelay = splashDelaySeconds ?? config.splashSecondsBefore ?? 60;
  const splashStart = splashDelay < 0
    ? drawMoment.add(splashDelay, "second")
    : spinnerStart.add(splashDelay, "second");

  const splashDuration = config.cellSplashDurationSeconds ?? 10;
  const columnReveal = splashStart.add(splashDuration, "second");
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
