import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
/**
 * UploadAuthRequest
 *
 * We use an intersection type (`Request & { ... }`) instead of
 * `interface extends Request` to avoid conflicts with any existing
 * Express Request augmentations elsewhere in the codebase.
 *
 * This type represents a Request object AFTER the upload token
 * has been validated and the corresponding uploadLink has been attached.
 */

export type UploadAuthRequest = Request & {
  uploadLink: {
    id: string;
    clientId: string;
    token: string;
    expiresAt: Date;
    isActive: boolean;
    createdById: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
};
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
  next: NextFunction
) {
  try {
    // Extract token from either Authorization header or query string.
    // This supports both browser uploads and direct API calls.
    const token =
      req.headers.authorization?.replace("Bearer ", "") ||
      (req.query.token as string);
    // Reject requests that do not provide any token.
    if (!token) {
      return res.status(401).json({ error: "Upload token required" });
    }
    /**
     * Look up the upload link associated with this token.
     *
     * We select only the fields needed by the upload flow.
     * This is safer and more efficient than selecting the entire record.
     */
    const uploadLink = await prisma.uploadLink.findUnique({
      where: { token },
      select: {
        id: true,
        clientId: true,
        token: true,
        expiresAt: true,
        isActive: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    // Reject if the token does not correspond to a valid upload link.
    if (!uploadLink) {
      return res.status(401).json({ error: "Invalid upload token" });
    }
    // Reject if the upload link has been manually disabled.
    if (!uploadLink.isActive) {
      return res
        .status(401)
        .json({ error: "Upload link has been deactivated" });
    }
    // Reject if the upload link has expired.
    if (new Date() > uploadLink.expiresAt) {
      return res.status(401).json({ error: "Upload link has expired" });
    }
    /**
     * Attach the validated uploadLink to the request object.
     *
     * We cast req to UploadAuthRequest so TypeScript understands
     * that uploadLink now exists on the request.
     *
     * Downstream route handlers can now rely on:
     *   typedReq.uploadLink
     */
    (req as UploadAuthRequest).uploadLink = uploadLink;
    next();
  } catch (error) {
    // Catch unexpected errors (DB issues, etc.) and return a safe response.
    console.error("Upload token verification error:", error);
    return res.status(500).json({ error: "Token verification failed" });
  }
}
