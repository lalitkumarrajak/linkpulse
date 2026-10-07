import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { RateLimiter } from "@/lib/rate-limit";
import { PostgresRateLimitStore } from "@/lib/rate-limit/postgres";
import { apiKeyService } from "@/server/services/api-keys";
import { DEMO_EMAIL, seedDemoData } from "@/server/services/demo-seed";
import { createUser, resetDatabase } from "./helpers";

describe("API keys", () => {
  beforeEach(resetDatabase);

  it("stores only a hash and authenticates until revoked", async () => {
    const user = await createUser();
    const { key, id, prefix } = await apiKeyService.create(user.id, "CI");
    expect(key.startsWith(prefix)).toBe(true);
    const row = await db.apiKey.findUniqueOrThrow({ where: { id } });
    expect(row.keyHash).not.toContain(key);
    expect(row.keyHash).toMatch(/^[a-f0-9]{64}$/);

    expect(await apiKeyService.authenticate(key)).toEqual({ keyId: id, userId: user.id });
    expect((await db.apiKey.findUniqueOrThrow({ where: { id } })).lastUsedAt).not.toBeNull();

    await apiKeyService.revoke(user.id, id);
    expect(await apiKeyService.authenticate(key)).toBeNull();
    expect(await apiKeyService.list(user.id)).toEqual([]);
  });

  it("prevents revoking someone else's key", async () => {
    const [a, b] = [await createUser(), await createUser()];
    const { id } = await apiKeyService.create(a.id, "mine");
    await expect(apiKeyService.revoke(b.id, id)).rejects.toMatchObject({ code: "not_found" });
  });
});

describe("PostgresRateLimitStore", () => {
  beforeEach(resetDatabase);

  it("enforces a fixed window atomically under concurrency", async () => {
    const limiter = new RateLimiter(new PostgresRateLimitStore(db));
    const rule = { name: "test", limit: 5, windowMs: 60_000 };
    const results = await Promise.all(Array.from({ length: 8 }, () => limiter.check(rule, "ip-1")));
    expect(results.filter((r) => r.success)).toHaveLength(5);
    expect((await limiter.check(rule, "ip-2")).success).toBe(true);
  });

  it("starts a new window once the previous one expires", async () => {
    const limiter = new RateLimiter(new PostgresRateLimitStore(db));
    const rule = { name: "short", limit: 1, windowMs: 200 };
    expect((await limiter.check(rule, "k")).success).toBe(true);
    expect((await limiter.check(rule, "k")).success).toBe(false);
    await new Promise((r) => setTimeout(r, 300));
    const fresh = await limiter.check(rule, "k");
    expect(fresh).toMatchObject({ success: true, remaining: 0 });
  });
});

describe("demo seed", () => {
  beforeEach(resetDatabase);

  it("creates an idempotent demo dataset", async () => {
    const now = new Date("2026-06-15T12:00:00Z");
    const first = await seedDemoData(db, { now });
    const second = await seedDemoData(db, { now });
    expect(second.clicks).toBe(first.clicks);
    expect(first.clicks).toBeGreaterThan(3000);
    const user = await db.user.findUniqueOrThrow({ where: { email: DEMO_EMAIL }, include: { links: true } });
    expect(user.links).toHaveLength(15);
    const counted = user.links.reduce((s, l) => s + l.clickCount, 0);
    expect(counted).toBe(await db.click.count());
  });
});
