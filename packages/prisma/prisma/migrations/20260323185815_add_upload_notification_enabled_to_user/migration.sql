/*
  Warnings:

  - You are about to drop the column `uploadNotificationEnabled` on the `Upload` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Upload" DROP COLUMN "uploadNotificationEnabled";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "uploadNotificationEnabled" BOOLEAN NOT NULL DEFAULT true;
