import { formatNumber } from "@/lib/utils";

export interface BarListItem {
  key: string;
  label: React.ReactNode;
  value: number;
  icon?: React.ReactNode;
  href?: string;
}

/** Ranked horizontal bars (one hue, magnitude encoded by length, every value labelled). */
export function BarList({ items, total }: { items: BarListItem[]; total: number }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-1.5">
      {items.map((item) => {
        const share = total > 0 ? item.value / total : 0;
        const content = (
          <>
            <div className="relative h-8 min-w-0 flex-1 overflow-hidden rounded-md">
              <div
                className="absolute inset-y-0 left-0 rounded-md bg-[color-mix(in_oklab,var(--series-1)_16%,transparent)] transition-[width] duration-500"
                style={{ width: `${Math.max(2, (item.value / max) * 100)}%` }}
              />
              <div className="relative flex h-full min-w-0 items-center gap-2 px-2.5 text-[13px]">
                {item.icon}
                <span className="truncate">{item.label}</span>
              </div>
            </div>
            <span className="w-12 shrink-0 text-right text-[13px] font-medium tabular">
              {formatNumber(item.value, { compact: true })}
            </span>
            <span className="hidden w-11 shrink-0 text-right text-xs text-muted-foreground tabular sm:inline">
              {(share * 100).toFixed(share < 0.1 ? 1 : 0)}%
            </span>
          </>
        );
        return (
          <li key={item.key}>
            {item.href ? (
              <a href={item.href} className="flex items-center gap-3 rounded-md hover:bg-muted/60">
                {content}
              </a>
            ) : (
              <div className="flex items-center gap-3">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
