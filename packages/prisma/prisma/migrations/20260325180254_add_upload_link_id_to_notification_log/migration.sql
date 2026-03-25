/*
  Warnings:

  - Added the required column `fileCount` to the `UploadNotificationLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalSize` to the `UploadNotificationLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UploadNotificationLog" ADD COLUMN     "fileCount" INTEGER NOT NULL,
ADD COLUMN     "totalSize" DECIMAL(65,30) NOT NULL;
