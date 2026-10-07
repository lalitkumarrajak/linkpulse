"use client";

import { ArrowRightIcon, LinkIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DemoButton } from "@/app/(auth)/auth-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { destinationUrlSchema } from "@/lib/validation";

export function ShortenForm({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string>();
  const [pendingUrl, setPendingUrl] = useState<string>();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = destinationUrlSchema.safeParse(value);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid URL");
      return;
    }
    setError(undefined);
    if (signedIn) router.push(`/dashboard/links?create=${encodeURIComponent(parsed.data)}`);
    else setPendingUrl(parsed.data);
  }

  return (
    <>
      <form onSubmit={submit} noValidate className="w-full max-w-xl">
        <div className="flex flex-col gap-2 rounded-2xl border bg-card p-2 shadow-lg shadow-black/[0.03] sm:flex-row sm:items-center">
          <label htmlFor="hero-url" className="sr-only">
            Long URL to shorten
          </label>
          <div className="flex flex-1 items-center gap-2 px-2">
            <LinkIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <input
              id="hero-url"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Paste a long URL, e.g. https://example.com/blog/launch-week"
              className="h-10 w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/80"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "hero-url-error" : undefined}
              inputMode="url"
              autoComplete="url"
            />
          </div>
          <Button type="submit" size="lg" className="rounded-xl">
            Shorten <ArrowRightIcon />
          </Button>
        </div>
        <p id="hero-url-error" role="alert" className="mt-2 min-h-5 px-3 text-left text-sm text-destructive">
          {error}
        </p>
      </form>

      <Dialog open={Boolean(pendingUrl)} onOpenChange={(open) => !open && setPendingUrl(undefined)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Almost there</DialogTitle>
            <DialogDescription>
              Short links live in your workspace so you can track every click. Pick how you&apos;d like to
              continue.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="truncate rounded-lg border bg-muted/50 px-3 py-2 font-mono text-[13px] text-muted-foreground">
              {pendingUrl}
            </div>
            <div className="space-y-2">
              <DemoButton url={pendingUrl} />
              <Button asChild size="lg" className="w-full">
                <Link href={`/signup?url=${encodeURIComponent(pendingUrl ?? "")}`}>
                  <SparklesIcon /> Create a free account
                </Link>
              </Button>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link
                href={`/login?url=${encodeURIComponent(pendingUrl ?? "")}`}
                className="font-medium text-foreground hover:underline"
              >
                Sign in
              </Link>
            </p>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
