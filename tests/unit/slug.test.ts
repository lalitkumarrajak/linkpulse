import { describe, expect, it } from "vitest";
import { generateSlug, RESERVED_SLUGS, SLUG_ALPHABET, validateSlug } from "@/lib/slug";

describe("generateSlug", () => {
  it("generates slugs of the requested length from the unambiguous alphabet", () => {
    for (const length of [5, 7, 12]) {
      const slug = generateSlug(length);
      expect(slug).toHaveLength(length);
      for (const char of slug) expect(SLUG_ALPHABET).toContain(char);
    }
  });

  it("never uses look-alike characters", () => {
    const sample = Array.from({ length: 500 }, () => generateSlug()).join("");
    expect(sample).not.toMatch(/[0O1lI]/);
  });

  it("is practically collision-free", () => {
    const slugs = new Set(Array.from({ length: 10_000 }, () => generateSlug()));
    expect(slugs.size).toBe(10_000);
  });
});

describe("validateSlug", () => {
  it.each(["abc", "my-launch", "Promo_2026", "a".repeat(48)])("accepts %s", (slug) => {
    expect(validateSlug(slug)).toEqual({ valid: true });
  });

  it.each([
    ["ab", "at least 3"],
    ["a".repeat(49), "at most 48"],
    ["-leading", "Use letters"],
    ["has space", "Use letters"],
    ["emoji🔥", "Use letters"],
    ["../etc", "Use letters"],
  ])("rejects %s", (slug, reason) => {
    const result = validateSlug(slug);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toContain(reason);
  });

  it("rejects reserved application paths case-insensitively", () => {
    expect(RESERVED_SLUGS.has("dashboard")).toBe(true);
    expect(validateSlug("Dashboard")).toEqual({ valid: false, reason: "This alias is reserved" });
    expect(validateSlug("api")).toMatchObject({ valid: false });
  });
});
