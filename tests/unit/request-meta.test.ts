import { describe, expect, it } from "vitest";
import { clientIp, geoFromHeaders, referrerDomain, visitorId } from "@/lib/request-meta";

describe("referrerDomain", () => {
  it.each([
    [null, "Direct"],
    ["", "Direct"],
    ["not a url", "Direct"],
    ["https://www.google.com/search?q=x", "google.com"],
    ["https://news.ycombinator.com/item?id=1", "news.ycombinator.com"],
    ["https://t.co/abc", "x.com"],
    ["https://lnkd.in/xyz", "linkedin.com"],
    ["https://links.example.com/dashboard", "Direct"],
  ])("%s -> %s", (input, expected) => {
    expect(referrerDomain(input, "links.example.com")).toBe(expected);
  });
});

describe("geoFromHeaders", () => {
  it("reads and decodes Vercel geo headers", () => {
    const geo = geoFromHeaders(
      new Headers({
        "x-vercel-ip-country": "br",
        "x-vercel-ip-country-region": "SP",
        "x-vercel-ip-city": "S%C3%A3o%20Paulo",
      }),
    );
    expect(geo).toEqual({ country: "BR", region: "SP", city: "São Paulo" });
  });

  it("falls back to Unknown when headers are missing or malformed", () => {
    expect(geoFromHeaders(new Headers({ "x-vercel-ip-country": "XYZ" }))).toEqual({
      country: "Unknown",
      region: "Unknown",
      city: "Unknown",
    });
  });
});

describe("visitor identification", () => {
  it("uses the first forwarded IP", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "198.51.100.1, 10.0.0.1" }))).toBe("198.51.100.1");
    expect(clientIp(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
  });

  it("is stable within a day, rotates daily and never contains the raw IP", () => {
    const day1 = new Date("2026-03-01T10:00:00Z");
    const later = new Date("2026-03-01T22:00:00Z");
    const day2 = new Date("2026-03-02T10:00:00Z");
    const id = visitorId("203.0.113.9", "ua", "secret", day1);
    expect(id).toHaveLength(32);
    expect(id).not.toContain("203");
    expect(visitorId("203.0.113.9", "ua", "secret", later)).toBe(id);
    expect(visitorId("203.0.113.9", "ua", "secret", day2)).not.toBe(id);
    expect(visitorId("203.0.113.9", "ua", "other-secret", day1)).not.toBe(id);
  });
});
