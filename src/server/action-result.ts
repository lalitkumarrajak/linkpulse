import { UnauthorizedError } from "@/lib/auth/session";
import { ServiceError } from "./errors";

export type ActionResult<T = void> =
  { ok: true; data: T } | { ok: false; error: string; fields?: Record<string, string> };

/** Runs a server-action body and converts domain errors into a serialisable result. */
export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    if (error instanceof ServiceError) return { ok: false, error: error.message, fields: error.fields };
    if (error instanceof UnauthorizedError)
      return { ok: false, error: "Your session has expired. Please sign in again." };
    console.error(error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
