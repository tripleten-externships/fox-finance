import { Router } from "express";
import {
  prisma,
  degradeIfDatabaseUnavailable,
  Status,
  UploadStatus,
} from "@fox-finance/prisma";
import { validate } from "../../middleware/validation";
import {
  createClientSchema,
  updateClientSchema,
} from "../../schemas/client.schema";
import { Response } from "express";
import zod from "zod";

const router = Router();

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

    const [clients, count] = await degradeIfDatabaseUnavailable(() =>
      Promise.all([
        prisma.client.findMany({
          take: limit,
          ...(cursor ? { skip: Number(cursor) } : {}),
          where: {
            OR: req.query.search
              ? [
                  {
                    firstName: {
                      contains: String(req.query.search),
                      mode: "insensitive",
                    },
                  },
                  {
                    lastName: {
                      contains: String(req.query.search),
                      mode: "insensitive",
                    },
                  },
                  {
                    email: {
                      contains: String(req.query.search),
                      mode: "insensitive",
                    },
                  },
                  {
                    company: {
                      contains: String(req.query.search),
                      mode: "insensitive",
                    },
                  },
                ]
              : undefined,
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.client.count({
          where: {
            OR: req.query.search
              ? [
                  {
                    firstName: {
                      contains: String(req.query.search),
                      mode: "insensitive",
                    },
                  },
                  {
                    lastName: {
                      contains: String(req.query.search),
                      mode: "insensitive",
                    },
                  },
                  {
                    email: {
                      contains: String(req.query.search),
                      mode: "insensitive",
                    },
                  },
                  {
                    company: {
                      contains: String(req.query.search),
                      mode: "insensitive",
                    },
                  },
                ]
              : undefined,
          },
        }),
      ])
    );

    res.setHeader("X-Total-Count", count);
    res.json({
      items: clients,
      count,
      pageSize: limit,
      totalPages: Math.ceil(count / limit), // UI convenience only
      next: clients.length === limit ? clients[clients.length - 1].id : null,
    });
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

// GET / Get a specific client
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await degradeIfDatabaseUnavailable(() =>
      prisma.client.findUnique({
        where: { id: id },
      })
    );

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

    const result = await degradeIfDatabaseUnavailable(() =>
      prisma.client.create({
        data: { firstName, lastName, email, company, phone },
      })
    );

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

    const updated = await degradeIfDatabaseUnavailable(() =>
      prisma.client.update({
        where: { id: id },
        data: { firstName, lastName, email, company, phone },
      })
    );

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

    const deleted = await degradeIfDatabaseUnavailable(() =>
      prisma.client.delete({
        where: { id: id },
      })
    );

    res.status(200).json({
      message: "Client deleted successfully.",
      data: deleted,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
