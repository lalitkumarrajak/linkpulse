import type { RateLimitStore } from "./types";

/** In-process store. Suitable for tests and single-instance deployments. */
export class MemoryRateLimitStore implements RateLimitStore {
  private readonly buckets = new Map<string, { count: number; resetAt: number }>();

  constructor(private readonly now: () => number = Date.now) {}

  async increment(key: string, windowMs: number) {
    const now = this.now();
    const existing = this.buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      const bucket = { count: 1, resetAt: now + windowMs };
      this.buckets.set(key, bucket);
      this.sweep(now);
      return { ...bucket };
    }
    existing.count += 1;
    return { ...existing };
  }

  private sweep(now: number) {
    if (this.buckets.size < 10_000) return;
    for (const [key, bucket] of this.buckets) if (bucket.resetAt <= now) this.buckets.delete(key);
  }
}
