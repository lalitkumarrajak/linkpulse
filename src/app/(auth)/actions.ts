"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSession, destroySession } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";
import { getRateLimiter, RATE_LIMITS } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request-meta";
import { safeNextPath } from "@/lib/safe-redirect";
import { fieldErrors, loginSchema, signupSchema } from "@/lib/validation";
import { DEMO_EMAIL } from "@/server/services/demo-seed";

export interface AuthFormState {
  error?: string;
  fields?: Record<string, string>;
  values?: { email?: string; name?: string };
}

// Constant-time-ish defence against user enumeration: always run a bcrypt compare.
const DUMMY_HASH = "$2b$12$SeH8TQqQerdGsO5Y3f1iT.y1k36ccCLNniUxxaxlO4DWJYGoMmAD.";

async function ip() {
  return clientIp(await headers());
}

function destination(formData: FormData) {
  const next = safeNextPath(formData.get("next"));
  const url = formData.get("url");
  if (typeof url === "string" && url.trim()) {
    return `/dashboard/links?create=${encodeURIComponent(url.trim().slice(0, 2048))}`;
  }
  return next;
}

export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const raw = { email: formData.get("email"), password: formData.get("password") };
  const parsed = loginSchema.safeParse(raw);
  const values = { email: typeof raw.email === "string" ? raw.email : "" };
  if (!parsed.success) return { fields: fieldErrors(parsed.error), values };

  const limit = await getRateLimiter().check(RATE_LIMITS.login, `${await ip()}:${parsed.data.email}`);
  if (!limit.success)
    return { error: "Too many sign-in attempts. Please wait a few minutes and try again.", values };

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  const valid = await verifyPassword(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !user.passwordHash || !valid) return { error: "Invalid email or password.", values };

  await createSession(user.id);
  redirect(destination(formData));
}

export async function signupAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  };
  const values = {
    name: typeof raw.name === "string" ? raw.name : "",
    email: typeof raw.email === "string" ? raw.email : "",
  };
  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) return { fields: fieldErrors(parsed.error), values };

  const limit = await getRateLimiter().check(RATE_LIMITS.signup, await ip());
  if (!limit.success) return { error: "Too many sign-ups from this network. Try again later.", values };

  const existing = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (existing)
    return { fields: { email: "An account with this email already exists. Try signing in." }, values };

  const user = await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
    },
  });
  await createSession(user.id);
  redirect(destination(formData));
}

export async function demoLoginAction(formData: FormData) {
  const user = await db.user.findUnique({ where: { email: DEMO_EMAIL }, select: { id: true } });
  if (!user) redirect("/login?error=demo_unavailable");
  await createSession(user.id);
  redirect(destination(formData));
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
