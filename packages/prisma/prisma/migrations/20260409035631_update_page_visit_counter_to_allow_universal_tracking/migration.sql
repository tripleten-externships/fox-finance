/*
  Warnings:

  - You are about to drop the `PageVisit` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PageVisit" DROP CONSTRAINT "PageVisit_uploadLinkId_fkey";

-- DropTable
DROP TABLE "PageVisit";

-- CreateTable
CREATE TABLE "PageVisitCounter" (
    "id" UUID NOT NULL,
    "page" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageVisitCounter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PageVisitCounter_page_idx" ON "PageVisitCounter"("page");
