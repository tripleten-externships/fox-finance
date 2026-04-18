import { Request, Response } from "express";
import { errorHandler } from "../errorHandler";
import {
  MockPrismaKnownRequestError,
  MockUnavailableError,
} from "../../test/mocks/prisma";

const createResponse = () => {
  const res = {
    headersSent: false,
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
};

describe("error handler middleware", () => {
  it("returns 503 for database unavailability", () => {
    const req = {} as Request;
    const res = createResponse();
    const next = jest.fn();

    errorHandler(new MockUnavailableError("db down"), req, res, next);

    expect(res.status).toHaveBeenCalledWith(503);
  });

  it("returns 404 for Prisma P2025", () => {
    const req = {} as Request;
    const res = createResponse();
    const next = jest.fn();

    const err = new MockPrismaKnownRequestError("not found", "P2025");
    errorHandler(err as Error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns 409 for Prisma P2002", () => {
    const req = {} as Request;
    const res = createResponse();
    const next = jest.fn();

    const err = new MockPrismaKnownRequestError("duplicate", "P2002", {
      target: ["email"],
    });
    errorHandler(err as Error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it("returns 500 for generic errors", () => {
    const req = {} as Request;
    const res = createResponse();
    const next = jest.fn();

    errorHandler(new Error("boom"), req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
