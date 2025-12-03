import { Prisma } from "@prisma/client";
import { logger } from "./logger";

export class UnavailableError extends Error {
  constructor(message: string = "Database is currently unavailable") {
    super(message);
    this.name = "UnavailableError";
  }
}

let databaseUnavailableUntil: number | null = null;

function markDown(durationMs: number) {
  databaseUnavailableUntil = Date.now() + durationMs;
}

function isDbDown() {
  return (
    databaseUnavailableUntil !== null && Date.now() < databaseUnavailableUntil
  );
}

export async function degradeIfDatabaseUnavailable<T>(
  fn: () => Promise<T>
): Promise<T> {
  if (isDbDown()) {
    throw new UnavailableError();
  }

  try {
    return await fn();
  } catch (err) {
    const message = err instanceof Error ? err.message.toLowerCase() : "";
    if (
      message.includes("could not connect to server") ||
      message.includes("connection refused") ||
      message.includes("database is down") ||
      message.includes("timeout") ||
      message.includes("too many connections")
    ) {
      logger.error(
        "Database connection error detected, marking as unavailable",
        {
          originalError: err,
        }
      );
      markDown(10 * 1000); // Mark as down for 10 seconds
      throw new UnavailableError();
    }
    throw err;
  }
}
