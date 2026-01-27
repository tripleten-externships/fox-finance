import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

// Secret for JWT tokens - use environment variable or default for development
const UPLOAD_TOKEN_SECRET =
  process.env.UPLOAD_TOKEN_SECRET ||
  "your-secret-key-here-change-in-production";

async function main() {
  console.log("Starting database seed...");

  // ============================================================================
  // ENVIRONMENT CHECK - Prevent seeding in production
  // ============================================================================
  const nodeEnv = process.env.NODE_ENV?.toLowerCase();
  const isProduction = nodeEnv === "production" || nodeEnv === "prod";

  if (isProduction) {
    console.log("⚠️  Seed script is disabled in production environment");
    process.exit(0);
  }

  console.log("✓ Environment check passed, seeding data...");

  // ============================================================================
  // ADMIN USER
  // ============================================================================
  console.log("Seeding Admin User...");

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@fox-finance.net" },
    update: {
      name: "Ferris Bueller",
      role: "ADMIN",
    },
    create: {
      id: "vxdBr2T4C8QwMF7GbFus9pAKAB52",
      email: "admin@fox-finance.net",
      name: "Ferris Bueller",
      role: "ADMIN",
      createdAt: new Date("2026-01-23T22:10:46.286Z"),
    },
  });
  console.log(`✓ Admin user seeded: ${adminUser.email}`);

  // ============================================================================
  // DOCUMENT TYPES
  // ============================================================================

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
      phone: "9195550101",
      status: "ACTIVE" as const,
    },
    {
      email: "sarah.johnson@example.com",
      firstName: "Sarah",
      lastName: "Johnson",
      company: "Johnson & Associates", // Business client
      phone: "9195550102",
      status: "ACTIVE" as const,
    },
    {
      email: "michael.chen@example.com",
      firstName: "Michael",
      lastName: "Chen",
      company: "Tech Innovations Inc", // Business client
      phone: "9195550103",
      status: "ACTIVE" as const,
    },
    {
      email: "emma.davis@example.com",
      firstName: "Emma",
      lastName: "Davis",
      company: "Davis Financial Services", // Business client
      phone: "9195550104",
      status: "ACTIVE" as const,
    },
    {
      email: "robert.wilson@example.com",
      firstName: "Robert",
      lastName: "Wilson",
      // No company - Individual client
      phone: "9195550105",
      status: "ACTIVE" as const,
    },
    {
      email: "lisa.martinez@example.com",
      firstName: "Lisa",
      lastName: "Martinez",
      // No company - Individual client
      phone: "9195550106",
      status: "ACTIVE" as const,
    },
    {
      email: "david.brown@example.com",
      firstName: "David",
      lastName: "Brown",
      // No company - Individual client
      phone: "9195550107",
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

  // ============================================================================
  // UPLOAD LINKS, DOCUMENT REQUESTS, AND UPLOADS
  // ============================================================================

  // Fetch seeded clients and document types to reference them
  const seededClients = await prisma.client.findMany();
  const seededDocTypes = await prisma.documentType.findMany();

  // Helper function to get document type ID by name
  const getDocTypeId = (name: string) => {
    const docType = seededDocTypes.find((dt) => dt.name === name);
    if (!docType) throw new Error(`Document type "${name}" not found`);
    return docType.id;
  };

  // Helper function to generate JWT auth token
  const generateToken = (uploadLinkId: string, clientId: string) => {
    return jwt.sign(
      {
        uploadLinkId,
        clientId,
        type: "auth",
      },
      UPLOAD_TOKEN_SECRET,
      // No expiration - the auth token is permanently valid
      // Upload link expiration in DB controls validity
    );
  };

  // Upload Links with varied statuses and expiration dates
  console.log("Seeding UploadLink table...");

  const uploadLinksData = [
    {
      clientEmail: "john.smith@example.com",
      uniqueIdentifier: "active-link-john-2026",
      expiresAt: new Date("2026-03-01"), // Future date - active
      isActive: true,
      instructions:
        "Please upload your government ID and proof of address for account verification.",
    },
    {
      clientEmail: "sarah.johnson@example.com",
      uniqueIdentifier: "active-link-sarah-2026",
      expiresAt: new Date("2026-02-15"), // Future date - active
      isActive: true,
      instructions:
        "Please provide tax documentation and bank statements for the past 3 months.",
    },
    {
      clientEmail: "michael.chen@example.com",
      uniqueIdentifier: "expired-link-michael",
      expiresAt: new Date("2025-12-31"), // Past date - expired
      isActive: false,
      instructions:
        "Upload your business registration documents and financial statements.",
    },
    {
      clientEmail: "emma.davis@example.com",
      uniqueIdentifier: "active-link-emma-2026",
      expiresAt: new Date("2026-04-01"), // Future date - active
      isActive: true,
      instructions: "Please upload your passport and recent utility bill.",
    },
    {
      clientEmail: "robert.wilson@example.com",
      uniqueIdentifier: "inactive-link-robert",
      expiresAt: new Date("2026-05-01"), // Future but inactive
      isActive: false,
      instructions: "Upload proof of income and tax returns for verification.",
    },
  ];

  const uploadLinks: any[] = [];
  for (const linkData of uploadLinksData) {
    const client = seededClients.find((c) => c.email === linkData.clientEmail);
    if (!client) {
      console.error(`Client with email ${linkData.clientEmail} not found`);
      continue;
    }

    // First, try to find existing upload link by checking if any exist for this client with similar expiry
    const existingLink = await prisma.uploadLink.findFirst({
      where: {
        clientId: client.id,
        expiresAt: linkData.expiresAt,
      },
    });

    let uploadLink;
    if (existingLink) {
      // Update existing link
      const jwtToken = generateToken(existingLink.id, client.id);
      uploadLink = await prisma.uploadLink.update({
        where: { id: existingLink.id },
        data: {
          token: jwtToken,
          expiresAt: linkData.expiresAt,
          isActive: linkData.isActive,
        },
      });
    } else {
      // Create new link with temporary token first
      const tempLink = await prisma.uploadLink.create({
        data: {
          clientId: client.id,
          token: `temp-${linkData.uniqueIdentifier}`,
          expiresAt: linkData.expiresAt,
          isActive: linkData.isActive,
          createdById: null,
        },
      });

      // Generate JWT token with the actual uploadLinkId
      const jwtToken = generateToken(tempLink.id, client.id);

      // Update with the proper JWT token
      uploadLink = await prisma.uploadLink.update({
        where: { id: tempLink.id },
        data: { token: jwtToken },
      });
    }

    uploadLinks.push({
      ...uploadLink,
      instructions: linkData.instructions,
      uniqueIdentifier: linkData.uniqueIdentifier,
    });
    console.log(
      `Created/Updated UploadLink for ${client.firstName} ${client.lastName} (ID: ${uploadLink.id})`,
    );
  }

  // ============================================================================
  // DOCUMENT REQUESTS AND REQUESTED DOCUMENTS
  // ============================================================================

  console.log("Seeding DocumentRequest and RequestedDocument tables...");

  // Document requests for each upload link
  const documentRequestsData = [
    {
      // John Smith - Active link with complete uploads
      uniqueIdentifier: "active-link-john-2026",
      instructions: "Please upload clear photos of both sides of your ID",
      status: "COMPLETE" as const,
      requestedDocs: [
        {
          docType: "Government-issued ID",
          description: "Front and back of driver's license",
        },
        {
          docType: "Proof of Address",
          description: "Recent utility bill or bank statement",
        },
      ],
    },
    {
      // Sarah Johnson - Active link with partial uploads
      uniqueIdentifier: "active-link-sarah-2026",
      instructions: "Tax documentation needed for compliance",
      status: "INCOMPLETE" as const,
      requestedDocs: [
        { docType: "Tax Return", description: "2025 tax return documents" },
        {
          docType: "Bank Statement",
          description: "Last 3 months of statements",
        },
        { docType: "Pay Stub", description: "Recent pay stubs" },
      ],
    },
    {
      // Michael Chen - Expired link with some uploads
      uniqueIdentifier: "expired-link-michael",
      instructions: "Business verification documents",
      status: "INCOMPLETE" as const,
      requestedDocs: [
        { docType: "Government-issued ID", description: "Business owner ID" },
        { docType: "Tax Documentation", description: "Business tax documents" },
      ],
    },
    {
      // Emma Davis - Active link with complete uploads
      uniqueIdentifier: "active-link-emma-2026",
      instructions: "International travel documentation",
      status: "COMPLETE" as const,
      requestedDocs: [
        { docType: "Passport", description: "Valid passport with photo page" },
        { docType: "Utility Bill", description: "Proof of current address" },
      ],
    },
    {
      // Robert Wilson - Inactive link, no uploads yet
      uniqueIdentifier: "inactive-link-robert",
      instructions: "Income verification documents",
      status: "INCOMPLETE" as const,
      requestedDocs: [
        { docType: "Pay Stub", description: "Last 2 pay stubs" },
        { docType: "Tax Return", description: "Most recent tax return" },
      ],
    },
  ];

  const documentRequests: any[] = [];
  for (const reqData of documentRequestsData) {
    const uploadLink = uploadLinks.find(
      (ul) => ul.uniqueIdentifier === reqData.uniqueIdentifier,
    );
    if (!uploadLink) {
      console.error(
        `UploadLink with identifier ${reqData.uniqueIdentifier} not found`,
      );
      continue;
    }

    // Create DocumentRequest
    const docRequest = await prisma.documentRequest.create({
      data: {
        uploadLinkId: uploadLink.id,
        instructions: reqData.instructions,
        status: reqData.status,
      },
    });

    // Create RequestedDocuments for this request
    for (const reqDoc of reqData.requestedDocs) {
      await prisma.requestedDocument.create({
        data: {
          documentTypeId: getDocTypeId(reqDoc.docType),
          description: reqDoc.description,
          documentRequestId: docRequest.id,
        },
      });
    }

    documentRequests.push({
      ...docRequest,
      uploadLinkId: uploadLink.id,
      uniqueIdentifier: reqData.uniqueIdentifier,
    });
    console.log(
      `Created DocumentRequest for ${reqData.uniqueIdentifier} with ${reqData.requestedDocs.length} requested documents`,
    );
  }

  // ============================================================================
  // UPLOADS (DUMMY FILES)
  // ============================================================================

  console.log("Seeding Upload table...");

  const uploadsData = [
    // John Smith - Complete uploads
    {
      uniqueIdentifier: "active-link-john-2026",
      fileName: "drivers-license-front.jpg",
      fileSize: 2458624, // ~2.4 MB
      fileType: "image/jpeg",
      s3Key: "uploads/john-smith/drivers-license-front.jpg",
      s3Bucket: "fox-finance-uploads-test",
      metadata: {
        uploadedBy: "john.smith@example.com",
        description: "Front of driver's license",
      },
    },
    {
      uniqueIdentifier: "active-link-john-2026",
      fileName: "drivers-license-back.jpg",
      fileSize: 2351488, // ~2.2 MB
      fileType: "image/jpeg",
      s3Key: "uploads/john-smith/drivers-license-back.jpg",
      s3Bucket: "fox-finance-uploads-test",
      metadata: {
        uploadedBy: "john.smith@example.com",
        description: "Back of driver's license",
      },
    },
    {
      uniqueIdentifier: "active-link-john-2026",
      fileName: "utility-bill-jan-2026.pdf",
      fileSize: 1048576, // 1 MB
      fileType: "application/pdf",
      s3Key: "uploads/john-smith/utility-bill-jan-2026.pdf",
      s3Bucket: "fox-finance-uploads-test",
      metadata: {
        uploadedBy: "john.smith@example.com",
        description: "Electricity bill for January 2026",
      },
    },

    // Sarah Johnson - Partial uploads
    {
      uniqueIdentifier: "active-link-sarah-2026",
      fileName: "bank-statement-nov-2025.pdf",
      fileSize: 856432,
      fileType: "application/pdf",
      s3Key: "uploads/sarah-johnson/bank-statement-nov-2025.pdf",
      s3Bucket: "fox-finance-uploads-test",
      metadata: {
        uploadedBy: "sarah.johnson@example.com",
        description: "Bank statement November 2025",
      },
    },
    {
      uniqueIdentifier: "active-link-sarah-2026",
      fileName: "bank-statement-dec-2025.pdf",
      fileSize: 923648,
      fileType: "application/pdf",
      s3Key: "uploads/sarah-johnson/bank-statement-dec-2025.pdf",
      s3Bucket: "fox-finance-uploads-test",
      metadata: {
        uploadedBy: "sarah.johnson@example.com",
        description: "Bank statement December 2025",
      },
    },
    {
      uniqueIdentifier: "active-link-sarah-2026",
      fileName: "pay-stub-jan-2026.pdf",
      fileSize: 456789,
      fileType: "application/pdf",
      s3Key: "uploads/sarah-johnson/pay-stub-jan-2026.pdf",
      s3Bucket: "fox-finance-uploads-test",
      metadata: {
        uploadedBy: "sarah.johnson@example.com",
        description: "Pay stub January 2026",
      },
    },

    // Michael Chen - Some uploads (expired link)
    {
      uniqueIdentifier: "expired-link-michael",
      fileName: "passport-photo-page.jpg",
      fileSize: 3145728, // 3 MB
      fileType: "image/jpeg",
      s3Key: "uploads/michael-chen/passport-photo-page.jpg",
      s3Bucket: "fox-finance-uploads-test",
      metadata: {
        uploadedBy: "michael.chen@example.com",
        description: "Passport photo page",
      },
    },
    {
      uniqueIdentifier: "expired-link-michael",
      fileName: "business-tax-2025.pdf",
      fileSize: 5242880, // 5 MB
      fileType: "application/pdf",
      s3Key: "uploads/michael-chen/business-tax-2025.pdf",
      s3Bucket: "fox-finance-uploads-test",
      metadata: {
        uploadedBy: "michael.chen@example.com",
        description: "Business tax return 2025",
      },
    },

    // Emma Davis - Complete uploads
    {
      uniqueIdentifier: "active-link-emma-2026",
      fileName: "passport-scan.pdf",
      fileSize: 4194304, // 4 MB
      fileType: "application/pdf",
      s3Key: "uploads/emma-davis/passport-scan.pdf",
      s3Bucket: "fox-finance-uploads-test",
      metadata: {
        uploadedBy: "emma.davis@example.com",
        description: "Full passport scan",
      },
    },
    {
      uniqueIdentifier: "active-link-emma-2026",
      fileName: "water-bill-jan-2026.pdf",
      fileSize: 654321,
      fileType: "application/pdf",
      s3Key: "uploads/emma-davis/water-bill-jan-2026.pdf",
      s3Bucket: "fox-finance-uploads-test",
      metadata: {
        uploadedBy: "emma.davis@example.com",
        description: "Water utility bill January 2026",
      },
    },

    // Additional varied uploads
    {
      uniqueIdentifier: "active-link-john-2026",
      fileName: "supplemental-doc.png",
      fileSize: 1572864, // ~1.5 MB
      fileType: "image/png",
      s3Key: "uploads/john-smith/supplemental-doc.png",
      s3Bucket: "fox-finance-uploads-test",
      metadata: {
        uploadedBy: "john.smith@example.com",
        description: "Additional documentation",
      },
    },
    {
      uniqueIdentifier: "active-link-sarah-2026",
      fileName: "w2-form-2025.pdf",
      fileSize: 789456,
      fileType: "application/pdf",
      s3Key: "uploads/sarah-johnson/w2-form-2025.pdf",
      s3Bucket: "fox-finance-uploads-test",
      metadata: {
        uploadedBy: "sarah.johnson@example.com",
        description: "W-2 tax form 2025",
      },
    },
    {
      uniqueIdentifier: "expired-link-michael",
      fileName: "business-license.jpg",
      fileSize: 2097152, // 2 MB
      fileType: "image/jpeg",
      s3Key: "uploads/michael-chen/business-license.jpg",
      s3Bucket: "fox-finance-uploads-test",
      metadata: {
        uploadedBy: "michael.chen@example.com",
        description: "Business license document",
      },
    },
    {
      uniqueIdentifier: "active-link-emma-2026",
      fileName: "address-verification.jpg",
      fileSize: 1835008,
      fileType: "image/jpeg",
      s3Key: "uploads/emma-davis/address-verification.jpg",
      s3Bucket: "fox-finance-uploads-test",
      metadata: {
        uploadedBy: "emma.davis@example.com",
        description: "Address verification document",
      },
    },
  ];

  for (const uploadData of uploadsData) {
    const uploadLink = uploadLinks.find(
      (ul) => ul.uniqueIdentifier === uploadData.uniqueIdentifier,
    );
    if (!uploadLink) {
      console.error(
        `UploadLink with identifier ${uploadData.uniqueIdentifier} not found`,
      );
      continue;
    }

    // Find the first document request for this upload link
    const docRequest = documentRequests.find(
      (dr) => dr.uploadLinkId === uploadLink.id,
    );

    await prisma.upload.create({
      data: {
        uploadLinkId: uploadLink.id,
        documentRequestId: docRequest?.id || null,
        fileName: uploadData.fileName,
        fileSize: uploadData.fileSize,
        fileType: uploadData.fileType,
        s3Key: uploadData.s3Key,
        s3Bucket: uploadData.s3Bucket,
        metadata: uploadData.metadata,
      },
    });

    console.log(`Created Upload: ${uploadData.fileName}`);
  }

  console.log("✓ Database seeding completed successfully");
  console.log(`
  ============================================================================
  Seed completed successfully!
  ============================================================================
  Summary:
  - Admin User: 1 (admin@fox-finance.net)
  - Document Types: ${seededDocTypes.length}
  - Clients: ${seededClients.length}
  - Upload Links: ${uploadLinks.length}
  - Document Requests: ${documentRequests.length}
  - Uploads: ${uploadsData.length}
  ============================================================================
  `);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
