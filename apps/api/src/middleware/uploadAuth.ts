import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

export interface UploadAuthRequest extends Request {
  uploadLink: {
    id: string;
    clientId: string;
    token: string;
  };
}

export async function requireUploadToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token =
      req.headers.authorization?.replace("Bearer ", "") ||
      (req.query.token as string);

    if (!token) {
      return res.status(401).json({ error: "Upload token required" });
    }

    // TODO: uncomment once upload links are implemented
    const uploadLink = await prisma.uploadLink.findUnique({
      where: { token },
      select: {
        id: true,
        clientId: true,
        token: true,
        expiresAt: true,
        isActive: true,
        client:true,
      },
     
    });

    if (!uploadLink) {
      return res.status(401).json({ error: "Invalid upload token" });
    }

    if (!uploadLink.isActive) {
      return res
        .status(401)
        .json({ error: "Upload link has been deactivated" });
    }

    if (uploadLink.expiresAt && new Date() > uploadLink.expiresAt) {
      return res.status(403).json({ error: "Upload link has expired" });
    }

    (req as UploadAuthRequest).uploadLink =  {id:uploadLink.id,clientId:uploadLink.clientId,token:uploadLink.token};
    next();
  } catch (error) {
    console.error("Upload token verification error:", error);
    return res.status(500).json({ error: "Token verification failed" });
  }
}
