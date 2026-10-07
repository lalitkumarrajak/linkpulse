import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { rangeSchema } from "@/lib/validation";
import { handleRouteError } from "@/server/http";
import { analyticsService } from "@/server/services/analytics";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const params = request.nextUrl.searchParams;
    const range = rangeSchema.parse(params.get("range") ?? "30d");
    const linkId = params.get("linkId") ?? undefined;
    return NextResponse.json(await analyticsService.summary({ userId: user.id, linkId, range }));
  } catch (error) {
    return handleRouteError(error);
  }
}
