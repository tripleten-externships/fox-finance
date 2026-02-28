-- AlterTable
ALTER TABLE "Upload" ADD COLUMN     "downloadCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "virusScanStatus" TEXT NOT NULL DEFAULT 'pending';
