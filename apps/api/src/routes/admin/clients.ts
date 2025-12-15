import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { validate } from "../../middleware/validation";
import {
  createClientSchema,
  updateClientSchema,
} from "../../schemas/client.schema";
// I introduced this one
import {Prisma, UploadStatus, Status } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
const router = Router();

//helper function
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
    // TODO: Implement endpoint
    res.status(501).json({ error: "Not implemented" });
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

// POST /api/admin/clients - Create a new client
router.post("/", validate(createClientSchema), async (req, res, next) => {
  try {
    // TODO: Implement endpoint
    res.status(501).json({ error: "Not implemented" });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/clients/:id - Update a client
router.put("/:id", validate(updateClientSchema), async (req, res, next) => {
  try {
    // TODO: Implement endpoint
    res.status(501).json({ error: "Not implemented" });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/clients/:id - Delete a client
router.delete("/:id", async (req, res, next) => {
  try {
    // TODO: Implement endpoint
    res.status(501).json({ error: "Not implemented" });
  } catch (error) {
    next(error);
  }
});

// I copied from github b/c it was deleted during merge conflict resolution
// GET /api/admin/clients - List all clients
router.get("/stats", async (req: Request, res: Response, next: NextFunction) => {
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
      uploadsByClient,
    ] = await Promise.all([
      // Total clients
      prisma.client.count(),

      // Active clients
      prisma.client.count({ where: { status: Status.ACTIVE } }),

      // Total upload links
      prisma.uploadLink.count(),

    // Completed upload links
      prisma.uploadLink.count({ where: { isActive: true  } }),
     // request complete
      prisma.documentRequest.count({ where: { status: UploadStatus.COMPLETE } }),

      // Pending file uploads (requests not yet complete)
      prisma.documentRequest.count({
        where: { status: UploadStatus.INCOMPLETE },
      }),

      // Group uploads by client
      prisma.upload.groupBy({
        by: ["uploadLinkId"],
        _count: { id: true },
      }),
    ]);

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
