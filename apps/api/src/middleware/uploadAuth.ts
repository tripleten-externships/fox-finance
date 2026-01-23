import { Request, Response, NextFunction } from "express";
import { degradeIfDatabaseUnavailable, prisma } from "@fox-finance/prisma";
import jwt from "jsonwebtoken";

export interface UploadAuthRequest extends Request {
  uploadLink?: {
    id: string;
    clientId: string;
    token: string;
    documentRequestId?: string;
  };
}

interface BearerTokenPayload {
  uploadLinkId: string;
  clientId: string;
  type: "bearer";
}

/**
 * requireUploadToken Middleware
 *
 * This middleware validates the bearer token provided by the client.
 * It expects a JWT token in the Authorization header in the format: "Bearer <token>"
 *
 * The bearer token must be obtained by calling the /verify endpoint with an auth token.
 * Bearer tokens contain the uploadLinkId and clientId in the JWT payload and expire after 7 days.
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

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error:
          "Bearer token required. Please call /verify endpoint first to obtain a bearer token.",
      });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        error:
          "Bearer token required. Please call /verify endpoint first to obtain a bearer token.",
      });
    }

    // Get the secret from environment
    const secret = process.env.UPLOAD_TOKEN_SECRET;
    if (!secret) {
      console.error("UPLOAD_TOKEN_SECRET environment variable not set");
      return res.status(500).json({ error: "Server configuration error" });
    }

    // Verify the JWT bearer token
    let decoded: BearerTokenPayload;
    try {
      decoded = jwt.verify(token, secret) as BearerTokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
          error:
            "Bearer token has expired. Please call /verify endpoint again to obtain a new token.",
        });
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ error: "Invalid bearer token" });
      }
      throw error;
    }

    // Validate token type
    if (decoded.type !== "bearer") {
      return res.status(401).json({ error: "Invalid token type" });
    }

    // Get the upload link from the database
    const uploadLink = await degradeIfDatabaseUnavailable(() =>
      prisma.uploadLink.findFirst({
        where: { id: decoded.uploadLinkId },
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
      return res.status(401).json({ error: "Upload link not found" });
    }

    // Verify the clientId matches
    if (uploadLink.clientId !== decoded.clientId) {
      return res.status(401).json({ error: "Token client mismatch" });
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
