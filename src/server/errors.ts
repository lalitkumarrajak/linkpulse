export type ServiceErrorCode =
  "validation_error" | "not_found" | "conflict" | "rate_limited" | "unauthorized" | "forbidden";

const STATUS: Record<ServiceErrorCode, number> = {
  validation_error: 422,
  not_found: 404,
  conflict: 409,
  rate_limited: 429,
  unauthorized: 401,
  forbidden: 403,
};

/** Domain error thrown by services and mapped to HTTP / action responses at the edges. */
export class ServiceError extends Error {
  constructor(
    public readonly code: ServiceErrorCode,
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ServiceError";
  }

  get status() {
    return STATUS[this.code];
  }
}

export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}
