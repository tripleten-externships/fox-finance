import { Prisma, PrismaClient } from "@prisma/client";
import { logger } from "../degredation/degredation";

declare global {
  // Prevent multiple Prisma instances in dev (Hot Reload fix)
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: [
      { emit: "event", level: "query" },
      { emit: "event", level: "error" },
      { emit: "event", level: "warn" },
    ],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

prisma.$on("error" as never, (e: Prisma.LogEvent) => {
  logger.error("Prisma error log event", {
    target: e.target,
    message: e.message,
  });
});

prisma.$on("warn" as never, (e: Prisma.LogEvent) => {
  logger.warn("Prisma warning", {
    target: e.target,
    message: e.message,
  });
});

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
