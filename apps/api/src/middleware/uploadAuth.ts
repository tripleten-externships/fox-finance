import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { createClient } from 'redis';

const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redis.on('error', (err) => console.log('Redis Client Error', err));
redis.connect();

async function getCachedUploadLink(token: string) {
  try {
    const cached = await redis.get(`upload_token:${token}`);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

async function setCachedUploadLink(token: string, uploadLink: any, ttlSeconds: number) {
  try {
    await redis.setEx(`upload_token:${token}`, ttlSeconds, JSON.stringify(uploadLink));
  } catch (error) {
    console.error('Redis set error', error);
  }
}

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
    let uploadLink = await getCachedUploadLink(token);

    if(!uploadLink) {
      uploadLink = await prisma.uploadLink.findUnique({
        where: { token },
        select: {
          id: true,
          clientId: true,
          token: true,
          expiresAt: true,
          isActive: true,
        },
      });

      if (uploadLink) {
        const now = new Date();
        const expiresIn = Math.floor((uploadLink.expiresAt.getTime() - now.getTime()) / 1000);
        const ttl = Math.min(300, Math.max(60, expiresIn));

        await setCachedUploadLink(token, uploadLink, ttl);
      }
    }

    if (!uploadLink) {
      return res.status(401).json({ error: "Invalid upload token" });
    }

    if (!uploadLink.isActive) {
      return res
        .status(403)
        .json({ error: "Upload link has been deactivated" });
    }

    if (new Date() > uploadLink.expiresAt) {
      return res.status(401).json({ error: "Upload link has expired" });
    }

    (req as UploadAuthRequest).uploadLink = uploadLink;
    next();
  } catch (error) {
    console.error("Upload token verification error:", error);
    return res.status(500).json({ error: "Token verification failed" });
  }
}
