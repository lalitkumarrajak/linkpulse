/**
 * Minimal, dependency-free variant helper (a tiny subset of `class-variance-authority`).
 */
type VariantMap = Record<string, Record<string, string>>;

export type VariantProps<T extends (...args: never[]) => string> = Parameters<T>[0] extends infer P
  ? P extends object
    ? P
    : never
  : never;

export function cva<V extends VariantMap>(
  base: string,
  variants: V,
  defaults: { [K in keyof V]?: keyof V[K] },
) {
  return (props: { [K in keyof V]?: keyof V[K] | null } = {}) => {
    const classes = [base];
    for (const key of Object.keys(variants) as (keyof V)[]) {
      const value = (props[key] ?? defaults[key]) as string | undefined;
      if (value) classes.push(variants[key]![value] ?? "");
    }
    return classes.join(" ");
  };
}
