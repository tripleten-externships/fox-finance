import { Request, Response, NextFunction } from "express";
import { UnavailableError } from "../utils/degredation";

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

  // Handle UnavailableError specifically
  if (err instanceof UnavailableError) {
    return res.status(503).json({ error: "Service Temporarily Unavailable" });
  }

  res.status(500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
}
