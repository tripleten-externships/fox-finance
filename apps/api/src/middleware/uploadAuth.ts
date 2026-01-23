import { Request, Response, NextFunction } from "express";
import { degradeIfDatabaseUnavailable, prisma } from "@fox-finance/prisma";

export interface UploadAuthRequest extends Request {
  uploadLink?: {
    id: string;
    clientId: string;
    token: string;
    documentRequestId?: string;
  };
}
/**
 * requireUploadToken Middleware
 *
 * This middleware validates the upload token provided by the client.
 * It supports tokens passed via:
 *   - Authorization header: "Bearer <token>"
 *   - Query string: ?token=<token>
 *
 * Once validated, it attaches the uploadLink record to req.uploadLink
 * so downstream handlers can trust that the upload is authorized.
 */

export async function requireUploadToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader?.slice(7).trim()
      : authHeader?.trim() || (req.query.token as string);

    if (!token) {
      return res.status(401).json({ error: "Upload token required" });
    }

    const uploadLink = await degradeIfDatabaseUnavailable(() =>
      prisma.uploadLink.findFirst({
        where: { token },
        select: {
          id: true,
          clientId: true,
          token: true,
          expiresAt: true,
          isActive: true,
          client: true,
        },
      }),
    );

    if (!uploadLink) {
      return res.status(401).json({ error: "Invalid upload token" });
    }

    if (!uploadLink.isActive) {
      return res
        .status(401)
        .json({ error: "Upload link has been deactivated" });
    }

    if (new Date() > uploadLink.expiresAt) {
      return res.status(401).json({ error: "Upload link has expired" });
    }

    (req as UploadAuthRequest).uploadLink = uploadLink;
    next();
  } catch (error) {
    // Catch unexpected errors (DB issues, etc.) and return a safe response.
    console.error("Upload token verification error:", error);
    return res.status(500).json({ error: "Token verification failed" });
  }
}
