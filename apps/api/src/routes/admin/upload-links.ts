import { Router } from "express";
import {
  prisma,
  degradeIfDatabaseUnavailable,
  UploadProcessingStatus,
} from "@fox-finance/prisma";
import { validate } from "../../middleware/validation";
import { createUploadLinkSchema } from "../../schemas/uploadLink.schema";
import { AuthenticatedRequest } from "../../middleware/auth";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { s3Service } from "../../services/s3.service";

// Secret for JWT tokens - use environment variable or default for development
const UPLOAD_TOKEN_SECRET =
  process.env.UPLOAD_TOKEN_SECRET ||
  "your-secret-key-here-change-in-production";

const router = Router();
const PRESIGNED_URL_EXPIRY = 900; // 15 minutes

const generateToken = (uploadLinkId: string, clientId: string) => {
  return jwt.sign(
    {
      uploadLinkId,
      clientId,
      type: "auth",
    },
    UPLOAD_TOKEN_SECRET,
    // No expiration - the auth token is permanently valid
    // Upload link expiration in DB controls validity
  );
};

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
          uploads: true,
          _count: { select: { uploads: true } },
        },
      }),
    );

    const total = await degradeIfDatabaseUnavailable(() =>
      prisma.uploadLink.count({ where }),
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
      }),
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
    const { clientId, expiresAt, requestedDocuments, instructions } = req.body;

    // Validate input
    if (!clientId) {
      return res.status(400).json({ error: "Client ID is required" });
    }

    if (!requestedDocuments || requestedDocuments.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one document must be requested" });
    }

    // Generate secure token
    const linkId = crypto.randomUUID();
    const token = generateToken(linkId, clientId);

    // Parse expiration date from ISO string
    const expirationDate = new Date(expiresAt);

    // Use a transaction to ensure data consistency
    const result = await degradeIfDatabaseUnavailable(() =>
      prisma.$transaction(async (tx) => {
        // Create the upload link
        const uploadLink = await tx.uploadLink.create({
          data: {
            id: linkId,
            token,
            expiresAt: expirationDate,
            client: {
              connect: { id: clientId },
            },
            isActive: true,
            createdBy: {
              connect: { id: (req as AuthenticatedRequest).user.uid },
            },
          },
        });

        // Create document request
        const documentRequest = await tx.documentRequest.create({
          data: {
            uploadLinkId: uploadLink.id,
            instructions: instructions || "",
          },
        });

        // Process each requested document
        const requestedDocPromises = requestedDocuments.map(
          async (doc: { name: string; description?: string }) => {
            // Try to find existing DocumentType by name
            let documentType = await tx.documentType.findFirst({
              where: { name: doc.name },
            });

            // If DocumentType doesn't exist, create it
            if (!documentType) {
              documentType = await tx.documentType.create({
                data: {
                  name: doc.name,
                  description: doc.description || null,
                },
              });
            }

            // Create RequestedDocument with relation to DocumentType
            return tx.requestedDocument.create({
              data: {
                documentTypeId: documentType.id,
                description: doc.description || "",
                documentRequestId: documentRequest.id,
              },
            });
          },
        );

        await Promise.all(requestedDocPromises);

        // Fetch complete upload link with relations for response
        return tx.uploadLink.findUnique({
          where: { id: uploadLink.id },
          include: {
            client: true,
            documentRequests: {
              include: {
                requestedDocuments: {
                  include: {
                    documentType: true,
                  },
                },
              },
            },
          },
        });
      }),
    );

    // Return the full upload URL
    const uploadUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/upload/${token}`;
    res.status(201).json({ url: uploadUrl, uploadLink: result });
  } catch (error) {
    console.error("Error creating upload link:", error);
    next(error);
  }
});

// PATCH /api/admin/upload-links/:id/deactivate - Deactivate an upload link
router.patch(
  "/:id/deactivate",
  validate(createUploadLinkSchema),
  async (req, res, next) => {
    const { id } = req.params;

    try {
      const uploadLink = await prisma.uploadLink.findUnique({
        where: { id },
      });

      if (!uploadLink) {
        return res.status(404).json({
          error: "Upload link not found",
        });
      }

      const updatedLink = await prisma.uploadLink.update({
        where: { id },
        data: {
          isActive: false,
          updatedById: (req as AuthenticatedRequest).user.uid,
        },
      });

      return res.status(200).json(updatedLink);
    } catch (error) {
      next(error);
    }
  },
);

// PATCH /api/admin/upload-links/:id/activate - Reactivate an upload link
router.patch(
  "/:id/activate",
  validate(createUploadLinkSchema),
  async (req, res, next) => {
    const { id } = req.params;

    try {
      const uploadLink = await prisma.uploadLink.findUnique({
        where: { id },
      });

      if (!uploadLink) {
        return res.status(404).json({
          error: "Upload link not found",
        });
      }

      if (uploadLink.expiresAt < new Date()) {
        return res.status(400).json({
          error: "Upload link is expired",
        });
      }

      const updatedLink = await prisma.uploadLink.update({
        where: { id },
        data: {
          isActive: true,
          updatedById: (req as AuthenticatedRequest).user.uid,
        },
      });

      return res.status(200).json(updatedLink);
    } catch (error) {
      next(error);
    }
  },
);

// DELETE /api/admin/upload-links/:id - Delete an upload link
router.delete("/:id", async (req, res, next) => {
  try {
    // TODO: Implement endpoint
    res.status(501).json({ error: "Not implemented" });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/upload-links/uploads/:uploadId/retry - Retry a failed upload by regenerating a presigned URL
router.post("/uploads/:uploadId/retry", async (req, res, next) => {
  try {
    const { uploadId } = req.params;

    const upload = await degradeIfDatabaseUnavailable(() =>
      prisma.upload.findUnique({
        where: { id: uploadId },
        include: {
          uploadLink: {
            select: {
              id: true,
              clientId: true,
              isActive: true,
              expiresAt: true,
            },
          },
        },
      }),
    );

    if (!upload) {
      return res.status(404).json({ error: "Upload not found" });
    }

    if (upload.status !== UploadProcessingStatus.FAILED) {
      return res.status(400).json({ error: "Only failed uploads can be retried" });
    }

    if (!upload.uploadLink.isActive || new Date() > upload.uploadLink.expiresAt) {
      return res.status(400).json({ error: "Upload link is not active" });
    }

    const nextS3Key = s3Service.generateKey({
      uploadLinkId: upload.uploadLink.id,
      fileName: upload.fileName,
      clientId: upload.uploadLink.clientId,
    });

    const contentLength = Number(upload.fileSize);
    if (!Number.isFinite(contentLength) || contentLength <= 0) {
      return res.status(400).json({ error: "Invalid file size for retry" });
    }

    const { url } = await s3Service.generatePresignedUrl({
      key: nextS3Key,
      contentType: upload.fileType || "application/octet-stream",
      contentLength,
      expiresIn: PRESIGNED_URL_EXPIRY,
    });

    const updated = await degradeIfDatabaseUnavailable(() =>
      prisma.upload.update({
        where: { id: upload.id },
        data: {
          s3Key: nextS3Key,
          status: UploadProcessingStatus.UPLOADING,
          progress: 10,
          errorMessage: null,
          metadata: {
            ...(upload.metadata as Record<string, unknown>),
            retriedBy: (req as unknown as AuthenticatedRequest).user.uid,
            lastRetryAt: new Date().toISOString(),
          },
        },
        select: {
          id: true,
          fileName: true,
          status: true,
          progress: true,
          s3Key: true,
        },
      }),
    );

    return res.json({
      message: "Retry URL generated",
      upload: updated,
      presignedUrl: url,
      expiresIn: PRESIGNED_URL_EXPIRY,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
