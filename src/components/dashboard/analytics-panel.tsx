"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  ActivityIcon,
  AlertTriangleIcon,
  BarChart3Icon,
  CompassIcon,
  MonitorIcon,
  MousePointerClickIcon,
  SmartphoneIcon,
  TabletIcon,
  TrophyIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchJson, toQueryString } from "@/lib/api-client";
import { countryFlag, countryName } from "@/lib/countries";
import { cn, formatNumber } from "@/lib/utils";
import type { Range } from "@/lib/validation";
import type { AnalyticsSummary, BreakdownRow } from "@/server/services/analytics";
import { EmptyState } from "../empty-state";
import { BarList, type BarListItem } from "./bar-list";
import { ChartLegend, ClicksChart } from "./clicks-chart";
import { Favicon } from "./favicon";
import { DeltaBadge, KpiCard, KpiSkeleton, percentChange } from "./kpi-card";
import { RANGE_LABEL } from "./range-picker";
import { Sparkline } from "./sparkline";

const RANGE_DAYS: Record<Range, number> = { "24h": 24, "7d": 7, "30d": 30, "90d": 90 };

function PeakNote({ data }: { data: AnalyticsSummary }) {
  const peak = data.timeseries.reduce((best, p) => (p.clicks > best.clicks ? p : best), data.timeseries[0]!);
  if (!peak || peak.clicks === 0) return <span className="text-xs text-muted-foreground">No clicks yet</span>;
  const when = new Date(peak.t).toLocaleString(
    "en-US",
    data.interval === "hour" ? { hour: "numeric", minute: "2-digit" } : { month: "short", day: "numeric" },
  );
  return (
    <span className="text-xs text-muted-foreground">
      Peak of <span className="font-medium text-foreground">{formatNumber(peak.clicks)}</span>{" "}
      {data.interval === "hour" ? "at" : "on"} {when}
    </span>
  );
}

export function useAnalytics(range: Range, linkId?: string) {
  return useQuery({
    queryKey: ["analytics", linkId ?? "all", range],
    queryFn: () => fetchJson<AnalyticsSummary>(`/api/app/analytics?${toQueryString({ range, linkId })}`),
    placeholderData: keepPreviousData,
    refetchInterval: 15_000,
  });
}

const DEVICE_ICONS: Record<string, React.ReactNode> = {
  Desktop: <MonitorIcon className="size-4 text-muted-foreground" />,
  Mobile: <SmartphoneIcon className="size-4 text-muted-foreground" />,
  Tablet: <TabletIcon className="size-4 text-muted-foreground" />,
};

function referrerItems(rows: BreakdownRow[]): BarListItem[] {
  return rows.map((r) => ({
    key: r.name,
    label: r.name,
    value: r.value,
    icon:
      r.name === "Direct" ? (
        <CompassIcon className="size-4 shrink-0 text-muted-foreground" />
      ) : (
        <Favicon url={`https://${r.name}`} className="size-4" />
      ),
  }));
}

function countryItems(rows: BreakdownRow[]): BarListItem[] {
  return rows.map((r) => ({
    key: r.name,
    label: countryName(r.name),
    value: r.value,
    icon: (
      <span aria-hidden className="text-base leading-none">
        {countryFlag(r.name)}
      </span>
    ),
  }));
}

function plainItems(rows: BreakdownRow[], icons?: Record<string, React.ReactNode>): BarListItem[] {
  return rows.map((r) => ({ key: r.name, label: r.name, value: r.value, icon: icons?.[r.name] }));
}

