"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import {
  AlertTriangleIcon,
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CornerDownRightIcon,
  Link2Icon,
  PlusIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { EmptyState } from "@/components/empty-state";
import { Favicon } from "@/components/dashboard/favicon";
import { LinkActions } from "@/components/dashboard/link-actions";
import { LinkFormDialog } from "@/components/dashboard/link-form-dialog";
import { PageHeader } from "@/components/dashboard/shell";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchJson, toQueryString } from "@/lib/api-client";
import { useDebounced } from "@/lib/use-debounced";
import { cn, formatNumber, prettyUrl, timeAgo } from "@/lib/utils";
import type { LinkListQuery } from "@/lib/validation";
import type { LinkDTO } from "@/server/services/links";

interface LinksResponse {
  rows: LinkDTO[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  tags: string[];
}

const features = tableFeatures({ rowSortingFeature, rowPaginationFeature });
const helper = createColumnHelper<typeof features, LinkDTO>();
const EMPTY: LinkDTO[] = [];
const SORTABLE = new Set(["createdAt", "clickCount", "title", "lastClickedAt"]);

function buildColumns(tags: string[]) {
  return helper.columns([
    helper.accessor("title", {
      id: "title",
      header: "Link",
      cell: ({ row }) => {
        const link = row.original;
        return (
          <div className="flex min-w-0 items-start gap-3">
            <Favicon url={link.url} className="mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-1">
                <Link
                  href={`/dashboard/links/${link.id}`}
                  className="truncate font-medium text-foreground hover:underline"
                >
                  {prettyUrl(link.shortUrl)}
                </Link>
                <CopyButton value={link.shortUrl} label={`Copy ${link.slug}`} />
              </div>
              <p className="flex min-w-0 items-center gap-1 text-[13px] text-muted-foreground">
                <CornerDownRightIcon className="size-3 shrink-0" aria-hidden />
                <span className="truncate" title={link.url}>
                  {link.title ? <span className="text-foreground/80">{link.title} · </span> : null}
                  {prettyUrl(link.url)}
                </span>
              </p>
            </div>
          </div>
        );
      },
    }),
    helper.accessor("tags", {
      header: "Tags",
      enableSorting: false,
      cell: ({ getValue }) => {
        const value = getValue();
        return value.length ? (
          <div className="flex flex-wrap gap-1">
            {value.slice(0, 3).map((t) => (
              <Badge key={t} variant="primary">
                {t}
              </Badge>
            ))}
            {value.length > 3 && <Badge>+{value.length - 3}</Badge>}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    }),
    helper.accessor("clickCount", {
      header: "Clicks",
      sortDescFirst: true,
      cell: ({ row }) => (
        <div className="text-right">
          <p className="font-medium tabular">{formatNumber(row.original.clickCount)}</p>
          <p className="text-xs whitespace-nowrap text-muted-foreground">
            {row.original.lastClickedAt ? timeAgo(row.original.lastClickedAt) : "No clicks yet"}
          </p>
        </div>
      ),
    }),
    helper.accessor("status", {
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => <StatusBadge link={row.original} />,
    }),
    helper.accessor("createdAt", {
      header: "Created",
      sortDescFirst: true,
      cell: ({ getValue }) => (
        <time dateTime={getValue()} className="whitespace-nowrap text-muted-foreground">
          {new Date(getValue()).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </time>
      ),
    }),
    helper.display({
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <LinkActions link={row.original} tagSuggestions={tags} />
        </div>
      ),
    }),
  ]);
}

const COLUMN_CLASS: Record<string, string> = {
  title: "w-full min-w-44 max-w-0 sm:min-w-64",
  tags: "hidden lg:table-cell",
  clickCount: "text-right",
  status: "hidden sm:table-cell",
  createdAt: "hidden md:table-cell",
  actions: "w-10",
};

export function LinksView({ createUrl }: { createUrl?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [createOpen, setCreateOpen] = useState(createUrl !== undefined);
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("");
  const [status, setStatus] = useState<LinkListQuery["status"]>("all");
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const q = useDebounced(search.trim(), 300);

  const sort = sorting[0];
  const params = {
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    q,
    tag,
    status,
    sort: sort && SORTABLE.has(sort.id) ? sort.id : "createdAt",
    order: sort ? (sort.desc ? "desc" : "asc") : "desc",
  };
  const query = useQuery({
    queryKey: ["links", params],
    queryFn: () => fetchJson<LinksResponse>(`/api/app/links?${toQueryString(params)}`),
    placeholderData: keepPreviousData,
  });

  const tags = query.data?.tags;
  const columns = useMemo(() => buildColumns(tags ?? []), [tags]);
  const table = useTable({
    features,
    columns,
    data: query.data?.rows ?? EMPTY,
    rowCount: query.data?.total ?? 0,
    state: { sorting, pagination },
    onSortingChange: (updater) => {
      setSorting(updater);
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    },
    onPaginationChange: setPagination,
    manualSorting: true,
    manualPagination: true,
    enableSortingRemoval: false,
    getRowId: (row) => row.id,
  });

  const resetPage = () => setPagination((p) => ({ ...p, pageIndex: 0 }));
  const filtered = Boolean(q || tag || status !== "all");
  const total = query.data?.total ?? 0;
  const from = total ? pagination.pageIndex * pagination.pageSize + 1 : 0;
  const to = Math.min(total, (pagination.pageIndex + 1) * pagination.pageSize);

  return (
    <>
      <PageHeader
        title="Links"
        description="Create, organise and track every short link in one place."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <PlusIcon /> New link
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-2 border-b p-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetPage();
              }}
              placeholder="Search by title, alias or destination…"
              aria-label="Search links"
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select
              aria-label="Filter by tag"
              value={tag}
              onChange={(e) => {
                setTag(e.target.value);
                resetPage();
              }}
              className="flex-1 sm:w-36 sm:flex-none"
            >
              <option value="">All tags</option>
              {(tags ?? []).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Filter by status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as LinkListQuery["status"]);
                resetPage();
              }}
              className="flex-1 sm:w-36 sm:flex-none"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
              <option value="expired">Expired</option>
            </Select>
            {filtered && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Clear filters"
                onClick={() => {
                  setSearch("");
                  setTag("");
                  setStatus("all");
                  resetPage();
                }}
              >
                <XIcon />
              </Button>
            )}
          </div>
        </div>

