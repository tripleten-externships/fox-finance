import {
  Prisma,
  PrismaClient,
  Role,
  Status,
  UploadProcessingStatus,
  UploadStatus,
} from "@prisma/client";
import { getLogger } from "@fox-finance/config";

const logger = getLogger();

declare global {
  // Prevent multiple Prisma instances in dev (Hot Reload fix)
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Connection pool configuration
const CONNECTION_LIMIT = process.env.DB_CONNECTION_LIMIT
  ? parseInt(process.env.DB_CONNECTION_LIMIT)
  : 20;
const POOL_TIMEOUT = process.env.DB_POOL_TIMEOUT
  ? parseInt(process.env.DB_POOL_TIMEOUT)
  : 10;

// Build URL with connection pooling
const getDatabaseUrl = () => {
  const baseUrl =
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/fox-finance";
  const url = new URL(baseUrl);

  // Add pooling parameters
  url.searchParams.set("connection_limit", CONNECTION_LIMIT.toString());
  url.searchParams.set("pool_timeout", POOL_TIMEOUT.toString());
  console.log("Database URL:", url.toString());
  return url.toString();
};

export const prisma =
  global.prisma ||
  new PrismaClient({
    datasourceUrl: getDatabaseUrl(),
    log: [
      { emit: "event", level: "query" },
      { emit: "event", level: "error" },
      { emit: "event", level: "warn" },
    ],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

// Export disconnect for cleanup
export const disconnect = async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
};

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

export { Prisma, Role, Status, UploadStatus, UploadProcessingStatus };
