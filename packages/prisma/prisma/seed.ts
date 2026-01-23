import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  // Document Types to seed
  const documentTypes = [
    {
      name: "Government-issued ID",
      description: "Driver's license, passport, or state ID",
    },
    {
      name: "Passport",
      description: "Valid passport document for identification",
    },
    {
      name: "Proof of Address",
      description: "Document showing current residential address",
    },
    {
      name: "Tax Documentation",
      description: "Tax-related documents and forms",
    },
    {
      name: "Bank Statement",
      description: "Recent bank account statement",
    },
    {
      name: "Pay Stub",
      description: "Recent pay stub or income verification",
    },
    {
      name: "Utility Bill",
      description: "Recent utility bill as proof of address",
    },
    {
      name: "Tax Return",
      description: "Complete tax return documentation",
    },
  ];

  // Seed DocumentType table
  console.log("Seeding DocumentType table...");
  for (const docType of documentTypes) {
    await prisma.documentType.upsert({
      where: { name: docType.name },
      update: {
        description: docType.description,
      },
      create: {
        name: docType.name,
        description: docType.description,
      },
    });
    console.log(`Created/Updated: ${docType.name}`);
  }

  // Fake clients for testing (mix of business clients and individual clients)
  const clients = [
    {
      email: "john.smith@example.com",
      firstName: "John",
      lastName: "Smith",
      company: "Smith Consulting LLC", // Business client
      phone: "+1-555-0101",
      status: "ACTIVE" as const,
    },
    {
      email: "sarah.johnson@example.com",
      firstName: "Sarah",
      lastName: "Johnson",
      company: "Johnson & Associates", // Business client
      phone: "+1-555-0102",
      status: "ACTIVE" as const,
    },
    {
      email: "michael.chen@example.com",
      firstName: "Michael",
      lastName: "Chen",
      company: "Tech Innovations Inc", // Business client
      phone: "+1-555-0103",
      status: "ACTIVE" as const,
    },
    {
      email: "emma.davis@example.com",
      firstName: "Emma",
      lastName: "Davis",
      company: "Davis Financial Services", // Business client
      phone: "+1-555-0104",
      status: "ACTIVE" as const,
    },
    {
      email: "robert.wilson@example.com",
      firstName: "Robert",
      lastName: "Wilson",
      // No company - Individual client
      phone: "+1-555-0105",
      status: "ACTIVE" as const,
    },
    {
      email: "lisa.martinez@example.com",
      firstName: "Lisa",
      lastName: "Martinez",
      // No company - Individual client
      phone: "+1-555-0106",
      status: "ACTIVE" as const,
    },
    {
      email: "david.brown@example.com",
      firstName: "David",
      lastName: "Brown",
      // No company - Individual client
      phone: "+1-555-0107",
      status: "INACTIVE" as const,
    },
  ];

  // Seed Client table
  console.log("Seeding Client table...");
  for (const client of clients) {
    await prisma.client.upsert({
      where: { email: client.email },
      update: {
        firstName: client.firstName,
        lastName: client.lastName,
        company: client.company,
        phone: client.phone,
        status: client.status,
      },
      create: {
        email: client.email,
        firstName: client.firstName,
        lastName: client.lastName,
        company: client.company,
        phone: client.phone,
        status: client.status,
      },
    });
    const clientType = client.company ? `${client.company}` : "Individual";
    console.log(
      `Created/Updated: ${client.firstName} ${client.lastName} (${clientType})`,
    );
  }

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
