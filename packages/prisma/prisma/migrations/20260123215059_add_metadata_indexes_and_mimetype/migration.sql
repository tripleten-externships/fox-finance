/*
  Warnings:

  - Added the required column `mimeType` to the `Upload` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Upload` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Upload" ADD COLUMN     "mimeType" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "uploadedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Upload_mimeType_idx" ON "Upload"("mimeType");

-- CreateIndex
CREATE INDEX "Upload_metadata_idx" ON "Upload" USING GIN ("metadata" jsonb_path_ops);
