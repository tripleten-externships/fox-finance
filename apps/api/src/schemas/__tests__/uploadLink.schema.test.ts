import {
  completeUploadSchema,
  createUploadLinkSchema,
  getPresignedUrlSchema,
} from "../uploadLink.schema";

describe("upload link schemas", () => {
  it("accepts valid upload-link creation payload", async () => {
    const payload = {
      body: {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        requestedDocuments: [{ name: "W2" }],
      },
    };

    await expect(createUploadLinkSchema.parseAsync(payload)).resolves.toBeDefined();
  });

  it("rejects invalid mime type for presigned-url payload", async () => {
    const payload = {
      body: {
        files: [
          {
            fileName: "test.pdf",
            contentType: "invalid",
            contentLength: 1,
          },
        ],
      },
    };

    await expect(getPresignedUrlSchema.parseAsync(payload)).rejects.toBeDefined();
  });

  it("rejects oversized complete-upload payload", async () => {
    const payload = {
      body: {
        s3Key: "uploads/key",
        fileName: "test.pdf",
        fileSize: 60 * 1024 * 1024,
        fileType: "application/pdf",
      },
    };

    await expect(completeUploadSchema.parseAsync(payload)).rejects.toBeDefined();
  });
});
