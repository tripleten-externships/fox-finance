import { Router, Request, Response } from "express";
import { prisma } from "@fox-finance/prisma";

const router = Router();

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  services: {
    api: {
      status: "up";
      uptime: number;
    };
    database: {
      status: "up" | "down" | "degraded";
      responseTime?: number;
      error?: string;
    };
  };
}

// Basic health check (doesn't check database)
router.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

// Detailed health check (checks database connectivity)
router.get("/detailed", async (_req: Request, res: Response) => {
  const startTime = Date.now();
  const health: HealthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      api: {
        status: "up",
        uptime: process.uptime(),
      },
      database: {
        status: "up",
      },
    },
  };

  // Check database connectivity
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbResponseTime = Date.now() - dbStart;

    health.services.database.status = "up";
    health.services.database.responseTime = dbResponseTime;

    // Mark as degraded if DB is slow
    if (dbResponseTime > 1000) {
      health.status = "degraded";
    }
  } catch (error) {
    health.status = "unhealthy";
    health.services.database.status = "down";
    health.services.database.error =
      error instanceof Error ? error.message : "Unknown error";
  }

  const statusCode =
    health.status === "healthy"
      ? 200
      : health.status === "degraded"
      ? 200
      : 503;

  res.status(statusCode).json(health);
});

// Readiness check (for Kubernetes/Docker - must be fully ready)
router.get("/ready", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ ready: true });
  } catch (error) {
    res.status(503).json({
      ready: false,
      error: error instanceof Error ? error.message : "Database unavailable",
    });
  }
});

// Liveness check (for Kubernetes/Docker - is the service alive)
router.get("/live", (_req: Request, res: Response) => {
  res.status(200).json({ alive: true });
});

export default router;
