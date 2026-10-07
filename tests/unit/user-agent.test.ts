import { describe, expect, it } from "vitest";
import { isBotUserAgent, parseUserAgent } from "@/lib/user-agent";

const UA = {
  chromeMac:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  edgeWindows:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0",
  firefoxLinux: "Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0",
  safariIphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  chromeAndroid:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
  samsung:
    "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36",
  ipad: "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
};

describe("parseUserAgent", () => {
  it.each([
    [UA.chromeMac, { device: "Desktop", browser: "Chrome", os: "macOS" }],
    [UA.edgeWindows, { device: "Desktop", browser: "Edge", os: "Windows" }],
    [UA.firefoxLinux, { device: "Desktop", browser: "Firefox", os: "Linux" }],
    [UA.safariIphone, { device: "Mobile", browser: "Safari", os: "iOS" }],
    [UA.chromeAndroid, { device: "Mobile", browser: "Chrome", os: "Android" }],
    [UA.samsung, { device: "Mobile", browser: "Samsung Internet", os: "Android" }],
    [UA.ipad, { device: "Tablet", browser: "Safari", os: "iOS" }],
  ])("parses %s", (ua, expected) => {
    expect(parseUserAgent(ua)).toEqual(expected);
  });

  it("falls back to Unknown for empty user agents", () => {
    expect(parseUserAgent(null)).toEqual({ device: "Desktop", browser: "Unknown", os: "Unknown" });
  });
});

describe("isBotUserAgent", () => {
  it.each(Object.values(UA))("lets real browsers through: %s", (ua) => {
    expect(isBotUserAgent(ua)).toBe(false);
  });

  it.each([
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Twitterbot/1.0",
    "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
    "LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/130.0.0.0 Safari/537.36",
    "curl/8.5.0",
    "python-requests/2.32.3",
    "",
    null,
  ])("flags bots and scripts: %s", (ua) => {
    expect(isBotUserAgent(ua)).toBe(true);
  });
});
