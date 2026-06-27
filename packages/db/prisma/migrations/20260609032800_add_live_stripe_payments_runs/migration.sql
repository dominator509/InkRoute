-- CreateTable
CREATE TABLE "LiveStripePaymentsRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "commandMatrix" JSONB NOT NULL,
    "readinessAreaManifest" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "stripeConfigurationManifest" JSONB NOT NULL,
    "lifecycleEvidenceManifest" JSONB NOT NULL,
    "paymentsPackageTypecheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "paymentsPackageTestsPassed" BOOLEAN NOT NULL DEFAULT false,
    "paymentRoutesTestsPassed" BOOLEAN NOT NULL DEFAULT false,
    "stripeSdkInstalled" BOOLEAN NOT NULL DEFAULT false,
    "stripeSecretConfigured" BOOLEAN NOT NULL DEFAULT false,
    "stripeWebhookSecretConfigured" BOOLEAN NOT NULL DEFAULT false,
    "stripeApiVersionPinned" BOOLEAN NOT NULL DEFAULT false,
    "checkoutProviderCallImplemented" BOOLEAN NOT NULL DEFAULT false,
    "paymentIntentLifecycleHandled" BOOLEAN NOT NULL DEFAULT false,
    "providerIdempotencyStoreBackedByDb" BOOLEAN NOT NULL DEFAULT false,
    "checkoutSessionPersisted" BOOLEAN NOT NULL DEFAULT false,
    "webhookRawBodyVerificationConfigured" BOOLEAN NOT NULL DEFAULT false,
    "webhookReplayProtectionPersisted" BOOLEAN NOT NULL DEFAULT false,
    "dbReconciliationTransactional" BOOLEAN NOT NULL DEFAULT false,
    "refundExecutionImplemented" BOOLEAN NOT NULL DEFAULT false,
    "disputeWorkflowImplemented" BOOLEAN NOT NULL DEFAULT false,
    "stripeCliLifecycleVerified" BOOLEAN NOT NULL DEFAULT false,
    "bookingToPaidE2eVerified" BOOLEAN NOT NULL DEFAULT false,
    "crossTenantPaymentIsolationVerified" BOOLEAN NOT NULL DEFAULT false,
    "ciPaymentEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "secretSafeArtifactsCaptured" BOOLEAN NOT NULL DEFAULT false,
    "paymentsTypecheckArtifactPath" TEXT,
    "paymentsTestArtifactPath" TEXT,
    "paymentRoutesTestArtifactPath" TEXT,
    "stripeSdkConfigArtifactPath" TEXT,
    "checkoutProviderCallArtifactPath" TEXT,
    "webhookLifecycleArtifactPath" TEXT,
    "dbReconciliationArtifactPath" TEXT,
    "refundDisputeArtifactPath" TEXT,
    "stripeCliLifecycleArtifactPath" TEXT,
    "bookingToPaidE2eArtifactPath" TEXT,
    "ciPaymentEvidenceArtifactPath" TEXT,
    "secretSafeArtifactsPath" TEXT,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiveStripePaymentsRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LiveStripePaymentsRun_tenantId_runId_key" ON "LiveStripePaymentsRun"("tenantId", "runId");

-- CreateIndex
CREATE INDEX "LiveStripePaymentsRun_tenantId_status_idx" ON "LiveStripePaymentsRun"("tenantId", "status");

-- CreateIndex
CREATE INDEX "LiveStripePaymentsRun_tenantId_createdAt_idx" ON "LiveStripePaymentsRun"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "LiveStripePaymentsRun" ADD CONSTRAINT "LiveStripePaymentsRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
