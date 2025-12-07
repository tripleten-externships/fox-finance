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

import { prisma } from "../../lib/prisma";
//i  imported the following
import { HeadObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "../../lib/s3";
import { eventBus } from "../../lib/events";



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
  requireUploadToken,
  validate(completeUploadSchema),
  async (req, res, next) => {
    try {
      const { key, name, size, type, documentRequestId } = req.body;

      //  Extract token the same way as middleware
      const token =
        req.headers.authorization?.replace("Bearer ", "") ||
        (req.query.token as string);

      if (!token) {
        return res.status(401).json({ error: "Upload token required" });
      }

      // Fetch UploadLink (middleware does NOT do this yet)
      const uploadLink = await prisma.uploadLink.findUnique({
        where: { token },
        select: {
          id: true,
          clientId: true,
          token: true,
          expiresAt: true,
          isActive: true,
          documentRequests: true, // JSON array
        },
      });

      if (!uploadLink) {
        return res.status(401).json({ error: "Invalid upload token" });
      }

      if (!uploadLink.isActive) {
        return res.status(401).json({ error: "Upload link has been deactivated" });
      }

      if (new Date() > uploadLink.expiresAt) {
        return res.status(401).json({ error: "Upload link has expired" });
      }

      //  Validate documentRequestId inside JSON array
      if (documentRequestId) {
        const exists = uploadLink.documentRequests?.some(
          (dr: any) => dr.id === documentRequestId
        );

        if (!exists) {
          return res.status(400).json({
            error: "documentRequestId does not exist in this upload link",
          });
        }
      }

      //  Validate S3 object exists
      try {
        await s3Client.send(
          new HeadObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: key,
          })
        );
      } catch (err) {
        return res.status(400).json({
          error: "File not found in S3. Upload may not have completed.",
        });
      }

      //  Create Upload record
      const upload = await prisma.upload.create({
  data: {
    fileName: name,          // map request.name → fileName
    fileSize: size,          // map request.size → fileSize
    s3Key: key,              // map request.key → s3Key
    s3Bucket: process.env.S3_BUCKET!, // required by schema
    metadata: { mimeType: type },     // optional but useful
    uploadLinkId: uploadLink.id,
    documentRequestId: documentRequestId ?? null,
  },
});

      //  Generate pre-signed download URL (1 hour)
      const downloadUrl = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: key,
        }),
        { expiresIn: 3600 }
      );

      // Emit event for email notification
      eventBus.emit("upload.completed", {
        uploadId: upload.id,
        uploadLinkId: uploadLink.id,
        documentRequestId,
      });

      // Return confirmation
     return res.json({
  message: "Upload confirmed",
  upload: {
    id: upload.id,
    fileName: upload.fileName,
    fileSize: upload.fileSize,
    s3Key: upload.s3Key,
    s3Bucket: upload.s3Bucket,
    downloadUrl,
  },
});

    } catch (error) {
      next(error);
    }
  }
);

export default router;
