import { isbot } from "isbot";
import { UAParser } from "ua-parser-js";

export type DeviceType = "Desktop" | "Mobile" | "Tablet";

export interface ParsedUserAgent {
  device: DeviceType;
  browser: string;
  os: string;
}

const BROWSER_ALIASES: Record<string, string> = {
  "Mobile Safari": "Safari",
  "Chrome WebView": "Chrome",
  "Chrome Headless": "Chrome",
  "Mobile Firefox": "Firefox",
  "Samsung Browser": "Samsung Internet",
};

const OS_ALIASES: Record<string, string> = {
  "Mac OS": "macOS",
  "Chromium OS": "ChromeOS",
};

export function parseUserAgent(ua: string | null | undefined): ParsedUserAgent {
  const result = new UAParser(ua ?? "").getResult();
  const type = result.device.type;
  const device: DeviceType =
    type === "tablet" ? "Tablet" : type === "mobile" || type === "wearable" ? "Mobile" : "Desktop";
  const browserName = result.browser.name ?? "Unknown";
  const osName = result.os.name ?? "Unknown";
  return {
    device,
    browser: BROWSER_ALIASES[browserName] ?? browserName,
    os: OS_ALIASES[osName] ?? osName,
  };
}

/** Link-preview fetchers and crawlers that don't match common bot patterns. */
const EXTRA_BOT_PATTERN = /(headlesschrome|lighthouse|preview|slurp|linkcheck|monitor|uptime)/i;

/**
 * Bot detection used to keep crawlers, link unfurlers and scripted clients out of analytics.
 * Requests without a User-Agent are treated as bots.
 */
export function isBotUserAgent(ua: string | null | undefined): boolean {
  if (!ua || ua.trim().length < 8) return true;
  return isbot(ua) || EXTRA_BOT_PATTERN.test(ua);
}
