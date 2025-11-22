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
