import { describe, expect, it } from "vitest";
import { buildUtmUrl, parseUtmParams, stripUtmParams } from "@/lib/utm";

describe("UTM builder", () => {
  it("appends provided parameters and skips empty ones", () => {
    const url = buildUtmUrl("https://example.com/post", {
      source: "twitter",
      medium: " ",
      campaign: "launch",
    });
    expect(url).toBe("https://example.com/post?utm_source=twitter&utm_campaign=launch");
  });

  it("preserves existing query params and fragments", () => {
    const url = buildUtmUrl("https://example.com/?ref=1#top", { source: "newsletter" });
    expect(url).toBe("https://example.com/?ref=1&utm_source=newsletter#top");
  });

  it("overwrites existing utm values instead of duplicating them", () => {
    const url = buildUtmUrl("https://example.com/?utm_source=old", { source: "new" });
    expect(new URL(url).searchParams.getAll("utm_source")).toEqual(["new"]);
  });

  it("encodes special characters", () => {
    const url = buildUtmUrl("https://example.com", { campaign: "spring sale & more" });
    expect(new URL(url).searchParams.get("utm_campaign")).toBe("spring sale & more");
    expect(url).toContain("spring+sale+%26+more");
  });

  it("round-trips through parse and strip", () => {
    const url = buildUtmUrl("https://example.com/a?x=1", {
      source: "s",
      medium: "m",
      term: "t",
      content: "c",
    });
    expect(parseUtmParams(url)).toEqual({ source: "s", medium: "m", term: "t", content: "c" });
    expect(stripUtmParams(url)).toBe("https://example.com/a?x=1");
    expect(parseUtmParams("not a url")).toEqual({});
  });
});
