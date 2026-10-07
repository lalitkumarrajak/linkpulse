import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const standard = new Intl.NumberFormat("en-US");

export function formatNumber(value: number, opts: { compact?: boolean } = {}) {
  return opts.compact && Math.abs(value) >= 10_000 ? compact.format(value) : standard.format(value);
}

export function formatPercent(value: number, digits = 1) {
  return `${(value * 100).toFixed(digits).replace(/\.0+$/, "")}%`;
}

/** Strips protocol and trailing slash for compact display of URLs. */
export function prettyUrl(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export function hostnameOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Compact relative time: "just now", "5m ago", "3h ago", "2d ago", then a short date. */
export function timeAgo(input: string | Date, now = Date.now()): string {
  const date = typeof input === "string" ? new Date(input) : input;
  const seconds = Math.max(0, Math.round((now - date.getTime()) / 1000));
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
