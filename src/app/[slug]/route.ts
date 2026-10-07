import { after, NextResponse, type NextRequest } from "next/server";
import { clickFromHeaders, clickService } from "@/server/services/clicks";
import { linkService } from "@/server/services/links";

/**
 * Short-link redirect hot path: one indexed lookup, then a 302. Click recording
 * runs after the response is sent (`after`) so it never delays the redirect.
 * Links that need a human (password, expired, disabled, unknown) go to /l/:slug.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/[slug]">) {
  const { slug } = await ctx.params;
  const link = await linkService.resolve(slug);

  const blocked =
    !link || link.disabled || link.passwordHash || (link.expiresAt && link.expiresAt <= new Date());
  if (blocked) {
    return NextResponse.redirect(new URL(`/l/${encodeURIComponent(slug)}`, request.url), 307);
  }

  const event = clickFromHeaders(request.headers, {
    secret: process.env.AUTH_SECRET ?? "",
    selfHost: request.nextUrl.hostname,
  });
  if (event) {
    after(() =>
      clickService.record(link.id, event).catch((error) => console.error("Failed to record click", error)),
    );
  }

  return new NextResponse(null, {
    status: 302,
    headers: {
      Location: link.url,
      "Cache-Control": "private, no-store, max-age=0",
      "Referrer-Policy": "unsafe-url",
      "X-Robots-Tag": "noindex",
    },
  });
}
