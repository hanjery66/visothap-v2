import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
