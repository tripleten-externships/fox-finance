/*
  Warnings:

  - The primary key for the `Client` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `DocumentRequest` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `RequestedDocument` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Upload` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `UploadLink` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `id` on the `Client` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `DocumentRequest` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `RequestedDocument` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `Upload` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `UploadLink` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `clientId` on the `UploadLink` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `uploadLinkId` on the `DocumentRequest` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `uploadLinkId` on the `Upload` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `documentRequestId` on the `Upload` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `documentRequestId` on the `RequestedDocument` table. No cast exists, the column would be dropped and recreated.

*/

-- Step 1: Drop all foreign key constraints
-- Drop foreign keys referencing Client
ALTER TABLE "UploadLink" DROP CONSTRAINT IF EXISTS "UploadLink_clientId_fkey";

-- Drop foreign keys referencing UploadLink
ALTER TABLE "DocumentRequest" DROP CONSTRAINT IF EXISTS "DocumentRequest_uploadLinkId_fkey";
ALTER TABLE "Upload" DROP CONSTRAINT IF EXISTS "Upload_uploadLinkId_fkey";

-- Drop foreign keys referencing DocumentRequest
ALTER TABLE "Upload" DROP CONSTRAINT IF EXISTS "Upload_documentRequestId_fkey";
ALTER TABLE "RequestedDocument" DROP CONSTRAINT IF EXISTS "RequestedDocument_documentRequestId_fkey";

-- Drop foreign key referencing User (to be recreated later)
ALTER TABLE "UploadLink" DROP CONSTRAINT IF EXISTS "UploadLink_createdById_fkey";

-- Step 2: Perform all column type changes for primary keys
-- AlterTable Client
ALTER TABLE "Client" DROP CONSTRAINT "Client_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "Client_pkey" PRIMARY KEY ("id");

-- AlterTable DocumentRequest
ALTER TABLE "DocumentRequest" DROP CONSTRAINT "DocumentRequest_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "DocumentRequest_pkey" PRIMARY KEY ("id");

-- AlterTable RequestedDocument
ALTER TABLE "RequestedDocument" DROP CONSTRAINT "RequestedDocument_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "RequestedDocument_pkey" PRIMARY KEY ("id");

-- AlterTable Upload
ALTER TABLE "Upload" DROP CONSTRAINT "Upload_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "Upload_pkey" PRIMARY KEY ("id");

-- AlterTable UploadLink
ALTER TABLE "UploadLink" DROP CONSTRAINT "UploadLink_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "UploadLink_pkey" PRIMARY KEY ("id");

-- Step 3: Convert foreign key columns to UUID type
-- Convert UploadLink.clientId to UUID
ALTER TABLE "UploadLink" 
DROP COLUMN "clientId",
ADD COLUMN "clientId" UUID NOT NULL;

-- Convert DocumentRequest.uploadLinkId to UUID
ALTER TABLE "DocumentRequest"
DROP COLUMN "uploadLinkId",
ADD COLUMN "uploadLinkId" UUID NOT NULL;

-- Convert Upload.uploadLinkId to UUID
ALTER TABLE "Upload"
DROP COLUMN "uploadLinkId",
ADD COLUMN "uploadLinkId" UUID NOT NULL;

-- Convert Upload.documentRequestId to UUID
ALTER TABLE "Upload"
DROP COLUMN "documentRequestId",
ADD COLUMN "documentRequestId" UUID NOT NULL;

-- Convert RequestedDocument.documentRequestId to UUID (nullable)
ALTER TABLE "RequestedDocument"
DROP COLUMN "documentRequestId",
ADD COLUMN "documentRequestId" UUID;

-- Step 4: Recreate all foreign key constraints with proper CASCADE rules
-- Recreate foreign key from UploadLink to Client
ALTER TABLE "UploadLink" 
ADD CONSTRAINT "UploadLink_clientId_fkey" 
FOREIGN KEY ("clientId") 
REFERENCES "Client"("id") 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Recreate foreign key from UploadLink to User
ALTER TABLE "UploadLink"
ADD CONSTRAINT "UploadLink_createdById_fkey"
FOREIGN KEY ("createdById")
REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Recreate foreign key from DocumentRequest to UploadLink
ALTER TABLE "DocumentRequest"
ADD CONSTRAINT "DocumentRequest_uploadLinkId_fkey"
FOREIGN KEY ("uploadLinkId")
REFERENCES "UploadLink"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Recreate foreign key from Upload to UploadLink
ALTER TABLE "Upload"
ADD CONSTRAINT "Upload_uploadLinkId_fkey"
FOREIGN KEY ("uploadLinkId")
REFERENCES "UploadLink"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Recreate foreign key from Upload to DocumentRequest
ALTER TABLE "Upload"
ADD CONSTRAINT "Upload_documentRequestId_fkey"
FOREIGN KEY ("documentRequestId")
REFERENCES "DocumentRequest"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Recreate foreign key from RequestedDocument to DocumentRequest
ALTER TABLE "RequestedDocument"
ADD CONSTRAINT "RequestedDocument_documentRequestId_fkey"
FOREIGN KEY ("documentRequestId")
REFERENCES "DocumentRequest"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Upload_uploadLinkId_idx" ON "Upload"("uploadLinkId");

-- CreateIndex
CREATE INDEX "UploadLink_clientId_idx" ON "UploadLink"("clientId");

-- CreateIndex
CREATE INDEX "UploadLink_isActive_expiresAt_idx" ON "UploadLink"("isActive", "expiresAt");
