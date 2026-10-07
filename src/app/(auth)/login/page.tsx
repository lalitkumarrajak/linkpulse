import type { Metadata } from "next";
import { isGithubAuthEnabled } from "@/lib/env";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  demo_unavailable: "The demo account hasn't been seeded yet. Run `npm run db:seed`.",
  github: "GitHub sign-in failed. Please try again.",
  github_email: "Your GitHub account has no verified email address.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const error = one(params.error);
  return (
    <AuthForm
      mode="login"
      next={one(params.next)}
      url={one(params.url)}
      githubEnabled={isGithubAuthEnabled()}
      notice={error ? (ERRORS[error] ?? "Something went wrong.") : undefined}
    />
  );
}
