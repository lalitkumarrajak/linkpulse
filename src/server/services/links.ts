import type { Link, Prisma, PrismaClient } from "@/generated/prisma/client";
import { shortUrlFor } from "@/lib/app-url";
import { hashPassword } from "@/lib/auth/password";
import { db as defaultDb } from "@/lib/db";
import { generateSlug, validateSlug } from "@/lib/slug";
import {
  fieldErrors,
  linkInputSchema,
  linkUpdateSchema,
  type LinkInput,
  type LinkListQuery,
} from "@/lib/validation";
import { isUniqueViolation, ServiceError } from "../errors";

export type LinkStatus = "active" | "disabled" | "expired";

export interface LinkDTO {
  id: string;
  slug: string;
  shortUrl: string;
  url: string;
  title: string | null;
  tags: string[];
  hasPassword: boolean;
  expiresAt: string | null;
  disabled: boolean;
  status: LinkStatus;
  clickCount: number;
  lastClickedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function linkStatus(link: Pick<Link, "disabled" | "expiresAt">, now = new Date()): LinkStatus {
  if (link.disabled) return "disabled";
  if (link.expiresAt && link.expiresAt <= now) return "expired";
  return "active";
}

export function toLinkDTO(link: Link): LinkDTO {
  return {
    id: link.id,
    slug: link.slug,
    shortUrl: shortUrlFor(link.slug),
    url: link.url,
    title: link.title,
    tags: link.tags,
    hasPassword: Boolean(link.passwordHash),
    expiresAt: link.expiresAt?.toISOString() ?? null,
    disabled: link.disabled,
    status: linkStatus(link),
    clickCount: link.clickCount,
    lastClickedAt: link.lastClickedAt?.toISOString() ?? null,
    createdAt: link.createdAt.toISOString(),
    updatedAt: link.updatedAt.toISOString(),
  };
}

function statusWhere(status: LinkListQuery["status"], now: Date): Prisma.LinkWhereInput {
  switch (status) {
    case "active":
      return { disabled: false, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] };
    case "disabled":
      return { disabled: true };
    case "expired":
      return { disabled: false, expiresAt: { lte: now } };
    default:
      return {};
  }
}

function orderBy(query: LinkListQuery): Prisma.LinkOrderByWithRelationInput[] {
  const { sort, order } = query;
  const primary: Prisma.LinkOrderByWithRelationInput =
    sort === "title" || sort === "lastClickedAt"
      ? { [sort]: { sort: order, nulls: "last" } }
      : { [sort]: order };
  return [primary, { id: "desc" }];
}

export class LinkService {
  constructor(private readonly db: PrismaClient = defaultDb) {}

