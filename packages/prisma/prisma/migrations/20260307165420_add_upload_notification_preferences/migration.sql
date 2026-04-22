-- CreateEnum
CREATE TYPE "NotificationFrequency" AS ENUM ('IMMEDIATE', 'HOURLY', 'DAILY');

-- CreateTable
CREATE TABLE "UploadNotificationLog" (
    "id" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadIds" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UploadNotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UploadNotificationLog_clientId_sentAt_idx" ON "UploadNotificationLog"("clientId", "sentAt");

-- AddForeignKey
ALTER TABLE "UploadNotificationLog" ADD CONSTRAINT "UploadNotificationLog_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
