"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  CornerDownRightIcon,
  DownloadIcon,
  MonitorIcon,
  MoreHorizontalIcon,
  QrCodeIcon,
  SmartphoneIcon,
  TabletIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { AnalyticsPanel } from "@/components/dashboard/analytics-panel";
import { Favicon } from "@/components/dashboard/favicon";
import { LinkActions } from "@/components/dashboard/link-actions";
import { LiveIndicator } from "@/components/dashboard/live-indicator";
import { QrDialog } from "@/components/dashboard/qr-dialog";
import { RangePicker } from "@/components/dashboard/range-picker";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchJson } from "@/lib/api-client";
import { countryFlag, countryName } from "@/lib/countries";
import { prettyUrl, timeAgo } from "@/lib/utils";
import type { Range } from "@/lib/validation";
import type { LinkDTO } from "@/server/services/links";

interface RecentClick {
  id: string;
  createdAt: string;
  referrer: string;
  country: string;
  city: string;
  device: string;
  browser: string;
  os: string;
}

const DEVICE_ICON = { Desktop: MonitorIcon, Mobile: SmartphoneIcon, Tablet: TabletIcon } as const;

function RecentClicks({ linkId }: { linkId: string }) {
  const { data, isPending } = useQuery({
    queryKey: ["clicks", linkId],
    queryFn: () => fetchJson<RecentClick[]>(`/api/app/links/${linkId}/clicks`),
    refetchInterval: 10_000,
  });
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Recent clicks</CardTitle>
          <CardDescription>
            <LiveIndicator>Latest 25 visits, refreshed every 10 seconds</LiveIndicator>
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-2">
        {isPending ? (
          <div className="space-y-2 px-5">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-9" />
            ))}
          </div>
        ) : !data?.length ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            No clicks yet — share the link and visits will appear here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b">
                  <th scope="col" className="px-5 py-2 font-medium">
                    Time
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Location
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Referrer
                  </th>
                  <th scope="col" className="hidden px-3 py-2 font-medium sm:table-cell">
                    Device
                  </th>
                  <th scope="col" className="hidden px-5 py-2 font-medium md:table-cell">
                    Browser · OS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.map((c) => {
                  const Icon = DEVICE_ICON[c.device as keyof typeof DEVICE_ICON] ?? MonitorIcon;
                  return (
                    <tr key={c.id}>
                      <td className="px-5 py-2.5 whitespace-nowrap text-muted-foreground">
                        <time dateTime={c.createdAt} title={new Date(c.createdAt).toLocaleString()}>
                          {timeAgo(c.createdAt)}
                        </time>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span aria-hidden className="mr-1.5">
                          {countryFlag(c.country)}
                        </span>
                        {c.city !== "Unknown" ? `${c.city}, ` : ""}
                        {countryName(c.country)}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{c.referrer}</td>
                      <td className="hidden px-3 py-2.5 sm:table-cell">
                        <span className="inline-flex items-center gap-1.5">
                          <Icon className="size-3.5 text-muted-foreground" aria-hidden /> {c.device}
                        </span>
                      </td>
                      <td className="hidden px-5 py-2.5 whitespace-nowrap text-muted-foreground md:table-cell">
                        {c.browser} · {c.os}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function LinkDetailView({ initialLink }: { initialLink: LinkDTO }) {
  const router = useRouter();
  const [range, setRange] = useState<Range>("30d");
  const [qrOpen, setQrOpen] = useState(false);
  const { data: link = initialLink } = useQuery({
    queryKey: ["link", initialLink.id],
    queryFn: () => fetchJson<LinkDTO>(`/api/app/links/${initialLink.id}`),
    initialData: initialLink,
  });

  return (
    <>
      <Link
        href="/dashboard/links"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" /> All links
      </Link>

      <Card className="mb-6 p-5">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-xl border bg-muted/40">
              <Favicon url={link.url} className="size-6" />
            </div>
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-semibold tracking-tight">{prettyUrl(link.shortUrl)}</h1>
                <CopyButton value={link.shortUrl} label="Copy short link" />
                <StatusBadge link={link} />
              </div>
              {link.title && <p className="font-medium text-foreground/90">{link.title}</p>}
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <CornerDownRightIcon className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{link.url}</span>
              </a>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <CalendarIcon className="size-3.5" aria-hidden /> Created{" "}
                  {new Date(link.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
                </span>
                {link.expiresAt && (
                  <span className="inline-flex items-center gap-1">
                    <ClockIcon className="size-3.5" aria-hidden />
                    {link.status === "expired" ? "Expired" : "Expires"}{" "}
                    {new Date(link.expiresAt).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                )}
                {link.tags.map((t) => (
                  <Badge key={t} variant="primary">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => setQrOpen(true)}>
              <QrCodeIcon /> QR code
            </Button>
            <Button asChild variant="secondary" size="sm">
              <a href={`/api/app/export?linkId=${link.id}&range=${range}`} download>
                <DownloadIcon /> Export CSV
              </a>
            </Button>
            <LinkActions
              link={link}
              showAnalytics={false}
              onDeleted={() => router.push("/dashboard/links")}
              trigger={
                <Button variant="secondary" size="icon-sm" aria-label="More actions">
                  <MoreHorizontalIcon />
                </Button>
              }
            />
          </div>
        </div>
      </Card>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <RangePicker value={range} onChange={setRange} />
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground tabular">{link.clickCount.toLocaleString()}</span>{" "}
          clicks all-time
        </p>
      </div>
      <div className="space-y-4">
        <AnalyticsPanel range={range} linkId={link.id} />
        <RecentClicks linkId={link.id} />
      </div>
      <QrDialog open={qrOpen} onOpenChange={setQrOpen} shortUrl={link.shortUrl} slug={link.slug} />
    </>
  );
}
