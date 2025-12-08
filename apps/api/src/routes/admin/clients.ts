import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { validate } from "../../middleware/validation";
import {
  createClientSchema,
  updateClientSchema,
} from "../../schemas/client.schema";
import { Prisma, UploadStatus, Status } from "@prisma/client";
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
    ] = await Promise.all([
      // Total clients
      prisma.client.count(),

      // Active clients
      prisma.client.count({ where: { status: Status.ACTIVE } }),

      // Total upload links
      prisma.uploadLink.count(),

      // Active upload links (still incomplete)
      prisma.uploadLink.count({ where: { isActive: true } }),

      // Completed document requests
      prisma.documentRequest.count({
        where: { status: UploadStatus.COMPLETE },
      }),

      // Pending file uploads (requests not yet complete)
      prisma.documentRequest.count({
        where: { status: UploadStatus.INCOMPLETE },
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

// GET / List all clients
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
    sendError(res, 500, "Failed to fetch stats", { error });
    next(error);
  }
});

// GET / Get a specific client
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await prisma.client.findUnique({
      where: { id: id },
    });

    if (!result) {
      return res.status(404).json({
        message: "Client not found. Please check the ID and try again.",
      });
    }

    res.status(200).json({
      message: "Client details retrieved successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// POST / Create a new client
router.post("/", validate(createClientSchema), async (req, res, next) => {
  try {
    const { firstName, lastName, email, company, phone } = req.body;

    const result = await prisma.client.create({
      data: { firstName, lastName, email, company, phone },
    });

    res.status(201).json({
      message: "Client created successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// PUT / Update a client
router.put("/:id", validate(updateClientSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, company, phone } = req.body;

    const updated = await prisma.client.update({
      where: { id: id },
      data: { firstName, lastName, email, company, phone },
    });

    res.status(200).json({
      message: "Client information updated successfully.",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE / Delete a client
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleted = await prisma.client.delete({
      where: { id: id },
    });

    res.status(200).json({
      message: "Client deleted successfully.",
      data: deleted,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
