import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { validate } from "../../middleware/validation";
import { createUploadLinkSchema } from "../../schemas/uploadLink.schema";
import { AuthenticatedRequest } from "../../middleware/auth";
import { randomBytes } from "crypto";
import { degradeIfDatabaseUnavailable } from "../../degredation/degredation";

const router = Router();

// Generate a secure random token for upload links
function generateToken(): string {
  return randomBytes(32).toString("hex");
}

// GET /api/admin/upload-links - List all upload links with pagination, filters, sorting
router.get("/", async (req, res, next) => {
  try {
    const {
      pageSize = "20",
      clientId,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
      cursor,
    } = req.query;

    const limit = Math.min(Number(pageSize) || 20, 100);

    const where: any = {};

    if (clientId) where.clientId = String(clientId);

    if (status) {
      if (status === "active") {
        where.isActive = true;
        where.expiresAt = { gt: new Date() };
      }
      if (status === "expired") {
        where.expiresAt = { lt: new Date() };
      }
      if (status === "inactive") {
        where.isActive = false;
      }
    }

    const items = await degradeIfDatabaseUnavailable(() =>
      prisma.uploadLink.findMany({
        where,
        take: limit,
        ...(cursor ? { skip: 1, cursor: { id: String(cursor) } } : {}),
        orderBy: { [sortBy as string]: sortOrder },
        include: {
          client: true,
          _count: { select: { uploads: true } },
        },
      })
    );

    const total = await degradeIfDatabaseUnavailable(() =>
      prisma.uploadLink.count({ where })
    );

    res.setHeader("X-Total-Count", total);
    res.json({
      data: items,
      pagination: {
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit),
        nextCursor: items.length === limit ? items[items.length - 1].id : null,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/upload-links/:id - Get a specific upload link with all details
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const link = await degradeIfDatabaseUnavailable(() =>
      prisma.uploadLink.findUnique({
        where: { id },
        include: {
          client: true,
          uploads: { orderBy: { uploadedAt: "desc" } },
          _count: { select: { uploads: true } },
        },
      })
    );

    if (!link) return res.status(404).json({ error: "Upload link not found" });

    const lastUpload =
      link.uploads.length > 0 ? link.uploads[0].uploadedAt : null;

    res.json({
      ...link,
      stats: {
        uploadCount: link._count.uploads,
        lastUploadAt: lastUpload,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/upload-links - Create a new upload link
router.post("/", validate(createUploadLinkSchema), async (req, res, next) => {
  try {
    const { clientId, documentRequests, expirationDays = 7 } = req.body;

    // Validate input
    if (!clientId) {
      return res.status(400).json({ error: "Client ID is required" });
    }

    // Generate secure token
    const token = generateToken();

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    // Create UploadLink record in the database
    const uploadLink = await degradeIfDatabaseUnavailable(() =>
      prisma.uploadLink.create({
        data: {
          token,
          expiresAt,
          clientId,
          createdById: (req as AuthenticatedRequest).user?.uid, // Optional for testing
          documentRequests: { create: documentRequests },
        },
      })
    );
    // Return the full upload URL
    const uploadUrl = `${process.env.FRONTEND_URL}/upload/${token}`;
    res.status(201).json({ uploadUrl, uploadLink });
  } catch (error) {
    console.error("Error creating upload link:", error);
    next(error);
  }
});

// PATCH /api/admin/upload-links/:id/deactivate - Deactivate an upload link
router.patch("/:id/deactivate", async (req, res, next) => {
  try {
    // TODO: Implement endpoint
    res.status(501).json({ error: "Not implemented" });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/upload-links/:id/activate - Reactivate an upload link
router.patch("/:id/activate", async (req, res, next) => {
  try {
    // TODO: Implement endpoint
    res.status(501).json({ error: "Not implemented" });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/upload-links/:id - Delete an upload link
router.delete("/:id", async (req, res, next) => {
  try {
    // TODO: Implement endpoint
    res.status(501).json({ error: "Not implemented" });
  } catch (error) {
    next(error);
  }
});

export default router;
