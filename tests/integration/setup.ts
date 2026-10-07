import { afterAll } from "vitest";
import { loadTestEnv } from "./env";

loadTestEnv();

afterAll(async () => {
  const { db } = await import("@/lib/db");
  await db.$disconnect();
});
