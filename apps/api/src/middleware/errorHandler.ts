import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.error("Error:", err);

  if (res.headersSent) {
    return next(err);
  }

  // Handle Prisma specific errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violations
    if (err.code === "P2002") {
      const field = err.meta?.target as string[];

      if (field && field.includes("email")) {
        return res.status(409).json({
          error: "Email is already in use",
        });
      } else if (field && field.includes("phone")) {
        return res.status(409).json({
          error: "Phone number is already in use",
        });
      } else {
        return res.status(409).json({
          error: "This information is already in use",
        });
      }
    }

    // Record not found
    if (err.code === "P2025") {
      return res.status(404).json({
        error: "Record not found.",
      });
    }

    // Foreign key constraint failed
    if (err.code === "P2003") {
      return res.status(400).json({
        error: "Invalid reference data.",
      });
    }

    // General Prisma error
    return res.status(400).json({
      error: "Invalid data provided.",
    });
  }

  // Handle Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      error: "Invalid data format.",
    });
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const fieldErrors = err.errors.map((e) => {
      const field = e.path.join(".");
      return `${field}: ${e.message}`;
    });
    return res.status(400).json({
      error: "Validation failed.",
      details: fieldErrors,
    });
  }

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && err.message.includes("JSON")) {
    return res.status(400).json({
      error: "Invalid JSON format.",
    });
  }

  // Handle authentication errors
  if (
    err.name === "UnauthorizedError" ||
    err.message?.includes("unauthorized")
  ) {
    return res.status(401).json({
      error: "Authentication required.",
    });
  }

  // Handle permission errors
  if (err.name === "ForbiddenError" || err.message?.includes("forbidden")) {
    return res.status(403).json({
      error: "Access denied.",
    });
  }

  // Handle rate limiting errors
  if (
    err.message?.includes("rate limit") ||
    err.name === "TooManyRequestsError"
  ) {
    return res.status(429).json({
      error: "Too many requests. Try again later.",
    });
  }

  // Handle network/timeout errors
  if (err.code === "ETIMEDOUT" || err.code === "ECONNREFUSED") {
    return res.status(503).json({
      error: "Service temporarily unavailable.",
    });
  }

  // Handle file upload errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      error: "File too large.",
    });
  }

  // Handle CORS errors
  if (err.message?.includes("CORS")) {
    return res.status(403).json({
      error: "Cross-origin request blocked.",
    });
  }

  // Handle general errors with custom status codes
  if (err.status || err.statusCode) {
    const status = err.status || err.statusCode;
    return res.status(status).json({
      error: err.message || "An error occurred.",
    });
  }

  // Default server error
  return res.status(500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message || "Something went wrong.",
  });
}
