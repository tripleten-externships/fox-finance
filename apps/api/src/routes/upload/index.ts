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
import { HeadObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "../../lib/s3";
import { s3Service } from "../../services/s3.service";
import { prisma, degradeIfDatabaseUnavailable } from "@fox-finance/prisma";

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
/**
 * POST /api/upload/complete
 * Confirms that a file was successfully uploaded to S3 and records it in the database.
 * This endpoint is called AFTER the client uploads the file using the pre-signed URL.
 */

router.post(
  "/presigned-url",
  requireUploadToken, // Middleware attaches req.uploadLink
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
          }),
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
          }),
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
        }),
      );

      return res.json({ url: presigned.url, key });
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/upload/complete - Record completed upload
router.post(
  "/complete",
  requireUploadToken, // Middleware attaches req.uploadLink
  validate(completeUploadSchema), // Ensures key, name, size, type, documentRequestId are valid
  (req, res, next) => {
    // Cast req to UploadAuthRequest so TypeScript knows uploadLink exists
    const typedReq = req as UploadAuthRequest;
    return (async () => {
      try {
        // Extract validated fields from the request body
        const { key, name, size, type, documentRequestId } = typedReq.body;
        // Safety check — should never happen because middleware guarantees uploadLink
        if (!typedReq.uploadLink) {
          return res.status(400).json({ error: "Upload link missing" });
        }
        const uploadLink = typedReq.uploadLink; // Convenience alias

        // provided by middleware
        console.log(uploadLink);
        // --- Step 1: Verify the file actually exists in S3 ---
        // This prevents false "completed" uploads if the client never uploaded the file.
        try {
          await s3Client.send(
            new HeadObjectCommand({
              Bucket: process.env.S3_BUCKET,
              Key: key,
            }),
          );
        } catch {
          return res.status(400).json({
            error: "File not found in S3. Upload may not have completed.",
          });
        }
        // --- Step 2: Create Upload record in the database ---
        // This ties the uploaded file to the upload link and optional document request.
        const upload = await prisma.upload.create({
          data: {
            fileName: name,
            fileSize: size,
            s3Key: key,
            s3Bucket: process.env.S3_BUCKET!,
            metadata: { mimeType: type },
            uploadLinkId: uploadLink.id,
            documentRequestId: documentRequestId ?? null,
          },
          select: {
            id: true,
            fileName: true,
            fileSize: true,
            s3Key: true,
            s3Bucket: true,
            metadata: true,
            uploadedAt: true,
          },
        });
        // --- Step 3: Generate a pre-signed download URL ---
        // Allows the client to immediately download the uploaded file.
        const downloadUrl = await getSignedUrl(
          s3Client,
          new GetObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: key,
          }),
          { expiresIn: 3600 }, // 1 hour
        );
        // --- Step 4: Respond to the client with confirmation ---
        return res.json({
          message: "Upload confirmed",
          upload: {
            ...upload,
            downloadUrl,
          },
        });
      } catch (error) {
        next(error);
      }
    })();
  },
);

export default router;
