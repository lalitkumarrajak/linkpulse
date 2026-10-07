import Link from "next/link";
import { LogoMark } from "@/components/logo";

export function StatusScreen({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  eyebrow?: string;
  title: string;
  description: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-6 py-16">
      <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_center,black,transparent_65%)]" />
      <div className="relative w-full max-w-sm text-center">
        <div className="mx-auto mb-6 grid size-14 place-items-center rounded-2xl border bg-card shadow-sm">
          <Icon className="size-6 text-muted-foreground" />
        </div>
        {eyebrow && <p className="mb-2 font-mono text-xs text-muted-foreground">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-pretty text-muted-foreground">{description}</p>
        {children && <div className="mt-6">{children}</div>}
        <div className="mt-10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <LogoMark className="size-4" />
          <span>
            Powered by{" "}
            <Link href="/" className="font-medium text-foreground hover:underline">
              LinkPulse
            </Link>
          </span>
        </div>
      </div>
    </main>
  );
}
