import { resetPrismaMocks } from "./mocks/prisma";

process.env.UPLOAD_TOKEN_SECRET = process.env.UPLOAD_TOKEN_SECRET || "test-secret";
process.env.S3_UPLOADS_BUCKET = process.env.S3_UPLOADS_BUCKET || "test-bucket";
process.env.FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

jest.mock("@fox-finance/prisma", () => {
  const prismaMocks = require("./mocks/prisma");
  return {
    prisma: prismaMocks.mockPrisma,
    admin: prismaMocks.mockAdmin,
    Status: prismaMocks.Status,
    UploadStatus: prismaMocks.UploadStatus,
    ScanStatus: prismaMocks.ScanStatus,
    degradeIfDatabaseUnavailable: async (fn: () => Promise<unknown>) => fn(),
    Prisma: {
      PrismaClientKnownRequestError: prismaMocks.MockPrismaKnownRequestError,
    },
    UnavailableError: prismaMocks.MockUnavailableError,
  };
});

jest.mock("../services/s3.service", () => ({
  s3Service: {
    generatePresignedUrl: jest.fn(),
    generatePresignedGetUrl: jest.fn(),
    generateKey: jest.fn(),
  },
}));

jest.mock("../services/malwareScan.service", () => ({
  queueUploadScan: jest.fn(),
}));

jest.mock("../lib/s3", () => ({
  s3Client: {
    send: jest.fn(),
  },
}));

jest.mock("../middleware/rateLimit", () => ({
  adminUploadLinkCreationRateLimit: (_req: unknown, _res: unknown, next: () => void) => next(),
  uploadPresignedUrlRateLimit: (_req: unknown, _res: unknown, next: () => void) => next(),
  uploadCompletionRateLimit: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

beforeEach(() => {
  resetPrismaMocks();
});
