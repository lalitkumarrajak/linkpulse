import path from "node:path";
import { config } from "dotenv";

/**
 * Integration tests run against a real Postgres database. Locally the URL comes from
 * `.env.test`; in CI it's provided via DATABASE_URL (which takes precedence).
 */
export function loadTestEnv() {
  config({ path: path.resolve(__dirname, "../../.env.test"), quiet: true });
  const url = process.env.DATABASE_URL ?? "";
  if (!/test/i.test(new URL(url).pathname)) {
    throw new Error(`Refusing to run integration tests against a non-test database: ${url}`);
  }
  process.env.RATE_LIMIT_STORE = "postgres";
}
