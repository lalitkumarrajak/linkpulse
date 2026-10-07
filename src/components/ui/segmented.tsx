"use client";

import { cn } from "@/lib/utils";

/** Accessible segmented control (radio group semantics). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: string }[];
  label: string;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("inline-flex rounded-lg border bg-muted/60 p-0.5", className)}
      onKeyDown={(e) => {
        const index = options.findIndex((o) => o.value === value);
        const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!delta) return;
        e.preventDefault();
        const next = options[(index + delta + options.length) % options.length]!;
        onChange(next.value);
        (e.currentTarget.querySelector(`[data-value="${next.value}"]`) as HTMLElement | null)?.focus();
      }}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            data-value={option.value}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-7 rounded-md px-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground",
              active && "bg-card text-foreground shadow-xs",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
