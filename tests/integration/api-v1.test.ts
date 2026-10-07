import { beforeEach, describe, expect, it } from "vitest";
import { DELETE, GET as getOne } from "@/app/api/v1/links/[id]/route";
import { GET as getStats } from "@/app/api/v1/links/[id]/stats/route";
import { GET as list, POST as create } from "@/app/api/v1/links/route";
import { apiKeyService } from "@/server/services/api-keys";
import { createUser, resetDatabase } from "./helpers";

const BASE = "http://localhost:3300/api/v1";

function request(path: string, init: RequestInit & { key?: string } = {}) {
  const headers = new Headers(init.headers);
  if (init.key) headers.set("authorization", `Bearer ${init.key}`);
  if (init.body) headers.set("content-type", "application/json");
  return new Request(`${BASE}${path}`, { ...init, headers });
}

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("REST API v1", () => {
  let key: string;

  beforeEach(async () => {
    await resetDatabase();
    const user = await createUser();
    key = (await apiKeyService.create(user.id, "tests")).key;
  });

  it("rejects missing and invalid keys", async () => {
    const missing = await list(request("/links"));
    expect(missing.status).toBe(401);
    expect(await missing.json()).toMatchObject({ error: { code: "unauthorized" } });
    expect((await list(request("/links", { key: "lp_live_nope" }))).status).toBe(401);
  });

  it("supports the full create → list → get → stats → delete lifecycle", async () => {
    const created = await create(
      request("/links", {
        method: "POST",
        key,
        body: JSON.stringify({ url: "https://example.com", slug: "api-test", tags: ["api"] }),
      }),
    );
    expect(created.status).toBe(201);
    expect(created.headers.get("x-ratelimit-limit")).toBe("60");
    const { data: link } = await created.json();
    expect(link).toMatchObject({
      slug: "api-test",
      url: "https://example.com",
      tags: ["api"],
      clickCount: 0,
    });

    const listed = await (await list(request("/links?pageSize=5", { key }))).json();
    expect(listed.pagination).toMatchObject({ total: 1, page: 1, pageSize: 5 });
    expect(listed.data[0].id).toBe(link.id);

    expect((await getOne(request(`/links/${link.id}`, { key }), ctx(link.id))).status).toBe(200);

    const stats = await getStats(request(`/links/${link.id}/stats?range=7d`, { key }), ctx(link.id));
    expect((await stats.json()).data).toMatchObject({ range: "7d", totals: { clicks: 0 } });

    expect((await DELETE(request(`/links/${link.id}`, { method: "DELETE", key }), ctx(link.id))).status).toBe(
      204,
    );
    expect((await getOne(request(`/links/${link.id}`, { key }), ctx(link.id))).status).toBe(404);
  });

  it("returns structured validation, conflict and JSON errors", async () => {
    const invalid = await create(
      request("/links", { method: "POST", key, body: JSON.stringify({ url: "nope" }) }),
    );
    expect(invalid.status).toBe(422);
    expect(await invalid.json()).toMatchObject({
      error: { code: "validation_error", fields: { url: expect.any(String) } },
    });

    await create(
      request("/links", {
        method: "POST",
        key,
        body: JSON.stringify({ url: "https://a.com", slug: "dupe" }),
      }),
    );
    const conflict = await create(
      request("/links", {
        method: "POST",
        key,
        body: JSON.stringify({ url: "https://b.com", slug: "dupe" }),
      }),
    );
    expect(conflict.status).toBe(409);

    const badJson = await create(request("/links", { method: "POST", key, body: "{oops" }));
    expect(badJson.status).toBe(400);
  });

  it("does not expose other users' links", async () => {
    const otherUser = await createUser();
    const otherKey = (await apiKeyService.create(otherUser.id, "other")).key;
    const res = await create(
      request("/links", {
        method: "POST",
        key: otherKey,
        body: JSON.stringify({ url: "https://private.com" }),
      }),
    );
    const { data } = await res.json();
    expect((await getOne(request(`/links/${data.id}`, { key }), ctx(data.id))).status).toBe(404);
    expect((await DELETE(request(`/links/${data.id}`, { method: "DELETE", key }), ctx(data.id))).status).toBe(
      404,
    );
  });

  it("rate limits each key", async () => {
    let last: Response | undefined;
    for (let i = 0; i < 61; i++) last = await list(request("/links", { key }));
    expect(last!.status).toBe(429);
    expect(last!.headers.get("retry-after")).toMatch(/^\d+$/);
    expect(last!.headers.get("x-ratelimit-remaining")).toBe("0");
  });
});
