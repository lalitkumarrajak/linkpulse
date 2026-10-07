import { NextResponse } from "next/server";
import { rangeSchema } from "@/lib/validation";
import { authenticateApiRequest } from "@/server/api-auth";
import { handleRouteError } from "@/server/http";
import { analyticsService } from "@/server/services/analytics";
import { linkService } from "@/server/services/links";

/** GET /api/v1/links/:id/stats?range=7d — aggregated analytics for one link. */
export async function GET(request: Request, ctx: RouteContext<"/api/v1/links/[id]/stats">) {
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await ctx.params;
    await linkService.get(auth.userId, id); // ownership check -> 404
    const range = rangeSchema.parse(new URL(request.url).searchParams.get("range") ?? "30d");
    const { topLinks: _unused, ...summary } = await analyticsService.summary({
      userId: auth.userId,
      linkId: id,
      range,
    });
    return NextResponse.json({ data: summary }, { headers: auth.headers });
  } catch (error) {
    return handleRouteError(error, auth.headers);
  }
}
