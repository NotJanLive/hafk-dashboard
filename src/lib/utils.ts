import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const dateTime = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" });
const relative = new Intl.RelativeTimeFormat("de-DE", { numeric: "auto" });

export function formatDateTime(iso: string) {
  return dateTime.format(new Date(iso));
}

export function formatRelative(iso: string, now: number = Date.now()) {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }
  return relative.format(seconds, "second");
}

export function formatNumber(value: number) {
  return value.toLocaleString("de-DE");
}

/** Only allow same-origin relative paths as post-login targets (prevents open redirects). */
export function safeReturnTo(value: string | null | undefined, fallback = "/servers") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
