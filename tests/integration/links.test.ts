import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { linkListQuerySchema } from "@/lib/validation";
import { ServiceError } from "@/server/errors";
import { linkService } from "@/server/services/links";
import { createUser, resetDatabase } from "./helpers";

const query = (overrides: Record<string, unknown> = {}) => linkListQuerySchema.parse(overrides);

describe("LinkService", () => {
  beforeEach(resetDatabase);

  it("creates a link with an auto-generated slug and normalised URL", async () => {
    const user = await createUser();
    const link = await linkService.create(user.id, { url: "example.com/path", tags: ["Docs", "docs"] });
    expect(link.slug).toMatch(/^[a-zA-Z0-9]{7}$/);
    expect(link.url).toBe("https://example.com/path");
    expect(link.tags).toEqual(["docs"]);
    expect(link.status).toBe("active");
    expect(link.shortUrl).toMatch(new RegExp(`/${link.slug}$`));
  });

  it("rejects a taken custom alias with a conflict error", async () => {
    const [a, b] = [await createUser(), await createUser()];
    await linkService.create(a.id, { url: "https://a.com", slug: "launch" });
    await expect(linkService.create(b.id, { url: "https://b.com", slug: "launch" })).rejects.toMatchObject({
      code: "conflict",
      fields: { slug: expect.any(String) },
    });
  });

  it("validates input and reports field errors", async () => {
    const user = await createUser();
    const error = await linkService
      .create(user.id, { url: "javascript:alert(1)", slug: "dashboard" })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ServiceError);
    expect((error as ServiceError).fields).toMatchObject({
      url: expect.any(String),
      slug: "This alias is reserved",
    });
  });

  it("hashes link passwords and never exposes them", async () => {
    const user = await createUser();
    const link = await linkService.create(user.id, { url: "https://secret.com", password: "hunter2" });
    expect(link.hasPassword).toBe(true);
    expect(link).not.toHaveProperty("passwordHash");
    const row = await db.link.findUniqueOrThrow({ where: { id: link.id } });
    expect(row.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it("lists with search, tag/status filters, sorting and pagination", async () => {
    const user = await createUser();
    const other = await createUser();
    await linkService.create(other.id, { url: "https://other.com", title: "Not mine" });
    const a = await linkService.create(user.id, {
      url: "https://react.dev",
      title: "React docs",
      tags: ["react"],
    });
    const b = await linkService.create(user.id, {
      url: "https://nextjs.org",
      title: "Next.js",
      tags: ["react", "next"],
    });
    await linkService.create(user.id, { url: "https://prisma.io", title: "Prisma" });
    await linkService.setDisabled(user.id, b.id, true);
    await db.link.update({ where: { id: a.id }, data: { clickCount: 42 } });

    const all = await linkService.list(user.id, query());
    expect(all.total).toBe(3);

    expect((await linkService.list(user.id, query({ q: "react" }))).rows.map((r) => r.id)).toEqual([a.id]);
    expect((await linkService.list(user.id, query({ tag: "react" }))).total).toBe(2);
    expect((await linkService.list(user.id, query({ status: "disabled" }))).rows[0]!.id).toBe(b.id);
    expect((await linkService.list(user.id, query({ status: "active" }))).total).toBe(2);

    const byClicks = await linkService.list(user.id, query({ sort: "clickCount", order: "desc" }));
    expect(byClicks.rows[0]!.id).toBe(a.id);

    const page2 = await linkService.list(user.id, query({ page: 2, pageSize: 2 }));
    expect(page2.rows).toHaveLength(1);
    expect(page2.pageCount).toBe(2);
    expect(await linkService.tags(user.id)).toEqual(["next", "react"]);
  });

  it("treats past expiry dates as expired", async () => {
    const user = await createUser();
    const link = await linkService.create(user.id, { url: "https://e.com" });
    await db.link.update({ where: { id: link.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await linkService.get(user.id, link.id)).status).toBe("expired");
    expect((await linkService.list(user.id, query({ status: "expired" }))).total).toBe(1);
  });

  it("partial updates leave omitted fields untouched", async () => {
    const user = await createUser();
    const link = await linkService.create(user.id, {
      url: "https://x.com",
      title: "Keep me",
      tags: ["keep"],
      password: "pass1234",
    });
    const updated = await linkService.update(user.id, link.id, { url: "https://y.com" });
    expect(updated).toMatchObject({
      url: "https://y.com",
      title: "Keep me",
      tags: ["keep"],
      hasPassword: true,
    });
    const cleared = await linkService.update(user.id, link.id, { password: null, title: null });
    expect(cleared).toMatchObject({ hasPassword: false, title: null, tags: ["keep"] });
  });

  it("duplicates a link with a fresh slug", async () => {
    const user = await createUser();
    const link = await linkService.create(user.id, {
      url: "https://dup.com",
      title: "Original",
      tags: ["a"],
      password: "abcd",
    });
    const copy = await linkService.duplicate(user.id, link.id);
    expect(copy.id).not.toBe(link.id);
    expect(copy.slug).not.toBe(link.slug);
    expect(copy).toMatchObject({ url: link.url, title: "Original (copy)", tags: ["a"], hasPassword: true });
  });

  it("enforces ownership on read, update and delete", async () => {
    const owner = await createUser();
    const intruder = await createUser();
    const link = await linkService.create(owner.id, { url: "https://mine.com" });
    await expect(linkService.get(intruder.id, link.id)).rejects.toMatchObject({ code: "not_found" });
    await expect(linkService.update(intruder.id, link.id, { title: "pwned" })).rejects.toMatchObject({
      code: "not_found",
    });
    await expect(linkService.delete(intruder.id, link.id)).rejects.toMatchObject({ code: "not_found" });
    await linkService.delete(owner.id, link.id);
    expect(await linkService.resolve(link.slug)).toBeNull();
  });

  it("reports slug availability", async () => {
    const user = await createUser();
    await linkService.create(user.id, { url: "https://a.com", slug: "taken" });
    expect(await linkService.isSlugAvailable("taken")).toMatchObject({ available: false });
    expect(await linkService.isSlugAvailable("free-one")).toEqual({ available: true });
    expect(await linkService.isSlugAvailable("api")).toMatchObject({
      available: false,
      reason: "This alias is reserved",
    });
  });
});
