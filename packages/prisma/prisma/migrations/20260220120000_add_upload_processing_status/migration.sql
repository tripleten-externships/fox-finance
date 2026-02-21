-- Create enum for upload processing lifecycle
CREATE TYPE "UploadProcessingStatus" AS ENUM (
    'UPLOADING',
    'SCANNING',
    'PROCESSING',
    'READY',
    'FAILED'
);

-- Add processing fields to uploads
ALTER TABLE "Upload"
ADD COLUMN "status" "UploadProcessingStatus" NOT NULL DEFAULT 'UPLOADING',
ADD COLUMN "progress" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "errorMessage" TEXT;
