import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { requireUploadToken } from "../uploadAuth";
import { mockPrisma } from "../../test/mocks/prisma";

const createResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
};

describe("upload auth middleware", () => {
  it("returns 401 when bearer header is missing", async () => {
    const req = { headers: {} } as Request;
    const res = createResponse();
    const next = jest.fn();

    await requireUploadToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 for invalid bearer token", async () => {
    const req = {
      headers: { authorization: "Bearer bad-token" },
    } as unknown as Request;
    const res = createResponse();
    const next = jest.fn();

    await requireUploadToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("attaches uploadLink for valid bearer token", async () => {
    const token = jwt.sign(
      {
        uploadLinkId: "link-1",
        clientId: "client-1",
        type: "bearer",
      },
      process.env.UPLOAD_TOKEN_SECRET as string,
    );

    mockPrisma.uploadLink.findFirst.mockResolvedValueOnce({
      id: "link-1",
      clientId: "client-1",
      token: "upload-token",
      expiresAt: new Date(Date.now() + 60_000),
      isActive: true,
      client: { id: "client-1" },
    });

    const req = {
      headers: { authorization: `Bearer ${token}` },
    } as unknown as Request;
    const res = createResponse();
    const next = jest.fn();

    await requireUploadToken(req, res, next);

    expect(next).toHaveBeenCalled();
    expect((req as any).uploadLink.id).toBe("link-1");
  });
});
