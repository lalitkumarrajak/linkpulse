"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { verifyPassword } from "@/lib/auth/password";
import { getRateLimiter, RATE_LIMITS } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request-meta";
import { clickFromHeaders, clickService } from "@/server/services/clicks";
import { linkService } from "@/server/services/links";

export async function unlockLinkAction(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const slug = String(formData.get("slug") ?? "");
  const password = String(formData.get("password") ?? "");
  const requestHeaders = await headers();

  const limit = await getRateLimiter().check(RATE_LIMITS.unlock, `${clientIp(requestHeaders)}:${slug}`);
  if (!limit.success) return { error: "Too many attempts. Please wait a few minutes." };

  const link = await linkService.resolve(slug);
  if (!link || link.disabled || (link.expiresAt && link.expiresAt <= new Date()))
    return { error: "This link is no longer available." };
  if (link.passwordHash && !(await verifyPassword(password, link.passwordHash)))
    return { error: "Incorrect password." };

  const event = clickFromHeaders(requestHeaders, {
    secret: process.env.AUTH_SECRET ?? "",
    selfHost: requestHeaders.get("host")?.split(":")[0],
  });
  if (event) after(() => clickService.record(link.id, event).catch(console.error));
  redirect(link.url);
}
