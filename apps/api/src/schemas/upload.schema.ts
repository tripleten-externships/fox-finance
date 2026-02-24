import { z } from "zod";

export const bulkDownloadSchema = z.object({
  body: z.object({
    uploadIds: z
      .array(
        z.string().uuid({
          message: "Upload ID must be a valid UUID",
        }),
      )
      .min(1, { message: "At least one upload must be selected" })
      .max(50, { message: "Cannot download more than 50 files per batch" }),
  }),
});

export type BulkDownloadInput = z.infer<typeof bulkDownloadSchema>["body"];
