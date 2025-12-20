-- DropForeignKey
ALTER TABLE "public"."DocumentRequest" DROP CONSTRAINT "DocumentRequest_uploadLinkId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RequestedDocument" DROP CONSTRAINT "RequestedDocument_documentRequestId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Upload" DROP CONSTRAINT "Upload_documentRequestId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Upload" DROP CONSTRAINT "Upload_uploadLinkId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UploadLink" DROP CONSTRAINT "UploadLink_clientId_fkey";

-- AlterTable
ALTER TABLE "DocumentRequest" ALTER COLUMN "uploadLinkId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "RequestedDocument" ALTER COLUMN "documentRequestId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Upload" ALTER COLUMN "uploadLinkId" SET DATA TYPE TEXT,
ALTER COLUMN "documentRequestId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "UploadLink" ALTER COLUMN "clientId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "UploadLink" ADD CONSTRAINT "UploadLink_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRequest" ADD CONSTRAINT "DocumentRequest_uploadLinkId_fkey" FOREIGN KEY ("uploadLinkId") REFERENCES "UploadLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestedDocument" ADD CONSTRAINT "RequestedDocument_documentRequestId_fkey" FOREIGN KEY ("documentRequestId") REFERENCES "DocumentRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_uploadLinkId_fkey" FOREIGN KEY ("uploadLinkId") REFERENCES "UploadLink"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_documentRequestId_fkey" FOREIGN KEY ("documentRequestId") REFERENCES "DocumentRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
