"use client";

import { Loader2Icon, SparklesIcon } from "lucide-react";
import { GithubIcon } from "@/components/icons";
import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { demoLoginAction, loginAction, signupAction, type AuthFormState } from "./actions";

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending && <Loader2Icon className="animate-spin" />}
      {children}
    </Button>
  );
}

export function DemoButton({ next, url }: { next?: string; url?: string }) {
  return (
    <form action={demoLoginAction}>
      {next && <input type="hidden" name="next" value={next} />}
      {url && <input type="hidden" name="url" value={url} />}
      <DemoSubmit />
    </form>
  );
}

function DemoSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" size="lg" className="w-full" disabled={pending}>
      {pending ? <Loader2Icon className="animate-spin" /> : <SparklesIcon className="text-primary" />}
      Try the demo account
    </Button>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      or
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function AuthForm({
  mode,
  next,
  url,
  githubEnabled,
  notice,
}: {
  mode: "login" | "signup";
  next?: string;
  url?: string;
  githubEnabled: boolean;
  notice?: string;
}) {
  const [state, formAction] = useActionState<AuthFormState, FormData>(
    mode === "login" ? loginAction : signupAction,
    {},
  );
  const isLogin = mode === "login";
  const query = new URLSearchParams({ ...(next && { next }), ...(url && { url }) }).toString();

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">
          {isLogin ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isLogin
            ? "Sign in to manage your links and analytics."
            : "Start shortening and tracking links in seconds. Free forever."}
        </p>
      </div>

      {url && (
        <div className="rounded-lg border bg-accent/60 px-3 py-2 text-sm text-accent-foreground">
          We&apos;ll shorten <span className="font-medium break-all">{url}</span> right after you
          {isLogin ? " sign in" : " sign up"}.
        </div>
      )}
      {notice && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {notice}
        </div>
      )}

      <div className="space-y-3">
        <DemoButton next={next} url={url} />
        {githubEnabled && (
          <Button asChild variant="secondary" size="lg" className="w-full">
            <a href={`/api/auth/github${query ? `?${query}` : ""}`}>
              <GithubIcon /> Continue with GitHub
            </a>
          </Button>
        )}
      </div>

      <Divider />

      <form action={formAction} className="space-y-4" noValidate>
        {next && <input type="hidden" name="next" value={next} />}
        {url && <input type="hidden" name="url" value={url} />}
        {!isLogin && (
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              autoComplete="name"
              placeholder="Ada Lovelace"
              defaultValue={state.values?.name}
              aria-invalid={Boolean(state.fields?.name)}
              aria-describedby="name-error"
            />
            <FieldError id="name-error">{state.fields?.name}</FieldError>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            defaultValue={state.values?.email}
            aria-invalid={Boolean(state.fields?.email)}
            aria-describedby="email-error"
          />
          <FieldError id="email-error">{state.fields?.email}</FieldError>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            placeholder={isLogin ? "••••••••" : "At least 8 characters"}
            aria-invalid={Boolean(state.fields?.password)}
            aria-describedby="password-error"
          />
          <FieldError id="password-error">{state.fields?.password}</FieldError>
        </div>
        {state.error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        )}
        <SubmitButton>{isLogin ? "Sign in" : "Create account"}</SubmitButton>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {isLogin ? "New to LinkPulse? " : "Already have an account? "}
        <Link
          href={`${isLogin ? "/signup" : "/login"}${query ? `?${query}` : ""}`}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {isLogin ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </div>
  );
}
