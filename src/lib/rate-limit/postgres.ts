import type { PrismaClient } from "@/generated/prisma/client";
import type { RateLimitStore } from "./types";

/**
 * Postgres-backed fixed-window store. A single atomic UPSERT makes it safe across
 * serverless instances without needing Redis.
 */
export class PostgresRateLimitStore implements RateLimitStore {
  constructor(private readonly prisma: PrismaClient) {}

  async increment(key: string, windowMs: number) {
    const interval = `${Math.max(1, Math.round(windowMs))} milliseconds`;
    const rows = await this.prisma.$queryRaw<{ count: number; resetAt: Date }[]>`
      INSERT INTO "RateLimit" ("key", "count", "resetAt")
      VALUES (${key}, 1, now() + ${interval}::interval)
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "RateLimit"."resetAt" <= now() THEN 1 ELSE "RateLimit"."count" + 1 END,
        "resetAt" = CASE WHEN "RateLimit"."resetAt" <= now() THEN now() + ${interval}::interval ELSE "RateLimit"."resetAt" END
      RETURNING "count", "resetAt"`;
    const row = rows[0]!;
    return { count: Number(row.count), resetAt: row.resetAt.getTime() };
  }

  /** Removes expired windows. Called opportunistically by the daily maintenance job. */
  async prune() {
    return this.prisma.rateLimit.deleteMany({ where: { resetAt: { lt: new Date() } } });
  }
}
