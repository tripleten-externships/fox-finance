import { z } from "zod";

// TODO: Define your validation schemas here
// Example:
// export const createUploadLinkSchema = z.object({
//   body: z.object({
//     clientId: z.string().cuid(),
//     expiresAt: z.string().datetime(),
//     maxUploads: z.number().int().positive().default(10),
//     documents: z.array(
//       z.object({
//         name: z.string().min(1),
//         description: z.string().optional(),
//         required: z.boolean().default(true),
//       })
//     ),
//   }),
// });

export const createUploadLinkSchema = z.object({
  body: z.object({}),
});

export const getPresignedUrlSchema = z.object({
  body: z.object({
    files: z.array(z.object({
      fileName: z.string()
      .min(1, {message: "File name is required"})
      .max(255, {message:"File name cannot exceed 255 characters"}),
      contentType: z.string()
      .min(1, {message: "Content type is required"})
      .regex(/^[a-zA-Z0-9!#$&^_.+-]+\/[a-zA-Z0-9!#$&^_.+-]+$/, {message: "Invalid MIME type"}),
      contentLength: z.number({ invalid_type_error: "File size must be a number"})
      .int({message: "File size must be a whole number"})
      .positive({message: "File size must be greater than zero"})
      .max(50 * 1024 * 1024, {message:"File size exceeds maximum permitted 50MB"})
    })
  ).min(1, {message:"At least one file is required"}).max(20, {message:"Too many files in one batch"})
  }),
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
