import { Router } from "express";
import {
  requireUploadToken,
  UploadAuthRequest,
} from "../../middleware/uploadAuth";
import { validate } from "../../middleware/validation";
import {
  getPresignedUrlSchema,
  completeUploadSchema,
} from "../../schemas/uploadLink.schema";
import { s3Service } from "../../services/s3.service";
import { prisma, degradeIfDatabaseUnavailable } from "@fox-finance/prisma";
import { updateUploadMetadataSchema } from "src/schemas/upload.schema";

const router = Router();

// GET /api/upload/verify?token=xyz - Verify upload token and get requirements
router.get("/verify", requireUploadToken, async (req, res, next) => {
  try {
    // TODO: Implement endpoint
    res.status(501).json({ error: "Not implemented" });
  } catch (error) {
    next(error);
  }
});

// POST /api/upload/presigned-url - Get a pre-signed URL for direct S3 upload
router.post(
  "/presigned-url",
  requireUploadToken,
  validate(getPresignedUrlSchema),
  async (req: UploadAuthRequest, res, next) => {
    try {
      if (!req.uploadLink) {
        return res.status(401).json({ error: "Upload link missing" });
      }

      const { id: uploadLinkId, clientId, documentRequestId } = req.uploadLink;

      const files = Array.isArray(req.body.files) ? req.body.files : [req.body];

      const ALLOWED_FILE_TYPES = ["image/png", "image/jpeg", "application/pdf"];
      const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

      for (const file of files) {
        if (!ALLOWED_FILE_TYPES.includes(file.contentType)) {
          return res
            .status(400)
            .json({ error: `Unsupported file type: ${file.fileName}` });
        }

        if (file.contentLength > MAX_FILE_SIZE) {
          return res
            .status(400)
            .json({ error: `File too large: ${file.fileName}` });
        }
      }

      if (files.length > 1) {
        const batch = await degradeIfDatabaseUnavailable(() =>
          prisma.uploadBatch.create({
            data: {
              uploadLinkId,
              status: "pending",
              totalFiles: files.length,
              uploadedFiles: 0,
            },
          })
        );
        const uploads = await degradeIfDatabaseUnavailable(() =>
          prisma.$transaction(async (tx) => {
            const results: Array<{
              fileName: string;
              s3Key: string;
              presignedUrl: string;
            }> = [];

            for (const file of files) {
              const key = s3Service.generateKey({
                uploadLinkId,
                fileName: file.fileName,
                clientId,
              });

              const presigned = await s3Service.generatePresignedUrl({
                key,
                contentType: file.contentType,
                contentLength: file.contentLength,
              });

              await tx.upload.create({
                data: {
                  uploadBatchId: batch.id,
                  uploadLinkId,
                  ...(documentRequestId && { documentRequestId }),
                  fileName: file.fileName,
                  fileSize: file.contentLength,
                  s3Key: key,
                  s3Bucket: process.env.S3_UPLOADS_BUCKET!,
                  metadata: {},
                  mimeType: file.contentType,
                },
              });
              results.push({
                fileName: file.fileName,
                s3Key: key,
                presignedUrl: presigned.url,
              });
            }
            return results;
          })
        );
        return res.json({ batchId: batch.id, uploads });
      }

      const file = files[0];
      const key = s3Service.generateKey({
        uploadLinkId,
        fileName: file.fileName,
        clientId,
      });

      const presigned = await s3Service.generatePresignedUrl({
        key,
        contentType: file.contentType,
        contentLength: file.contentLength,
      });

      await degradeIfDatabaseUnavailable(() =>
        prisma.upload.create({
          data: {
            uploadLinkId,
            ...(documentRequestId && { documentRequestId }),
            fileName: file.fileName,
            fileSize: file.contentLength,
            s3Key: key,
            s3Bucket: process.env.S3_UPLOADS_BUCKET!,
            metadata: {},
            mimeType: file.contentType,
          },
        })
      );

      return res.json({ url: presigned.url, key });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  "/:id/metadata",
  requireUploadToken,
  validate(updateUploadMetadataSchema),
  async (req: UploadAuthRequest, res, next) => {
    try {
      if (!req.uploadLink) {
        return res.status(401).json({ error: "Upload link missing" });
      }

      const { id } = req.params;
      const { description, tags, category } = req.body;
      const upload = await prisma.upload.findFirst({
        where: {
          id,
          uploadLinkId: req.uploadLink.id,
        },
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

// POST /api/upload/complete - Record completed upload
router.post(
  "/complete",
  requireUploadToken,
  validate(completeUploadSchema),
  async (req, res, next) => {
    try {
      // TODO: Implement endpoint
      res.status(501).json({ error: "Not implemented" });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
