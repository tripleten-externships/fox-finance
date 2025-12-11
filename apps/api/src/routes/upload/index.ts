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
const router = Router();


router.get("/verify/:token",validateToken,async (req, res, next) => {
  // ValidateToken is assign for temporary since this task is taken by other person.
  try {
    const { token } = req.params;

    // Query DB for upload link, client info, and document requests
    const uploadLink = await prisma.uploadLink.findUnique({
      where: { token },
      select: {
        token: true,
        expiresAt: true,
        isActive: true,

        client: {
          select:{ 
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            company: true
          }
        },
        documentRequests: {
          select: {
            requestedDocuments: {
              select: {
                name: true,
                description: true
              }
            }
          }
        }
      },
    });

    if (!uploadLink) {
      return res.status(404).json({ message: "Invalid upload token" });
    }

    // Check for expiry and active status
    const now = new Date();
    const isExpired = 
      !uploadLink.isActive || (uploadLink.expiresAt < now);

    if (isExpired) {
      return res.status(410).json({ message: "Upload token expired" });
    }

    // Return data
    return res.json({
      clientInfo: uploadLink.client,
      expiration: uploadLink.expiresAt,

      requestedDocuments:
  uploadLink.documentRequests?.flatMap(request =>
    request.requestedDocuments?.map(doc => ({
      documentType: doc.name,
      description: doc.description,
    })) ?? []
  ) ?? [],

    });

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
