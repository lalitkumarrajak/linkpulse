import { createHash } from "node:crypto";
import type { PrismaClient } from "@/generated/prisma/client";
import { generateApiKey } from "@/lib/api-key";
import { hashPassword } from "@/lib/auth/password";
import { buildUtmUrl } from "@/lib/utm";

export const DEMO_EMAIL = "demo@linkpulse.dev";
export const DEMO_PASSWORD = "demo1234";

const DAY = 86_400_000;

/** Deterministic PRNG (mulberry32) so the demo dataset is reproducible. */
function createRandom(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pick = <T>(entries: readonly (readonly [T, number])[]): T => {
    const total = entries.reduce((sum, [, w]) => sum + w, 0);
    let r = next() * total;
    for (const [value, weight] of entries) {
      r -= weight;
      if (r <= 0) return value;
    }
    return entries[entries.length - 1]![0];
  };
  /** Poisson-ish integer around `mean` (normal approximation, clamped at 0). */
  const around = (mean: number) => {
    const u = 1 - next();
    const v = next();
    const gaussian = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return Math.max(0, Math.round(mean + gaussian * Math.sqrt(mean)));
  };
  return { next, pick, around };
}

const REFERRERS = [
  ["Direct", 30],
  ["google.com", 14],
  ["x.com", 12],
  ["linkedin.com", 12],
  ["github.com", 10],
  ["news.ycombinator.com", 5],
  ["reddit.com", 5],
  ["dev.to", 4],
  ["youtube.com", 2],
  ["medium.com", 2],
  ["bing.com", 2],
  ["duckduckgo.com", 1],
] as const;

type Place = readonly [country: string, region: string, city: string];
const PLACES: readonly (readonly [Place, number])[] = [
  [["US", "CA", "San Francisco"], 8],
  [["US", "NY", "New York"], 7],
  [["US", "WA", "Seattle"], 4],
  [["US", "TX", "Austin"], 4],
  [["US", "IL", "Chicago"], 3],
  [["IN", "KA", "Bengaluru"], 9],
  [["IN", "MH", "Mumbai"], 5],
  [["IN", "DL", "New Delhi"], 4],
  [["IN", "TG", "Hyderabad"], 4],
  [["IN", "MH", "Pune"], 3],
  [["IN", "WB", "Kolkata"], 2],
  [["DE", "BE", "Berlin"], 5],
  [["DE", "BY", "Munich"], 3],
  [["GB", "ENG", "London"], 6],
  [["GB", "ENG", "Manchester"], 2],
  [["CA", "ON", "Toronto"], 3],
  [["CA", "BC", "Vancouver"], 2],
  [["BR", "SP", "São Paulo"], 3],
  [["FR", "IDF", "Paris"], 3],
  [["NL", "NH", "Amsterdam"], 3],
  [["JP", "13", "Tokyo"], 2],
  [["AU", "NSW", "Sydney"], 2],
  [["SG", "01", "Singapore"], 2],
  [["ES", "MD", "Madrid"], 1],
  [["PL", "14", "Warsaw"], 1],
  [["Unknown", "Unknown", "Unknown"], 2],
];

const DEVICES = [
  ["Desktop", 56],
  ["Mobile", 39],
  ["Tablet", 5],
] as const;

const OS_BY_DEVICE: Record<string, readonly (readonly [string, number])[]> = {
  Desktop: [
    ["Windows", 44],
    ["macOS", 36],
    ["Linux", 15],
    ["ChromeOS", 5],
  ],
  Mobile: [
    ["Android", 58],
    ["iOS", 42],
  ],
  Tablet: [
    ["iOS", 65],
    ["Android", 35],
  ],
};

const BROWSER_BY_OS: Record<string, readonly (readonly [string, number])[]> = {
  Windows: [
    ["Chrome", 64],
    ["Edge", 26],
    ["Firefox", 10],
  ],
  macOS: [
    ["Chrome", 52],
    ["Safari", 36],
    ["Firefox", 8],
    ["Edge", 4],
  ],
  Linux: [
    ["Chrome", 55],
    ["Firefox", 45],
  ],
  ChromeOS: [["Chrome", 100]],
  Android: [
    ["Chrome", 80],
    ["Samsung Internet", 12],
    ["Firefox", 8],
  ],
  iOS: [
    ["Safari", 82],
    ["Chrome", 18],
  ],
};

/** Typical audience activity by UTC hour (peaks cover IST evenings and US working hours). */
const HOUR_WEIGHTS = [2, 2, 3, 4, 5, 6, 6, 7, 7, 7, 6, 6, 7, 8, 9, 10, 10, 9, 8, 7, 5, 4, 3, 2].map(
  (w, h) => [h, w] as const,
);

