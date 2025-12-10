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
