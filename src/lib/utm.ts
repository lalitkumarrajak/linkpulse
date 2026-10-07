export const UTM_FIELDS = ["source", "medium", "campaign", "term", "content"] as const;
export type UtmField = (typeof UTM_FIELDS)[number];
export type UtmParams = Partial<Record<UtmField, string>>;

/**
 * Merges UTM parameters into a destination URL. Empty values are ignored and
 * existing `utm_*` params on the URL are overwritten by the provided ones.
 */
export function buildUtmUrl(url: string, params: UtmParams): string {
  const parsed = new URL(url);
  for (const field of UTM_FIELDS) {
    const value = params[field]?.trim();
    if (value) parsed.searchParams.set(`utm_${field}`, value);
  }
  return parsed.toString();
}

/** Extracts UTM parameters already present on a URL (used to prefill the builder when editing). */
export function parseUtmParams(url: string): UtmParams {
  try {
    const parsed = new URL(url);
    const out: UtmParams = {};
    for (const field of UTM_FIELDS) {
      const value = parsed.searchParams.get(`utm_${field}`);
      if (value) out[field] = value;
    }
    return out;
  } catch {
    return {};
  }
}

/** Removes all utm_* params, returning the "base" destination. */
export function stripUtmParams(url: string): string {
  try {
    const parsed = new URL(url);
    for (const field of UTM_FIELDS) parsed.searchParams.delete(`utm_${field}`);
    return parsed.toString();
  } catch {
    return url;
  }
}
