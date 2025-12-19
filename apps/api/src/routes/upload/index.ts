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
import { prisma } from "../../lib/prisma";
//I  imported the following
// AWS SDK imports for verifying and retrieving S3 objects
import { HeadObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "../../lib/s3";
// Event bus used to notify other parts of the system (email service, etc.)
import { eventBus } from "../../lib/events";
//for typescript to know req.uploadLink exists without creating a new file is

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
  async (req, res, next) => {
    try {
      // TODO: Implement endpoint
      res.status(501).json({ error: "Not implemented" });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/upload/complete - Record completed upload
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
            })
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
          { expiresIn: 3600 } // 1 hour
        );
        // --- Step 4: Emit an event for downstream services ---
        // Example: email service sends a notification to the client.
        eventBus.emit("upload.completed", {
          uploadId: upload.id,
          uploadLinkId: uploadLink.id,
          documentRequestId,
        });
        // --- Step 5: Respond to the client with confirmation ---
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
  }
);

export default router;
