/*
  Warnings:

  - You are about to drop the column `name` on the `RequestedDocument` table. All the data in the column will be lost.
  - Added the required column `documentTypeId` to the `RequestedDocument` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RequestedDocument" DROP COLUMN "name",
ADD COLUMN     "documentTypeId" TEXT NOT NULL;

-- DropEnum
DROP TYPE "DocumentType";

-- CreateTable
CREATE TABLE "DocumentType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DocumentType_name_key" ON "DocumentType"("name");

-- CreateIndex
CREATE INDEX "RequestedDocument_documentTypeId_idx" ON "RequestedDocument"("documentTypeId");

-- AddForeignKey
ALTER TABLE "RequestedDocument" ADD CONSTRAINT "RequestedDocument_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "DocumentType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
