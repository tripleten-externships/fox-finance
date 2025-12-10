import { z } from "zod";

export const fileCategorySchema = z.enum([
  "FINANCIAL",
  "IDENTITY",
  "LEGAL",
  "TAX",
  "OTHER",
]);

export const uploadMetadataSchema = z.object({
  description: z
    .string()
    .max(1000, {
      message: "Description cannot exceed 1000 characters",
    })
    .optional(),
  tags: z
    .array(
      z.string().max(50, { message: "Each tag cannot exceed 50 characters" })
    )
    .max(10, {
      message: "Cannot add more than 10 tags",
    })
    .optional(),
  category: fileCategorySchema.optional(),
});

export const updateUploadMetadataSchema = z.object({
  params: z.object({
    id: z.string().uuid({
      message: "Upload ID must be a valid UUID",
    }),
  }),
  body: uploadMetadataSchema,
});

export type UploadMetadata = z.infer<typeof uploadMetadataSchema>;
export type FileCategory = z.infer<typeof fileCategorySchema>;
export type UpdateUploadMetadataBody = z.infer<
  typeof updateUploadMetadataSchema
>;
