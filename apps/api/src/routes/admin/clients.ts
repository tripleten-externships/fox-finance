import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { validate } from "../../middleware/validation";
import {
  createClientSchema,
  updateClientSchema,
} from "../../schemas/client.schema";
import { UploadStatus, Status } from "@prisma/client";
import zod from "zod";
const router = Router();
//helper function
import { Response } from "express";

const sendError = (
  res: Response,
  status: number,
  message: string,
  meta?: object
) => {
  return res.status(status).json({
    error: message,
    ...(meta && { meta }),
  });
};

// GET /api/admin/clients - List all clients
router.get("/", async (req, res, next) => {
  try {
    const limit = zod
      .number()
      .int()
      .max(100)
      .default(20)
      .parse(req.query.limit);

    const cursor = req.query.cursor;

    const users = await prisma.user.findMany({
      take: limit,
      ...(cursor ? { skip: Number(cursor) } : {}),
      where: {
        name: req.query.search
          ? { contains: String(req.query.search), mode: "insensitive" }
          : undefined,
      },
      orderBy: { createdAt: "desc" },
    });

    const count = await prisma.user.count({
      where: {
        name: req.query.search
          ? { contains: String(req.query.search) }
          : undefined,
      },
    });

    res.setHeader("X-Total-Count", count);
    res.json({
      items: users,
      count,
      pageSize: limit,
      totalPages: Math.ceil(count / limit), // UI convenience only
      next: users.length === limit ? users[users.length - 1].id : null,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/clients/:id - Get a specific client
router.get("/:id", async (req, res, next) => {
  try {
    // TODO: Implement endpoint
    res.status(501).json({ error: "Not implemented" });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/clients - List all clients
router.get("/stats", async (req, res, next) => {
  const startTime = Date.now(); // track response time

  try {
    // TODO: Implement endpoint
    // Run queries in parallel

    const [
      totalClients,
      activeClients,
      totalUploadLinks,
      activeUploadLinks,
      completedUploadLinks,
      pendingFileUploads,
      uploadsRaw,
    ] = await Promise.all([
      // Total clients
      prisma.client.count(),

      // Active clients
      prisma.client.count({ where: { status: Status.ACTIVE } }),

      // Total upload links
      prisma.uploadLink.count(),

      // Active upload links (still incomplete)
      prisma.uploadLink.count({ where: { isActive: true } }),

      //complete file uploads
      prisma.documentRequest.count({
        where: { status: UploadStatus.COMPLETE },
      }),

      // Pending file uploads (requests not yet complete)
      prisma.documentRequest.count({
        where: { status: UploadStatus.INCOMPLETE },
      }),

      //  fetch uploads with clientId instead of grouping by uploadLinkId
      prisma.upload.findMany({
        select: {
          id: true,
          uploadLink: {
            select: { clientId: true },
          },
        },
      }),
    ]);

    // Aggregate uploads by clientId
    const uploadsByClient = uploadsRaw.reduce((acc, upload) => {
      //From this upload record, go to its uploadLink, and from that uploadLink, extract the clientId.
      const clientId = upload.uploadLink.clientId;
      acc[clientId] = (acc[clientId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const responseTime = Date.now() - startTime;

    res.json({
      data: {
        totalClients,
        activeClients,
        uploadMetrics: {
          totalUploadLinks,
          activeUploadLinks,
          completedUploadLinks,
          pendingFileUploads,
          uploadsByClient,
        },
      },
      meta: {
        performance: {
          responseTimeMs: responseTime,
          under200ms: responseTime < 200,
        },
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    sendError(res, 500, "Failed to fetch stats", { error });
    next(error);
  }
});

export default router;
