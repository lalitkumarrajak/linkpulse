import { db } from "@/lib/db";
import { RateLimiter } from "./limiter";
import { MemoryRateLimitStore } from "./memory";
import { PostgresRateLimitStore } from "./postgres";
import type { RateLimitRule } from "./types";

export { RateLimiter, rateLimitHeaders } from "./limiter";
export type { RateLimitResult, RateLimitRule, RateLimitStore } from "./types";

const MINUTE = 60_000;

export const RATE_LIMITS = {
  login: { name: "login", limit: 10, windowMs: 15 * MINUTE },
  signup: { name: "signup", limit: 5, windowMs: 60 * MINUTE },
  createLink: { name: "create-link", limit: 30, windowMs: MINUTE },
  slugCheck: { name: "slug-check", limit: 60, windowMs: MINUTE },
  api: { name: "api", limit: 60, windowMs: MINUTE },
  unlock: { name: "unlock", limit: 10, windowMs: 15 * MINUTE },
} satisfies Record<string, RateLimitRule>;

const globalForLimiter = globalThis as unknown as { rateLimiter?: RateLimiter };

export function getRateLimiter(): RateLimiter {
  if (!globalForLimiter.rateLimiter) {
    const store =
      process.env.RATE_LIMIT_STORE === "memory" ? new MemoryRateLimitStore() : new PostgresRateLimitStore(db);
    globalForLimiter.rateLimiter = new RateLimiter(store);
  }
  return globalForLimiter.rateLimiter;
}
