/*
  Warnings:

  - A unique constraint covering the columns `[page,uploadLinkId]` on the table `PageVisit` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `uploadLinkId` to the `PageVisit` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "PageVisit_page_key";

-- AlterTable
ALTER TABLE "PageVisit" ADD COLUMN     "firstVisitAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "uploadLinkId" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "PageVisit_uploadLinkId_idx" ON "PageVisit"("uploadLinkId");

-- CreateIndex
CREATE UNIQUE INDEX "PageVisit_page_uploadLinkId_key" ON "PageVisit"("page", "uploadLinkId");

-- AddForeignKey
ALTER TABLE "PageVisit" ADD CONSTRAINT "PageVisit_uploadLinkId_fkey" FOREIGN KEY ("uploadLinkId") REFERENCES "UploadLink"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
