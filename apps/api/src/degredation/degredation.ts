import { Prisma } from "@prisma/client";
import { runRetry } from "./retry";

type logLevel = "debug" | "info" | "warn" | "error";

function log(level: logLevel, message: string, meta?: Record<string, unknown>) {
  const logEntry = {
    level,
    message,
    ...meta,
    timestamp: new Date().toISOString(),
  };
  console.log(JSON.stringify(logEntry));
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) =>
    log("debug", message, meta),
  info: (message: string, meta?: Record<string, unknown>) =>
    log("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) =>
    log("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) =>
    log("error", message, meta),
};

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
    // Wrap the operation with retry logic for transient errors
    return await runRetry(fn, {
      retries: 3,
      delayMs: 1000,
      maxDelayMs: 5000,
      operationName: "database-operation",
    });
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
