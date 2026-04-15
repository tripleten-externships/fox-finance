import request from "supertest";
import { createTestApp } from "../../test/utils/createTestApp";
import clientsRouter from "../admin/clients";
import { mockPrisma, MockPrismaKnownRequestError } from "../../test/mocks/prisma";

describe("clients routes", () => {
  const app = createTestApp(clientsRouter, { basePath: "/clients" });

  it("GET /clients returns paginated client list", async () => {
    mockPrisma.client.findMany.mockResolvedValueOnce([
      { id: "c1", firstName: "Jane", lastName: "Doe", email: "jane@test.com" },
    ]);
    mockPrisma.client.count.mockResolvedValueOnce(1);

    const response = await request(app).get("/clients");

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.count).toBe(1);
    expect(response.headers["x-total-count"]).toBe("1");
  });

  it("POST /clients validates payload", async () => {
    const response = await request(app).post("/clients").send({
      firstName: "Jane",
      lastName: "Doe",
      email: "not-an-email",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Validation failed");
  });

  it("POST /clients creates a client", async () => {
    mockPrisma.client.create.mockResolvedValueOnce({
      id: "c1",
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@test.com",
    });

    const response = await request(app).post("/clients").send({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@test.com",
      company: "Acme",
      phone: "9737851234",
    });

    expect(response.status).toBe(201);
    expect(response.body.data.id).toBe("c1");
  });

  it("POST /clients returns 409 on duplicate email", async () => {
    mockPrisma.client.create.mockRejectedValueOnce(
      new MockPrismaKnownRequestError("duplicate", "P2002", { target: ["email"] }),
    );

    const response = await request(app).post("/clients").send({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@test.com",
    });

    expect(response.status).toBe(409);
    expect(response.body.error).toBe("Duplicate entry");
  });

  it("GET /clients/:id returns 404 for unknown client", async () => {
    mockPrisma.client.findUnique.mockResolvedValueOnce(null);

    const response = await request(app).get("/clients/missing-id");

    expect(response.status).toBe(404);
  });

  it("PUT /clients/:id updates a client", async () => {
    mockPrisma.client.update.mockResolvedValueOnce({
      id: "c1",
      firstName: "Updated",
      lastName: "Doe",
      email: "jane@test.com",
    });

    const response = await request(app).put("/clients/c1").send({
      firstName: "Updated",
    });

    expect(response.status).toBe(200);
    expect(response.body.data.firstName).toBe("Updated");
  });

  it("DELETE /clients/:id returns 404 if client does not exist", async () => {
    mockPrisma.client.findUnique.mockResolvedValueOnce(null);

    const response = await request(app).delete("/clients/c1");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Client not found");
  });

  it("DELETE /clients/:id deletes client with transaction", async () => {
    mockPrisma.client.findUnique.mockResolvedValueOnce({ id: "c1" });
    mockPrisma.uploadLink.findMany.mockResolvedValueOnce([{ id: "u1" }]);
    mockPrisma.documentRequest.findMany.mockResolvedValueOnce([{ id: "dr1" }]);
    mockPrisma.client.delete.mockResolvedValueOnce({ id: "c1" });

    const response = await request(app).delete("/clients/c1");

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe("c1");
    expect(mockPrisma.client.delete).toHaveBeenCalled();
  });
});
