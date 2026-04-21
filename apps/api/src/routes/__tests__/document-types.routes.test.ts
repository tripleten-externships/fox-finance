import request from "supertest";
import documentTypesRouter from "../admin/document-types";
import { createTestApp } from "../../test/utils/createTestApp";
import { mockPrisma } from "../../test/mocks/prisma";

describe("document types routes", () => {
  const app = createTestApp(documentTypesRouter, { basePath: "/document-types" });

  it("GET /document-types returns sorted document types", async () => {
    mockPrisma.documentType.findMany.mockResolvedValueOnce([
      { id: "dt1", name: "Bank Statement" },
      { id: "dt2", name: "W2" },
    ]);

    const response = await request(app).get("/document-types");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
  });

  it("GET /document-types returns 500 on database error", async () => {
    mockPrisma.documentType.findMany.mockRejectedValueOnce(new Error("db down"));

    const response = await request(app).get("/document-types");

    expect(response.status).toBe(500);
    expect(response.body.error).toBe("Failed to fetch document types");
  });
});