  async list(userId: string, query: LinkListQuery) {
    const now = new Date();
    const where: Prisma.LinkWhereInput = {
      userId,
      ...statusWhere(query.status, now),
      ...(query.tag ? { tags: { has: query.tag } } : {}),
      ...(query.q
        ? {
            AND: [
              {
                OR: [
                  { title: { contains: query.q, mode: "insensitive" } },
                  { slug: { contains: query.q, mode: "insensitive" } },
                  { url: { contains: query.q, mode: "insensitive" } },
                ],
              },
            ],
          }
        : {}),
    };
    const [rows, total] = await this.db.$transaction([
      this.db.link.findMany({
        where,
        orderBy: orderBy(query),
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.db.link.count({ where }),
    ]);
    return {
      rows: rows.map(toLinkDTO),
      total,
      page: query.page,
      pageSize: query.pageSize,
      pageCount: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  }

  async tags(userId: string): Promise<string[]> {
    const rows = await this.db.$queryRaw<{ tag: string }[]>`
      SELECT DISTINCT unnest("tags") AS tag FROM "Link" WHERE "userId" = ${userId} ORDER BY tag`;
    return rows.map((r) => r.tag);
  }

  async get(userId: string, id: string): Promise<LinkDTO> {
    return toLinkDTO(await this.findOwned(userId, id));
  }

  async isSlugAvailable(slug: string) {
    const validation = validateSlug(slug);
    if (!validation.valid) return { available: false, reason: validation.reason };
    const existing = await this.db.link.findUnique({ where: { slug }, select: { id: true } });
    return existing ? { available: false, reason: "This alias is already taken" } : { available: true };
  }

  async create(userId: string, input: LinkInput): Promise<LinkDTO> {
    const parsed = linkInputSchema.safeParse(input);
    if (!parsed.success)
      throw new ServiceError("validation_error", "Invalid link", fieldErrors(parsed.error));
    const data = parsed.data;
    const base = {
      userId,
      url: data.url,
      title: data.title,
      tags: data.tags,
      expiresAt: data.expiresAt ?? null,
      passwordHash: data.password ? await hashPassword(data.password, 10) : null,
    };

    if (data.slug) {
      try {
        return toLinkDTO(await this.db.link.create({ data: { ...base, slug: data.slug } }));
      } catch (error) {
        if (isUniqueViolation(error))
          throw new ServiceError("conflict", "This alias is already taken", {
            slug: "This alias is already taken",
          });
        throw error;
      }
    }

    // Random slugs: retry on the (astronomically rare) collision, growing length each time.
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const slug = generateSlug(7 + attempt);
        return toLinkDTO(await this.db.link.create({ data: { ...base, slug } }));
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;
      }
    }
    throw new Error("Could not generate a unique slug");
  }

  async update(userId: string, id: string, input: unknown): Promise<LinkDTO> {
    await this.findOwned(userId, id);
    const parsed = linkUpdateSchema.safeParse(input);
    if (!parsed.success)
      throw new ServiceError("validation_error", "Invalid link", fieldErrors(parsed.error));
    const { password, ...rest } = parsed.data;
    const data: Prisma.LinkUpdateInput = {
      ...(rest.url !== undefined && { url: rest.url }),
      ...(rest.slug !== undefined && { slug: rest.slug }),
      ...(rest.title !== undefined && { title: rest.title }),
      ...(rest.tags !== undefined && { tags: rest.tags }),
      ...(rest.expiresAt !== undefined && { expiresAt: rest.expiresAt }),
      ...(rest.disabled !== undefined && { disabled: rest.disabled }),
    };
    if (password !== undefined) data.passwordHash = password ? await hashPassword(password, 10) : null;
    try {
      return toLinkDTO(await this.db.link.update({ where: { id }, data }));
    } catch (error) {
      if (isUniqueViolation(error))
        throw new ServiceError("conflict", "This alias is already taken", {
          slug: "This alias is already taken",
        });
      throw error;
    }
  }

  async setDisabled(userId: string, id: string, disabled: boolean) {
    await this.findOwned(userId, id);
    return toLinkDTO(await this.db.link.update({ where: { id }, data: { disabled } }));
  }

  async duplicate(userId: string, id: string): Promise<LinkDTO> {
    const source = await this.findOwned(userId, id);
    const copy = await this.create(userId, {
      url: source.url,
      title: source.title ? `${source.title} (copy)`.slice(0, 120) : null,
      tags: source.tags,
      expiresAt: source.expiresAt && source.expiresAt > new Date() ? source.expiresAt : null,
    });
    if (source.passwordHash) {
      await this.db.link.update({ where: { id: copy.id }, data: { passwordHash: source.passwordHash } });
      return { ...copy, hasPassword: true };
    }
    return copy;
  }

  async delete(userId: string, id: string) {
    await this.findOwned(userId, id);
    await this.db.link.delete({ where: { id } });
  }

  /** Minimal lookup used by the redirect hot path. */
  resolve(slug: string) {
    return this.db.link.findUnique({
      where: { slug },
      select: { id: true, url: true, disabled: true, expiresAt: true, passwordHash: true, title: true },
    });
  }

  private async findOwned(userId: string, id: string) {
    const link = await this.db.link.findFirst({ where: { id, userId } });
    if (!link) throw new ServiceError("not_found", "Link not found");
    return link;
  }
}

export const linkService = new LinkService();
