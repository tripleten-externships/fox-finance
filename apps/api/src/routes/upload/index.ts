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
import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../../lib/s3";
import { s3Service } from "../../services/s3.service";
import { prisma, degradeIfDatabaseUnavailable } from "@fox-finance/prisma";
import { updateUploadMetadataSchema } from "src/schemas/upload.schema";
import jwt from "jsonwebtoken";

const router = Router();

// Configuration constants
const ALLOWED_FILE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/pdf",
];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const PRESIGNED_URL_EXPIRY = 900; // 15 minutes
const BEARER_TOKEN_EXPIRY = 3600 * 24 * 7; // 7 days

interface AuthTokenPayload {
  uploadLinkId: string;
  clientId: string;
  type: "auth";
}

interface BearerTokenPayload {
  uploadLinkId: string;
  clientId: string;
  type: "bearer";
}

/**
 * GET /api/upload/verify?token=xyz
 *
 * Verifies an auth token from the upload link URL and returns a temporary bearer token.
 * This endpoint is called first when a client accesses an upload link.
 *
 * Flow:
 * 1. Client receives upload link with auth token in URL parameter
 * 2. Client calls this endpoint with the auth token
 * 3. Endpoint validates the JWT auth token and checks if upload link is valid
 * 4. If valid, generates a new bearer token (JWT) with 7-day expiration
 * 5. Client uses the bearer token for subsequent upload requests
 */
router.get("/verify", async (req, res, next) => {
  try {
    const token = req.query.token as string;

    if (!token) {
      return res
        .status(400)
        .json({ error: "Token query parameter is required" });
    }

    // Get the secret from environment
    const secret = process.env.UPLOAD_TOKEN_SECRET;
    if (!secret) {
      console.error("UPLOAD_TOKEN_SECRET environment variable not set");
      return res.status(500).json({ error: "Server configuration error" });
    }

    // Verify the JWT auth token
    let decoded: AuthTokenPayload;
    try {
      decoded = jwt.verify(token, secret) as AuthTokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ error: "Auth token has expired" });
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ error: "Invalid auth token" });
      }
      throw error;
    }

    // Validate token type
    if (decoded.type !== "auth") {
      return res
        .status(401)
        .json({ error: "Invalid token type. Expected auth token." });
    }

    // Query database to validate upload link
    const uploadLink = await degradeIfDatabaseUnavailable(() =>
      prisma.uploadLink.findUnique({
        where: { id: decoded.uploadLinkId },
        select: {
          id: true,
          clientId: true,
          expiresAt: true,
          isActive: true,
        },
      }),
    );

    if (!uploadLink) {
      return res.status(404).json({ error: "Upload link not found" });
    }

    // Verify the clientId matches
    if (uploadLink.clientId !== decoded.clientId) {
      return res.status(401).json({ error: "Token client mismatch" });
    }

    if (!uploadLink.isActive) {
      return res
        .status(403)
        .json({ error: "Upload link has been deactivated" });
    }

    if (new Date() > uploadLink.expiresAt) {
      return res.status(410).json({ error: "Upload link has expired" });
    }

    // Generate a new temporary bearer token
    const bearerTokenPayload: BearerTokenPayload = {
      uploadLinkId: decoded.uploadLinkId,
      clientId: decoded.clientId,
      type: "bearer",
    };

    const bearerToken = jwt.sign(bearerTokenPayload, secret, {
      expiresIn: BEARER_TOKEN_EXPIRY,
    });

    return res.json({
      token: bearerToken,
      expiresIn: BEARER_TOKEN_EXPIRY,
      uploadLinkId: uploadLink.id,
      clientId: uploadLink.clientId,
    });
  } catch (error) {
    console.error("Error verifying auth token:", error);
    next(error);
  }
});

/**
 * POST /api/upload/presigned-url
 *
 * Generates pre-signed S3 URLs for direct client-side uploads.
 * This endpoint validates the file metadata and returns presigned URLs
 * but does NOT create Upload records in the database yet.
 *
 * Upload records are created later in the /complete endpoint after
 * the client successfully uploads the file to S3.
 *
 * Flow:
 * 1. Validate file metadata (name, type, size)
 * 2. Generate S3 key(s) for the file(s)
 * 3. Create presigned URL(s) for S3 upload
 * 4. Return presigned URL(s) to client
 */
router.post(
  "/presigned-url",
  requireUploadToken,
  validate(getPresignedUrlSchema),
  async (req: UploadAuthRequest, res, next) => {
    try {
      if (!req.uploadLink) {
        return res.status(401).json({ error: "Upload link missing" });
      }

      const { id: uploadLinkId, clientId } = req.uploadLink;
      const files = req.body.files;

      // Validate file types and sizes
      for (const file of files) {
        if (!ALLOWED_FILE_TYPES.includes(file.contentType)) {
          return res.status(400).json({
            error: `Unsupported file type: ${file.contentType}. Allowed types: ${ALLOWED_FILE_TYPES.join(", ")}`,
            fileName: file.fileName,
          });
        }

        if (file.contentLength > MAX_FILE_SIZE) {
          return res.status(400).json({
            error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
            fileName: file.fileName,
            fileSize: file.contentLength,
          });
        }
      }

      // Generate presigned URLs for each file
      const uploadUrls = await Promise.all(
        files.map(
          async (file: {
            fileName: string;
            contentType: string;
            contentLength: number;
          }) => {
            // Generate unique S3 key
            const s3Key = s3Service.generateKey({
              uploadLinkId,
              fileName: file.fileName,
              clientId,
            });

            // Generate presigned URL for upload
            const { url } = await s3Service.generatePresignedUrl({
              key: s3Key,
              contentType: file.contentType,
              contentLength: file.contentLength,
              expiresIn: PRESIGNED_URL_EXPIRY,
            });

            return {
              fileName: file.fileName,
              s3Key,
              presignedUrl: url,
              expiresIn: PRESIGNED_URL_EXPIRY,
            };
          },
        ),
      );

      // Return single object for single file, array for multiple
      if (files.length === 1) {
        return res.json(uploadUrls[0]);
      }

      return res.json({
        uploads: uploadUrls,
        totalFiles: files.length,
      });
    } catch (error) {
      console.error("Error generating presigned URL:", error);
      next(error);
    }
  },
);

