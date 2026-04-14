import request from "supertest";
import uploadLinksRouter from "../admin/upload-links";
import { createTestApp } from "../../test/utils/createTestApp";
import { mockPrisma } from "../../test/mocks/prisma";

describe("upload-links routes", () => {
  const app = createTestApp(uploadLinksRouter, {
    basePath: "/upload-links",
    user: { uid: "admin-1", role: "ADMIN", email: "admin@test.com" },
  });

  it("GET /upload-links returns links with pagination metadata", async () => {
    mockPrisma.uploadLink.findMany.mockResolvedValueOnce([{ id: "link-1", uploads: [], _count: { uploads: 0 } }]);
    mockPrisma.uploadLink.count.mockResolvedValueOnce(1);

    const response = await request(app).get("/upload-links");

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.pagination.total).toBe(1);
  });

  it("GET /upload-links/:id returns a link with stats", async () => {
    mockPrisma.uploadLink.findUnique.mockResolvedValueOnce({
      id: "link-1",
      uploads: [{ uploadedAt: new Date() }],
      _count: { uploads: 1 },
    });

    const response = await request(app).get("/upload-links/link-1");

    expect(response.status).toBe(200);
    expect(response.body.stats.uploadCount).toBe(1);
  });

  it("GET /upload-links/:id returns 404 when not found", async () => {
    mockPrisma.uploadLink.findUnique.mockResolvedValueOnce(null);

    const response = await request(app).get("/upload-links/missing");

    expect(response.status).toBe(404);
  });

  it("POST /upload-links validates body", async () => {
    const response = await request(app).post("/upload-links").send({
      clientId: "not-a-uuid",
      expiresAt: "2026-01-01",
      requestedDocuments: [],
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Validation failed");
  });

  it("POST /upload-links creates link and returns upload URL", async () => {
    mockPrisma.documentType.findFirst.mockResolvedValueOnce(null);
    mockPrisma.documentType.create.mockResolvedValueOnce({ id: "dt-1", name: "Bank Statement" });
    mockPrisma.uploadLink.create.mockResolvedValueOnce({ id: "link-1" });
    mockPrisma.documentRequest.create.mockResolvedValueOnce({ id: "dr-1" });
    mockPrisma.requestedDocument.create.mockResolvedValueOnce({ id: "rd-1" });
    mockPrisma.uploadLink.findUnique.mockResolvedValueOnce({
      id: "link-1",
      client: { id: "client-1" },
      documentRequests: [],
    });

    const response = await request(app).post("/upload-links").send({
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      requestedDocuments: [{ name: "Bank Statement" }],
      instructions: "Upload latest document",
    });

    expect(response.status).toBe(201);
    expect(response.body.url).toContain("/upload/");
  });

  it("PATCH /upload-links/:id/activate blocks expired links", async () => {
    mockPrisma.uploadLink.findUnique.mockResolvedValueOnce({
      id: "link-1",
      expiresAt: new Date(Date.now() - 60_000),
    });

    const response = await request(app)
      .patch("/upload-links/link-1/activate")
      .send({
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        expiresAt: new Date().toISOString(),
        requestedDocuments: [{ name: "W2" }],
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Upload link is expired");
  });

  it("PATCH /upload-links/:id/activate reactivates valid links", async () => {
    mockPrisma.uploadLink.findUnique.mockResolvedValueOnce({
      id: "link-1",
      expiresAt: new Date(Date.now() + 60_000),
    });
    mockPrisma.uploadLink.update.mockResolvedValueOnce({
      id: "link-1",
      isActive: true,
    });

    const response = await request(app)
      .patch("/upload-links/link-1/activate")
      .send({
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        expiresAt: new Date().toISOString(),
        requestedDocuments: [{ name: "W2" }],
      });

    expect(response.status).toBe(200);
    expect(response.body.isActive).toBe(true);
  });

  it("PATCH /upload-links/:id/deactivate returns 404 when link missing", async () => {
    mockPrisma.uploadLink.findUnique.mockResolvedValueOnce(null);

    const response = await request(app)
      .patch("/upload-links/missing/deactivate")
      .send({
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        expiresAt: new Date().toISOString(),
        requestedDocuments: [{ name: "W2" }],
      });

    expect(response.status).toBe(404);
  });

  it("PATCH /upload-links/:id/deactivate disables active link", async () => {
    mockPrisma.uploadLink.findUnique.mockResolvedValueOnce({
      id: "link-1",
      expiresAt: new Date(Date.now() + 60_000),
      isActive: true,
    });
    mockPrisma.uploadLink.update.mockResolvedValueOnce({
      id: "link-1",
      isActive: false,
    });

    const response = await request(app)
      .patch("/upload-links/link-1/deactivate")
      .send({
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        expiresAt: new Date().toISOString(),
        requestedDocuments: [{ name: "W2" }],
      });

    expect(response.status).toBe(200);
    expect(response.body.isActive).toBe(false);
  });

  it("DELETE /upload-links/:id returns not implemented", async () => {
    const response = await request(app).delete("/upload-links/link-1");

    expect(response.status).toBe(501);
  });
});
