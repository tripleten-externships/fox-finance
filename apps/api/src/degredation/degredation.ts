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

// Thrown when database is unavailable (returns 503)
export class UnavailableError extends Error {
  constructor(message: string = "Database is currently unavailable") {
    super(message);
    this.name = "UnavailableError";
  }
}

// Circuit breaker state: tracks when database is marked as down
let databaseUnavailableUntil: number | null = null;

// Marks database as unavailable for specified duration
function markDown(durationMs: number) {
  databaseUnavailableUntil = Date.now() + durationMs;
}

// Checks if circuit breaker is open (DB marked down)
function isDbDown() {
  return (
    databaseUnavailableUntil !== null && Date.now() < databaseUnavailableUntil
  );
}

// Wraps database operations with circuit breaker + retry logic
// - Fast-fails if DB marked down (10s cooldown)
// - Retries transient errors 3x with exponential backoff
export async function degradeIfDatabaseUnavailable<T>(
  fn: () => Promise<T>
): Promise<T> {
  // Fast-fail if circuit breaker is open
  if (isDbDown()) {
    throw new UnavailableError();
  }

  try {
    // Retry transient errors (deadlocks, timeouts)
    return await runRetry(fn, {
      retries: 3,
      delayMs: 1000,
      maxDelayMs: 5000,
      operationName: "database-operation",
    });
  } catch (err) {
    // Check for persistent connection errors
    const message = err instanceof Error ? err.message.toLowerCase() : "";
    const isPrismaConnectionError =
      err instanceof Prisma.PrismaClientKnownRequestError &&
      (err.code === "P1001" ||
        err.code === "P1002" ||
        err.code === "P1008" ||
        err.code === "P1017");

    if (
      isPrismaConnectionError ||
      message.includes("could not connect to server") ||
      message.includes("connection refused") ||
      message.includes("can't reach database server") || // Add this
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
      markDown(10 * 1000);
      throw new UnavailableError();
    }
    throw err;
  }
}
