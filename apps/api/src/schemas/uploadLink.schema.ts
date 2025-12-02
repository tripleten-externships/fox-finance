import { z } from "zod";

export const createUploadLinkSchema = z.object({
  body: z.object({
    clientId: z.string().cuid({
      message: "Client ID must be a valid CUID"
    }),
    expiresAt: z.string().datetime(),
    maxUploads: z.number().int({
      message: "Max uploads must be a whole number"
    }).positive({
      message: "Max uploads must be greater than 0"
    }).max(100, {
      message: "Max uploads cannot exceed 100"
    }).default(10),
    documents: z.array(
      z.object({
        name: z.string().min(1, {
          message: "Document name is required"
        }).max(255, {
          message: "Document name cannot exceed 255 characters"
        }),
        description: z.string().max(1000, {
          message: "Document description cannot exceed 1000 characters"
        }).optional(),
        required: z.boolean().default(true),
      })
    ).min(1, {
      message: "At least one document must be requested"
    }).max(50, {
      message: "Cannot request more than 50 documents per link"
    })
  }),
});

export const getPresignedUrlSchema = z.object({
  body: z.object({}),
});

export const completeUploadSchema = z.object({
  body: z.object({}),
});

export type CreateUploadLinkInput = z.infer<
  typeof createUploadLinkSchema
>["body"];
export type GetPresignedUrlInput = z.infer<
  typeof getPresignedUrlSchema
>["body"];
export type CompleteUploadInput = z.infer<typeof completeUploadSchema>["body"];
