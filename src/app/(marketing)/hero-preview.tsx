import { ArrowUpRightIcon, MousePointerClickIcon } from "lucide-react";

/** Static product preview for the hero (illustrative numbers, rendered as real HTML/SVG). */
const SERIES = [32, 41, 38, 52, 47, 61, 58, 72, 66, 81, 77, 94, 88, 109];
const REFERRERS = [
  { name: "linkedin.com", value: 412 },
  { name: "x.com", value: 298 },
  { name: "news.ycombinator.com", value: 187 },
  { name: "Direct", value: 141 },
];

export function HeroPreview({ host }: { host: string }) {
  const w = 320;
  const h = 96;
  const max = Math.max(...SERIES) * 1.1;
  const pts = SERIES.map((v, i) => [(i / (SERIES.length - 1)) * w, h - (v / max) * h] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const last = pts[pts.length - 1]!;
  const maxRef = REFERRERS[0]!.value;

  return (
    <div aria-hidden className="relative w-full max-w-md select-none">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--primary)_22%,transparent),transparent)] blur-2xl" />
      <div className="rounded-2xl border bg-card p-5 shadow-2xl shadow-black/[0.06]">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-xs text-muted-foreground">{host}/launch</p>
            <p className="mt-1 text-sm font-medium">Launch week announcement</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
            <span className="size-1.5 animate-pulse rounded-full bg-success motion-reduce:animate-none" />{" "}
            Live
          </span>
        </div>
        <div className="mt-5 flex items-end gap-3">
          <p className="text-4xl font-semibold tracking-tight tabular">1,038</p>
          <p className="mb-1 inline-flex items-center text-sm font-medium text-success">
            <ArrowUpRightIcon className="size-4" /> 24%
          </p>
        </div>
        <p className="text-xs text-muted-foreground">Clicks · last 14 days</p>
        <svg viewBox={`0 0 ${w} ${h}`} className="mt-4 h-24 w-full overflow-visible">
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={0} x2={w} y1={h * f} y2={h * f} stroke="var(--chart-grid)" strokeWidth={1} />
          ))}
          <path d={area} fill="var(--series-1)" opacity={0.1} />
          <path
            d={line}
            fill="none"
            stroke="var(--series-1)"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <circle
            cx={last[0]}
            cy={last[1]}
            r={4}
            fill="var(--series-1)"
            stroke="var(--card)"
            strokeWidth={2}
          />
        </svg>
        <div className="mt-5 space-y-2.5 border-t pt-4">
          <p className="text-xs font-medium text-muted-foreground">Top referrers</p>
          {REFERRERS.map((r) => (
            <div key={r.name} className="flex items-center gap-3 text-[13px]">
              <div className="relative h-6 flex-1 overflow-hidden rounded">
                <div
                  className="absolute inset-y-0 left-0 rounded bg-bar-track"
                  style={{ width: `${(r.value / maxRef) * 100}%` }}
                />
                <span className="relative flex h-full items-center px-2">{r.name}</span>
              </div>
              <span className="w-10 text-right text-muted-foreground tabular">{r.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute -bottom-12 -left-6 hidden items-center gap-2.5 rounded-xl border bg-card px-3.5 py-2.5 shadow-xl sm:flex">
        <div className="grid size-8 place-items-center rounded-lg bg-accent">
          <MousePointerClickIcon className="size-4 text-accent-foreground" />
        </div>
        <div className="text-xs">
          <p className="font-medium">New click from Berlin</p>
          <p className="text-muted-foreground">Chrome · macOS · just now</p>
        </div>
      </div>
    </div>
  );
}
