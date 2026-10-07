import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";

export async function resetDatabase() {
  await db.$executeRawUnsafe(
    'TRUNCATE TABLE "Click", "Link", "ApiKey", "User", "RateLimit" RESTART IDENTITY CASCADE',
  );
}

export async function createUser(overrides: { email?: string; name?: string } = {}) {
  return db.user.create({
    data: {
      email: overrides.email ?? `user-${randomUUID()}@test.dev`,
      name: overrides.name ?? "Test User",
    },
  });
}

export const baseClick = {
  visitorId: "visitor-1",
  referrer: "Direct",
  country: "US",
  region: "CA",
  city: "San Francisco",
  device: "Desktop",
  browser: "Chrome",
  os: "macOS",
};
