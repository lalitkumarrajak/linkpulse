"use server";

import { requireUser } from "@/lib/auth/session";
import { runAction } from "@/server/action-result";
import { apiKeyService } from "@/server/services/api-keys";

export async function createApiKeyAction(name: string) {
  return runAction(async () => apiKeyService.create((await requireUser()).id, name));
}

export async function revokeApiKeyAction(id: string) {
  return runAction(async () => apiKeyService.revoke((await requireUser()).id, id));
}
