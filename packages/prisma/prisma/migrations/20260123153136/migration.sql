-- AlterTable
ALTER TABLE "DocumentRequest" ALTER COLUMN "instructions" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Upload" ADD COLUMN     "fileType" TEXT NOT NULL DEFAULT 'unknown';
