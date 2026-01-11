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

  console.log("Building database URL with:", {
    DATABASE_USERNAME,
    DATABASE_HOST,
    DATABASE_PORT,
    DATABASE_NAME,
  });

  return `postgresql://${DATABASE_USERNAME}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}?schema=public`;
}

export default {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: buildDatabaseUrl(),
    shadowDatabaseUrl: buildDatabaseUrl(),
  },
} satisfies PrismaConfig;
