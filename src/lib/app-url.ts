/** Public base URL used to build short links (no trailing slash). */
export function appUrl(): string {
  const configured =
    process.env.APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3300");
  return configured.replace(/\/+$/, "");
}

export function shortUrlFor(slug: string) {
  return `${appUrl()}/${slug}`;
}
