import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@foxfinance.com" },
    update: {},
    create: {
      email: "admin@foxfinance.com",
      name: "Dev Admin",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log("Dev Admin Created:", admin.email);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
