/** Tiny trend line for stat tiles: de-emphasised history, accent on the latest point. */
export function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const w = 120;
  const h = 28;
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 2 - (v / max) * (h - 4)] as const);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const [lx, ly] = pts[pts.length - 1]!;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-full max-w-36 overflow-visible" aria-hidden>
      <path
        d={d}
        fill="none"
        stroke="var(--muted-foreground)"
        strokeOpacity={0.55}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <circle cx={lx} cy={ly} r={3} fill="var(--series-1)" stroke="var(--card)" strokeWidth={1.5} />
    </svg>
  );
}
