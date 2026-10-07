import type { PrismaClient } from "@/generated/prisma/client";
import { db as defaultDb } from "@/lib/db";
import { clientIp, geoFromHeaders, referrerDomain, visitorId } from "@/lib/request-meta";
import { isBotUserAgent, parseUserAgent } from "@/lib/user-agent";

export interface ClickEvent {
  visitorId: string;
  referrer: string;
  country: string;
  region: string;
  city: string;
  device: string;
  browser: string;
  os: string;
  createdAt?: Date;
}

/**
 * Derives a click event from request headers. Returns null for bots so they are
 * excluded from analytics (the redirect itself still happens).
 */
export function clickFromHeaders(headers: Headers, options: { secret: string; selfHost?: string }) {
  const ua = headers.get("user-agent");
  if (isBotUserAgent(ua)) return null;
  const parsed = parseUserAgent(ua);
  return {
    ...geoFromHeaders(headers),
    ...parsed,
    referrer: referrerDomain(headers.get("referer"), options.selfHost),
    visitorId: visitorId(clientIp(headers), ua ?? "", options.secret),
  } satisfies ClickEvent;
}

export class ClickService {
  constructor(private readonly db: PrismaClient = defaultDb) {}

  async record(linkId: string, event: ClickEvent) {
    const createdAt = event.createdAt ?? new Date();
    await this.db.$transaction([
      this.db.click.create({ data: { ...event, linkId, createdAt } }),
      this.db.link.update({
        where: { id: linkId },
        data: { clickCount: { increment: 1 }, lastClickedAt: createdAt },
      }),
    ]);
  }
}

export const clickService = new ClickService();
