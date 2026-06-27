-- Add durable UI package adoption run tracking.
CREATE TABLE "UiPackageAdoptionRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "commandMatrix" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "primitiveAdoptionEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "formNavDialogEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "accessibilityEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "keyboardFocusEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "visualSmokeEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "buildSmokeEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "designTokenDocsEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "secretSafeArtifactsCaptured" BOOLEAN NOT NULL DEFAULT false,
    "styleRegressionReviewPath" TEXT,
    "visualArtifactManifestPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UiPackageAdoptionRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UiPackageAdoptionRun_tenantId_runId_key" ON "UiPackageAdoptionRun"("tenantId", "runId");
CREATE INDEX "UiPackageAdoptionRun_tenantId_status_idx" ON "UiPackageAdoptionRun"("tenantId", "status");
CREATE INDEX "UiPackageAdoptionRun_commitSha_idx" ON "UiPackageAdoptionRun"("commitSha");

ALTER TABLE "UiPackageAdoptionRun" ADD CONSTRAINT "UiPackageAdoptionRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
