import { expect, test } from "vitest";

import { ApiError, fromStatus, retryDelay, shouldRetry } from "./errors";

test("only failures are retried, at most twice", () => {
  const failed = new ApiError("failed", "down");
  expect(shouldRetry(0, failed)).toBe(true);
  expect(shouldRetry(1, failed)).toBe(true);
  expect(shouldRetry(2, failed)).toBe(false);
  expect(shouldRetry(0, new ApiError("invalid", "too short"))).toBe(false);
  expect(shouldRetry(0, new ApiError("not-found", "missing"))).toBe(false);
  expect(shouldRetry(0, new Error("unknown"))).toBe(false);
});

test("retries back off exponentially", () => {
  expect([0, 1].map(retryDelay)).toEqual([500, 1000]);
});

test("an error status without a body falls back to a generic message", () => {
  expect(fromStatus(400, undefined).message).toBe("The Pokédex could not be reached.");
  expect(fromStatus(503, undefined).kind).toBe("failed");
});
