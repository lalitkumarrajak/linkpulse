import { randomInt } from "node:crypto";
import { DEFAULT_SLUG_LENGTH, SLUG_ALPHABET } from "./slug-rules";

export * from "./slug-rules";

export function generateSlug(length = DEFAULT_SLUG_LENGTH): string {
  let slug = "";
  for (let i = 0; i < length; i++) slug += SLUG_ALPHABET[randomInt(SLUG_ALPHABET.length)];
  return slug;
}
