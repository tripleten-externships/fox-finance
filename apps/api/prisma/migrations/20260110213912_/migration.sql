-- DropForeignKey
ALTER TABLE "public"."Upload" DROP CONSTRAINT "Upload_documentRequestId_fkey";

-- AlterTable
ALTER TABLE "Upload" ALTER COLUMN "documentRequestId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_documentRequestId_fkey" FOREIGN KEY ("documentRequestId") REFERENCES "DocumentRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
