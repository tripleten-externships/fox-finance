import request from "supertest";
import jwt from "jsonwebtoken";
import uploadRouter from "../upload";
import { createTestApp } from "../../test/utils/createTestApp";
import { mockPrisma } from "../../test/mocks/prisma";
import { s3Service } from "../../services/s3.service";
import { queueUploadScan } from "../../services/malwareScan.service";
import { s3Client } from "../../lib/s3";

describe("upload flow routes", () => {
  const app = createTestApp(uploadRouter, { basePath: "/upload" });

  const createAuthToken = () =>
    jwt.sign(
      {
        uploadLinkId: "link-1",
        clientId: "client-1",
        type: "auth",
      },
      process.env.UPLOAD_TOKEN_SECRET as string,
    );

  const createBearerToken = () =>
    jwt.sign(
      {
        uploadLinkId: "link-1",
        clientId: "client-1",
        type: "bearer",
      },
      process.env.UPLOAD_TOKEN_SECRET as string,
    );

  beforeEach(() => {
    mockPrisma.uploadLink.findUnique.mockResolvedValue({
      id: "link-1",
      clientId: "client-1",
      expiresAt: new Date(Date.now() + 60_000),
      isActive: true,
      client: {
        id: "client-1",
        firstName: "Jamie",
        lastName: "Lee",
        company: "Acme Co",
      },
      documentRequests: [],
    });

    mockPrisma.uploadLink.findFirst.mockResolvedValue({
      id: "link-1",
      clientId: "client-1",
      token: "upload-link-token",
      expiresAt: new Date(Date.now() + 60_000),
      isActive: true,
      client: { id: "client-1" },
    });
  });

  it("GET /upload/verify returns bearer token for valid auth token", async () => {
    const token = createAuthToken();

    const response = await request(app).get(`/upload/verify?token=${token}`);

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(response.body.uploadLinkId).toBe("link-1");
  });

  it("GET /upload/verify rejects invalid auth token", async () => {
    const response = await request(app).get("/upload/verify?token=bad-token");

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Invalid auth token");
  });

  it("POST /upload/presigned-url returns presigned URL", async () => {
    const bearer = createBearerToken();
    (s3Service.generateKey as jest.Mock).mockReturnValueOnce("uploads/client-1/link-1/file.pdf");
    (s3Service.generatePresignedUrl as jest.Mock).mockResolvedValueOnce({
      url: "https://s3/presigned",
    });

    const response = await request(app)
      .post("/upload/presigned-url")
      .set("Authorization", `Bearer ${bearer}`)
      .send({
        files: [
          {
            fileName: "file.pdf",
            contentType: "application/pdf",
            contentLength: 11,
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body.presignedUrl).toBe("https://s3/presigned");
  });

  it("POST /upload/presigned-url rejects unsupported file types", async () => {
    const bearer = createBearerToken();

    const response = await request(app)
      .post("/upload/presigned-url")
      .set("Authorization", `Bearer ${bearer}`)
      .send({
        files: [
          {
            fileName: "virus.exe",
            contentType: "application/x-msdownload",
            contentLength: 11,
          },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("Unsupported file type");
  });

  it("POST /upload/complete creates upload and queues scan", async () => {
    const bearer = createBearerToken();
    (s3Client.send as jest.Mock).mockResolvedValueOnce({ ContentLength: 11 });

    mockPrisma.upload.findFirst.mockResolvedValueOnce(null);
    mockPrisma.upload.create.mockResolvedValueOnce({
      id: "up-1",
      fileName: "file.pdf",
      fileSize: { toString: () => "11" },
      s3Key: "uploads/client-1/link-1/file.pdf",
      s3Bucket: "test-bucket",
      uploadedAt: new Date(),
      scanStatus: "SCANNING",
      scanResult: null,
      metadata: { mimeType: "application/pdf", fileType: "application/pdf" },
    });

    const response = await request(app)
      .post("/upload/complete")
      .set("Authorization", `Bearer ${bearer}`)
      .send({
        s3Key: "uploads/client-1/link-1/file.pdf",
        fileName: "file.pdf",
        fileSize: 11,
        fileType: "application/pdf",
      });

    expect(response.status).toBe(200);
    expect(response.body.upload.id).toBe("up-1");
    expect(queueUploadScan).toHaveBeenCalledWith("up-1");
  });

  it("POST /upload/complete returns 400 when file is missing in S3", async () => {
    const bearer = createBearerToken();
    (s3Client.send as jest.Mock).mockRejectedValueOnce({ name: "NotFound" });

    const response = await request(app)
      .post("/upload/complete")
      .set("Authorization", `Bearer ${bearer}`)
      .send({
        s3Key: "uploads/client-1/link-1/file.pdf",
        fileName: "file.pdf",
        fileSize: 11,
        fileType: "application/pdf",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("File not found in S3");
  });
});
