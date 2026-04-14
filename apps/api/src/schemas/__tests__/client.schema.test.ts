import { createClientSchema, updateClientSchema } from "../client.schema";

describe("client schemas", () => {
  it("accepts valid create payload", async () => {
    const payload = {
      body: {
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@test.com",
        phone: "9737851234",
      },
    };

    await expect(createClientSchema.parseAsync(payload)).resolves.toBeDefined();
  });

  it("rejects invalid email in create payload", async () => {
    const payload = {
      body: {
        firstName: "Jane",
        lastName: "Doe",
        email: "bad-email",
      },
    };

    await expect(createClientSchema.parseAsync(payload)).rejects.toBeDefined();
  });

  it("rejects empty update payload", async () => {
    const payload = {
      params: { id: "client-1" },
      body: {},
    };

    await expect(updateClientSchema.parseAsync(payload)).rejects.toBeDefined();
  });
});
