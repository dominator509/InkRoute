import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildProviderDeliveryId,
  buildProviderWebhookReconciliationArtifactReview,
  buildProviderWebhookReconciliationEvidenceDecision,
  buildProviderWebhookReconciliationExecutionPlan,
  buildProviderWebhookReconciliationContract,
  buildRedactedProviderWebhookReconciliationArtifact,
  buildSentryReconciliationPlan,
  mapSentryActionToErrorStatus,
  providerWebhookReconciliationArtifactPaths,
  providerWebhookReconciliationCommands,
  providerWebhookReconciliationDecisionRequiredEvidence,
  providerWebhookReconciliationExecutionPolicy,
  providerWebhookReconciliationMatrix,
  providerWebhookReconciliationProofFiles,
  providerWebhookReconciliationRequiredExternalEvidence,
  sanitizeProviderWebhookPayload,
} from "../lib/providerWebhookReconciliation";

const root = join(__dirname, "..", "..");
const routeSource = readFileSync(join(root, "apps/web/app/api/webhooks/sentry/route.ts"), "utf8");
const workflowSource = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");
const unitManifest = readFileSync(join(root, "testing/manifests/unit-test-manifest.json"), "utf8");
const gapTracker = readFileSync(join(root, "GAP_TRACKER.md"), "utf8");
const prismaSchema = readFileSync(join(root, "packages/db/prisma/schema.prisma"), "utf8");
const providerWebhookDeliveryMigration = readFileSync(
  join(root, "packages/db/prisma/migrations/20260613000300_add_provider_webhook_deliveries/migration.sql"),
  "utf8",
);

const event = {
  action: "resolved",
  data: {
    id: "issue_123",
    tenantId: "tenant_123",
    fingerprint: "stack_hash_123",
    title: "Crash from artist@example.com",
    culprit: "Bearer abc.def.ghi",
    token: "super-secret-token",
  },
};

