import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { analyticsService } from "@/server/services/analytics";
import { clickFromHeaders, clickService } from "@/server/services/clicks";
import { linkService } from "@/server/services/links";
import { baseClick, createUser, resetDatabase } from "./helpers";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const NOW = new Date("2026-06-15T12:30:00Z");

describe("click recording and analytics", () => {
  beforeEach(resetDatabase);

  it("records a click and bumps the link counter", async () => {
    const user = await createUser();
    const link = await linkService.create(user.id, { url: "https://a.com" });
    await clickService.record(link.id, baseClick);
    const updated = await linkService.get(user.id, link.id);
    expect(updated.clickCount).toBe(1);
    expect(updated.lastClickedAt).not.toBeNull();
  });

  it("derives click metadata from request headers and skips bots", () => {
    const headers = new Headers({
      "user-agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
      referer: "https://www.linkedin.com/feed/",
      "x-vercel-ip-country": "de",
      "x-vercel-ip-city": "M%C3%BCnchen",
      "x-forwarded-for": "203.0.113.7, 10.0.0.1",
    });
    const event = clickFromHeaders(headers, { secret: "s" });
    expect(event).toMatchObject({
      device: "Mobile",
      browser: "Safari",
      os: "iOS",
      referrer: "linkedin.com",
      country: "DE",
      city: "München",
    });
    expect(clickFromHeaders(new Headers({ "user-agent": "Twitterbot/1.0" }), { secret: "s" })).toBeNull();
  });

  it("summarises clicks with totals, previous period, gap-free series and breakdowns", async () => {
    const user = await createUser();
    const other = await createUser();
    const a = await linkService.create(user.id, { url: "https://a.com", slug: "aaa" });
    const b = await linkService.create(user.id, { url: "https://b.com", slug: "bbb" });
    const foreign = await linkService.create(other.id, { url: "https://c.com" });

    const at = (msAgo: number) => new Date(NOW.getTime() - msAgo);
    // Current 7d window
    await clickService.record(a.id, {
      ...baseClick,
      createdAt: at(1 * HOUR),
      visitorId: "v1",
      referrer: "x.com",
    });
    await clickService.record(a.id, {
      ...baseClick,
      createdAt: at(2 * HOUR),
      visitorId: "v1",
      referrer: "x.com",
    });
    await clickService.record(a.id, {
      ...baseClick,
      createdAt: at(3 * DAY),
      visitorId: "v2",
      country: "IN",
      device: "Mobile",
    });
    await clickService.record(b.id, {
      ...baseClick,
      createdAt: at(5 * DAY),
      visitorId: "v3",
      browser: "Firefox",
    });
    // Previous 7d window
    await clickService.record(a.id, { ...baseClick, createdAt: at(10 * DAY), visitorId: "v4" });
    // Other user's click must never leak
    await clickService.record(foreign.id, { ...baseClick, createdAt: at(1 * HOUR) });

    const summary = await analyticsService.summary({ userId: user.id, range: "7d", now: NOW });
    expect(summary.totals).toEqual({ clicks: 4, visitors: 3, prevClicks: 1, prevVisitors: 1 });
    expect(summary.interval).toBe("day");
    expect(summary.timeseries).toHaveLength(8);
    expect(summary.timeseries.reduce((s, p) => s + p.clicks, 0)).toBe(4);
    // Ties are ordered alphabetically for stable output.
    expect(summary.breakdowns.referrer).toEqual([
      { name: "Direct", value: 2 },
      { name: "x.com", value: 2 },
    ]);
    expect(summary.breakdowns.country).toEqual([
      { name: "US", value: 3 },
      { name: "IN", value: 1 },
    ]);
    expect(summary.topLinks.map((l) => [l.slug, l.clicks])).toEqual([
      ["aaa", 3],
      ["bbb", 1],
    ]);

    const perLink = await analyticsService.summary({ userId: user.id, linkId: b.id, range: "7d", now: NOW });
    expect(perLink.totals.clicks).toBe(1);
    expect(perLink.breakdowns.browser).toEqual([{ name: "Firefox", value: 1 }]);
    expect(perLink.topLinks).toEqual([]);

    const hourly = await analyticsService.summary({ userId: user.id, range: "24h", now: NOW });
    expect(hourly.interval).toBe("hour");
    expect(hourly.totals.clicks).toBe(2);
    expect(hourly.timeseries).toHaveLength(25);
  });

  it("exports clicks in batches scoped to the owner", async () => {
    const user = await createUser();
    const link = await linkService.create(user.id, { url: "https://a.com", slug: "export-me" });
    await db.click.createMany({
      data: Array.from({ length: 7 }, (_, i) => ({
        ...baseClick,
        linkId: link.id,
        createdAt: new Date(NOW.getTime() - i * HOUR),
      })),
    });
    const batches = [];
    for await (const batch of analyticsService.exportClicks({ userId: user.id, batchSize: 3 }))
      batches.push(batch);
    expect(batches.map((b) => b.length)).toEqual([3, 3, 1]);
    expect(batches[0]![0]!.link.slug).toBe("export-me");

    const intruder = await createUser();
    const none = [];
    for await (const batch of analyticsService.exportClicks({ userId: intruder.id })) none.push(batch);
    expect(none).toHaveLength(0);
  });
});