function BreakdownCard<T extends string>({
  title,
  tabs,
  total,
  loading,
}: {
  title: string;
  tabs: { value: T; label: string; items: BarListItem[] }[];
  total: number;
  loading: boolean;
}) {
  const [tab, setTab] = useState<T>(tabs[0]!.value);
  const active = tabs.find((t) => t.value === tab) ?? tabs[0]!;
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center">
        <CardTitle>{title}</CardTitle>
        {tabs.length > 1 && (
          <Segmented label={`${title} breakdown`} value={tab} onChange={setTab} options={tabs} />
        )}
      </CardHeader>
      <CardContent className="flex-1 pt-4">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-8" style={{ width: `${95 - i * 13}%` }} />
            ))}
          </div>
        ) : active.items.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No data in this period</p>
        ) : (
          <BarList items={active.items.slice(0, 8)} total={total} />
        )}
      </CardContent>
    </Card>
  );
}

function SeriesTable({ data }: { data: AnalyticsSummary }) {
  const fmt = new Intl.DateTimeFormat(
    "en-US",
    data.interval === "hour"
      ? { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" }
      : { dateStyle: "medium" },
  );
  return (
    <div className="max-h-72 overflow-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-muted text-left text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">{data.interval === "hour" ? "Hour" : "Date"}</th>
            <th className="px-3 py-2 text-right font-medium">Clicks</th>
            <th className="px-3 py-2 text-right font-medium">Unique visitors</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {[...data.timeseries].reverse().map((p) => (
            <tr key={p.t}>
              <td className="px-3 py-1.5">{fmt.format(new Date(p.t))}</td>
              <td className="px-3 py-1.5 text-right tabular">{formatNumber(p.clicks)}</td>
              <td className="px-3 py-1.5 text-right tabular">{formatNumber(p.visitors)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AnalyticsPanel({ range, linkId }: { range: Range; linkId?: string }) {
  const { data, isError, refetch, isFetching } = useAnalytics(range, linkId);
  const [view, setView] = useState<"chart" | "table">("chart");
  const compareLabel = RANGE_LABEL[range];

  if (isError && !data)
    return (
      <Card>
        <EmptyState
          icon={AlertTriangleIcon}
          title="Couldn't load analytics"
          description="Something went wrong while fetching your stats."
          action={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          }
        />
      </Card>
    );

  const totals = data?.totals;
  const clickChange = totals ? percentChange(totals.clicks, totals.prevClicks) : null;
  const top = linkId ? data?.breakdowns.referrer[0] : data?.topLinks[0];

  return (
    <div className="space-y-4" aria-busy={isFetching}>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {!data || !totals ? (
          Array.from({ length: 4 }, (_, i) => <KpiSkeleton key={i} />)
        ) : (
          <>
            <KpiCard
              label="Total clicks"
              icon={MousePointerClickIcon}
              value={formatNumber(totals.clicks)}
              footer={<DeltaBadge change={clickChange} label={compareLabel} />}
            />
            <KpiCard
              label="Unique visitors"
              icon={UsersIcon}
              value={formatNumber(totals.visitors)}
              footer={
                <DeltaBadge
                  change={percentChange(totals.visitors, totals.prevVisitors)}
                  label={compareLabel}
                />
              }
            />
            <KpiCard
              label="Daily average"
              icon={ActivityIcon}
              value={
                <>
                  {formatNumber(Math.round(totals.clicks / Math.max(1, RANGE_DAYS[range])), {
                    compact: true,
                  })}
                  <span className="ml-1 text-base font-normal text-muted-foreground">
                    clicks/{range === "24h" ? "hour" : "day"}
                  </span>
                </>
              }
              footer={<PeakNote data={data} />}
            >
              <Sparkline values={data.timeseries.map((p) => p.clicks)} />
            </KpiCard>
            {linkId ? (
              <KpiCard
                label="Top referrer"
                icon={TrophyIcon}
                value={<span className="text-xl">{top ? (top as BreakdownRow).name : "—"}</span>}
                footer={
                  top && (
                    <span className="text-xs text-muted-foreground">
                      {formatNumber((top as BreakdownRow).value)} clicks ·{" "}
                      {totals.clicks ? Math.round(((top as BreakdownRow).value / totals.clicks) * 100) : 0}%
                      of traffic
                    </span>
                  )
                }
              />
            ) : (
              <KpiCard
                label="Top link"
                icon={TrophyIcon}
                value={
                  data.topLinks[0] ? (
                    <Link
                      href={`/dashboard/links/${data.topLinks[0].id}`}
                      className="text-xl hover:underline"
                    >
                      /{data.topLinks[0].slug}
                    </Link>
                  ) : (
                    "—"
                  )
                }
                footer={
                  data.topLinks[0] && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {formatNumber(data.topLinks[0].clicks)} clicks ·{" "}
                      {data.topLinks[0].title ?? data.topLinks[0].url}
                    </span>
                  )
                }
              />
            )}
          </>
        )}
      </div>

      <Card>
        <CardHeader className="flex-wrap items-center">
          <div>
            <CardTitle>Clicks over time</CardTitle>
            <CardDescription>
              {data ? (data.interval === "hour" ? "Hourly" : "Daily") : " "} clicks and unique visitors (UTC)
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <ChartLegend />
            <Segmented
              label="Chart view"
              value={view}
              onChange={setView}
              options={[
                { value: "chart", label: "Chart" },
                { value: "table", label: "Table" },
              ]}
            />
          </div>
        </CardHeader>
        <CardContent>
          {!data ? (
            <Skeleton className="h-72 w-full" />
          ) : data.totals.clicks === 0 ? (
            <EmptyState
              icon={BarChart3Icon}
              className="h-72"
              title="No clicks in this period"
              description="Share your short links — clicks will appear here within seconds."
            />
          ) : view === "chart" ? (
            <ClicksChart data={data.timeseries} interval={data.interval} />
          ) : (
            <SeriesTable data={data} />
          )}
        </CardContent>
      </Card>

      <div className={cn("grid gap-4", linkId ? "lg:grid-cols-3" : "lg:grid-cols-2")}>
        {!linkId && (
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Top links</CardTitle>
              <Button asChild variant="link" className="text-[13px]">
                <Link href="/dashboard/links">View all</Link>
              </Button>
            </CardHeader>
            <CardContent className="flex-1 pt-4">
              {!data ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Skeleton key={i} className="h-8" />
                  ))}
                </div>
              ) : data.topLinks.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No clicks in this period</p>
              ) : (
                <BarList
                  total={data.totals.clicks}
                  items={data.topLinks.map((l) => ({
                    key: l.id,
                    href: `/dashboard/links/${l.id}`,
                    label: (
                      <>
                        <span className="font-medium">/{l.slug}</span>
                        <span className="ml-2 text-muted-foreground">{l.title}</span>
                      </>
                    ),
                    value: l.clicks,
                    icon: <Favicon url={l.url} className="size-4" />,
                  }))}
                />
              )}
            </CardContent>
          </Card>
        )}
        <BreakdownCard
          title="Referrers"
          total={totals?.clicks ?? 0}
          loading={!data}
          tabs={[
            { value: "referrer", label: "Referrers", items: referrerItems(data?.breakdowns.referrer ?? []) },
          ]}
        />
        <BreakdownCard
          title="Locations"
          total={totals?.clicks ?? 0}
          loading={!data}
          tabs={[
            { value: "country", label: "Countries", items: countryItems(data?.breakdowns.country ?? []) },
            { value: "city", label: "Cities", items: plainItems(data?.breakdowns.city ?? []) },
          ]}
        />
        <BreakdownCard
          title="Technology"
          total={totals?.clicks ?? 0}
          loading={!data}
          tabs={[
            {
              value: "device",
              label: "Devices",
              items: plainItems(data?.breakdowns.device ?? [], DEVICE_ICONS),
            },
            { value: "browser", label: "Browsers", items: plainItems(data?.breakdowns.browser ?? []) },
            { value: "os", label: "OS", items: plainItems(data?.breakdowns.os ?? []) },
          ]}
        />
      </div>
      {isFetching && data && (
        <span className="sr-only" role="status">
          Updating analytics
        </span>
      )}
    </div>
  );
}
