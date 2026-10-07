import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getRateLimiter, RATE_LIMITS, rateLimitHeaders } from "@/lib/rate-limit";
import { handleRouteError, jsonError } from "@/server/http";
import { linkService } from "@/server/services/links";

/** GET /api/app/slug?slug=foo — custom alias availability check. */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const limit = await getRateLimiter().check(RATE_LIMITS.slugCheck, user.id);
    if (!limit.success)
      return jsonError(429, "rate_limited", "Too many checks", { headers: rateLimitHeaders(limit) });
    const slug = (request.nextUrl.searchParams.get("slug") ?? "").trim();
    return NextResponse.json({ slug, ...(await linkService.isSlugAvailable(slug)) });
  } catch (error) {
    return handleRouteError(error);
  }
}
