import { createHash, randomBytes } from "node:crypto";

export const API_KEY_PREFIX = "lp_live_";

export function generateApiKey() {
  const secret = randomBytes(24).toString("base64url");
  const key = `${API_KEY_PREFIX}${secret}`;
  return { key, prefix: key.slice(0, API_KEY_PREFIX.length + 6), hash: hashApiKey(key) };
}

/** API keys are high-entropy random tokens, so a fast SHA-256 is appropriate (no need for bcrypt). */
export function hashApiKey(key: string) {
  return createHash("sha256").update(key).digest("hex");
}

export function parseBearerToken(header: string | null): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return match?.[1] ?? null;
}
