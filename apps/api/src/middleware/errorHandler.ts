import { Request, Response, NextFunction } from "express";
import { Prisma, UnavailableError } from "@fox-finance/prisma";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("Error:", err);

  if (res.headersSent) {
    return next(err);
  }

  // Handle database unavailability
  if (err instanceof UnavailableError) {
    return res.status(503).json({
      error: "Service Temporarily Unavailable",
      message: "Database is currently unavailable. Please try again later.",
    });
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Record not found (P2025)
    if (err.code === "P2025") {
      return res.status(404).json({
        error: "Not found",
        message: "The requested record does not exist",
      });
    }

    // Unique constraint violation (P2002)
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[]) || [];
      return res.status(409).json({
        error: "Duplicate entry",
        message: `A record with this ${target.join(", ")} already exists`,
      });
    }

    // Foreign key constraint failed (P2003)
    if (err.code === "P2003") {
      return res.status(400).json({
        error: "Invalid reference",
        message: "The referenced record does not exist",
      });
    }
  }

  // Default error response
  res.status(500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
}
