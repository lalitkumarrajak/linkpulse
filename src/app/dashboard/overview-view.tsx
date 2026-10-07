"use client";

import { DownloadIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAppConfig } from "@/components/app-config";
import { AnalyticsPanel } from "@/components/dashboard/analytics-panel";
import { LiveIndicator } from "@/components/dashboard/live-indicator";
import { RangePicker } from "@/components/dashboard/range-picker";
import { PageHeader } from "@/components/dashboard/shell";
import { Button } from "@/components/ui/button";
import type { Range } from "@/lib/validation";

export function OverviewView() {
  const [range, setRange] = useState<Range>("30d");
  const { user } = useAppConfig();
  const firstName = user.name?.split(" ")[0];
  return (
    <>
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : "Overview"}
        description={<LiveIndicator>Performance across all your links</LiveIndicator>}
        actions={
          <>
            <Button asChild variant="secondary" size="sm">
              <a href={`/api/app/export?range=${range}`} download>
                <DownloadIcon /> Export CSV
              </a>
            </Button>
            <Button asChild size="sm">
              <Link href="/dashboard/links?create=">
                <PlusIcon /> New link
              </Link>
            </Button>
          </>
        }
      />
      <div className="mb-4 flex items-center justify-between gap-3">
        <RangePicker value={range} onChange={setRange} />
      </div>
      <AnalyticsPanel range={range} />
    </>
  );
}
