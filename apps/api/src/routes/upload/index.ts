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
import { string } from "zod";
import { error } from "console";

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
      // const {clientId, uploadLinkId} = req.uploadAuth!; // uncomment when requireUploadToken is fully implemented
      const { contentType, contentLength, fileName } = req.body

      const ALLOWED_FILE_TYPES= ["image/png", "image/jpeg", "application/pdf"];

      if(!ALLOWED_FILE_TYPES.includes(contentType)) {
        return res.status(400).json({ error: "Unsupported file type"})
      }

      const MAX_FILE_SIZE = 50 * 1024 * 1024;

      if (contentLength > MAX_FILE_SIZE) {
        return res.status(400).json({error: "File too large"})
      }

      // NOTE: uploadLinkId and clientId are not available yet because
      // requireUploadToken does not attach uploadAuth data to req.
      // Once upload link validation is implemented, uncomment this:

      // const key = s3Service.generateKey({
      //   uploadLinkId,
      //   fileName,
      //   clientId,
      // }) // 

      // const result = await s3Service.generatePresignedUrl({
      //   key,
      //   contentType,
      //   contentLength,
      // })

      // return res.json({
      //   url: result.url,
      //   key:result.key,
      // })
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
