import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/server/api-auth";
import { handleRouteError } from "@/server/http";
import { linkService } from "@/server/services/links";

/** GET /api/v1/links/:id */
export async function GET(request: Request, ctx: RouteContext<"/api/v1/links/[id]">) {
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await ctx.params;
    return NextResponse.json({ data: await linkService.get(auth.userId, id) }, { headers: auth.headers });
  } catch (error) {
    return handleRouteError(error, auth.headers);
  }
}

/** DELETE /api/v1/links/:id */
export async function DELETE(request: Request, ctx: RouteContext<"/api/v1/links/[id]">) {
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await ctx.params;
    await linkService.delete(auth.userId, id);
    return new Response(null, { status: 204, headers: auth.headers });
  } catch (error) {
    return handleRouteError(error, auth.headers);
  }
}
