import request from "supertest";
import statsRouter from "../admin/stats";
import { createTestApp } from "../../test/utils/createTestApp";
import { mockPrisma } from "../../test/mocks/prisma";

describe("stats routes", () => {
  const app = createTestApp(statsRouter, { basePath: "/stats" });

  it("GET /stats/trends returns trend payload", async () => {
    mockPrisma.$queryRaw
      .mockResolvedValueOnce([{ day: "2026-03-01", count: 2 }])
      .mockResolvedValueOnce([{ clientId: "c1", count: 2 }])
      .mockResolvedValueOnce([{ fileType: "application/pdf", count: 2 }]);

    const response = await request(app).get("/stats/trends?range=30d");

    expect(response.status).toBe(200);
    expect(response.body.uploadsOverTime).toHaveLength(1);
    expect(response.body.uploadsByClient).toHaveLength(1);
    expect(response.body.fileTypes).toHaveLength(1);
  });

  it("GET /stats/trends returns 500 for invalid range", async () => {
    const response = await request(app).get("/stats/trends?range=2d");

    expect(response.status).toBe(500);
  });
});
