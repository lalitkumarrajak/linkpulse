import type { Metadata } from "next";
import { isGithubAuthEnabled } from "@/lib/env";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const params = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  return (
    <AuthForm
      mode="signup"
      next={one(params.next)}
      url={one(params.url)}
      githubEnabled={isGithubAuthEnabled()}
    />
  );
}
