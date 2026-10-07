import { NextResponse } from "next/server";
import { getRateLimiter, RATE_LIMITS } from "@/lib/rate-limit";
import { linkListQuerySchema } from "@/lib/validation";
import { authenticateApiRequest } from "@/server/api-auth";
import { handleRouteError, jsonError } from "@/server/http";
import { linkService } from "@/server/services/links";

/** GET /api/v1/links — paginated list of the key owner's links. */
export async function GET(request: Request) {
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return auth.response;
  try {
    const params = Object.fromEntries(new URL(request.url).searchParams);
    const query = linkListQuerySchema.parse(params);
    const result = await linkService.list(auth.userId, query);
    return NextResponse.json(
      {
        data: result.rows,
        pagination: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
          pageCount: result.pageCount,
        },
      },
      { headers: auth.headers },
    );
  } catch (error) {
    return handleRouteError(error, auth.headers);
  }
}

/** POST /api/v1/links — create a short link. */
export async function POST(request: Request) {
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return auth.response;
  try {
    const createLimit = await getRateLimiter().check(RATE_LIMITS.createLink, auth.userId);
    if (!createLimit.success)
      return jsonError(429, "rate_limited", "Too many links created. Try again in a minute.", {
        headers: auth.headers,
      });
    const body = await request.json();
    const link = await linkService.create(auth.userId, body);
    return NextResponse.json({ data: link }, { status: 201, headers: auth.headers });
  } catch (error) {
    return handleRouteError(error, auth.headers);
  }
}
