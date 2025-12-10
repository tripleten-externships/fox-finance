import { Prisma } from "@prisma/client";
import { logger } from "./degredation";

// Retries transient database errors with exponential backoff (1s, 2s, 4s)
export async function runRetry<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number;
    delayMs?: number;
    maxDelayMs?: number;
    operationName?: string;
  } = {}
): Promise<T> {
  const {
    retries = 3,
    delayMs = 1000,
    maxDelayMs = 5000,
    operationName = "unknown-operation",
  } = options;
  let attempt = 0;
  let previousError: unknown;

  while (attempt <= retries) {
    try {
      // Attempt the operation
      return await fn();
    } catch (err) {
      previousError = err;
      attempt++;

      // Check if this is a transient error worth retrying
      const isTransient = isTransientError(err);

      logger.error("Database operation failed", {
        operationName,
        attempt,
        transient: isTransient,
        error: err instanceof Error ? err.message : String(err),
      });

      // Don't retry if error is not transient or we've exhausted retries
      if (!isTransient || attempt > retries) {
        throw err;
      }

      // Calculate exponential backoff delay: delayMs * 2^(attempt-1)
      // e.g., with delayMs=1000: 1s, 2s, 4s, 8s...
      const delay = Math.min(delayMs * 2 ** (attempt - 1), maxDelayMs);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw previousError;
}

// Checks if error is transient (deadlocks, timeouts) and worth retrying
function isTransientError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const pgCode = (err.meta?.code ?? err.meta?.db_error_code) as
      | string
      | undefined;

    // 40001 = deadlock, 40P01 = serialization failure
    if (pgCode === "40001" || pgCode === "40P01") {
      return true;
    }
    return false;
  }

  if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    const message = String(err.message || "").toLowerCase();
    if (
      message.includes("connection closed") ||
      message.includes("timeout") ||
      message.includes("connection refused") ||
      message.includes("network error") ||
      message.includes("temporarily unavailable") ||
      message.includes("terminated")
    ) {
      return true;
    }
  }

  if (err instanceof Error) {
    const message = err.message.toLowerCase();
    if (
      message.includes("deadlock detected") ||
      message.includes("sterilization failure") ||
      message.includes("connection timeout") ||
      message.includes("connection reset") ||
      message.includes("network unreachable")
    ) {
      return true;
    }
  }
  return false;
}
