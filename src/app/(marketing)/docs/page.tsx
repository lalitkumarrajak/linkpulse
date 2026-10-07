import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/code-block";
import { Badge } from "@/components/ui/badge";
import { appUrl } from "@/lib/app-url";

export const metadata: Metadata = {
  title: "API documentation",
  description: "Create and manage LinkPulse short links programmatically with the REST API.",
};

const METHOD_VARIANT = { GET: "success", POST: "primary", DELETE: "danger" } as const;

function Endpoint({
  method,
  path,
  children,
  id,
}: {
  method: keyof typeof METHOD_VARIANT;
  path: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4 border-t pt-10">
      <h3 className="flex flex-wrap items-center gap-2 font-mono text-[15px] font-medium">
        <Badge variant={METHOD_VARIANT[method]} className="font-mono">
          {method}
        </Badge>
        {path}
      </h3>
      {children}
    </section>
  );
}

function ParamTable({ rows }: { rows: [name: string, type: string, description: string][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">
              Field
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Type
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Description
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map(([name, type, description]) => (
            <tr key={name}>
              <td className="px-3 py-2 font-mono text-[13px] whitespace-nowrap">{name}</td>
              <td className="px-3 py-2 font-mono text-[13px] whitespace-nowrap text-muted-foreground">
                {type}
              </td>
              <td className="px-3 py-2 text-muted-foreground">{description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TOC = [
  ["authentication", "Authentication"],
  ["rate-limits", "Rate limits"],
  ["errors", "Errors"],
  ["list-links", "List links"],
  ["create-link", "Create a link"],
  ["get-link", "Retrieve a link"],
  ["link-stats", "Link statistics"],
  ["delete-link", "Delete a link"],
] as const;

export default function DocsPage() {
  const base = `${appUrl()}/api/v1`;
  const linkJson = `{
  "data": {
    "id": "cm1x9k2ab0001qz8f3h2l4m5n",
    "slug": "launch",
    "shortUrl": "${appUrl()}/launch",
    "url": "https://example.com/blog/launch",
    "title": "Launch post",
    "tags": ["marketing"],
    "hasPassword": false,
    "expiresAt": null,
    "disabled": false,
    "status": "active",
    "clickCount": 0,
    "lastClickedAt": null,
    "createdAt": "2026-10-01T09:30:00.000Z",
    "updatedAt": "2026-10-01T09:30:00.000Z"
  }
}`;

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-5 py-14 lg:grid-cols-[200px_1fr]">
      <aside className="hidden lg:block">
        <nav aria-label="On this page" className="sticky top-24 space-y-1 text-sm">
          <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            On this page
          </p>
          {TOC.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="block rounded-md px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {label}
            </a>
          ))}
        </nav>
      </aside>

      <article className="min-w-0 space-y-10">
        <header className="space-y-3">
          <p className="text-sm font-medium text-primary">Developer API · v1</p>
          <h1 className="text-4xl font-semibold tracking-tight">REST API reference</h1>
          <p className="max-w-2xl text-muted-foreground">
            Manage short links from your own code. All endpoints accept and return JSON and live under{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px] text-foreground">
              {base}
            </code>
            .
          </p>
        </header>

        <section id="authentication" className="scroll-mt-24 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Authentication</h2>
          <p className="text-muted-foreground">
            Create a key on the{" "}
            <Link
              href="/dashboard/developers"
              className="font-medium text-foreground underline underline-offset-4"
            >
              API keys
            </Link>{" "}
            page and send it as a bearer token. Keys start with{" "}
            <code className="font-mono text-[13px]">lp_live_</code>, are shown once, and are stored only as a
            SHA-256 hash.
          </p>
          <CodeBlock code={`curl ${base}/links \\\n  -H "Authorization: Bearer lp_live_xxxxxxxxxxxxxxxx"`} />
        </section>

        <section id="rate-limits" className="scroll-mt-24 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Rate limits</h2>
          <p className="text-muted-foreground">
            Each key may make <strong className="text-foreground">60 requests per minute</strong>; link
            creation is additionally capped at 30 per minute per account. Every response includes{" "}
            <code className="font-mono text-[13px]">X-RateLimit-Limit</code>,{" "}
            <code className="font-mono text-[13px]">X-RateLimit-Remaining</code> and{" "}
            <code className="font-mono text-[13px]">X-RateLimit-Reset</code> (Unix seconds). Exceeding the
            limit returns <code className="font-mono text-[13px]">429</code> with a{" "}
            <code className="font-mono text-[13px]">Retry-After</code> header.
          </p>
        </section>

        <section id="errors" className="scroll-mt-24 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Errors</h2>
          <p className="text-muted-foreground">
            Errors use conventional HTTP status codes and a consistent body:
          </p>
          <CodeBlock
            title="json"
            code={`{
  "error": {
    "code": "validation_error",
    "message": "Invalid link",
    "fields": { "url": "Enter a valid http(s) URL" }
  }
}`}
          />
          <ParamTable
            rows={[
              ["400 invalid_json", "—", "The request body isn't valid JSON."],
              ["401 unauthorized", "—", "Missing, invalid or revoked API key."],
              ["404 not_found", "—", "The link doesn't exist or belongs to someone else."],
              ["409 conflict", "—", "The requested custom alias is already taken."],
              ["422 validation_error", "—", "One or more fields are invalid — see `fields`."],
              ["429 rate_limited", "—", "Too many requests — retry after `Retry-After` seconds."],
            ]}
          />
        </section>

        <div className="space-y-10">
          <h2 className="text-xl font-semibold tracking-tight">Endpoints</h2>

          <Endpoint id="list-links" method="GET" path="/api/v1/links">
            <p className="text-muted-foreground">
              Returns your links, newest first, with pagination metadata.
            </p>
            <ParamTable
              rows={[
                ["page", "integer", "Page number, starting at 1. Default 1."],
                ["pageSize", "integer", "Items per page, 1–100. Default 10."],
                ["q", "string", "Search title, alias and destination."],
                ["tag", "string", "Only links with this tag."],
                ["status", "enum", "all · active · disabled · expired"],
                ["sort", "enum", "createdAt · clickCount · title · lastClickedAt"],
                ["order", "enum", "asc · desc"],
              ]}
            />
            <CodeBlock
              code={`curl "${base}/links?pageSize=5&sort=clickCount" \\\n  -H "Authorization: Bearer $LINKPULSE_API_KEY"`}
            />
          </Endpoint>

          <Endpoint id="create-link" method="POST" path="/api/v1/links">
            <p className="text-muted-foreground">
              Creates a short link. Returns <code className="font-mono text-[13px]">201</code> with the link.
            </p>
            <ParamTable
              rows={[
                ["url", "string", "Required. Destination http(s) URL (scheme optional)."],
                [
                  "slug",
                  "string",
                  "Custom alias, 3–48 chars: letters, numbers, - and _. Auto-generated if omitted.",
                ],
                ["title", "string", "Optional label, up to 120 characters."],
                ["tags", "string[]", "Up to 10 lowercase tags."],
                ["expiresAt", "ISO 8601", "When the link stops redirecting. Must be in the future."],
                ["password", "string", "Require visitors to enter this password (min. 4 chars)."],
              ]}
            />
            <CodeBlock
              code={`curl -X POST ${base}/links \\
  -H "Authorization: Bearer $LINKPULSE_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com/blog/launch",
    "slug": "launch",
    "title": "Launch post",
    "tags": ["marketing"]
  }'`}
            />
            <CodeBlock title="201 Created" code={linkJson} />
          </Endpoint>

          <Endpoint id="get-link" method="GET" path="/api/v1/links/{id}">
            <p className="text-muted-foreground">Retrieves a single link by its ID.</p>
            <CodeBlock
              code={`curl ${base}/links/cm1x9k2ab0001qz8f3h2l4m5n \\\n  -H "Authorization: Bearer $LINKPULSE_API_KEY"`}
            />
          </Endpoint>

          <Endpoint id="link-stats" method="GET" path="/api/v1/links/{id}/stats">
            <p className="text-muted-foreground">
              Aggregated analytics for a link: totals (with the previous period), a gap-free time series and
              the top referrers, countries, cities, devices, browsers and operating systems. Bots are
              excluded.
            </p>
            <ParamTable rows={[["range", "enum", "24h · 7d · 30d · 90d. Default 30d."]]} />
            <CodeBlock
              code={`curl "${base}/links/cm1x9k2ab0001qz8f3h2l4m5n/stats?range=7d" \\\n  -H "Authorization: Bearer $LINKPULSE_API_KEY"`}
            />
          </Endpoint>

          <Endpoint id="delete-link" method="DELETE" path="/api/v1/links/{id}">
            <p className="text-muted-foreground">
              Permanently deletes a link and its click history. Returns{" "}
              <code className="font-mono text-[13px]">204 No Content</code>.
            </p>
            <CodeBlock
              code={`curl -X DELETE ${base}/links/cm1x9k2ab0001qz8f3h2l4m5n \\\n  -H "Authorization: Bearer $LINKPULSE_API_KEY"`}
            />
          </Endpoint>
        </div>
      </article>
    </div>
  );
}
