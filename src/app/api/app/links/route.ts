import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { linkListQuerySchema } from "@/lib/validation";
import { handleRouteError } from "@/server/http";
import { linkService } from "@/server/services/links";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const query = linkListQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const [result, tags] = await Promise.all([linkService.list(user.id, query), linkService.tags(user.id)]);
    return NextResponse.json({ ...result, tags });
  } catch (error) {
    return handleRouteError(error);
  }
}
