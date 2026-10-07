/** Slug rules shared by server and browser code (no Node.js APIs). */
/** Unambiguous alphabet: no 0/O, 1/l/I to keep short links easy to read aloud. */
export const SLUG_ALPHABET = "23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
export const DEFAULT_SLUG_LENGTH = 7;
export const SLUG_MIN_LENGTH = 3;
export const SLUG_MAX_LENGTH = 48;

/** Paths owned by the application that can never be used as short-link slugs. */
export const RESERVED_SLUGS = new Set([
  "api",
  "app",
  "dashboard",
  "docs",
  "login",
  "logout",
  "signup",
  "register",
  "settings",
  "l",
  "admin",
  "static",
  "public",
  "assets",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "_next",
  "health",
  "status",
  "pricing",
  "about",
]);

const SLUG_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

export type SlugValidation = { valid: true } | { valid: false; reason: string };

export function validateSlug(slug: string): SlugValidation {
  if (slug.length < SLUG_MIN_LENGTH)
    return { valid: false, reason: `Must be at least ${SLUG_MIN_LENGTH} characters` };
  if (slug.length > SLUG_MAX_LENGTH)
    return { valid: false, reason: `Must be at most ${SLUG_MAX_LENGTH} characters` };
  if (!SLUG_PATTERN.test(slug))
    return {
      valid: false,
      reason: "Use letters, numbers, dashes and underscores (must start with a letter or number)",
    };
  if (RESERVED_SLUGS.has(slug.toLowerCase())) return { valid: false, reason: "This alias is reserved" };
  return { valid: true };
}

/** Returns a human-readable problem with the slug, or null if it's valid. */
export function validateSlugClient(slug: string): string | null {
  const result = validateSlug(slug);
  return result.valid ? null : result.reason;
}
