import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { db as defaultDb } from "@/lib/db";
import type { Range } from "@/lib/validation";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export const RANGE_CONFIG: Record<Range, { durationMs: number; interval: "hour" | "day"; label: string }> = {
  "24h": { durationMs: DAY, interval: "hour", label: "Last 24 hours" },
  "7d": { durationMs: 7 * DAY, interval: "day", label: "Last 7 days" },
  "30d": { durationMs: 30 * DAY, interval: "day", label: "Last 30 days" },
  "90d": { durationMs: 90 * DAY, interval: "day", label: "Last 90 days" },
};

export const BREAKDOWN_DIMENSIONS = ["referrer", "country", "city", "device", "browser", "os"] as const;
export type BreakdownDimension = (typeof BREAKDOWN_DIMENSIONS)[number];

export interface BreakdownRow {
  name: string;
  value: number;
}

export interface TimeseriesPoint {
  t: string;
  clicks: number;
  visitors: number;
}

export interface AnalyticsSummary {
  range: Range;
  interval: "hour" | "day";
  start: string;
  end: string;
  totals: { clicks: number; visitors: number; prevClicks: number; prevVisitors: number };
  timeseries: TimeseriesPoint[];
  breakdowns: Record<BreakdownDimension, BreakdownRow[]>;
  topLinks: { id: string; slug: string; title: string | null; url: string; clicks: number }[];
}

/** Floors a date to the start of its UTC hour/day bucket. */
export function bucketStart(date: Date, interval: "hour" | "day"): Date {
  const d = new Date(date);
  d.setUTCMinutes(0, 0, 0);
  if (interval === "day") d.setUTCHours(0);
  return d;
}

/** Produces a gap-free series so charts don't interpolate across missing buckets. */
export function fillTimeseries(
  rows: { bucket: Date; clicks: number; visitors: number }[],
  start: Date,
  end: Date,
  interval: "hour" | "day",
): TimeseriesPoint[] {
  const step = interval === "hour" ? HOUR : DAY;
  const byKey = new Map(rows.map((r) => [new Date(r.bucket).getTime(), r]));
  const out: TimeseriesPoint[] = [];
  for (let t = bucketStart(start, interval).getTime(); t <= end.getTime(); t += step) {
    const row = byKey.get(t);
    out.push({ t: new Date(t).toISOString(), clicks: row?.clicks ?? 0, visitors: row?.visitors ?? 0 });
  }
  return out;
}

export class AnalyticsService {
  constructor(private readonly db: PrismaClient = defaultDb) {}

  async summary(params: {
    userId: string;
    linkId?: string;
    range: Range;
    now?: Date;
  }): Promise<AnalyticsSummary> {
    const { userId, linkId, range } = params;
    const config = RANGE_CONFIG[range];
    const end = params.now ?? new Date();
    const start = new Date(end.getTime() - config.durationMs);
    const prevStart = new Date(start.getTime() - config.durationMs);

    const scope = Prisma.sql`l."userId" = ${userId} ${linkId ? Prisma.sql`AND c."linkId" = ${linkId}` : Prisma.empty}`;
    const inRange = Prisma.sql`c."createdAt" >= ${start} AND c."createdAt" <= ${end}`;

    const totalsQuery = this.db.$queryRaw<
      { clicks: number; visitors: number; prev_clicks: number; prev_visitors: number }[]
    >`
      SELECT
        count(*) FILTER (WHERE c."createdAt" >= ${start})::int AS clicks,
        count(DISTINCT c."visitorId") FILTER (WHERE c."createdAt" >= ${start})::int AS visitors,
        count(*) FILTER (WHERE c."createdAt" < ${start})::int AS prev_clicks,
        count(DISTINCT c."visitorId") FILTER (WHERE c."createdAt" < ${start})::int AS prev_visitors
      FROM "Click" c JOIN "Link" l ON l.id = c."linkId"
      WHERE ${scope} AND c."createdAt" >= ${prevStart} AND c."createdAt" <= ${end}`;

    const seriesQuery = this.db.$queryRaw<{ bucket: Date; clicks: number; visitors: number }[]>`
      SELECT date_trunc(${config.interval}, c."createdAt") AS bucket,
             count(*)::int AS clicks,
             count(DISTINCT c."visitorId")::int AS visitors
      FROM "Click" c JOIN "Link" l ON l.id = c."linkId"
      WHERE ${scope} AND ${inRange}
      GROUP BY 1 ORDER BY 1`;

    const breakdownQueries = BREAKDOWN_DIMENSIONS.map((dimension) => {
      const column = Prisma.raw(`c."${dimension}"`);
      return this.db.$queryRaw<BreakdownRow[]>`
        SELECT ${column} AS name, count(*)::int AS value
        FROM "Click" c JOIN "Link" l ON l.id = c."linkId"
        WHERE ${scope} AND ${inRange}
        GROUP BY 1 ORDER BY 2 DESC, 1 ASC LIMIT 10`;
    });

    const topLinksQuery = linkId
      ? Promise.resolve([])
      : this.db.$queryRaw<AnalyticsSummary["topLinks"]>`
          SELECT l.id, l.slug, l.title, l.url, count(*)::int AS clicks
          FROM "Click" c JOIN "Link" l ON l.id = c."linkId"
          WHERE ${scope} AND ${inRange}
          GROUP BY l.id ORDER BY clicks DESC, l.slug ASC LIMIT 5`;

    const [totals, series, topLinks, ...breakdowns] = await Promise.all([
      totalsQuery,
      seriesQuery,
      topLinksQuery,
      ...breakdownQueries,
    ]);

    const t = totals[0] ?? { clicks: 0, visitors: 0, prev_clicks: 0, prev_visitors: 0 };
    return {
      range,
      interval: config.interval,
      start: start.toISOString(),
      end: end.toISOString(),
      totals: {
        clicks: t.clicks,
        visitors: t.visitors,
        prevClicks: t.prev_clicks,
        prevVisitors: t.prev_visitors,
      },
      timeseries: fillTimeseries(series, start, end, config.interval),
      breakdowns: Object.fromEntries(BREAKDOWN_DIMENSIONS.map((d, i) => [d, breakdowns[i] ?? []])) as Record<
        BreakdownDimension,
        BreakdownRow[]
      >,
      topLinks,
    };
  }

  recentClicks(userId: string, linkId: string, take = 20) {
    return this.db.click.findMany({
      where: { linkId, link: { userId } },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        createdAt: true,
        referrer: true,
        country: true,
        city: true,
        device: true,
        browser: true,
        os: true,
      },
    });
  }

  /** Streams clicks in batches (keyset pagination) for CSV export without loading everything in memory. */
  async *exportClicks(params: { userId: string; linkId?: string; since?: Date; batchSize?: number }) {
    const batchSize = params.batchSize ?? 1000;
    let cursor: bigint | undefined;
    for (;;) {
      const rows = await this.db.click.findMany({
        where: {
          link: { userId: params.userId },
          ...(params.linkId && { linkId: params.linkId }),
          ...(params.since && { createdAt: { gte: params.since } }),
          ...(cursor !== undefined && { id: { lt: cursor } }),
        },
        orderBy: { id: "desc" },
        take: batchSize,
        include: { link: { select: { slug: true } } },
      });
      if (rows.length === 0) return;
      yield rows;
      cursor = rows[rows.length - 1]!.id;
      if (rows.length < batchSize) return;
    }
  }
}

export const analyticsService = new AnalyticsService();
