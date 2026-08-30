import dayjs from "dayjs";
import { parseDrawTime } from "@/lib/utils";
import type { LotteryDisplayConfig } from "@/lib/lottery-display";

export type CellDrawStatus = "empty" | "pending" | "spinning" | "done";

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
): CellDrawStatus {
  if (!drawTime) return "done";

  const parsed = parseDrawTime(drawTime);
  if (!parsed) return "done";

  const drawMoment = dayjs(dateParam)
    .hour(parsed.hour)
    .minute(parsed.minute)
    .second(0);

  const splashMinutes = config.splashMinutesBefore ?? 2;

  // Splash window opens N minutes before draw time
  const splashWindowStart = drawMoment.subtract(splashMinutes, "minute");

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

