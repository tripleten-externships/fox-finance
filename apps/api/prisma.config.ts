import "dotenv/config";
import type { PrismaConfig } from "prisma";
import { env } from "prisma/config";

console.log("Prisma config - DATABASE_URL:", env("DATABASE_URL"));

export default {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
} satisfies PrismaConfig;
