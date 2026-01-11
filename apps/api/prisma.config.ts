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

  return `postgresql://${DATABASE_USERNAME}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}`;
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
