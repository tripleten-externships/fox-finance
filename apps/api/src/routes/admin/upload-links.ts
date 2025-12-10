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

// GET /api/admin/upload-links - List all upload links
router.get("/", async (req, res, next) => {
  try {
    const uploadLinks = await degradeIfDatabaseUnavailable(() =>
      prisma.uploadLink.findMany({
        include: { client: true, createdBy: true },
      })
    );
    res.json(uploadLinks);
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/upload-links/:id - Get a specific upload link with details
router.get("/:id", async (req, res, next) => {
  try {
    const uploadLink = await degradeIfDatabaseUnavailable(() =>
      prisma.uploadLink.findUnique({
        where: { id: req.params.id },
        include: { client: true, createdBy: true, documentRequests: true },
      })
    );

    if (!uploadLink) {
      return res.status(404).json({ error: "Upload link not found" });
    }

    res.json(uploadLink);
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
