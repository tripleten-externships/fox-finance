-- CreateIndex
CREATE INDEX "UploadLink_clientId_idx" ON "UploadLink"("clientId");

-- CreateIndex
CREATE INDEX "UploadLink_isActive_expiresAt_idx" ON "UploadLink"("isActive", "expiresAt");

-- CreateIndex
CREATE INDEX "Upload_uploadLinkId_idx" ON "Upload"("uploadLinkId");