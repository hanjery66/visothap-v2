import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import dayjs from "dayjs";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper to ensure we have a proper error object
export function ensureError(err: unknown): Error {
  if (err instanceof Error) {
    return err;
  }
  return new Error(err instanceof Object ? JSON.stringify(err) : String(err));
}

export const DISPLAY_DATETIME_FORMAT = "DD-MM-YYYY hh:mm A";
export const DISPLAY_DATE_FORMAT = "DD-MM-YYYY";
export const STORAGE_DATE_FORMAT = "YYYY-MM-DD";

/** Parse draw times stored as "HH:mm" or "h:mm A". */
export function parseDrawTime(time: string): { hour: number; minute: number } | null {
  const hhmm = time.match(/^(\d{1,2}):(\d{2})$/);
  if (hhmm) {
    return { hour: Number(hhmm[1]), minute: Number(hhmm[2]) };
  }

  const ampm = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampm) {
    let hour = Number(ampm[1]);
    const minute = Number(ampm[2]);
    const meridiem = ampm[3].toUpperCase();

    if (meridiem === "PM" && hour !== 12) hour += 12;
    if (meridiem === "AM" && hour === 12) hour = 0;

    return { hour, minute };
  }

  return null;
}

/**
 * Format user-facing dates/times as `DD-MM-YYYY hh:mm A`.
 * Pass `time` (e.g. "17:15") to combine a calendar date with a draw time.
 * Date-only inputs (`YYYY-MM-DD`) render as `DD-MM-YYYY`.
 * Timestamp inputs render with both date and time.
 */
export function formatDisplayDateTime(
  date: string | Date | dayjs.Dayjs,
  time?: string,
  format: string = DISPLAY_DATETIME_FORMAT,
): string {
  const base = dayjs(date);
  if (!base.isValid()) return "";

  let effective = base;

  if (time) {
    const parsed = parseDrawTime(time);
    if (parsed) {
      effective = base.hour(parsed.hour).minute(parsed.minute).second(0);
    } else {
      // time string couldn't be parsed — nothing to merge in, fall back to base
      return `${base.format(DISPLAY_DATE_FORMAT)} ${time}`;
    }
  }

  return effective.format(format);
}
