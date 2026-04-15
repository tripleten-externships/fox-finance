import rateLimit, { type RateLimitRequestHandler } from "express-rate-limit";
import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "./auth";
import type { UploadAuthRequest } from "./uploadAuth";

const ONE_HOUR_MS = 60 * 60 * 1000;
const DEFAULT_EXEMPT_IPS = (process.env.RATE_LIMIT_EXEMPT_IPS || "")
  .split(",")
  .map((ip) => ip.trim())
  .filter(Boolean);

type RateLimitedRequest = Request & {
  rateLimit?: {
    resetTime?: Date;
  };
};

const parseNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseWindowMs = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getClientIp = (req: Request) => req.ip || req.socket.remoteAddress || "unknown";

const getRetryAfterSeconds = (resetTime: Date | undefined) => {
  if (!resetTime) {
    return 0;
  }

  return Math.max(0, Math.ceil((resetTime.getTime() - Date.now()) / 1000));
};

const isExemptIp = (req: Request) => DEFAULT_EXEMPT_IPS.includes(getClientIp(req));

const buildLimiter = ({
  windowMs,
  max,
  keyGenerator,
  name,
}: {
  windowMs: number;
  max: number;
  keyGenerator: (req: Request) => string;
  name: string;
}): RateLimitRequestHandler =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: true,
    skip: isExemptIp,
    keyGenerator,
    handler: (req: Request, res: Response) => {
      const retryAfter = getRetryAfterSeconds(
        (req as RateLimitedRequest).rateLimit?.resetTime,
      );

      if (retryAfter > 0) {
        res.setHeader("Retry-After", retryAfter.toString());
      }

      return res.status(429).json({
        error: "Too Many Requests",
        message: `Rate limit exceeded for ${name}. Please retry later.`,
        retryAfter,
      });
    },
  });

export const adminUploadLinkCreationRateLimit = buildLimiter({
  name: "upload link creation",
  windowMs: parseWindowMs(
    process.env.RATE_LIMIT_ADMIN_UPLOAD_LINK_WINDOW_MS,
    ONE_HOUR_MS,
  ),
  max: parseNumber(process.env.RATE_LIMIT_ADMIN_UPLOAD_LINK_CREATE_MAX, 10),
  keyGenerator: (req) => {
    const userId = (req as AuthenticatedRequest).user?.uid;
    return userId ? `admin:${userId}` : `ip:${getClientIp(req)}`;
  },
});

export const uploadPresignedUrlRateLimit = buildLimiter({
  name: "presigned URL requests",
  windowMs: parseWindowMs(
    process.env.RATE_LIMIT_UPLOAD_PRESIGNED_WINDOW_MS,
    ONE_HOUR_MS,
  ),
  max: parseNumber(process.env.RATE_LIMIT_UPLOAD_PRESIGNED_MAX, 50),
  keyGenerator: (req) => {
    const token = (req as UploadAuthRequest).uploadLink?.token;
    return token ? `upload-token:${token}:presigned` : `ip:${getClientIp(req)}`;
  },
});

export const uploadCompletionRateLimit = buildLimiter({
  name: "upload completion requests",
  windowMs: parseWindowMs(
    process.env.RATE_LIMIT_UPLOAD_COMPLETE_WINDOW_MS,
    ONE_HOUR_MS,
  ),
  max: parseNumber(process.env.RATE_LIMIT_UPLOAD_COMPLETE_MAX, 100),
  keyGenerator: (req) => {
    const token = (req as UploadAuthRequest).uploadLink?.token;
    return token ? `upload-token:${token}:complete` : `ip:${getClientIp(req)}`;
  },
});
