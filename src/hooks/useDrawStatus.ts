"use client";

import { useState, useEffect } from "react";
import {
  computePeriodDrawFlags,
  type DrawStatus,
} from "@/lib/lottery-draw-status";
import {
  DEFAULT_LOTTERY_DISPLAY_SETTINGS,
  type LotteryDisplayConfig,
} from "@/lib/lottery-display";

export type { DrawStatus };

export function useDrawStatuses(
  dateParam: string,
  drawTime: string | undefined,
  columnCount: number,
  config: LotteryDisplayConfig = DEFAULT_LOTTERY_DISPLAY_SETTINGS,
) {
  const getState = () =>
    computePeriodDrawFlags(dateParam, drawTime, columnCount, config);

  const [state, setState] = useState(getState);

  useEffect(() => {
    setState(getState());

    const id = setInterval(() => {
      setState(getState());
    }, 10_000);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dateParam,
    drawTime,
    columnCount,
    config.splashMinutesBefore,
    config.columnRevealIntervalMinutes,
  ]);

  return state;
}

/** @deprecated Use useDrawStatuses for per-column reveal support. */
export function useDrawStatus(
  dateParam: string,
  drawTime?: string,
  config: LotteryDisplayConfig = DEFAULT_LOTTERY_DISPLAY_SETTINGS,
): DrawStatus {
  const { columnStatuses, isPending, isSpinning } = useDrawStatuses(
    dateParam,
    drawTime,
    1,
    config,
  );

  if (isPending) return "pending";
  if (isSpinning) return "spinning";
  return columnStatuses[0] ?? "done";
}
