export interface RateLimitResult {
  /** Whether the request is allowed. */
  success: boolean;
  limit: number;
  remaining: number;
  /** Epoch milliseconds when the current window resets. */
  reset: number;
}

export interface RateLimitStore {
  /** Atomically increments the counter for `key` within a fixed window and returns the new count. */
  increment(key: string, windowMs: number): Promise<{ count: number; resetAt: number }>;
}

export interface RateLimitRule {
  /** Namespace, e.g. "login" or "api". */
  name: string;
  limit: number;
  windowMs: number;
}
