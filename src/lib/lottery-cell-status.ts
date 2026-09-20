import dayjs from "dayjs";
import { parseDrawTime } from "@/lib/utils";
import type { LotteryDisplayConfig } from "@/lib/lottery-display";

export type CellDrawStatus = "pending" | "spinning" | "done";

/**
 * Compute the draw status for a single prize cell.
 *
 * @param totalPreviousSlots  Sum of all prize slots that belong to columns
 *                            that come *before* this column in the table.
 *                            Using this instead of colIndex ensures columns
 *                            reveal sequentially (top-to-bottom in col 0,
 *                            then col 1, etc.) rather than in parallel.
 * @param slotIndex           0-based index of this slot within its own column.
 */
export function computeCellDrawStatus(
  dateParam: string,
  drawTime: string | undefined,
  totalPreviousSlots: number,
  slotIndex: number,
  config: LotteryDisplayConfig,
  currentMoment?: dayjs.Dayjs,
  showTableTime?: string | null,
  splashDelaySeconds?: number | null,
  valueUpdatedAt?: string | number | null,
): CellDrawStatus {
  if (!drawTime) return "done";

  const parsed = parseDrawTime(drawTime);
  if (!parsed) return "done";

  const drawMoment = dayjs(dateParam)
    .hour(parsed.hour)
    .minute(parsed.minute)
    .second(parsed.second ?? 0);

  // Table appears at showTableTime if provided, else fallback to offset
  let tableStart: dayjs.Dayjs;
  const parsedShow = showTableTime ? parseDrawTime(showTableTime) : null;
  if (parsedShow) {
    tableStart = dayjs(dateParam)
      .hour(parsedShow.hour)
      .minute(parsedShow.minute)
      .second(parsedShow.second ?? 0);
  } else {
    const tableOffset = config.spinnerSecondsBeforeSplash ?? -180;
    tableStart = drawMoment.add(tableOffset, "second");
  }

  // Splash animation starts N seconds after table appears
  const splashDelay = splashDelaySeconds ?? config.splashSecondsBefore ?? 60;
  let splashWindowStart = splashDelay < 0
    ? drawMoment.add(splashDelay, "second")
    : tableStart.add(splashDelay, "second");

  // If values were entered after the scheduled splash start, animate from when they were entered!
  if (valueUpdatedAt) {
    const updatedMoment = dayjs(valueUpdatedAt);
    if (
      updatedMoment.isValid() &&
      updatedMoment.isSame(dayjs(dateParam), "day") &&
      updatedMoment.isAfter(splashWindowStart)
    ) {
      splashWindowStart = updatedMoment;
    }
  }

  const splashDurationSec = config.cellSplashDurationSeconds ?? 10;
  const pauseIntervalSec = config.cellPauseIntervalSeconds ?? 5;
  const slotStepSec = splashDurationSec + pauseIntervalSec;

  // Global slot position: all previous-column slots come first, then this slot
  const globalSlot = totalPreviousSlots + slotIndex;

  // Exact start and reveal moments for this cell
  const slotSplashStart = splashWindowStart.add(globalSlot * slotStepSec, "second");
  const slotRevealTime = slotSplashStart.add(splashDurationSec, "second");

  const now = currentMoment ?? dayjs();

  if (now.isBefore(slotSplashStart)) return "pending";
  if (now.isBefore(slotRevealTime)) return "spinning";
  return "done";
}

