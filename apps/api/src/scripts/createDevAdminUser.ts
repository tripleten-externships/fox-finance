import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Use a real Firebase UID if you have one, or a placeholder for now
  const FIREBASE_UID = "admin-dev-id-123"; 
  const email = "admin@foxfinance.com";

  console.log(`Checking for admin user: ${email}...`);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      id: FIREBASE_UID, // Mapping to the 'id' field which is your Firebase UID
      email,
      name: "System Admin",
      role: "ADMIN",
    },
  });

  console.log("Admin user ready in database:", admin.email);
}

main()
  .catch((e) => {
    console.error("Error seeding admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });