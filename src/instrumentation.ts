/** Validates environment variables once at server start so misconfiguration fails fast. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === "phase-production-build") return;
  const { env } = await import("./lib/env");
  env();
}
