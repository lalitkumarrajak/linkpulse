import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { handleRouteError } from "@/server/http";
import { linkService } from "@/server/services/links";

export async function GET(_request: Request, ctx: RouteContext<"/api/app/links/[id]">) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    return NextResponse.json(await linkService.get(user.id, id));
  } catch (error) {
    return handleRouteError(error);
  }
}
