import { z } from "zod";

export const createUploadLinkSchema = z.object({
  body: z.object({
    clientId: z.string().uuid({
      message: "Client ID must be a valid UUID",
    }),
    expiresAt: z.string().datetime(),
    requestedDocuments: z
      .array(
        z.object({
          name: z
            .string()
            .min(1, {
              message: "Document name is required",
            })
            .max(255, {
              message: "Document name cannot exceed 255 characters",
            }),
          description: z
            .string()
            .max(1000, {
              message: "Document description cannot exceed 1000 characters",
            })
            .optional(),
        }),
      )
      .min(1, {
        message: "At least one document must be requested",
      })
      .max(50, {
        message: "Cannot request more than 50 documents per link",
      }),
    instructions: z
      .string()
      .max(2000, {
        message: "Instructions cannot exceed 2000 characters",
      })
      .optional(),
  }),
});

export const getPresignedUrlSchema = z.object({
  body: z.object({
    files: z
      .array(
        z.object({
          fileName: z
            .string()
            .min(1, { message: "File name is required" })
            .max(255, { message: "File name cannot exceed 255 characters" }),
          contentType: z
            .string()
            .min(1, { message: "Content type is required" })
            .regex(/^[a-zA-Z0-9!#$&^_.+-]+\/[a-zA-Z0-9!#$&^_.+-]+$/, {
              message: "Invalid MIME type",
            }),
          contentLength: z
            .number({ invalid_type_error: "File size must be a number" })
            .int({ message: "File size must be a whole number" })
            .positive({ message: "File size must be greater than zero" })
            .max(50 * 1024 * 1024, {
              message: "File size exceeds maximum permitted 50MB",
            }),
        }),
      )
      .min(1, { message: "At least one file is required" })
      .max(20, { message: "Too many files in one batch" }),
  }),
});

/**
 * Schema for completing an upload after file has been uploaded to S3.
 * This validates the metadata needed to finalize the upload record.
 */
export const completeUploadSchema = z.object({
  body: z.object({
    s3Key: z
      .string()
      .min(1, { message: "S3 key is required" })
      .max(1024, { message: "S3 key is too long" }),
    fileName: z
      .string()
      .min(1, { message: "File name is required" })
      .max(255, { message: "File name cannot exceed 255 characters" }),
    fileSize: z
      .number({ invalid_type_error: "File size must be a number" })
      .int({ message: "File size must be a whole number" })
      .positive({ message: "File size must be greater than zero" })
      .max(50 * 1024 * 1024, {
        message: "File size exceeds maximum permitted 50MB",
      }),
    fileType: z
      .string()
      .min(1, { message: "File type is required" })
      .regex(/^[a-zA-Z0-9!#$&^_.+-]+\/[a-zA-Z0-9!#$&^_.+-]+$/, {
        message: "Invalid MIME type",
      }),
    documentRequestId: z
      .string()
      .uuid({ message: "Document request ID must be a valid UUID" })
      .optional(),
  }),
});

export type CreateUploadLinkBody = z.infer<
  typeof createUploadLinkSchema
>["body"];
export type GetPresignedUrlInput = z.infer<
  typeof getPresignedUrlSchema
>["body"];
export type CompleteUploadInput = z.infer<typeof completeUploadSchema>["body"];
