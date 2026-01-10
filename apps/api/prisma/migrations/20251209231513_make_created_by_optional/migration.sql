-- DropForeignKey
ALTER TABLE "UploadLink" DROP CONSTRAINT "UploadLink_createdById_fkey";

-- AlterTable
ALTER TABLE "UploadLink" ALTER COLUMN "createdById" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "UploadLink" ADD CONSTRAINT "UploadLink_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
