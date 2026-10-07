import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { UnauthorizedError } from "@/lib/auth/session";
import { fieldErrors } from "@/lib/validation";
import { ServiceError } from "./errors";

export interface ApiErrorBody {
  error: { code: string; message: string; fields?: Record<string, string> };
}

export function jsonError(
  status: number,
  code: string,
  message: string,
  init?: { headers?: Record<string, string>; fields?: Record<string, string> },
) {
  return NextResponse.json<ApiErrorBody>(
    { error: { code, message, ...(init?.fields && { fields: init.fields }) } },
    { status, headers: init?.headers },
  );
}

/** Maps thrown errors to consistent JSON error responses. */
export function handleRouteError(error: unknown, headers?: Record<string, string>) {
  if (error instanceof ServiceError)
    return jsonError(error.status, error.code, error.message, { headers, fields: error.fields });
  if (error instanceof UnauthorizedError)
    return jsonError(401, "unauthorized", "Authentication required", { headers });
  if (error instanceof ZodError)
    return jsonError(422, "validation_error", "Invalid request", {
      headers,
      fields: fieldErrors(error),
    });
  if (error instanceof SyntaxError)
    return jsonError(400, "invalid_json", "Request body must be valid JSON", { headers });
  console.error(error);
  return jsonError(500, "internal_error", "Something went wrong", { headers });
}
