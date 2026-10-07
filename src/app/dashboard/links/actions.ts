"use server";

import { requireUser } from "@/lib/auth/session";
import { getRateLimiter, RATE_LIMITS } from "@/lib/rate-limit";
import type { LinkInput, LinkUpdateInput } from "@/lib/validation";
import { runAction } from "@/server/action-result";
import { ServiceError } from "@/server/errors";
import { linkService } from "@/server/services/links";

async function enforceCreateLimit(userId: string) {
  const limit = await getRateLimiter().check(RATE_LIMITS.createLink, userId);
  if (!limit.success)
    throw new ServiceError("rate_limited", "You're creating links too quickly. Try again in a minute.");
}

export async function createLinkAction(input: LinkInput) {
  return runAction(async () => {
    const user = await requireUser();
    await enforceCreateLimit(user.id);
    return linkService.create(user.id, input);
  });
}

export async function updateLinkAction(id: string, input: LinkUpdateInput) {
  return runAction(async () => linkService.update((await requireUser()).id, id, input));
}

export async function setLinkDisabledAction(id: string, disabled: boolean) {
  return runAction(async () => linkService.setDisabled((await requireUser()).id, id, disabled));
}

export async function duplicateLinkAction(id: string) {
  return runAction(async () => {
    const user = await requireUser();
    await enforceCreateLimit(user.id);
    return linkService.duplicate(user.id, id);
  });
}

export async function deleteLinkAction(id: string) {
  return runAction(async () => linkService.delete((await requireUser()).id, id));
}
