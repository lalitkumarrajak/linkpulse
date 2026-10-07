import { execSync } from "node:child_process";
import { loadTestEnv } from "./env";

export default function setup() {
  loadTestEnv();
  const env = { ...process.env };
  delete env.DIRECT_URL; // always migrate the test database itself
  execSync("npx prisma migrate deploy", { stdio: "inherit", env });
}
