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
//I  imported the following
import { HeadObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "../../lib/s3";
import { eventBus } from "../../lib/events";
//for typescript to know req.uploadLink exists without creating a new file is
import { Request } from "express";
interface UploadLinkData {
  id: string;
  clientId: string;
  token: string;
  expiresAt: Date;
  isActive: boolean;
}
interface UploadRequest extends Request {
  uploadLink?: UploadLinkData;
}


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
  requireUploadToken,                     // attaches req.uploadLink + req.client
  validate(completeUploadSchema),         // only validates key, name, size, type, documentRequestId
  async (req: UploadRequest, res, next) => {
    try {
      const { key, name, size, type, documentRequestId } = req.body;
      
      if (!req.uploadLink) {
  return res.status(400).json({ error: "Upload link missing" });
}
 const uploadLink = req.uploadLink;  // provided by middleware
      console.log(uploadLink);
      //  Verify S3 object exists (upload actually succeeded)
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

      // Create Upload record
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
          uploadedAt : true,
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

      //  Emit event for email notification
      eventBus.emit("upload.completed", {
        uploadId: upload.id,
        uploadLinkId: uploadLink.id,
        documentRequestId,
      });

      //  Return confirmation
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
  }
);

export default router;
