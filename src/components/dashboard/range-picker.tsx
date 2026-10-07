"use client";

import { Segmented } from "@/components/ui/segmented";
import type { Range } from "@/lib/validation";

const OPTIONS = [
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
] as const satisfies readonly { value: Range; label: string }[];

export function RangePicker({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  return <Segmented label="Time range" value={value} onChange={onChange} options={OPTIONS} />;
}

export const RANGE_LABEL: Record<Range, string> = {
  "24h": "previous 24 hours",
  "7d": "previous 7 days",
  "30d": "previous 30 days",
  "90d": "previous 90 days",
};
