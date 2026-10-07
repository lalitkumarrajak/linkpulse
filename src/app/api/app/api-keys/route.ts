import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { handleRouteError } from "@/server/http";
import { apiKeyService } from "@/server/services/api-keys";

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json(await apiKeyService.list(user.id));
  } catch (error) {
    return handleRouteError(error);
  }
}
