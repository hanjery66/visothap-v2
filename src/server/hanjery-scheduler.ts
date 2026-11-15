import dayjs from "dayjs";
import { env } from "@/env";
import { parseDrawTime } from "@/lib/utils";
import type { LotteryDisplayConfig } from "@/lib/lottery-display";

export interface HanjeryBatchItem {
  date: string;
  shift_id: string;
  column: string;
  raw: string;
}

export interface ScheduledHanjerySync {
  shiftId: string;
  date: string;
  period: string;
  payload: HanjeryBatchItem[];
  scheduledFor: string; // ISO date string
  createdAt: string;
  timerId?: ReturnType<typeof setTimeout>;
}

export interface PendingHanjerySyncInfo {
  shiftId: string;
  date: string;
  period: string;
  scheduledFor: string;
  remainingSeconds: number;
  totalDelaySeconds: number;
}

// Global queue to survive module re-evaluations during development
const globalForHanjery = globalThis as unknown as {
  __hanjeryQueue?: Map<string, ScheduledHanjerySync>;
};

export const hanjeryQueue =
  globalForHanjery.__hanjeryQueue ?? new Map<string, ScheduledHanjerySync>();

if (process.env.NODE_ENV !== "production") {
  globalForHanjery.__hanjeryQueue = hanjeryQueue;
}

export async function postLotteryResultToHanjery(payload: HanjeryBatchItem[]) {
  if (!payload || payload.length === 0) return { success: true };

  const validPayload = payload.filter(
    (item) => Boolean(item.shift_id) && Boolean(item.raw && item.raw.trim().length > 0)
  );
  if (validPayload.length === 0) return { success: true, ignored: true };

  const endpoint = env.HANJERY_URL + "/api/lottery-result/batch";

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": env.HANJERY_API_KEY },
      body: JSON.stringify(validPayload),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn("Hanjery sync warning:", res.status, errText);
      return { success: false, status: res.status, error: errText };
    }

    const data = await res.json().catch(() => null);
    console.log("[HanjeryScheduler] Successfully posted to Hanjery:", validPayload.length, "items");
    return { success: true, data };
  } catch (err: any) {
    console.error("Failed to post lottery result to Hanjery:", err);
    return { success: false, error: err?.message };
  }
}

export interface ScheduleOptions {
  shiftId: string;
  payload: HanjeryBatchItem[];
  date: string;
  period: string;
  drawTime?: string | null;
  showTableTime?: string | null;
  splashDelaySeconds?: number | null;
  displayConfig?: LotteryDisplayConfig | null;
  savedAt?: Date;
}

