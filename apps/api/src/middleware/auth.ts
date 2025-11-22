import { Request, Response, NextFunction } from "express";
import { admin } from "../firebase";

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

    (req as AuthenticatedRequest).user = {
      uid: decoded.uid,
      email: decoded.email,
      role: decoded.role || "USER",
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