describe("provider webhook reconciliation contract", () => {
  it("keeps Sentry webhook reconciliation responses free of internal persistence IDs", () => {
    expect(routeSource).toContain("providerWebhookDeliveryIdEchoed: false");
    expect(routeSource).toContain("auditLogIdEchoed: false");
    expect(routeSource).toContain("matchedErrorReportIdEchoed: false");
    expect(routeSource).toContain("internalPersistenceIdsEchoed: false");
    expect(routeSource).toContain("providerWebhookDeliveryRecorded: persistenceResult.providerWebhookDeliveryRecorded");
    expect(routeSource).toContain("auditLogged: persistenceResult.auditLogged");
    expect(routeSource).toContain("matchedErrorReportResolved: persistenceResult.matchedErrorReportResolved");
    expect(routeSource).toContain("providerWebhookDeliveryRecorded: true");
    expect(routeSource).toContain("auditLogged: true");
    expect(routeSource).toContain("matchedErrorReportResolved: Boolean(updatedErrorReport)");
    expect(routeSource).toContain("matchedErrorReportResolved: Boolean(updatedErrorReport)");
    expect(routeSource).toContain("providerWebhookDeliveryRecorded: true");
    expect(routeSource).toContain("idempotencyPersisted: true");
    expect(routeSource).toContain("rawProviderDeliveryIdStored: false");
    expect(routeSource).toContain("rawProviderDeliveryIdEchoed: false");
    expect(routeSource).toContain("rawIdempotencyKeyStored: false");
    expect(routeSource).toContain("internalPersistenceIdsStored: false");
    expect(routeSource).not.toContain("providerWebhookDeliveryId: persistenceResult.providerWebhookDeliveryId");
    expect(routeSource).not.toContain("auditLogId: persistenceResult.auditLogId");
    expect(routeSource).not.toContain("matchedErrorReportId: persistenceResult.matchedErrorReportId");
    expect(routeSource).not.toContain("providerWebhookDeliveryId: null");
    expect(routeSource).not.toContain("auditLogId: null");
    expect(routeSource).not.toContain("matchedErrorReportId: null");
    expect(routeSource).not.toContain(
      "metadata: {\n            provider: \"sentry\",\n            providerDeliveryId: input.providerDeliveryId,\n            idempotencyKey: input.idempotencyKey,\n            providerFingerprint: input.providerFingerprint,\n            targetErrorStatus: input.targetErrorStatus,\n            previousErrorStatus: existingErrorReport?.status ?? null,\n            matchedErrorReportId: updatedErrorReport?.id ?? null",
    );
    expect(routeSource).not.toContain(
      "sanitizedProviderPayload: input.sanitizedPayload,\n            providerWebhookDeliveryId: providerWebhookDelivery.id",
    );
    expect(routeSource).not.toContain("idempotencyKey: input.idempotencyKey,\n            providerFingerprint: input.providerFingerprint");
  });

  it("builds deterministic delivery and idempotency keys", () => {
    expect(buildProviderDeliveryId(event, event.data)).toMatch(/^sentry:resolved:sha256:[a-f0-9]{24}$/);
    expect(buildProviderDeliveryId(event, event.data)).not.toContain("issue_123");

    const plan = buildSentryReconciliationPlan({ event, data: event.data });

    expect(plan).toMatchObject({
      provider: "sentry",
      action: "resolved",
      targetErrorStatus: "resolved",
      providerFingerprint: "stack_hash_123",
      rawPayloadStored: false,
      ownership: { tenantId: "tenant_123", source: "provider-payload" },
    });
    expect(plan.providerDeliveryId).toMatch(/^sentry:resolved:sha256:[a-f0-9]{24}$/);
    expect(plan.idempotencyKey).toBe(plan.providerDeliveryId);
    expect(plan.providerDeliveryId).not.toContain("issue_123");
  });

  it("maps provider issue actions to ErrorReport statuses", () => {
    expect(mapSentryActionToErrorStatus("resolved")).toBe("resolved");
    expect(mapSentryActionToErrorStatus("closed")).toBe("resolved");
    expect(mapSentryActionToErrorStatus("ignored")).toBe("ignored");
    expect(mapSentryActionToErrorStatus("archived")).toBe("ignored");
    expect(mapSentryActionToErrorStatus("assigned")).toBe("triaged");
    expect(mapSentryActionToErrorStatus("created")).toBe("open");
  });

  it("keeps provider payload summaries sanitized and artifact-backed", () => {
    const sanitized = sanitizeProviderWebhookPayload(event, event.data);

    expect(JSON.stringify(sanitized)).not.toContain("artist@example.com");
    expect(JSON.stringify(sanitized)).not.toContain("abc.def.ghi");
    expect(JSON.stringify(sanitized)).not.toContain("super-secret-token");
    expect(JSON.stringify(sanitized)).toContain("[redacted-email]");
    expect(JSON.stringify(sanitized)).toContain("[redacted-secret]");
    expect(providerWebhookReconciliationArtifactPaths).toEqual(
      expect.arrayContaining([
        "coverage/provider-webhook-reconciliation.json",
        "coverage/provider-webhook-idempotency.json",
        "coverage/provider-webhook-error-status-mutation.json",
        "coverage/provider-webhook-sanitized-payload-redacted.json",
        "coverage/provider-webhook-live-sentry-proof-redacted.json",
        "test-results/provider-webhook-reconciliation",
      ]),
    );
  });

  it("wires signature verification, transaction persistence, and status mutation seams in the route", () => {
    expect(routeSource).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(routeSource).toContain("SENTRY_WEBHOOK_SECRET");
    expect(routeSource).toContain("{ status: 503, headers: noStoreHeaders }");
    expect(routeSource).not.toContain("{ status: 501, headers: noStoreHeaders }");
    expect(routeSource).toContain("verifySentrySignature");
    expect(routeSource).toContain("timingSafeEqual");
    expect(routeSource).toContain("prisma.$transaction");
    expect(routeSource).toContain("tx.providerWebhookDelivery.create");
    expect(routeSource).toContain("tx.providerWebhookDelivery.update");
    expect(routeSource).toContain("tx.auditLog.create");
    expect(routeSource).toContain('entityType: "ProviderWebhookDelivery"');
    expect(routeSource).toContain("tx.errorReport.update");
    expect(routeSource).toContain("idempotencyKey");
    expect(routeSource).toContain("rawPayloadStored");
    expect(routeSource).toContain("provider-webhook-delivery-unique-constraint");
    expect(routeSource).toContain("PROVIDER_WEBHOOK_RECONCILIATION_NOT_CONFIGURED");
    expect(routeSource).toContain("providerWebhookDurablePersistenceRequired");
    expect(routeSource).toContain('persistence: "durable-provider-webhook-attempt"');
    expect(routeSource).not.toContain('persistence: "not-yet-wired"');
  });

  it("pins the ProviderWebhookDelivery durable idempotency schema and migration", () => {
    expect(prismaSchema).toContain("model ProviderWebhookDelivery");
    expect(prismaSchema).toContain("@@unique([provider, providerDeliveryId])");
    expect(prismaSchema).toContain("@@unique([provider, idempotencyKey])");
    expect(prismaSchema).toContain("targetErrorStatus     ErrorReportStatus");
    expect(prismaSchema).toContain("statusMutationApplied Boolean");
    expect(prismaSchema).toContain("rawPayloadStored      Boolean");
    expect(prismaSchema).toContain("providerWebhookDeliveries ProviderWebhookDelivery[]");
    expect(providerWebhookDeliveryMigration).toContain('CREATE TABLE "ProviderWebhookDelivery"');
    expect(providerWebhookDeliveryMigration).toContain('"ProviderWebhookDelivery_provider_idempotencyKey_key"');
    expect(providerWebhookDeliveryMigration).toContain('"ProviderWebhookDelivery_provider_providerDeliveryId_key"');
    expect(providerWebhookDeliveryMigration).toContain('FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE');
    expect(providerWebhookDeliveryMigration).toContain('FOREIGN KEY ("errorReportId") REFERENCES "ErrorReport"("id") ON DELETE SET NULL');
  });

  it("keeps live replay explicitly gated while the durable idempotency source contract is wired", () => {
    const contract = buildProviderWebhookReconciliationContract();

    expect(contract.status).toBe("blocked");
    expect(contract.blockers).toEqual(
      expect.arrayContaining([
        "route tests must pass before provider webhook reconciliation is production-ready",
        "web typecheck must pass before provider webhook reconciliation is production-ready",
        "live Sentry webhook proof is required",
      ]),
    );
    expect(contract.blockers).not.toContain("durable provider-delivery idempotency constraint is required");
    expect(contract.requiredEvidence).toEqual(
      expect.arrayContaining([
        "webhook secret, signature, timing-safe comparison, and replay-protection evidence",
        "durable provider-delivery persistence and idempotency constraint evidence",
        "tenant ownership lookup, ErrorReport status mutation, and reconciliation audit evidence",
        "sanitized provider payload and live Sentry webhook replay evidence",
      ]),
    );
  });

  it("pins the provider webhook reconciliation command and artifact matrix", () => {
    expect(providerWebhookReconciliationCommands).toEqual([
      "pnpm --filter @inkroute/observability typecheck",
      "pnpm --filter @inkroute/observability test",
      "pnpm vitest run apps/web/tests/provider-webhook-reconciliation-static.test.ts apps/web/tests/observability-routes.test.ts",
      "Sentry webhook signature and replay tests",
      "ProviderWebhookDelivery unique idempotency persistence tests",
      "ErrorReport status mutation integration tests",
      "live Sentry webhook replay proof with redacted payloads",
      "provider webhook no-PII artifact audit",
    ]);
    expect(providerWebhookReconciliationMatrix.map((entry) => entry.id)).toEqual([
      "observability-typecheck",
      "observability-tests",
      "route-static-contracts",
      "signature-replay",
      "idempotency",
      "durable-delivery-constraint",
      "error-status-mutation",
      "sanitized-payload",
      "live-sentry-proof",
      "no-pii-artifact-audit",
      "ci-provider-webhook-reconciliation",
      "secret-safe-artifacts",
    ]);
    expect(providerWebhookReconciliationArtifactPaths).toContain("coverage/provider-webhook-durable-delivery-constraint.json");
    expect(providerWebhookReconciliationArtifactPaths).toContain("coverage/provider-webhook-secret-safe-artifacts.json");
  });

  it("builds a local execution plan without live provider replay, migration execution, or durable database execution", () => {
    const plan = buildProviderWebhookReconciliationExecutionPlan();

    expect(plan.id).toBe("gap-082-provider-webhook-reconciliation");
    expect(plan.liveProviderReplayAllowed).toBe(false);
    expect(plan.migrationExecutionAllowed).toBe(false);
    expect(plan.durableDatabaseExecutionAllowed).toBe(false);
    expect(plan.policy).toBe(providerWebhookReconciliationExecutionPolicy);
    expect(plan.policy).toEqual({
      executeLiveProviderReplay: false,
      executeMigration: false,
      executeDurableDatabase: false,
      executeStatusMutationIntegration: false,
      executeNoPiiAudit: false,
      executeCi: false,
    });
    expect(plan.requiredCommands).toBe(providerWebhookReconciliationCommands);
    expect(plan.requiredArtifacts).toBe(providerWebhookReconciliationArtifactPaths);
    expect(plan.localContractArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/provider-webhook-reconciliation.json",
        "coverage/provider-webhook-route-static-contracts.json",
        "coverage/provider-webhook-sanitized-payload-redacted.json",
      ]),
    );
    expect(plan.durablePersistenceArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/provider-webhook-idempotency.json",
        "coverage/provider-webhook-durable-delivery-constraint.json",
        "coverage/provider-webhook-error-status-mutation.json",
      ]),
    );
    expect(plan.liveProviderArtifacts).toEqual(["coverage/provider-webhook-live-sentry-proof-redacted.json"]);
    expect(plan.privacyArtifacts).toEqual(["coverage/provider-webhook-no-pii-artifact-audit.json"]);
    expect(plan.secretSafeArtifactPath).toBe("coverage/provider-webhook-secret-safe-artifacts.json");
    expect(plan.externalEvidenceRequired).toBe(providerWebhookReconciliationRequiredExternalEvidence);
    expect(plan.externalEvidenceRequired).toEqual([
      "Sentry signature and replay execution",
      "ProviderWebhookDelivery migration applied in non-production database",
      "durable idempotency and ErrorReport status mutation integration proof",
      "live Sentry webhook replay proof",
      "provider webhook no-PII audit, CI evidence, and secret-safe artifacts",
    ]);
  });

  it("redacts provider webhook reconciliation artifacts before persistence", () => {
    const review = buildProviderWebhookReconciliationArtifactReview("provider-webhook-live-sentry-proof", {
      providerPayload: {
        title: "Crash from artist@example.com",
        authorization: "Bearer sentry-live-webhook-token",
        token: "super-secret-token",
      },
      rawBody: "{\"email\":\"artist@example.com\",\"token\":\"sentry-live-webhook-token\"}",
      signature: "sentry-signature-secret",
      statusMutation: "resolved",
      safeTraceLabel: "provider_event_private_trace_20260613000300",
      safeArtifactPath: "coverage/provider-webhook-live-private-proof.json",
      safeWorkflowUrl: "https://github.com/dominator509/InkRoute/actions/runs/private",
      safeCommitSelector: "commit_abcdef1234567890abcdef1234567890",
    });
    const redactedOnly = buildRedactedProviderWebhookReconciliationArtifact({
      publicSummary: "provider webhook reconciliation artifact captured",
      safeTraceLabel: "provider_event_private_trace_20260613000300",
      safeArtifactPath: "coverage/provider-webhook-live-private-proof.json",
      safeWorkflowUrl: "https://github.com/dominator509/InkRoute/actions/runs/private",
      neutralTokenLabel: "sentry_private_artifact_token",
    });
    const serialized = JSON.stringify(review.redactedArtifact);
    const directSerialized = JSON.stringify(redactedOnly);

    expect(serialized).not.toContain("artist@example.com");
    expect(serialized).not.toContain("sentry-live-webhook-token");
    expect(serialized).not.toContain("super-secret-token");
    expect(serialized).not.toContain("sentry-signature-secret");
    expect(serialized).not.toContain("provider_event_private_trace_20260613000300");
    expect(serialized).not.toContain("coverage/provider-webhook-live-private-proof.json");
    expect(serialized).not.toContain("/actions/runs/private");
    expect(serialized).not.toContain("commit_abcdef1234567890abcdef1234567890");
    expect(directSerialized).not.toContain("sentry_private_artifact_token");
    expect(directSerialized).toContain("provider webhook reconciliation artifact captured");
    expect(serialized).toContain("resolved");
    expect(review.safeToPersist).toBe(true);
    expect(review.unsafeFindings).toEqual([]);
    expect(review.requiredArtifactPath).toBe("coverage/provider-webhook-secret-safe-artifacts.json");
  });

  it("pins current provider webhook reconciliation proof files for GAP-082", () => {
    expect(providerWebhookReconciliationProofFiles).toEqual(
      expect.arrayContaining([
      "packages/observability/package.json",
        "apps/web/lib/providerWebhookReconciliation.ts",
        "apps/web/app/api/webhooks/sentry/route.ts",
        "apps/web/tests/provider-webhook-reconciliation-static.test.ts",
        "apps/web/tests/observability-routes.test.ts",
        "packages/observability/src/index.ts",
        "packages/observability/tests/redaction-report.test.ts",
        "packages/db/prisma/schema.prisma",
        "packages/db/prisma/migrations/20260613000300_add_provider_webhook_deliveries/migration.sql",
        "API_CONTRACTS.md",
        ".github/workflows/ci.yml",
        "testing/manifests/unit-test-manifest.json",
      ]),
    );
    for (const file of providerWebhookReconciliationProofFiles) {
      expect(readFileSync(join(root, file), "utf8").length).toBeGreaterThan(0);
    }
  });

  it("classifies GAP-082 provider webhook reconciliation evidence as blocked until every durable provider artifact is captured", () => {
    const blocked = buildProviderWebhookReconciliationEvidenceDecision({
      observabilityTypecheckPassed: true,
      observabilityTestsPassed: true,
      routeStaticContractsPassed: true,
      signatureReplayVerified: false,
      idempotencyVerified: false,
      durableDeliveryConstraintVerified: false,
      errorStatusMutationVerified: false,
      sanitizedPayloadCaptured: true,
      liveSentryReplayProofCaptured: false,
      noPiiArtifactAuditPassed: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactReviewPassed: false,
      capturedArtifacts: ["coverage/provider-webhook-reconciliation.json"],
    });

    expect(blocked.status).toBe("blocked");
    expect(blocked.blockers).toEqual(
      expect.arrayContaining([
        "Sentry webhook signature and replay evidence is required.",
        "Provider webhook idempotency evidence is required.",
        "ProviderWebhookDelivery durable unique constraint evidence is required.",
        "ErrorReport status mutation integration evidence is required.",
        "Live Sentry webhook replay proof evidence is required.",
      ]),
    );
    expect(blocked.missingArtifacts).toContain("coverage/provider-webhook-durable-delivery-constraint.json");
    expect(blocked.requiredCommands).toBe(providerWebhookReconciliationCommands);
    expect(blocked.requiredEvidence).toBe(providerWebhookReconciliationDecisionRequiredEvidence);

    const complete = buildProviderWebhookReconciliationEvidenceDecision({
      observabilityTypecheckPassed: true,
      observabilityTestsPassed: true,
      routeStaticContractsPassed: true,
      signatureReplayVerified: true,
      idempotencyVerified: true,
      durableDeliveryConstraintVerified: true,
      errorStatusMutationVerified: true,
      sanitizedPayloadCaptured: true,
      liveSentryReplayProofCaptured: true,
      noPiiArtifactAuditPassed: true,
      ciEvidenceCaptured: true,
      secretSafeArtifactReviewPassed: true,
      capturedArtifacts: providerWebhookReconciliationArtifactPaths,
    });

    expect(complete.status).toBe("complete");
    expect(complete.blockers).toEqual([]);
    expect(complete.missingArtifacts).toEqual([]);
    expect(complete.redactedSummary).toContain("CI-safe redacted artifacts captured");
  });

  it("is wired into CI with redacted provider webhook artifacts", () => {
    expect(workflowSource).toContain("Run Phase 11 provider webhook reconciliation contracts");
    expect(workflowSource).toContain("apps/web/tests/provider-webhook-reconciliation-static.test.ts");
    expect(workflowSource).toContain("Upload provider webhook reconciliation artifacts");
    expect(workflowSource).toContain("coverage/provider-webhook-live-sentry-proof-redacted.json");
    expect(workflowSource).toContain("coverage/provider-webhook-ci-evidence.json");
    expect(workflowSource).toContain("test-results/provider-webhook-reconciliation");
    expect(unitManifest).toContain("providerWebhookReconciliationMatrix");
    expect(gapTracker).toContain("Provider webhook reconciliation evidence classifier wired and runtime-matrix gated");
    expect(gapTracker).toContain("providerWebhookReconciliationDecisionRequiredEvidence");
    expect(gapTracker).toContain("buildRedactedProviderWebhookReconciliationArtifact");
  });
});