interface DemoLink {
  slug: string;
  url: string;
  title: string;
  tags: string[];
  weight: number;
  ageDays: number;
  expiresInDays?: number;
  disabled?: boolean;
  password?: string;
  spike?: { daysAgo: number; size: number; referrer: string };
}

const DEMO_LINKS: DemoLink[] = [
  {
    slug: "linkpulse",
    url: buildUtmUrl("https://github.com/rajak312/linkpulse", {
      source: "twitter",
      medium: "social",
      campaign: "launch",
    }),
    title: "LinkPulse launch — source code",
    tags: ["launch", "personal"],
    weight: 9,
    ageDays: 34,
    spike: { daysAgo: 21, size: 260, referrer: "news.ycombinator.com" },
  },
  {
    slug: "github",
    url: "https://github.com/rajak312",
    title: "GitHub profile",
    tags: ["personal"],
    weight: 8,
    ageDays: 120,
  },
  {
    slug: "nextjs-guide",
    url: "https://nextjs.org/docs/app/getting-started",
    title: "Next.js App Router guide",
    tags: ["docs", "nextjs"],
    weight: 7,
    ageDays: 110,
  },
  {
    slug: "react-19-2",
    url: "https://react.dev/blog/2025/10/01/react-19-2",
    title: "React 19.2 release notes",
    tags: ["react", "blog"],
    weight: 6,
    ageDays: 95,
  },
  {
    slug: "tanstack-query",
    url: "https://tanstack.com/query/latest/docs/framework/react/overview",
    title: "TanStack Query overview",
    tags: ["docs", "react"],
    weight: 5,
    ageDays: 88,
  },
  {
    slug: "prisma-orm",
    url: "https://www.prisma.io/docs/orm",
    title: "Prisma ORM documentation",
    tags: ["docs", "database"],
    weight: 4.5,
    ageDays: 100,
  },
  {
    slug: "tailwind-v4",
    url: buildUtmUrl("https://tailwindcss.com/blog/tailwindcss-v4", {
      source: "newsletter",
      medium: "email",
      campaign: "frontend-weekly",
    }),
    title: "Tailwind CSS v4.0 announcement",
    tags: ["blog", "css"],
    weight: 4,
    ageDays: 70,
  },
  {
    slug: "neon-docs",
    url: "https://neon.com/docs/introduction",
    title: "Neon serverless Postgres docs",
    tags: ["docs", "database"],
    weight: 3,
    ageDays: 60,
  },
  {
    slug: "oauth2",
    url: "https://oauth.net/2/",
    title: "OAuth 2.0 overview",
    tags: ["auth"],
    weight: 2.5,
    ageDays: 115,
  },
  {
    slug: "ts-narrowing",
    url: "https://www.typescriptlang.org/docs/handbook/2/narrowing.html",
    title: "TypeScript handbook: narrowing",
    tags: ["docs", "typescript"],
    weight: 2,
    ageDays: 80,
  },
  {
    slug: "pg17",
    url: "https://www.postgresql.org/docs/17/index.html",
    title: "PostgreSQL 17 manual",
    tags: ["database"],
    weight: 1.5,
    ageDays: 50,
  },
  {
    slug: "jwt-intro",
    url: "https://jwt.io/introduction",
    title: "Introduction to JSON Web Tokens",
    tags: ["auth"],
    weight: 1.5,
    ageDays: 40,
    password: "demo",
  },
  {
    slug: "hacktoberfest",
    url: "https://hacktoberfest.com/",
    title: "Hacktoberfest sign-up",
    tags: ["events"],
    weight: 2,
    ageDays: 45,
    expiresInDays: -2,
  },
  {
    slug: "meetup-rsvp",
    url: "https://www.meetup.com/",
    title: "React meetup RSVP (closed)",
    tags: ["events"],
    weight: 1,
    ageDays: 90,
    disabled: true,
  },
  {
    slug: "http-302",
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/302",
    title: "MDN: 302 Found",
    tags: ["docs"],
    weight: 1,
    ageDays: 12,
  },
];

const TARGET_CLICKS = 6600;
const HISTORY_DAYS = 90;

/**
 * (Re)creates the demo account with links and ~5k synthetic clicks spread over the
 * last 90 days. Idempotent: existing demo data is wiped first.
 */
