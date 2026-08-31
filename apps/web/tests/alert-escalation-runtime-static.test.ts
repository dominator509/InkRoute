import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  alertEscalationArtifactPaths,
  alertEscalationExecutionPolicy,
  alertEscalationProofFiles,
  alertEscalationRequiredExternalEvidence,
  alertEscalationRuntimeCommands,
  alertEscalationRuntimeRequiredEvidence,
  buildAlertEscalationArtifactReview,
  buildAlertEscalationEvidenceDecision,
  buildAlertEscalationExecutionPlan,
  buildRedactedAlertEscalationArtifact,
} from "../lib/alertEscalationRuntime";

const root = join(__dirname, "..", "..");
const routeSource = readFileSync(join(root, "apps/web/app/api/observability/alerts/route.ts"), "utf8");
const workflowSource = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");
const trackerSource = readFileSync(join(root, "GAP_TRACKER.md"), "utf8");
const unitManifest = readFileSync(join(root, "testing/manifests/unit-test-manifest.json"), "utf8");
const prismaSchema = readFileSync(join(root, "packages/db/prisma/schema.prisma"), "utf8");
const alertDeliveryMigration = readFileSync(
  join(root, "packages/db/prisma/migrations/20260613000400_add_alert_deliveries/migration.sql"),
  "utf8",
);

