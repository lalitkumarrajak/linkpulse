import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { appUrl } from "@/lib/app-url";
import { isGithubAuthEnabled } from "@/lib/env";
import { safeNextPath } from "@/lib/safe-redirect";

const OAUTH_STATE_COOKIE = "lp_oauth_state";

/** Starts the GitHub OAuth flow (only when GITHUB_CLIENT_ID/SECRET are configured). */
export function GET(request: NextRequest) {
  if (!isGithubAuthEnabled()) return NextResponse.redirect(new URL("/login", request.url));
  const state = randomBytes(16).toString("hex");
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  const shortenUrl = request.nextUrl.searchParams.get("url") ?? "";

  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID!);
  authorize.searchParams.set("redirect_uri", `${appUrl()}/api/auth/github/callback`);
  authorize.searchParams.set("scope", "read:user user:email");
  authorize.searchParams.set("state", state);

  const response = NextResponse.redirect(authorize);
  response.cookies.set(OAUTH_STATE_COOKIE, JSON.stringify({ state, next, url: shortenUrl }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/github",
    maxAge: 600,
  });
  return response;
}
