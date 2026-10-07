const displayNames = new Intl.DisplayNames(["en"], { type: "region" });

export function countryName(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return "Unknown";
  try {
    return displayNames.of(code) ?? code;
  } catch {
    return code;
  }
}

/** Converts an ISO-3166 alpha-2 code into its flag emoji. */
export function countryFlag(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return "🌐";
  return String.fromCodePoint(...[...code].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}
