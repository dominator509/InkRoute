-- Add durable Prisma validation run tracking.
CREATE TABLE "PrismaValidationRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT NOT NULL,
    "schemaPath" TEXT NOT NULL,
    "databaseUrlMode" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "commandMatrix" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "relationNameEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "manyToManyEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "enumCompatibilityEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "generatedSqlEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "secretSafeArtifactsCaptured" BOOLEAN NOT NULL DEFAULT false,
    "validateOutputPath" TEXT,
    "generatedSqlReviewPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrismaValidationRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PrismaValidationRun_tenantId_runId_key" ON "PrismaValidationRun"("tenantId", "runId");
CREATE INDEX "PrismaValidationRun_tenantId_status_idx" ON "PrismaValidationRun"("tenantId", "status");
CREATE INDEX "PrismaValidationRun_commitSha_idx" ON "PrismaValidationRun"("commitSha");

ALTER TABLE "PrismaValidationRun" ADD CONSTRAINT "PrismaValidationRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
