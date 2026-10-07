import { GithubIcon } from "@/components/icons";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-transparent bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <div className="flex items-center gap-8">
            <Logo />
            <nav
              aria-label="Main"
              className="hidden items-center gap-6 text-sm text-muted-foreground md:flex"
            >
              <Link href="/#features" className="hover:text-foreground">
                Features
              </Link>
              <Link href="/#how-it-works" className="hover:text-foreground">
                How it works
              </Link>
              <Link href="/docs" className="hover:text-foreground">
                API
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            {user ? (
              <Button asChild size="sm">
                <Link href="/dashboard">Open dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/signup">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-3">
            <Logo className="text-foreground" />
            <span className="hidden sm:inline">·</span>
            <span>
              Built by{" "}
              <a href="https://github.com/rajak312" className="font-medium text-foreground hover:underline">
                Lalit Kumar Rajak
              </a>
            </span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/docs" className="hover:text-foreground">
              API docs
            </Link>
            <a
              href="https://github.com/rajak312/linkpulse"
              className="inline-flex items-center gap-1.5 hover:text-foreground"
            >
              <GithubIcon className="size-4" /> Source
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