describe("alert escalation runtime contract", () => {
  it("requires an internal worker token before alert enqueueing", () => {
    expect(routeSource).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(routeSource).toContain("ALERT_WORKER_TOKEN");
    expect(routeSource).toContain("authorizeAlertWorker");
    expect(routeSource).toContain("ALERT_WORKER_UNAUTHORIZED");
    expect(routeSource).toContain("ALERT_WORKER_TOKEN_NOT_CONFIGURED");
    expect(routeSource).toContain("{ status: process.env.ALERT_WORKER_TOKEN ? 401 : 503, headers: noStoreHeaders }");
    expect(routeSource).not.toContain("{ status: process.env.ALERT_WORKER_TOKEN ? 401 : 501, headers: noStoreHeaders }");
  });

  it("builds sanitized escalation plans from observability reports", () => {
    expect(routeSource).toContain("buildObservabilityReportDraft");
    expect(routeSource).toContain("buildAlertEscalationPlan");
    expect(routeSource).toContain("sanitizedPayload");
    expect(routeSource).toContain("suppressExternalDelivery");
    expect(routeSource).toContain("rawPayloadStored: false");
  });

  it("persists durable alert delivery and acknowledgement state through AlertDelivery plus AuditLog metadata", () => {
    expect(routeSource).toContain("prisma.$transaction");
    expect(routeSource).toContain("tx.alertDelivery.create");
    expect(routeSource).toContain("tx.auditLog.create");
    expect(routeSource).toContain('entityType: "AlertDelivery"');
    expect(routeSource).toContain("alert-delivery-transaction");
    expect(routeSource).toContain("alertDeliveryRecorded: result.alertDeliveryRecorded");
    expect(routeSource).toContain("buildSafeAlertReportResponse");
    expect(routeSource).toContain("buildSafeAlertPayloadPreview");
    expect(routeSource).toContain("rawReportEchoed: false");
    expect(routeSource).toContain("reportIdEchoed: false");
    expect(routeSource).toContain("fingerprintEchoed: false");
    expect(routeSource).toContain("rawPayloadEchoed: false");
    expect(routeSource).toContain("rawSanitizedPayloadEchoed: false");
    expect(routeSource).toContain("alertDeliveryIdEchoed: false");
    expect(routeSource).toContain("auditLogged: result.auditLogged");
    expect(routeSource).toContain("auditLogIdEchoed: false");
    expect(routeSource).toContain("internalPersistenceIdsEchoed: false");
    expect(routeSource).toContain("reportMatched: true");
    expect(routeSource).toContain("alertDeliveryRecorded: true");
    expect(routeSource).toContain("internalPersistenceIdsStored: false");
    expect(routeSource).not.toContain("reportId: report.id");
    expect(routeSource).not.toContain("alertDeliveryId: result.alertDeliveryId");
    expect(routeSource).not.toContain("auditLogId: result.auditLogId");
    expect(routeSource).not.toContain("auditLogId: null");
    expect(routeSource).not.toContain("reportId: input.report.id");
    expect(routeSource).not.toContain("alertDeliveryId: alertDelivery.id");
    expect(routeSource).toContain("acknowledgementState");
    expect(routeSource).toContain("exponential-backoff-3-attempts");
    expect(routeSource).toContain("configured-dead-letter-after-retry-exhaustion");
  });

  it("pins the AlertDelivery queue, acknowledgement, retry, and callback schema", () => {
    expect(prismaSchema).toContain("model AlertDelivery");
    expect(prismaSchema).toContain("deliveryState            String");
    expect(prismaSchema).toContain("acknowledgementState     String");
    expect(prismaSchema).toContain("retryPolicy              String");
    expect(prismaSchema).toContain("deadLetterState          String");
    expect(prismaSchema).toContain("providerCallbackReceivedAt DateTime?");
    expect(prismaSchema).toContain("providerCallbackPayload  Json?");
    expect(prismaSchema).toContain("alertDeliveries AlertDelivery[]");
    expect(alertDeliveryMigration).toContain('CREATE TABLE "AlertDelivery"');
    expect(alertDeliveryMigration).toContain('"AlertDelivery_tenantId_deliveryState_createdAt_idx"');
    expect(alertDeliveryMigration).toContain('"AlertDelivery_tenantId_acknowledgementState_idx"');
    expect(alertDeliveryMigration).toContain('FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE');
    expect(alertDeliveryMigration).toContain('FOREIGN KEY ("errorReportId") REFERENCES "ErrorReport"("id") ON DELETE SET NULL');
  });

  it("keeps provider credentials and live delivery proof gated", () => {
    expect(routeSource).toContain("SLACK_WEBHOOK_URL");
    expect(routeSource).toContain("ALERT_EMAIL_PROVIDER");
    expect(routeSource).toContain("PAGERDUTY_ROUTING_KEY");
    expect(routeSource).toContain("liveCriticalPagerDeliveryVerified: false");
    expect(routeSource).toContain("liveHighSlackDeliveryVerified: false");
    expect(routeSource).toContain("ALERT_ESCALATION_DELIVERY_NOT_CONFIGURED");
    expect(routeSource).toContain("alertDeliveryEnqueueDisabled");
    expect(routeSource).toContain("requiresDurableWorkerExecutor");
    expect(routeSource).toContain("ALERT_ESCALATION_PERSISTENCE_NOT_AVAILABLE");
    expect(routeSource).toContain("alertDeliveryPersistenceRequired");
    expect(routeSource).toContain("databaseWriteFallbackDisabled");
  });

  it("pins the alert escalation command and artifact matrix", () => {
    expect(routeSource).toContain("alertEscalationRuntimeCommands");
    expect(routeSource).toContain("alertEscalationRuntimeMatrix");
    for (const id of [
      "worker-executor",
      "provider-credentials",
      "on-call-schedule",
      "quiet-hours-routing",
      "provider-callbacks",
      "live-critical-pager",
      "live-high-slack",
      "ci-alert-escalation-gate",
      "secret-safe-artifacts",
    ]) {
      expect(routeSource).toContain(`id: "${id}"`);
    }
  });

  it("declares redacted alert artifacts and CI coverage", () => {
    expect(routeSource).toContain("coverage/alert-escalation-runtime.json");
    expect(routeSource).toContain("coverage/alert-worker-retry-dead-letter.json");
    expect(routeSource).toContain("coverage/alert-acknowledgement-state.json");
    expect(routeSource).toContain("coverage/alert-sanitized-payload-redacted.json");
    expect(routeSource).toContain("coverage/alert-live-critical-pager-redacted.json");
    expect(routeSource).toContain("coverage/alert-live-high-slack-redacted.json");
    expect(routeSource).toContain("coverage/alert-worker-executor.json");
    expect(routeSource).toContain("coverage/alert-provider-callbacks-redacted.json");
    expect(routeSource).toContain("coverage/alert-ci-evidence.json");
    expect(routeSource).toContain("coverage/alert-secret-safe-artifacts.json");
    expect(workflowSource).toContain("Run Phase 11 alert escalation runtime contracts");
    expect(workflowSource).toContain("apps/web/tests/alert-escalation-runtime-static.test.ts");
    expect(workflowSource).toContain("coverage/alert-ci-evidence.json");
    expect(unitManifest).toContain("alertEscalationRuntimeMatrix");
  });

  it("builds a local execution plan without worker, provider, or migration execution", () => {
    const plan = buildAlertEscalationExecutionPlan();

    expect(plan.id).toBe("gap-083-alert-escalation");
    expect(plan.durableWorkerExecutionAllowed).toBe(false);
    expect(plan.providerDeliveryAllowed).toBe(false);
    expect(plan.migrationExecutionAllowed).toBe(false);
    expect(plan.policy).toBe(alertEscalationExecutionPolicy);
    expect(plan.policy).toEqual({
      executeDurableWorker: false,
      executeProviderDelivery: false,
      executeMigration: false,
      executeOnCallRouting: false,
      executeProviderCallbacks: false,
      executeLiveSyntheticProviderProof: false,
      executeCi: false,
    });
    expect(plan.requiredCommands).toBe(alertEscalationRuntimeCommands);
    expect(plan.requiredArtifacts).toBe(alertEscalationArtifactPaths);
    expect(plan.requiredEvidence).toBe(alertEscalationRuntimeRequiredEvidence);
    expect(plan.localContractArtifacts).toEqual(
      expect.arrayContaining(["coverage/alert-route-static-contract.json", "coverage/alert-sanitized-payload-redacted.json"]),
    );
    expect(plan.workerArtifacts).toEqual(["coverage/alert-worker-retry-dead-letter.json", "coverage/alert-worker-executor.json"]);
    expect(plan.providerArtifacts).toEqual(
      expect.arrayContaining(["coverage/alert-provider-credentials-redacted.json", "coverage/alert-live-critical-pager-redacted.json"]),
    );
    expect(plan.scheduleArtifacts).toEqual(["coverage/alert-on-call-schedule.json", "coverage/alert-quiet-hours-routing.json"]);
    expect(plan.callbackArtifacts).toEqual(["coverage/alert-acknowledgement-state.json", "coverage/alert-provider-callbacks-redacted.json"]);
    expect(plan.secretSafeArtifactPath).toBe("coverage/alert-secret-safe-artifacts.json");
    expect(plan.externalEvidenceRequired).toBe(alertEscalationRequiredExternalEvidence);
    expect(plan.externalEvidenceRequired).toEqual([
      "AlertDelivery migration applied in a non-production database",
      "durable worker executor smoke and retry/dead-letter proof",
      "Slack/email/pager credential-gated delivery tests",
      "on-call schedule and quiet-hours routing tests",
      "provider acknowledgement callback persistence tests",
      "live synthetic critical/high provider proof, CI evidence, and secret-safe artifacts",
    ]);
  });

  it("redacts alert escalation artifacts before persistence", () => {
    const rawArtifact = {
      provider: {
        slackWebhook: "https://hooks.slack.com/services/T000/B000/slack-secret-token",
        pagerdutyRoutingKey: "pagerduty-routing-key-secret",
        email: "oncall@example.com",
        phone: "+1 555 010 7777",
      },
      payload: {
        rawBody: "critical alert stack with private booking note",
        sanitizedPayload: { severity: "critical", route: "/api/observability/alerts" },
      },
      repositorySelector: "repo:dominator509/InkRoute",
      pullRequestSelector: "pr_alert_escalation",
      reviewerHandle: "reviewer_alert_owner",
      codeownerSelector: "CODEOWNER:observability-platform-team",
    };

    const redacted = buildRedactedAlertEscalationArtifact(rawArtifact);
    const review = buildAlertEscalationArtifactReview("alert-live-critical-pager", rawArtifact);
    const serialized = JSON.stringify(review.redactedArtifact);

    expect(JSON.stringify(redacted)).not.toContain("slack-secret-token");
    expect(serialized).not.toContain("pagerduty-routing-key-secret");
    expect(serialized).not.toContain("oncall@example.com");
    expect(serialized).not.toContain("+1 555 010 7777");
    expect(serialized).not.toContain("private booking note");
    expect(serialized).not.toContain("repo:dominator509/InkRoute");
    expect(serialized).not.toContain("pr_alert_escalation");
    expect(serialized).not.toContain("reviewer_alert_owner");
    expect(serialized).not.toContain("CODEOWNER:observability-platform-team");
    expect(serialized).toContain("critical");
    expect(review.safeToPersist).toBe(true);
    expect(review.unsafeFindings).toEqual([]);
    expect(review.requiredArtifactPath).toBe("coverage/alert-secret-safe-artifacts.json");
  });

  it("pins current alert escalation proof files for GAP-083", () => {
    expect(alertEscalationProofFiles).toEqual(
      expect.arrayContaining([
        "packages/observability/src/index.ts",
        "packages/observability/tests/redaction-report.test.ts",
        "packages/db/prisma/schema.prisma",
        "packages/db/prisma/migrations/20260613000400_add_alert_deliveries/migration.sql",
        "apps/web/app/api/observability/alerts/route.ts",
        "apps/web/tests/alert-escalation-runtime-static.test.ts",
        "apps/dashboard/app/errors/page.tsx",
        ".github/workflows/ci.yml",
        "testing/manifests/unit-test-manifest.json",
      ]),
    );
    for (const file of alertEscalationProofFiles) {
      expect(readFileSync(join(root, file), "utf8").length).toBeGreaterThan(0);
    }
  });

  it("classifies GAP-083 alert escalation evidence as blocked until every worker and provider artifact is captured", () => {
    const blocked = buildAlertEscalationEvidenceDecision({
      observabilityTypecheckPassed: true,
      observabilityTestsPassed: true,
      routeStaticContractPassed: true,
      workerRetryDeadLetterVerified: false,
      workerExecutorVerified: false,
      providerCredentialsVerified: false,
      onCallScheduleVerified: false,
      quietHoursRoutingVerified: false,
      acknowledgementStateVerified: false,
      providerCallbacksVerified: false,
      sanitizedPayloadCaptured: true,
      liveCriticalPagerProofCaptured: false,
      liveHighSlackProofCaptured: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactReviewPassed: false,
      capturedArtifacts: ["coverage/alert-escalation-runtime.json"],
    });

    expect(blocked.status).toBe("blocked");
    expect(blocked.blockers).toEqual(
      expect.arrayContaining([
        "Durable AlertDelivery worker executor evidence is required.",
        "Slack/email/pager credential-gated delivery evidence is required.",
        "On-call schedule routing evidence is required.",
        "Provider acknowledgement callback persistence evidence is required.",
        "Live synthetic critical pager proof evidence is required.",
      ]),
    );
    expect(blocked.missingArtifacts).toContain("coverage/alert-worker-executor.json");
    expect(blocked.requiredCommands).toBe(alertEscalationRuntimeCommands);

    const complete = buildAlertEscalationEvidenceDecision({
      observabilityTypecheckPassed: true,
      observabilityTestsPassed: true,
      routeStaticContractPassed: true,
      workerRetryDeadLetterVerified: true,
      workerExecutorVerified: true,
      providerCredentialsVerified: true,
      onCallScheduleVerified: true,
      quietHoursRoutingVerified: true,
      acknowledgementStateVerified: true,
      providerCallbacksVerified: true,
      sanitizedPayloadCaptured: true,
      liveCriticalPagerProofCaptured: true,
      liveHighSlackProofCaptured: true,
      ciEvidenceCaptured: true,
      secretSafeArtifactReviewPassed: true,
      capturedArtifacts: alertEscalationArtifactPaths,
    });

    expect(complete.status).toBe("complete");
    expect(complete.blockers).toEqual([]);
    expect(complete.missingArtifacts).toEqual([]);
    expect(complete.redactedSummary).toContain("CI-safe redacted provider artifacts captured");
  });

  it("updates GAP-083 tracker language without claiming live provider proof", () => {
    expect(trackerSource).toContain("GAP-083");
    expect(trackerSource).toContain("ALERT_WORKER_TOKEN");
    expect(trackerSource).toContain("AlertDelivery");
    expect(trackerSource).toContain("alert-escalation-runtime-matrix wired with alert escalation evidence classifier");
    expect(trackerSource).toContain("worker-token missing-config no-store 503");
    expect(trackerSource).toContain("live synthetic critical/high provider proof");
  });
});
