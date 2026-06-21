ALTER TABLE "FileAsset"
  ADD COLUMN "scanStatus" TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN "detectedMimeType" TEXT,
  ADD COLUMN "malwareVerdict" TEXT,
  ADD COLUMN "scanProvider" TEXT,
  ADD COLUMN "scanCheckedAt" TIMESTAMP(3),
  ADD COLUMN "quarantineReason" TEXT,
  ADD COLUMN "derivativeObjectKey" TEXT,
  ADD COLUMN "derivativeMimeType" TEXT,
  ADD COLUMN "metadataStripped" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "storageVisibility" TEXT;

CREATE INDEX "FileAsset_tenantId_scanStatus_idx"
  ON "FileAsset"("tenantId", "scanStatus");

CREATE INDEX "FileAsset_tenantId_derivativeObjectKey_idx"
  ON "FileAsset"("tenantId", "derivativeObjectKey");
