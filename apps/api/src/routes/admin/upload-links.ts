import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { validate } from "../../middleware/validation";
import { createUploadLinkSchema } from "../../schemas/uploadLink.schema";
import { AuthenticatedRequest } from "../../middleware/auth";
import { randomBytes } from "crypto";

const router = Router();

// Generate a secure random token for upload links
function generateToken(): string {
  return randomBytes(32).toString("hex");
}

// GET /api/admin/upload-links - List all upload links
router.get("/", async (req, res, next) => {
  try {
    // TODO: Implement endpoint
    res.status(501).json({ error: "Not implemented" });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/upload-links/:id - Get a specific upload link with details
router.get("/:id", async (req, res, next) => {
  try {
    // TODO: Implement endpoint
    res.status(501).json({ error: "Not implemented" });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/upload-links - Create a new upload link
router.post("/", validate(createUploadLinkSchema), async (req, res, next) => {
  try {
    // TODO: Implement endpoint
    res.status(501).json({ error: "Not implemented" });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/upload-links/:id/deactivate - Deactivate an upload link
router.patch(
  "/:id/deactivate",
  async (req: AuthenticatedRequest, res, next) => {
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
          updatedById: req.user.uid,
        },
      });

      return res.status(200).json(updatedLink);
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/admin/upload-links/:id/activate - Reactivate an upload link
router.patch("/:id/activate", async (req: AuthenticatedRequest, res, next) => {
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
        updatedById: req.user.uid,
      },
    });

    return res.status(200).json(updatedLink);
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
