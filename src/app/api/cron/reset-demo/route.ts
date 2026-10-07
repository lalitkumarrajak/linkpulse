import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PostgresRateLimitStore } from "@/lib/rate-limit/postgres";
import { jsonError } from "@/server/http";
import { seedDemoData } from "@/server/services/demo-seed";

export const maxDuration = 60;

/**
 * Daily maintenance (Vercel Cron, see vercel.json): restores the shared demo account so
 * visitors always see a complete dataset, and prunes expired rate-limit windows.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
    return jsonError(401, "unauthorized", "Invalid cron secret");
  const result = await seedDemoData(db);
  const pruned = await new PostgresRateLimitStore(db).prune();
  return NextResponse.json({ ok: true, ...result, prunedRateLimits: pruned.count });
}
