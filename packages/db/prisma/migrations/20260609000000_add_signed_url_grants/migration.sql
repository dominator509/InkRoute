CREATE TABLE "SignedUrlGrant" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fileAssetId" TEXT NOT NULL,
    "issuedByUserId" TEXT NOT NULL,
    "recipientUserId" TEXT,
    "operation" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "signedUrlHash" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokeReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SignedUrlGrant_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SignedUrlGrant_tenantId_fileAssetId_idx" ON "SignedUrlGrant"("tenantId", "fileAssetId");
CREATE INDEX "SignedUrlGrant_tenantId_objectKey_idx" ON "SignedUrlGrant"("tenantId", "objectKey");
CREATE INDEX "SignedUrlGrant_tenantId_expiresAt_idx" ON "SignedUrlGrant"("tenantId", "expiresAt");
CREATE INDEX "SignedUrlGrant_tenantId_revokedAt_idx" ON "SignedUrlGrant"("tenantId", "revokedAt");

ALTER TABLE "SignedUrlGrant" ADD CONSTRAINT "SignedUrlGrant_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SignedUrlGrant" ADD CONSTRAINT "SignedUrlGrant_fileAssetId_fkey" FOREIGN KEY ("fileAssetId") REFERENCES "FileAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;