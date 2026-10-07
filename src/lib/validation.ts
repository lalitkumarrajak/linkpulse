import { z } from "zod";
import { SLUG_MAX_LENGTH, validateSlug } from "./slug-rules";

export const emailSchema = z.email("Enter a valid email address").trim().toLowerCase().max(254);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(128),
});

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: emailSchema,
  password: z.string().min(8, "Use at least 8 characters").max(128),
});

export const destinationUrlSchema = z
  .string()
  .trim()
  .min(1, "Destination URL is required")
  .max(2048, "URL is too long")
  .transform((value) => (/^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`))
  .pipe(z.url({ protocol: /^https?$/, hostname: z.regexes.domain, message: "Enter a valid http(s) URL" }));

export const slugSchema = z
  .string()
  .trim()
  .max(SLUG_MAX_LENGTH)
  .superRefine((value, ctx) => {
    const result = validateSlug(value);
    if (!result.valid) ctx.addIssue({ code: "custom", message: result.reason });
  });

export const tagSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(24, "Tags must be 24 characters or fewer")
  .regex(/^[a-z0-9][a-z0-9-]*$/, "Tags may contain letters, numbers and dashes");

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

const tagsSchema = z
  .array(tagSchema)
  .max(10, "Up to 10 tags")
  .transform((tags) => [...new Set(tags)]);

const expiresAtSchema = z.coerce
  .date()
  .nullable()
  .refine((d) => !d || d.getTime() > Date.now(), "Expiry must be in the future");

/** undefined = leave unchanged, null/"" = remove password, string = set password. */
const linkPasswordSchema = z
  .string()
  .max(128)
  .nullable()
  .refine((v) => v == null || v === "" || v.length >= 4, "Password must be at least 4 characters");

const linkFields = {
  url: destinationUrlSchema,
  slug: z
    .union([slugSchema, z.literal("")])
    .optional()
    .transform((v) => v || undefined),
  title: optionalText(120),
  tags: tagsSchema,
  expiresAt: expiresAtSchema,
  password: linkPasswordSchema,
};

export const linkInputSchema = z.object({
  ...linkFields,
  tags: linkFields.tags.default([]),
  expiresAt: linkFields.expiresAt.optional(),
  password: linkFields.password.optional(),
});

export type LinkInput = z.input<typeof linkInputSchema>;
export type ParsedLinkInput = z.output<typeof linkInputSchema>;

/** Every field optional and without defaults, so omitted fields are left untouched. */
export const linkUpdateSchema = z.object({ ...linkFields, disabled: z.boolean() }).partial();
export type LinkUpdateInput = z.input<typeof linkUpdateSchema>;

export const RANGES = ["24h", "7d", "30d", "90d"] as const;
export type Range = (typeof RANGES)[number];
export const rangeSchema = z.enum(RANGES).catch("30d");

export const linkListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(1).max(100).catch(10),
  q: z.string().trim().max(200).optional().catch(undefined),
  tag: z.string().trim().max(24).optional().catch(undefined),
  status: z.enum(["all", "active", "disabled", "expired"]).catch("all"),
  sort: z.enum(["createdAt", "clickCount", "title", "lastClickedAt"]).catch("createdAt"),
  order: z.enum(["asc", "desc"]).catch("desc"),
});
export type LinkListQuery = z.infer<typeof linkListQuerySchema>;

export const apiKeyNameSchema = z.string().trim().min(1, "Name is required").max(60);

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    out[key] ??= issue.message;
  }
  return out;
}
