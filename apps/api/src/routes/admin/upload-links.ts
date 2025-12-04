import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { validate } from "../../middleware/validation";
import { createUploadLinkSchema } from "../../schemas/uploadLink.schema";
import { AuthenticatedRequest } from "../../middleware/auth";
import { randomBytes } from "crypto";
import { degradeIfDatabaseUnavailable } from "src/utils/degredation";

const router = Router();

// Generate a secure random token for upload links
function generateToken(): string {
  return randomBytes(32).toString("hex");
}

// GET /api/admin/upload-links - List all upload links
router.get("/", async (req, res, next) => {
  try {
    // TODO: Implement endpoint
    const uploadLinks = await degradeIfDatabaseUnavailable(() =>
      prisma.uploadLink.findMany({
        include: { client: true },
      })
    );
    res.status(200).json({ uploadLinks });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/upload-links/:id - Get a specific upload link with details
router.get("/:id", async (req, res, next) => {
  try {
    // TODO: Implement endpoint
    const uploadLinkById = await degradeIfDatabaseUnavailable(() =>
      prisma.uploadLink.findUnique({
        where: { id: req.params.id },
        include: { client: true },
      })
    );
    res.status(200).json({ uploadLinkById });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/upload-links - Create a new upload link
router.post("/", validate(createUploadLinkSchema), async (req, res, next) => {
  try {
    // TODO: Implement endpoint
    const newUploadLink = await degradeIfDatabaseUnavailable(() =>
      prisma.uploadLink.create({
        data: {
          ...req.body,
          token: generateToken(),
        },
      })
    );
    res.status(201).json({ newUploadLink });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/upload-links/:id/deactivate - Deactivate an upload link
router.patch("/:id/deactivate", async (req, res, next) => {
  try {
    // TODO: Implement endpoint
    const deactivatedLink = await degradeIfDatabaseUnavailable(() =>
      prisma.uploadLink.update({
        where: { id: req.params.id },
        data: { active: false },
      })
    );
    res.status(200).json({ deactivatedLink });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/upload-links/:id/activate - Reactivate an upload link
router.patch("/:id/activate", async (req, res, next) => {
  try {
    // TODO: Implement endpoint
    const activatedLink = await degradeIfDatabaseUnavailable(() =>
      prisma.uploadLink.update({
        where: { id: req.params.id },
        data: { active: true },
      })
    );
    res.status(200).json({ activatedLink });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/upload-links/:id - Delete an upload link
router.delete("/:id", async (req, res, next) => {
  try {
    // TODO: Implement endpoint
    const deletedLink = await degradeIfDatabaseUnavailable(() =>
      prisma.uploadLink.delete({
        where: { id: req.params.id },
      })
    );
    res.status(200).json({ deletedLink });
  } catch (error) {
    next(error);
  }
});

export default router;