export async function seedDemoData(prisma: PrismaClient, options: { now?: Date } = {}) {
  const now = options.now ?? new Date();
  const random = createRandom(312);
  const passwordHash = await hashPassword(DEMO_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { passwordHash, name: "Demo Account" },
    create: { email: DEMO_EMAIL, name: "Demo Account", passwordHash },
  });
  await prisma.link.deleteMany({ where: { userId: user.id } });
  await prisma.apiKey.deleteMany({ where: { userId: user.id } });

  const totalWeight = DEMO_LINKS.reduce((s, l) => s + l.weight, 0);
  const clicks: {
    linkId: string;
    createdAt: Date;
    visitorId: string;
    referrer: string;
    country: string;
    region: string;
    city: string;
    device: string;
    browser: string;
    os: string;
  }[] = [];
  const linkStats = new Map<string, { count: number; last?: Date }>();

  for (const demo of DEMO_LINKS) {
    const createdAt = new Date(now.getTime() - demo.ageDays * DAY);
    const expiresAt =
      demo.expiresInDays !== undefined ? new Date(now.getTime() + demo.expiresInDays * DAY) : null;
    const link = await prisma.link.create({
      data: {
        userId: user.id,
        slug: demo.slug,
        url: demo.url,
        title: demo.title,
        tags: demo.tags,
        disabled: demo.disabled ?? false,
        expiresAt,
        passwordHash: demo.password ? await hashPassword(demo.password, 10) : null,
        createdAt,
      },
    });

    // Average clicks/day for this link, so the whole dataset lands near TARGET_CLICKS.
    const perDay = (TARGET_CLICKS * (demo.weight / totalWeight)) / (HISTORY_DAYS * 1.15);
    const stats = { count: 0, last: undefined as Date | undefined };
    const activeUntil = demo.disabled ? now.getTime() - 20 * DAY : (expiresAt?.getTime() ?? now.getTime());

    for (let daysAgo = HISTORY_DAYS; daysAgo >= 0; daysAgo--) {
      const dayStart = new Date(now.getTime() - daysAgo * DAY);
      dayStart.setUTCHours(0, 0, 0, 0);
      if (dayStart.getTime() + DAY < createdAt.getTime()) continue;

      const progress = 1 - daysAgo / HISTORY_DAYS; // steady growth over the period
      const weekday = dayStart.getUTCDay();
      const weekendFactor = weekday === 0 || weekday === 6 ? 0.62 : 1;
      let count = random.around(perDay * (0.55 + progress * 0.9) * weekendFactor);
      let spikeRemaining = 0;
      if (demo.spike) {
        const distance = daysAgo - demo.spike.daysAgo;
        if (distance <= 0 && distance > -5) spikeRemaining = Math.round(demo.spike.size / 2 ** -distance);
      }
      count += spikeRemaining;

      const visitorsToday = Math.max(1, Math.round(count * 0.78));
      for (let i = 0; i < count; i++) {
        const hour = random.pick(HOUR_WEIGHTS);
        const at = new Date(dayStart.getTime() + hour * 3_600_000 + Math.floor(random.next() * 3_600_000));
        if (at > now || at < createdAt || at.getTime() > activeUntil) continue;
        const device = random.pick(DEVICES);
        const os = random.pick(OS_BY_DEVICE[device]!);
        const browser = random.pick(BROWSER_BY_OS[os]!);
        const [country, region, city] = random.pick(PLACES);
        const fromSpike = i < spikeRemaining;
        const referrer = fromSpike && random.next() < 0.7 ? demo.spike!.referrer : random.pick(REFERRERS);
        const visitorSeed = `${demo.slug}:${dayStart.toISOString()}:${Math.floor(random.next() * visitorsToday)}`;
        clicks.push({
          linkId: link.id,
          createdAt: at,
          visitorId: createHash("sha256").update(visitorSeed).digest("hex").slice(0, 32),
          referrer,
          country,
          region,
          city,
          device,
          browser,
          os,
        });
        stats.count++;
        if (!stats.last || at > stats.last) stats.last = at;
      }
    }
    linkStats.set(link.id, stats);
  }

  for (let i = 0; i < clicks.length; i += 1000) {
    await prisma.click.createMany({ data: clicks.slice(i, i + 1000) });
  }
  for (const [id, stats] of linkStats) {
    await prisma.link.update({
      where: { id },
      data: { clickCount: stats.count, lastClickedAt: stats.last ?? null },
    });
  }

  const sampleKey = generateApiKey();
  await prisma.apiKey.create({
    data: {
      userId: user.id,
      name: "Zapier integration",
      prefix: sampleKey.prefix,
      keyHash: sampleKey.hash,
      lastUsedAt: new Date(now.getTime() - 3 * 3_600_000),
      createdAt: new Date(now.getTime() - 30 * DAY),
    },
  });

  return { userId: user.id, links: DEMO_LINKS.length, clicks: clicks.length };
}
