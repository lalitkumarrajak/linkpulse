import {
  BarChart3Icon,
  BotIcon,
  CalendarClockIcon,
  CodeIcon,
  DownloadIcon,
  LockIcon,
  QrCodeIcon,
  TagIcon,
  WandSparklesIcon,
} from "lucide-react";
import Link from "next/link";
import { DemoButton } from "@/app/(auth)/auth-form";
import { Button } from "@/components/ui/button";
import { appUrl } from "@/lib/app-url";
import { getCurrentUser } from "@/lib/auth/session";
import { HeroPreview } from "./hero-preview";
import { ShortenForm } from "./shorten-form";

const FEATURES = [
  {
    icon: BarChart3Icon,
    title: "Real-time click analytics",
    text: "Clicks and unique visitors over time, with referrers, countries, cities, devices, browsers and OS.",
  },
  {
    icon: WandSparklesIcon,
    title: "Custom aliases",
    text: "Pick a memorable back-half with live availability checks, or let LinkPulse generate a clean one.",
  },
  {
    icon: QrCodeIcon,
    title: "QR codes",
    text: "Every link gets a QR code you can download as PNG or SVG — ready for print, slides and packaging.",
  },
  {
    icon: CalendarClockIcon,
    title: "Expiry & on/off switch",
    text: "Schedule links to expire for time-boxed campaigns, or disable them instantly without deleting data.",
  },
  {
    icon: LockIcon,
    title: "Password protection",
    text: "Share sensitive links safely. Visitors see a clean password prompt before being redirected.",
  },
  {
    icon: TagIcon,
    title: "UTM builder & tags",
    text: "Append campaign parameters without hand-editing URLs, and organise links with tags and filters.",
  },
  {
    icon: BotIcon,
    title: "Bot filtering",
    text: "Crawlers, link unfurlers and scripts are excluded so your numbers reflect real people.",
  },
  {
    icon: CodeIcon,
    title: "REST API",
    text: "Create, list and delete links from your own tools using hashed, revocable API keys.",
  },
  {
    icon: DownloadIcon,
    title: "CSV export",
    text: "Take your raw click data anywhere — spreadsheets, BI tools, or your data warehouse.",
  },
];

const STEPS = [
  {
    title: "Paste a long URL",
    text: "Add an optional alias, tags, expiry or password. UTM parameters are one click away.",
  },
  {
    title: "Share it anywhere",
    text: "Copy the short link or download its QR code. Redirects are instant — tracking never slows them down.",
  },
  {
    title: "Watch clicks arrive",
    text: "See where visitors come from, what they use and which links perform best — then export the data.",
  },
];

export default async function HomePage() {
  const user = await getCurrentUser();
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pt-16 pb-20 lg:grid-cols-[1.1fr_1fr] lg:pt-24 lg:pb-28">
          <div className="flex flex-col items-start">
            <Link
              href="/docs"
              className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs transition-colors hover:text-foreground"
            >
              <span className="rounded-full bg-accent px-1.5 py-px text-accent-foreground">New</span>
              Developer API with per-key rate limits →
            </Link>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Short links with a <span className="text-primary">pulse</span>.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-pretty text-muted-foreground">
              Shorten, brand and share links — then see exactly who clicks, from where and on what, in real
              time.
            </p>
            <div className="mt-8 w-full">
              <ShortenForm signedIn={Boolean(user)} />
            </div>
            {!user && (
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <div className="w-56">
                  <DemoButton />
                </div>
                <span>No sign-up needed — explore a workspace with 90 days of data.</span>
              </div>
            )}
          </div>
          <div className="flex justify-center lg:justify-end">
            <HeroPreview host={appUrl().replace(/^https?:\/\//, "")} />
          </div>
        </div>
      </section>

      <section id="features" className="scroll-mt-20 border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-5 py-20 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-primary">Features</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance">
              Everything you need to share links with confidence
            </h2>
            <p className="mt-3 text-muted-foreground">
              From a one-off link in a tweet to a campaign across channels — LinkPulse keeps it fast, tidy and
              measurable.
            </p>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="bg-card p-6">
                <div className="grid size-9 place-items-center rounded-lg bg-accent">
                  <Icon className="size-[18px] text-accent-foreground" />
                </div>
                <h3 className="mt-4 font-medium">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-20 border-t">
        <div className="mx-auto max-w-6xl px-5 py-20 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-primary">How it works</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              From long URL to insight in three steps
            </h2>
          </div>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="relative rounded-2xl border bg-card p-6 shadow-xs">
                <span className="grid size-8 place-items-center rounded-full border bg-muted font-mono text-sm font-medium">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-medium">{step.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>

          <div className="mt-16 grid items-center gap-10 rounded-2xl border bg-card p-6 shadow-xs md:grid-cols-[1fr_1.3fr] md:p-10">
            <div>
              <p className="text-sm font-medium text-primary">For developers</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight">Automate links with the REST API</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Generate an API key from your dashboard and create links from CI pipelines, CMS hooks or
                scripts. Keys are hashed at rest and rate limited per key.
              </p>
              <Button asChild variant="secondary" className="mt-6">
                <Link href="/docs">Read the API docs</Link>
              </Button>
            </div>
            <pre className="overflow-x-auto rounded-xl bg-[#0e0e0d] p-5 font-mono text-[13px] leading-relaxed text-[#e7e5e4] dark:bg-black/60">
              <code>
                <span className="text-[#a3a29b]"># Create a short link</span>
                {"\n"}curl -X POST {appUrl()}/api/v1/links \{"\n"}
                {"  "}-H <span className="text-[#9ec5f4]">&quot;Authorization: Bearer lp_live_…&quot;</span> \
                {"\n"}
                {"  "}-H <span className="text-[#9ec5f4]">&quot;Content-Type: application/json&quot;</span> \
                {"\n"}
                {"  "}-d{" "}
                <span className="text-[#9ec5f4]">
                  &apos;{"{"}
                  &quot;url&quot;:&quot;https://example.com&quot;,&quot;slug&quot;:&quot;launch&quot;{"}"}
                  &apos;
                </span>
              </code>
            </pre>
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/30">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-5 py-20 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-balance">
            Ready to see who&apos;s clicking?
          </h2>
          <p className="mt-3 max-w-md text-muted-foreground">
            Create a free account in seconds, or jump straight into the demo workspace.
          </p>
          <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="flex-1">
              <Link href={user ? "/dashboard" : "/signup"}>
                {user ? "Open dashboard" : "Create free account"}
              </Link>
            </Button>
            {!user && (
              <div className="flex-1">
                <DemoButton />
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
