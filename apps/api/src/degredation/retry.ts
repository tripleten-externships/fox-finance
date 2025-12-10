import { Prisma } from "@prisma/client";
import { logger } from "./degredation";

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
      return await fn();
    } catch (err) {
      previousError = err;
      attempt++;

      const isTransient = isTransientError(err);

      logger.error("Database operation failed", {
        operationName,
        attempt,
        transient: isTransient,
        error: err instanceof Error ? err.message : String(err),
      });

      if (!isTransient || attempt > retries) {
        throw err;
      }
      const delay = Math.min(delayMs * 2 ** (attempt - 1), maxDelayMs);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw previousError;
}

function isTransientError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const pgCode = (err.meta?.code ?? err.meta?.db_error_code) as
      | string
      | undefined;

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
