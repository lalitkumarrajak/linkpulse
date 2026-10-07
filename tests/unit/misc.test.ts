import { describe, expect, it } from "vitest";
import { parseBearerToken } from "@/lib/api-key";
import { generateApiKey, hashApiKey } from "@/lib/api-key";
import { signSessionToken, verifySessionToken } from "@/lib/auth/session-token";
import { countryFlag, countryName } from "@/lib/countries";
import { csvField, csvRow } from "@/lib/csv";
import { safeNextPath } from "@/lib/safe-redirect";
import { destinationUrlSchema, linkInputSchema, linkUpdateSchema } from "@/lib/validation";
import { bucketStart, fillTimeseries } from "@/server/services/analytics";

const SECRET = "x".repeat(40);

describe("session tokens", () => {
  it("round-trips a signed session", async () => {
    const token = await signSessionToken("user_123", SECRET);
    expect(await verifySessionToken(token, SECRET)).toEqual({ sub: "user_123" });
  });

  it("rejects tampered tokens or a different secret", async () => {
    const token = await signSessionToken("user_123", SECRET);
    expect(await verifySessionToken(`${token}x`, SECRET)).toBeNull();
    expect(await verifySessionToken(token, "y".repeat(40))).toBeNull();
    expect(await verifySessionToken(undefined, SECRET)).toBeNull();
  });
});

describe("API keys", () => {
  it("generates prefixed high-entropy keys with a deterministic hash", () => {
    const a = generateApiKey();
    const b = generateApiKey();
    expect(a.key).toMatch(/^lp_live_[A-Za-z0-9_-]{32}$/);
    expect(a.key).not.toBe(b.key);
    expect(a.key.startsWith(a.prefix)).toBe(true);
    expect(hashApiKey(a.key)).toBe(a.hash);
  });

  it("parses bearer tokens", () => {
    expect(parseBearerToken("Bearer abc")).toBe("abc");
    expect(parseBearerToken("bearer   abc ")).toBe("abc");
    expect(parseBearerToken("Basic abc")).toBeNull();
    expect(parseBearerToken(null)).toBeNull();
  });
});

describe("validation", () => {
  it("normalises destination URLs and blocks unsafe schemes", () => {
    expect(destinationUrlSchema.parse("example.com/x")).toBe("https://example.com/x");
    expect(destinationUrlSchema.safeParse("javascript:alert(1)").success).toBe(false);
    expect(destinationUrlSchema.safeParse("ftp://example.com").success).toBe(false);
    expect(destinationUrlSchema.safeParse("https://").success).toBe(false);
  });

  it("dedupes and lowercases tags; rejects past expiry", () => {
    expect(linkInputSchema.parse({ url: "a.com", tags: ["News", "news"] }).tags).toEqual(["news"]);
    expect(linkInputSchema.safeParse({ url: "a.com", expiresAt: "2000-01-01" }).success).toBe(false);
  });

  it("update schema has no defaults so omitted fields stay untouched", () => {
    expect(linkUpdateSchema.parse({})).toEqual({});
  });
});

describe("misc helpers", () => {
  it("only allows same-origin relative redirects", () => {
    expect(safeNextPath("/dashboard/links")).toBe("/dashboard/links");
    expect(safeNextPath("//evil.com")).toBe("/dashboard");
    expect(safeNextPath("https://evil.com")).toBe("/dashboard");
    expect(safeNextPath("/\\evil.com")).toBe("/dashboard");
    expect(safeNextPath(undefined)).toBe("/dashboard");
  });

  it("escapes CSV fields and neutralises formula injection", () => {
    expect(csvField('say "hi", ok')).toBe('"say ""hi"", ok"');
    expect(csvField("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvField(null)).toBe("");
    expect(csvRow(["a", 1, new Date("2026-01-01T00:00:00Z")])).toBe("a,1,2026-01-01T00:00:00.000Z\r\n");
  });

  it("maps country codes to names and flags", () => {
    expect(countryName("IN")).toBe("India");
    expect(countryFlag("IN")).toBe("🇮🇳");
    expect(countryName("Unknown")).toBe("Unknown");
  });

  it("fills gaps in time series", () => {
    const start = new Date("2026-01-01T10:15:00Z");
    const end = new Date("2026-01-03T09:00:00Z");
    const series = fillTimeseries(
      [{ bucket: new Date("2026-01-02T00:00:00Z"), clicks: 5, visitors: 3 }],
      start,
      end,
      "day",
    );
    expect(series).toEqual([
      { t: "2026-01-01T00:00:00.000Z", clicks: 0, visitors: 0 },
      { t: "2026-01-02T00:00:00.000Z", clicks: 5, visitors: 3 },
      { t: "2026-01-03T00:00:00.000Z", clicks: 0, visitors: 0 },
    ]);
    expect(bucketStart(start, "hour").toISOString()).toBe("2026-01-01T10:00:00.000Z");
  });
});
