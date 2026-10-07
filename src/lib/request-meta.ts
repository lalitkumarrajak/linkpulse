import { createHash } from "node:crypto";

export interface GeoInfo {
  country: string;
  region: string;
  city: string;
}

const UNKNOWN = "Unknown";

function decodeHeader(value: string | null): string {
  if (!value) return UNKNOWN;
  try {
    return decodeURIComponent(value) || UNKNOWN;
  } catch {
    return value;
  }
}

/** Reads Vercel's geo headers (https://vercel.com/docs/headers/request-headers). */
export function geoFromHeaders(headers: Headers): GeoInfo {
  const country = headers.get("x-vercel-ip-country")?.toUpperCase();
  return {
    country: country && /^[A-Z]{2}$/.test(country) ? country : UNKNOWN,
    region: decodeHeader(headers.get("x-vercel-ip-country-region")),
    city: decodeHeader(headers.get("x-vercel-ip-city")),
  };
}

export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "0.0.0.0";
}

/**
 * Normalises a Referer header to a bare domain. Self-referrals and missing values
 * are reported as "Direct".
 */
export function referrerDomain(referer: string | null | undefined, selfHost?: string): string {
  if (!referer) return "Direct";
  try {
    const host = new URL(referer).hostname.replace(/^www\./, "").toLowerCase();
    if (!host || (selfHost && host === selfHost.replace(/^www\./, "").toLowerCase())) return "Direct";
    if (host === "t.co") return "x.com";
    if (host === "lnkd.in") return "linkedin.com";
    return host;
  } catch {
    return "Direct";
  }
}

/**
 * Privacy-friendly visitor fingerprint: a salted hash of IP + UA that rotates daily,
 * so raw IPs are never stored and visitors can't be tracked across days.
 */
export function visitorId(ip: string, ua: string, secret: string, date = new Date()): string {
  const day = date.toISOString().slice(0, 10);
  return createHash("sha256").update(`${secret}:${day}:${ip}:${ua}`).digest("hex").slice(0, 32);
}
