import { describe, expect, it } from "vitest";
import { RateLimiter, rateLimitHeaders } from "@/lib/rate-limit/limiter";
import { MemoryRateLimitStore } from "@/lib/rate-limit/memory";

function setup() {
  let now = 1_000_000;
  const store = new MemoryRateLimitStore(() => now);
  return { limiter: new RateLimiter(store), advance: (ms: number) => (now += ms) };
}

const rule = { name: "login", limit: 3, windowMs: 60_000 };

describe("RateLimiter (memory store)", () => {
  it("allows requests up to the limit then blocks", async () => {
    const { limiter } = setup();
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await limiter.check(rule, "1.2.3.4"));
    expect(results.map((r) => r.success)).toEqual([true, true, true, false]);
    expect(results.map((r) => r.remaining)).toEqual([2, 1, 0, 0]);
  });

  it("tracks identifiers and rule namespaces independently", async () => {
    const { limiter } = setup();
    for (let i = 0; i < 3; i++) await limiter.check(rule, "a");
    expect((await limiter.check(rule, "a")).success).toBe(false);
    expect((await limiter.check(rule, "b")).success).toBe(true);
    expect((await limiter.check({ ...rule, name: "signup" }, "a")).success).toBe(true);
  });

  it("resets after the window elapses", async () => {
    const { limiter, advance } = setup();
    for (let i = 0; i < 4; i++) await limiter.check(rule, "x");
    advance(59_999);
    expect((await limiter.check(rule, "x")).success).toBe(false);
    advance(1);
    const fresh = await limiter.check(rule, "x");
    expect(fresh).toMatchObject({ success: true, remaining: 2 });
  });

  it("exposes standard rate limit headers", async () => {
    const { limiter } = setup();
    const ok = await limiter.check({ ...rule, limit: 1 }, "h");
    expect(rateLimitHeaders(ok)).toMatchObject({ "X-RateLimit-Limit": "1", "X-RateLimit-Remaining": "0" });
    expect(rateLimitHeaders(ok)).not.toHaveProperty("Retry-After");
    const blocked = await limiter.check({ ...rule, limit: 1 }, "h");
    expect(rateLimitHeaders(blocked)["Retry-After"]).toMatch(/^\d+$/);
  });
});
