import type { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { csvRow } from "@/lib/csv";
import { countryName } from "@/lib/countries";
import { rangeSchema } from "@/lib/validation";
import { handleRouteError } from "@/server/http";
import { analyticsService, RANGE_CONFIG } from "@/server/services/analytics";
import { linkService } from "@/server/services/links";

const HEADER = [
  "timestamp",
  "link",
  "referrer",
  "country_code",
  "country",
  "region",
  "city",
  "device",
  "browser",
  "os",
];

/** GET /api/app/export?range=30d[&linkId=] — streams clicks as CSV. */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const params = request.nextUrl.searchParams;
    const linkId = params.get("linkId") ?? undefined;
    const rangeParam = params.get("range");
    const since =
      rangeParam && rangeParam !== "all"
        ? new Date(Date.now() - RANGE_CONFIG[rangeSchema.parse(rangeParam)].durationMs)
        : undefined;
    let name = "all-links";
    if (linkId) name = (await linkService.get(user.id, linkId)).slug;

    const encoder = new TextEncoder();
    const rows = analyticsService.exportClicks({ userId: user.id, linkId, since });
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        controller.enqueue(encoder.encode(csvRow(HEADER)));
        for await (const batch of rows) {
          controller.enqueue(
            encoder.encode(
              batch
                .map((c) =>
                  csvRow([
                    c.createdAt,
                    c.link.slug,
                    c.referrer,
                    c.country,
                    countryName(c.country),
                    c.region,
                    c.city,
                    c.device,
                    c.browser,
                    c.os,
                  ]),
                )
                .join(""),
            ),
          );
        }
        controller.close();
      },
    });
    const date = new Date().toISOString().slice(0, 10);
    return new Response(stream, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="linkpulse-${name}-clicks-${date}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
