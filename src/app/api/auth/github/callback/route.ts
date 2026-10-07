import { NextResponse, type NextRequest } from "next/server";
import { appUrl } from "@/lib/app-url";
import { createSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { isGithubAuthEnabled } from "@/lib/env";
import { safeNextPath } from "@/lib/safe-redirect";

const STATE_COOKIE = "lp_oauth_state";

interface GithubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
}
interface GithubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

function fail(request: NextRequest, code = "github") {
  return NextResponse.redirect(new URL(`/login?error=${code}`, request.url));
}

export async function GET(request: NextRequest) {
  if (!isGithubAuthEnabled()) return fail(request);
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  let stored: { state?: string; next?: string; url?: string } = {};
  try {
    stored = JSON.parse(request.cookies.get(STATE_COOKIE)?.value ?? "{}");
  } catch {
    // fall through to state mismatch
  }
  if (!code || !state || state !== stored.state) return fail(request);

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${appUrl()}/api/auth/github/callback`,
    }),
  });
  const token = (await tokenRes.json().catch(() => ({}))) as { access_token?: string };
  if (!token.access_token) return fail(request);

  const gh = (path: string) =>
    fetch(`https://api.github.com${path}`, {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "LinkPulse",
      },
    }).then((r) => (r.ok ? r.json() : null));

  const [profile, emails] = (await Promise.all([gh("/user"), gh("/user/emails")])) as [
    GithubUser | null,
    GithubEmail[] | null,
  ];
  if (!profile) return fail(request);
  const email = emails?.find((e) => e.primary && e.verified)?.email ?? emails?.find((e) => e.verified)?.email;
  if (!email) return fail(request, "github_email");

  const githubId = String(profile.id);
  const existing =
    (await db.user.findUnique({ where: { githubId } })) ??
    (await db.user.findUnique({ where: { email: email.toLowerCase() } }));
  const user = existing
    ? await db.user.update({
        where: { id: existing.id },
        data: {
          githubId,
          avatarUrl: profile.avatar_url,
          name: existing.name ?? profile.name ?? profile.login,
        },
      })
    : await db.user.create({
        data: {
          email: email.toLowerCase(),
          githubId,
          name: profile.name ?? profile.login,
          avatarUrl: profile.avatar_url,
        },
      });

  await createSession(user.id);
  const destination = stored.url
    ? `/dashboard/links?create=${encodeURIComponent(stored.url)}`
    : safeNextPath(stored.next);
  const response = NextResponse.redirect(new URL(destination, request.url));
  response.cookies.delete({ name: STATE_COOKIE, path: "/api/auth/github" });
  return response;
}