        {query.isError && !query.data ? (
          <EmptyState
            icon={AlertTriangleIcon}
            title="Couldn't load your links"
            description={query.error.message}
            action={
              <Button variant="secondary" size="sm" onClick={() => query.refetch()}>
                Try again
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-busy={query.isFetching}>
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                {table.getHeaderGroups().map((group) => (
                  <tr key={group.id}>
                    {group.headers.map((header) => {
                      const canSort = header.column.getCanSort();
                      const sorted = header.column.getIsSorted();
                      return (
                        <th
                          key={header.id}
                          scope="col"
                          aria-sort={sorted ? (sorted === "asc" ? "ascending" : "descending") : undefined}
                          className={cn(
                            "px-3 py-2.5 font-medium whitespace-nowrap sm:px-4",
                            COLUMN_CLASS[header.column.id],
                          )}
                        >
                          {canSort ? (
                            <button
                              type="button"
                              onClick={header.column.getToggleSortingHandler()}
                              className={cn(
                                "inline-flex items-center gap-1 rounded hover:text-foreground",
                                sorted && "text-foreground",
                              )}
                            >
                              <table.FlexRender header={header} />
                              {sorted === "asc" ? (
                                <ArrowUpIcon className="size-3.5" />
                              ) : sorted === "desc" ? (
                                <ArrowDownIcon className="size-3.5" />
                              ) : (
                                <ArrowUpDownIcon className="size-3.5 opacity-50" />
                              )}
                            </button>
                          ) : (
                            <table.FlexRender header={header} />
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody
                className={cn(
                  "divide-y transition-opacity",
                  query.isFetching && query.isPlaceholderData && "opacity-60",
                )}
              >
                {!query.data
                  ? Array.from({ length: 6 }, (_, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3.5" colSpan={6}>
                          <div className="flex items-center gap-3">
                            <Skeleton className="size-5" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-48" />
                              <Skeleton className="h-3 w-72 max-w-full" />
                            </div>
                            <Skeleton className="h-4 w-12" />
                          </div>
                        </td>
                      </tr>
                    ))
                  : table.getRowModel().rows.map((row) => (
                      <tr key={row.id} className="group transition-colors hover:bg-muted/40">
                        {row.getAllCells().map((cell) => (
                          <td
                            key={cell.id}
                            className={cn("px-3 py-3 align-middle sm:px-4", COLUMN_CLASS[cell.column.id])}
                          >
                            <table.FlexRender cell={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
              </tbody>
            </table>
            {query.data && query.data.rows.length === 0 && (
              <EmptyState
                icon={Link2Icon}
                title={filtered ? "No links match your filters" : "No links yet"}
                description={
                  filtered
                    ? "Try a different search term, tag or status."
                    : "Create your first short link to start tracking clicks."
                }
                action={
                  filtered ? undefined : (
                    <Button size="sm" onClick={() => setCreateOpen(true)}>
                      <PlusIcon /> Create link
                    </Button>
                  )
                }
              />
            )}
          </div>
        )}

        <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 text-sm sm:flex-row">
          <p className="text-muted-foreground" aria-live="polite">
            {total ? (
              <>
                Showing{" "}
                <span className="font-medium text-foreground tabular">
                  {from}–{to}
                </span>{" "}
                of <span className="font-medium text-foreground tabular">{formatNumber(total)}</span> links
              </>
            ) : (
              " "
            )}
          </p>
          <div className="flex items-center gap-2">
            <Select
              aria-label="Rows per page"
              value={pagination.pageSize}
              onChange={(e) => setPagination({ pageIndex: 0, pageSize: Number(e.target.value) })}
              className="h-8"
            >
              {[10, 25, 50].map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </Select>
            <Button
              variant="secondary"
              size="icon-sm"
              aria-label="Previous page"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              <ChevronLeftIcon />
            </Button>
            <span className="min-w-16 text-center text-muted-foreground tabular">
              {pagination.pageIndex + 1} / {Math.max(1, table.getPageCount())}
            </span>
            <Button
              variant="secondary"
              size="icon-sm"
              aria-label="Next page"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      </Card>

      <LinkFormDialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open && createUrl !== undefined) router.replace(pathname);
        }}
        initialUrl={createUrl || undefined}
        tagSuggestions={tags}
        onSaved={() => {
          setSorting([{ id: "createdAt", desc: true }]);
          setPagination((p) => ({ ...p, pageIndex: 0 }));
        }}
      />
    </>
  );
}
