import type { PrismaClient } from "@/generated/prisma/client";
import { generateApiKey, hashApiKey } from "@/lib/api-key";
import { db as defaultDb } from "@/lib/db";
import { apiKeyNameSchema } from "@/lib/validation";
import { ServiceError } from "../errors";

const MAX_KEYS_PER_USER = 10;

export interface ApiKeyDTO {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export class ApiKeyService {
  constructor(private readonly db: PrismaClient = defaultDb) {}

  async list(userId: string): Promise<ApiKeyDTO[]> {
    const keys = await this.db.apiKey.findMany({
      where: { userId, revokedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return keys.map((k) => ({
      id: k.id,
      name: k.name,
      prefix: k.prefix,
      lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
      createdAt: k.createdAt.toISOString(),
    }));
  }

  /** Creates a key. The plaintext secret is returned exactly once and never stored. */
  async create(userId: string, rawName: string) {
    const name = apiKeyNameSchema.safeParse(rawName);
    if (!name.success) throw new ServiceError("validation_error", name.error.issues[0]!.message);
    const active = await this.db.apiKey.count({ where: { userId, revokedAt: null } });
    if (active >= MAX_KEYS_PER_USER)
      throw new ServiceError("forbidden", `You can have at most ${MAX_KEYS_PER_USER} active keys`);
    const { key, prefix, hash } = generateApiKey();
    const record = await this.db.apiKey.create({
      data: { userId, name: name.data, prefix, keyHash: hash },
    });
    return { key, id: record.id, name: record.name, prefix };
  }

  async revoke(userId: string, id: string) {
    const { count } = await this.db.apiKey.updateMany({
      where: { id, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (count === 0) throw new ServiceError("not_found", "API key not found");
  }

  /** Resolves a plaintext key to its owner. Returns null for unknown or revoked keys. */
  async authenticate(key: string) {
    const record = await this.db.apiKey.findUnique({
      where: { keyHash: hashApiKey(key) },
      select: { id: true, userId: true, revokedAt: true, lastUsedAt: true },
    });
    if (!record || record.revokedAt) return null;
    // Avoid a write on every request: only bump lastUsedAt once per minute.
    if (!record.lastUsedAt || Date.now() - record.lastUsedAt.getTime() > 60_000) {
      await this.db.apiKey.update({ where: { id: record.id }, data: { lastUsedAt: new Date() } });
    }
    return { keyId: record.id, userId: record.userId };
  }
}

export const apiKeyService = new ApiKeyService();
