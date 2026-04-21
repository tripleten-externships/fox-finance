import { Request, Response } from "express";
import { requireAdmin, requireAuth } from "../auth";
import { mockAdmin, mockPrisma } from "../../test/mocks/prisma";

const createResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
};

describe("auth middleware", () => {
  it("requireAuth returns 401 when token is missing", async () => {
    const req = { headers: {} } as Request;
    const res = createResponse();
    const next = jest.fn();

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("requireAuth attaches user and calls next for valid token", async () => {
    const verifyIdToken = jest.fn().mockResolvedValue({
      sub: "user-1",
      uid: "user-1",
      email: "admin@test.com",
    });
    mockAdmin.auth.mockReturnValueOnce({ verifyIdToken });
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "user-1", role: "ADMIN" });

    const req = {
      headers: { authorization: "Bearer valid-token" },
    } as unknown as Request;
    const res = createResponse();
    const next = jest.fn();

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect((req as any).user.role).toBe("ADMIN");
  });

  it("requireAuth returns 401 for invalid token", async () => {
    const verifyIdToken = jest.fn().mockRejectedValue(new Error("bad token"));
    mockAdmin.auth.mockReturnValueOnce({ verifyIdToken });

    const req = {
      headers: { authorization: "Bearer invalid-token" },
    } as unknown as Request;
    const res = createResponse();
    const next = jest.fn();

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("requireAdmin returns 403 for non-admin users", () => {
    const req = { user: { role: "USER" } } as unknown as Request;
    const res = createResponse();
    const next = jest.fn();

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
