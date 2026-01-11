import "dotenv/config";
import type { PrismaConfig } from "prisma";

function buildDatabaseUrl() {
  const {
    DATABASE_USERNAME,
    DATABASE_PASSWORD,
    DATABASE_HOST,
    DATABASE_PORT,
    DATABASE_NAME,
  } = process.env;

  if (
    !DATABASE_USERNAME ||
    !DATABASE_PASSWORD ||
    !DATABASE_HOST ||
    !DATABASE_NAME
  ) {
    throw new Error(
      "Missing one of DATABASE_USERNAME/DATABASE_PASSWORD/DATABASE_HOST/DATABASE_NAME"
    );
  }

  const u = new URL("postgresql://");
  u.username = DATABASE_USERNAME; // auto-encodes reserved chars
  u.password = DATABASE_PASSWORD; // auto-encodes reserved chars
  u.hostname = DATABASE_HOST;
  u.port = DATABASE_PORT ?? "5432";
  u.pathname = `/${DATABASE_NAME}`;

  return u.toString();
}

export default {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: buildDatabaseUrl(),
  },
} satisfies PrismaConfig;
