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

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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
          },
        })
      );

      return res.json({ url: presigned.url, key });
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
  async (req: UploadAuthRequest, res, next) => {
    
    try {
      if (!req.uploadLink) {
        return res.status(401).json({ error: "Upload link missing" });
      }

      // 1. Extract data
      const { s3Key, fileName, fileSize, fileType } = req.body;
      const { id: uploadLinkId, documentRequestId } = req.uploadLink;

      // 2. Update the Database record
      // We find the record first to get the unique 'id'
      const existingUpload = await degradeIfDatabaseUnavailable(() =>
        prisma.upload.findFirst({
          where: { s3Key: s3Key }
        })
      );

      if (!existingUpload) {
        return res.status(404).json({ error: "Upload record not found for the provided S3 key" });
      }

      const upload = await degradeIfDatabaseUnavailable(() =>
        prisma.upload.update({
          where: { id: existingUpload.id }, // Using the unique primary key
          data: {
            fileName,
            fileSize: fileSize.toString(),
            uploadLinkId,
            ...(documentRequestId && { documentRequestId }),
          },
        })
      );

      // 3. Generate a download URL
      const presignedData = await s3Service.generatePresignedUrl({
        key: s3Key,
        contentType: fileType,
        contentLength: Number(fileSize),
      });

      // 4. Return success
      return res.status(200).json({
        message: "Upload confirmed",
        upload,
        downloadUrl: presignedData.url,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