export async function scheduleHanjerySync(options: ScheduleOptions) {
  const {
    shiftId,
    payload,
    date,
    period,
    drawTime,
    showTableTime,
    splashDelaySeconds,
    displayConfig,
    savedAt = new Date(),
  } = options;

  const validPayload = (payload ?? []).filter(
    (item) => Boolean(item.shift_id) && Boolean(item.raw && item.raw.trim().length > 0)
  );

  if (validPayload.length === 0) {
    return { scheduled: false, reason: "empty_payload" };
  }

  // If no draw time available, send immediately
  if (!drawTime) {
    const res = await postLotteryResultToHanjery(validPayload);
    return { scheduled: false, sentImmediately: true, res };
  }

  const parsed = parseDrawTime(drawTime);
  if (!parsed) {
    const res = await postLotteryResultToHanjery(validPayload);
    return { scheduled: false, sentImmediately: true, res };
  }

  const drawMoment = dayjs(date)
    .hour(parsed.hour)
    .minute(parsed.minute)
    .second(parsed.second ?? 0);

  const parsedShow = showTableTime ? parseDrawTime(showTableTime) : null;
  let tableStart: dayjs.Dayjs;
  if (parsedShow) {
    tableStart = dayjs(date)
      .hour(parsedShow.hour)
      .minute(parsedShow.minute)
      .second(parsedShow.second ?? 0);
  } else {
    const tableOffset = displayConfig?.spinnerSecondsBeforeSplash ?? -180;
    tableStart = drawMoment.add(tableOffset, "second");
  }

  const splashDelay = splashDelaySeconds ?? displayConfig?.splashSecondsBefore ?? 60;
  let splashWindowStart =
    splashDelay < 0
      ? drawMoment.add(splashDelay, "second")
      : tableStart.add(splashDelay, "second");

  if (savedAt) {
    const updatedMoment = dayjs(savedAt);
    if (
      updatedMoment.isValid() &&
      updatedMoment.isSame(dayjs(date), "day") &&
      updatedMoment.isAfter(splashWindowStart)
    ) {
      splashWindowStart = updatedMoment;
    }
  }

  const isNorthern = period === "fourth";
  const totalSlots = isNorthern ? 27 : 18;
  const splashDurationSec = displayConfig?.cellSplashDurationSeconds ?? 10;
  const pauseIntervalSec = displayConfig?.cellPauseIntervalSeconds ?? 5;
  const slotStepSec = splashDurationSec + pauseIntervalSec;

  // Exact time last prize reveals (+3 seconds safety buffer)
  const totalSpinSeconds = (totalSlots - 1) * slotStepSec + splashDurationSec + 3;
  const endMoment = splashWindowStart.add(totalSpinSeconds, "second");

  const now = dayjs();
  const delayMs = endMoment.diff(now, "millisecond");

  if (delayMs <= 0) {
    // Spin animation has already completed (or edited past result)
    const res = await postLotteryResultToHanjery(validPayload);
    return {
      scheduled: false,
      sentImmediately: true,
      remainingSeconds: 0,
      res,
    };
  }

  // Clear existing pending sync if any for this shift
  const existing = hanjeryQueue.get(shiftId);
  if (existing?.timerId) {
    clearTimeout(existing.timerId);
  }

  const remainingSeconds = Math.ceil(delayMs / 1000);

  const timerId = setTimeout(async () => {
    try {
      console.log(`[HanjeryScheduler] Spin completed. Posting to Hanjery for shift ${shiftId}...`);
      await postLotteryResultToHanjery(validPayload);
    } catch (err) {
      console.error(`[HanjeryScheduler] Scheduled post failed for shift ${shiftId}:`, err);
    } finally {
      hanjeryQueue.delete(shiftId);
    }
  }, delayMs);

  hanjeryQueue.set(shiftId, {
    shiftId,
    date,
    period,
    payload: validPayload,
    scheduledFor: endMoment.toISOString(),
    createdAt: now.toISOString(),
    timerId,
  });

  return {
    scheduled: true,
    sentImmediately: false,
    remainingSeconds,
    scheduledFor: endMoment.toISOString(),
  };
}

export function getPendingHanjerySyncs(): PendingHanjerySyncInfo[] {
  const now = dayjs();
  const list: PendingHanjerySyncInfo[] = [];

  for (const item of hanjeryQueue.values()) {
    const target = dayjs(item.scheduledFor);
    const remainingSeconds = Math.max(0, target.diff(now, "second"));
    const totalDelaySeconds = Math.max(
      remainingSeconds,
      target.diff(dayjs(item.createdAt), "second")
    );

    list.push({
      shiftId: item.shiftId,
      date: item.date,
      period: item.period,
      scheduledFor: item.scheduledFor,
      remainingSeconds,
      totalDelaySeconds,
    });
  }

  return list;
}

export async function sendHanjeryNow(shiftId: string) {
  const item = hanjeryQueue.get(shiftId);
  if (!item) {
    return { success: false, error: "No pending sync found for this shift" };
  }

  if (item.timerId) {
    clearTimeout(item.timerId);
  }
  hanjeryQueue.delete(shiftId);

  const res = await postLotteryResultToHanjery(item.payload);
  return { success: true, res };
}

export function cancelHanjerySync(shiftId: string) {
  const item = hanjeryQueue.get(shiftId);
  if (!item) {
    return { success: false, error: "No pending sync found for this shift" };
  }

  if (item.timerId) {
    clearTimeout(item.timerId);
  }
  hanjeryQueue.delete(shiftId);

  return { success: true };
}

