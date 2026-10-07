import { parseBearerToken } from "@/lib/api-key";
import { getRateLimiter, RATE_LIMITS, rateLimitHeaders } from "@/lib/rate-limit";
import { jsonError } from "./http";
import { apiKeyService } from "./services/api-keys";

type ApiAuthResult =
  { ok: true; userId: string; headers: Record<string, string> } | { ok: false; response: Response };

/** Authenticates a public API request via `Authorization: Bearer <key>` and applies rate limiting. */
export async function authenticateApiRequest(request: Request): Promise<ApiAuthResult> {
  const token = parseBearerToken(request.headers.get("authorization"));
  if (!token)
    return {
      ok: false,
      response: jsonError(401, "unauthorized", "Missing API key. Send `Authorization: Bearer <key>`."),
    };
  const auth = await apiKeyService.authenticate(token);
  if (!auth) return { ok: false, response: jsonError(401, "unauthorized", "Invalid or revoked API key") };

  const limit = await getRateLimiter().check(RATE_LIMITS.api, auth.keyId);
  const headers = rateLimitHeaders(limit);
  if (!limit.success)
    return {
      ok: false,
      response: jsonError(429, "rate_limited", "Rate limit exceeded. Slow down and retry later.", {
        headers,
      }),
    };
  return { ok: true, userId: auth.userId, headers };
}
