import { Request, Response, NextFunction } from "express";
import { prisma, admin } from "@fox-finance/prisma";

export interface AuthenticatedRequest extends Request {
  user: {
    uid: string;
    email?: string;
    role: string;
  };
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ error: "No authentication token provided" });
    }

    if (!admin) {
      return res.status(500).json({ error: "Firebase admin not initialized" });
    }

    const decoded = await admin.auth().verifyIdToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    (req as AuthenticatedRequest).user = {
      uid: decoded.uid,
      email: decoded.email,
      role: user.role || "USER",
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid authentication token" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as AuthenticatedRequest).user;

  if (user.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
}
