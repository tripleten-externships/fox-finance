import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { validate } from "../../middleware/validation";
import { updateUploadMetadataSchema } from "../../schemas/upload.schema";

const router = Router();

// PATCH update an upload's metadata
router.patch(
  "/:id/metadata",
  validate(updateUploadMetadataSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { description, tags, category } = req.body;
      const upload = await prisma.upload.findUnique({
        where: { id },
      });

      if (!upload) {
        return res.status(404).json({
          error: "Upload was not found",
        });
      }

      const updatedMetadata = await prisma.upload.update({
        where: { id },
        data: {
          metadata: { description, tags, category },
        },
      });

      res.status(200).json({
        message: "Upload metadata updated successfully.",
        data: updatedMetadata,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
