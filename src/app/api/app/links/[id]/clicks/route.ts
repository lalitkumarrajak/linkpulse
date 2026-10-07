import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { handleRouteError } from "@/server/http";
import { analyticsService } from "@/server/services/analytics";

export async function GET(_request: Request, ctx: RouteContext<"/api/app/links/[id]/clicks">) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const clicks = await analyticsService.recentClicks(user.id, id, 25);
    return NextResponse.json(
      clicks.map((c) => ({ ...c, id: c.id.toString(), createdAt: c.createdAt.toISOString() })),
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
