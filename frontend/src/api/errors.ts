import type { ErrorResponse } from "./contract";

export type ApiErrorKind = "invalid" | "not-found" | "failed";

const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const MAX_RETRIES = 2;
const FIRST_RETRY_DELAY_MS = 500;
const GENERIC_FAILURE = "The Pokédex could not be reached.";

/** A request that did not produce a usable response, classified by what the user can do. */
export class ApiError extends Error {
  override readonly name = "ApiError";
  readonly kind: ApiErrorKind;

  constructor(kind: ApiErrorKind, message: string) {
    super(message);
    this.kind = kind;
  }
}

/** Classify an HTTP error status, keeping the API's message for invalid requests. */
export function fromStatus(status: number, body: ErrorResponse | undefined): ApiError {
  const message = body?.error.message ?? GENERIC_FAILURE;
  if (status === BAD_REQUEST) {
    return new ApiError("invalid", message);
  }
  if (status === NOT_FOUND) {
    return new ApiError("not-found", message);
  }
  return new ApiError("failed", GENERIC_FAILURE);
}

/** A network failure or a timeout, which retrying may cure. */
export function failure(): ApiError {
  return new ApiError("failed", GENERIC_FAILURE);
}

/** Retry only failures, never a client error, at most twice. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  return error instanceof ApiError && error.kind === "failed" && failureCount < MAX_RETRIES;
}

/** Exponential backoff between retries: 500 ms, then 1 s. */
export function retryDelay(attempt: number): number {
  return FIRST_RETRY_DELAY_MS * 2 ** attempt;
}
