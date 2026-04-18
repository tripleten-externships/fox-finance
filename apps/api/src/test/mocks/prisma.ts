import { mockDeep } from "jest-mock-extended";

export const mockPrisma = mockDeep<any>();

export const Status = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;

export const UploadStatus = {
  COMPLETE: "COMPLETE",
  INCOMPLETE: "INCOMPLETE",
} as const;

export const ScanStatus = {
  PENDING: "PENDING",
  SCANNING: "SCANNING",
  CLEAN: "CLEAN",
  THREAT_DETECTED: "THREAT_DETECTED",
  FAILED: "FAILED",
} as const;

export class MockPrismaKnownRequestError extends Error {
  code: string;
  meta?: Record<string, unknown>;

  constructor(message: string, code: string, meta?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.meta = meta;
  }
}

export class MockUnavailableError extends Error {}

export const mockAdmin = {
  auth: jest.fn(() => ({
    verifyIdToken: jest.fn(),
  })),
};

export const resetPrismaMocks = () => {
  jest.clearAllMocks();
  mockPrisma.$transaction.mockImplementation(async (callback: any) => {
    if (typeof callback === "function") {
      return callback(mockPrisma);
    }
    return undefined;
  });
};
