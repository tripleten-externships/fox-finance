/*
  Warnings:

  - The `status` column on the `DocumentRequest` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('COMPLETE', 'INCOMPLETE');

-- AlterEnum
ALTER TYPE "Status" ADD VALUE 'PENDING';

-- AlterTable
ALTER TABLE "DocumentRequest" DROP COLUMN "status",
ADD COLUMN     "status" "UploadStatus" NOT NULL DEFAULT 'INCOMPLETE';

-- AlterTable
ALTER TABLE "UploadLink" ADD COLUMN     "status" "UploadStatus" NOT NULL DEFAULT 'INCOMPLETE',
ALTER COLUMN "isActive" SET DEFAULT true;

-- DropEnum
DROP TYPE "public"."UpLoadStatus";
