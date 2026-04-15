import request from "supertest";
import uploadsRouter from "../admin/uploads";
import { createTestApp } from "../../test/utils/createTestApp";
import { mockPrisma } from "../../test/mocks/prisma";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn(),
}));

describe("admin uploads routes", () => {
  const app = createTestApp(uploadsRouter, { basePath: "/uploads" });

  it("GET /uploads/threats returns threat list", async () => {
    mockPrisma.upload.findMany.mockResolvedValueOnce([
      { id: "u1", fileName: "bad.pdf", scanStatus: "THREAT_DETECTED" },
    ]);

    const response = await request(app).get("/uploads/threats?limit=10");

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(1);
  });

  it("GET /uploads/:id/download-url returns 404 when upload missing", async () => {
    mockPrisma.upload.findUnique.mockResolvedValueOnce(null);

    const response = await request(app).get("/uploads/u1/download-url");

    expect(response.status).toBe(404);
  });

  it("GET /uploads/:id/download-url blocks pending scan", async () => {
    mockPrisma.upload.findUnique.mockResolvedValueOnce({
      id: "u1",
      fileName: "file.pdf",
      s3Bucket: "bucket",
      s3Key: "key",
      scanStatus: "PENDING",
      scanResult: null,
    });

    const response = await request(app).get("/uploads/u1/download-url");

    expect(response.status).toBe(423);
  });

  it("GET /uploads/:id/download-url blocks threat-detected files", async () => {
    mockPrisma.upload.findUnique.mockResolvedValueOnce({
      id: "u1",
      fileName: "file.pdf",
      s3Bucket: "bucket",
      s3Key: "key",
      scanStatus: "THREAT_DETECTED",
      scanResult: "infected",
    });

    const response = await request(app).get("/uploads/u1/download-url");

    expect(response.status).toBe(403);
  });

  it("GET /uploads/:id/download-url returns signed URL when clean", async () => {
    mockPrisma.upload.findUnique.mockResolvedValueOnce({
      id: "u1",
      fileName: "file.pdf",
      s3Bucket: "bucket",
      s3Key: "key",
      scanStatus: "CLEAN",
      scanResult: null,
    });
    (getSignedUrl as jest.Mock).mockResolvedValueOnce("https://signed-download");

    const response = await request(app).get("/uploads/u1/download-url");

    expect(response.status).toBe(200);
    expect(response.body.downloadUrl).toBe("https://signed-download");
  });

  it("GET /uploads/:id/scan-status returns upload scan status", async () => {
    mockPrisma.upload.findUnique.mockResolvedValueOnce({
      id: "u1",
      scanStatus: "SCANNING",
      scanResult: null,
      scannedAt: null,
    });

    const response = await request(app).get("/uploads/u1/scan-status");

    expect(response.status).toBe(200);
    expect(response.body.scanStatus).toBe("SCANNING");
  });
});