/**
 * POST /api/upload/complete
 *
 * Confirms that a file was successfully uploaded to S3 and creates the Upload record.
 * This endpoint is called AFTER the client uploads the file using the presigned URL.
 *
 * Flow:
 * 1. Validate upload link is still valid
 * 2. Verify the file exists in S3 (using HEAD request)
 * 3. Create Upload record in database with metadata
 * 4. Check if all uploads for the DocumentRequest are complete
 * 5. If complete, mark DocumentRequest as COMPLETE
 * 6. Return upload confirmation with download URL
 */
router.post(
  "/complete",
  requireUploadToken,
  validate(completeUploadSchema),
  async (req: UploadAuthRequest, res, next) => {
    try {
      if (!req.uploadLink) {
        return res.status(401).json({ error: "Upload link missing" });
      }

      const { s3Key, fileName, fileSize, fileType, documentRequestId } =
        req.body;
      const uploadLink = req.uploadLink;
      const bucketName = process.env.S3_UPLOADS_BUCKET;

      if (!bucketName) {
        console.error("S3_UPLOADS_BUCKET environment variable not set");
        return res.status(500).json({
          error: "Server configuration error",
        });
      }

      // Verify the file actually exists in S3
      try {
        const headCommand = new HeadObjectCommand({
          Bucket: bucketName,
          Key: s3Key,
        });
        const headResponse = await s3Client.send(headCommand);

        // Validate file size matches what's in S3
        if (
          headResponse.ContentLength &&
          headResponse.ContentLength !== fileSize
        ) {
          return res.status(400).json({
            error: "File size mismatch between request and S3",
            expected: fileSize,
            actual: headResponse.ContentLength,
          });
        }
      } catch (error: any) {
        console.error("S3 HEAD object error:", error);
        if (error.name === "NotFound") {
          return res.status(400).json({
            error:
              "File not found in S3. Upload may not have completed successfully.",
            s3Key,
          });
        }
        return res.status(500).json({
          error: "Failed to verify file in S3",
        });
      }

      // Create Upload record in database within a transaction
      const result = await degradeIfDatabaseUnavailable(() =>
        prisma.$transaction(async (tx) => {
          // Check if upload with this s3Key already exists
          const existingUpload = await tx.upload.findFirst({
            where: { s3Key },
          });

          if (existingUpload) {
            return {
              upload: existingUpload,
              wasCreated: false,
            };
          }

          // Create new Upload record
          const upload = await tx.upload.create({
            data: {
              uploadLinkId: uploadLink.id,
              documentRequestId: documentRequestId ?? null,
              fileName,
              fileSize,
              s3Key,
              s3Bucket: bucketName,
              metadata: {
                mimeType: fileType,
                fileType: fileType, // Store in metadata for compatibility
                uploadedAt: new Date().toISOString(),
              },
            },
            select: {
              id: true,
              fileName: true,
              fileSize: true,
              s3Key: true,
              s3Bucket: true,
              uploadedAt: true,
              metadata: true,
            },
          });

          // If this upload is part of a DocumentRequest, check if all uploads are complete
          if (documentRequestId) {
            const documentRequest = await tx.documentRequest.findUnique({
              where: { id: documentRequestId },
              include: {
                uploads: true,
                requestedDocuments: true,
              },
            });

            if (documentRequest) {
              // Check if all requested documents have been uploaded
              const requestedCount = documentRequest.requestedDocuments.length;
              const uploadedCount = documentRequest.uploads.length + 1; // +1 for current upload

              // If all documents uploaded, mark DocumentRequest as complete
              if (uploadedCount >= requestedCount) {
                await tx.documentRequest.update({
                  where: { id: documentRequestId },
                  data: { status: "COMPLETE" },
                });
              }
            }
          }

          return {
            upload,
            wasCreated: true,
          };
        }),
      );

      // Generate a presigned download URL for the uploaded file
      const downloadUrl = await s3Service.generatePresignedGetUrl(
        s3Key,
        3600, // 1 hour
      );

      // Extract fileType from metadata
      const metadata = result.upload.metadata as {
        fileType?: string;
        mimeType?: string;
      };
      const uploadFileType =
        metadata?.fileType || metadata?.mimeType || "unknown";

      return res.json({
        message: result.wasCreated
          ? "Upload confirmed and saved"
          : "Upload already exists",
        upload: {
          id: result.upload.id,
          fileName: result.upload.fileName,
          fileSize: result.upload.fileSize.toString(), // Convert Decimal to string
          fileType: uploadFileType,
          s3Key: result.upload.s3Key,
          uploadedAt: result.upload.uploadedAt,
          downloadUrl,
        },
      });
    } catch (error) {
      console.error("Error completing upload:", error);
      next(error);
    }
  },
);

export default router;
