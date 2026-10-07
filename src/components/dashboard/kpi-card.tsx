import { ArrowDownRightIcon, ArrowUpRightIcon, MinusIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Signed relative change; null when there's no baseline to compare against. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return (current - previous) / previous;
}

export function DeltaBadge({ change, label }: { change: number | null; label: string }) {
  if (change === 0) return <span className="text-xs text-muted-foreground">No change vs {label}</span>;
  if (change === null) return <span className="text-xs text-muted-foreground">No data for the {label}</span>;
  const pct = Math.abs(change * 100);
  const text = `${pct >= 10 ? pct.toFixed(0) : pct.toFixed(1)}%`;
  const flat = pct < 0.5;
  const up = change > 0;
  const Icon = flat ? MinusIcon : up ? ArrowUpRightIcon : ArrowDownRightIcon;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 rounded px-1 py-px font-medium",
          flat
            ? "bg-muted text-muted-foreground"
            : up
              ? "bg-success/10 text-success"
              : "bg-destructive/10 text-destructive",
        )}
      >
        <Icon className="size-3" aria-hidden />
        <span className="sr-only">{flat ? "No change" : up ? "Up" : "Down"}</span>
        {text}
      </span>
      vs {label}
    </span>
  );
}

export function KpiCard({
  label,
  value,
  footer,
  icon: Icon,
  children,
}: {
  label: string;
  value: React.ReactNode;
  footer?: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  children?: React.ReactNode;
}) {
  return (
    <Card className="flex min-w-0 flex-col gap-3 p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 truncate text-2xl leading-none font-semibold tracking-tight tabular sm:text-[28px]">
        {value}
      </div>
      {children}
      {footer && <div className="mt-auto min-h-5">{footer}</div>}
    </Card>
  );
}

export function KpiSkeleton() {
  return (
    <Card className="flex flex-col gap-3 p-5">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-7 w-28" />
      <Skeleton className="h-4 w-36" />
    </Card>
  );
}
