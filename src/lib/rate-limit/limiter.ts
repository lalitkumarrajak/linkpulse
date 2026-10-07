import type { RateLimitResult, RateLimitRule, RateLimitStore } from "./types";

export class RateLimiter {
  constructor(private readonly store: RateLimitStore) {}

  async check(rule: RateLimitRule, identifier: string): Promise<RateLimitResult> {
    const { count, resetAt } = await this.store.increment(`${rule.name}:${identifier}`, rule.windowMs);
    return {
      success: count <= rule.limit,
      limit: rule.limit,
      remaining: Math.max(0, rule.limit - count),
      reset: resetAt,
    };
  }
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.reset / 1000)),
  };
  if (!result.success) {
    headers["Retry-After"] = String(Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)));
  }
  return headers;
}
