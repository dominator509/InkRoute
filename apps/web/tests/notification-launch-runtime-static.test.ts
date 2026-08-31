import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildNotificationLaunchRunData,
  buildNotificationLaunchDecisionRequiredEvidence,
  buildNotificationLaunchEvidenceDecision,
  notificationLaunchExternalArtifacts,
  notificationLaunchExternalCommands,
  notificationLaunchArtifactPaths,
  notificationLaunchExecutionPolicy,
  notificationLaunchLocalArtifacts,
  notificationLaunchLocalCommands,
  notificationLaunchRequiredEvidence,
  notificationLaunchRequiredExternalEvidence,
  notificationLaunchRunPersistenceContract,
  notificationLaunchRuntimeCommands,
  notificationLaunchRuntimeControls,
  notificationLaunchRuntimeMatrix,
  notificationLaunchPreferenceSuppressionPlans,
  notificationLaunchQueueWorkerPlans,
  notificationLaunchRedactionPrivacyDecisions,
  notificationLaunchTenantIsolationDecisions,
  notificationLaunchWebhookReplayDecisions,
  notificationLaunchRuntimeReadiness,
  notificationLaunchRuntimeProofFiles,
  buildNotificationLaunchExecutionPlan,
  buildNotificationLaunchArtifactReview,
  buildRedactedNotificationLaunchArtifact,
  persistNotificationLaunchRun,
} from "../lib/notificationLaunchRuntime";
import { notificationTenantIsolationRequiredControls } from "../lib/notificationTenantIsolationContract";
import { notificationWebhookReplayRequiredControls } from "../lib/notificationWebhookReplayContract";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("notification launch runtime contract", () => {
  const notificationsPackageJson = readRepoFile("packages/notifications/package.json");
  const notificationsSource = readRepoFile("packages/notifications/src/index.ts");
  const notificationsTests = readRepoFile("packages/notifications/tests/delivery-plan.test.ts");
  const messageReadTest = readRepoFile("apps/dashboard/tests/message-read-route-static.test.ts");
  const templateReadTest = readRepoFile("apps/dashboard/tests/template-read-route-static.test.ts");
  const emailWebhook = readRepoFile("apps/web/app/api/webhooks/email/route.ts");
  const smsWebhook = readRepoFile("apps/web/app/api/webhooks/sms/route.ts");
  const notificationPreviewRoute = readRepoFile("apps/web/app/api/public/[tenantSlug]/notification-previews/route.ts");
  const redactionPrivacyContract = readRepoFile("apps/web/lib/notificationRedactionPrivacyContract.ts");
  const tenantIsolationContract = readRepoFile("apps/web/lib/notificationTenantIsolationContract.ts");
  const webhookReplayContract = readRepoFile("apps/web/lib/notificationWebhookReplayContract.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const notificationLaunchMigration = readRepoFile(
    "packages/db/prisma/migrations/20260609033400_add_notification_launch_runs/migration.sql",
  );
  const notificationWorkerMigration = readRepoFile(
    "packages/db/prisma/migrations/20260623093000_add_notification_worker_jobs/migration.sql",
  );
  const providerEventMigration = readRepoFile("packages/db/prisma/migrations/20260613001100_add_provider_events/migration.sql");
  const preferenceSuppressionMigration = readRepoFile("packages/db/prisma/migrations/20260613001200_add_notification_preferences_suppressions/migration.sql");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins notification launch commands, controls, matrix rows, and artifacts", () => {
    expect(notificationLaunchRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/notifications typecheck",
      "pnpm --filter @inkroute/notifications test",
      "notification provider sandbox tests",
      "notification queue worker integration tests",
      "provider webhook signature/replay tests",
      "message thread/preference suppression integration tests",
      "Expo push device smoke",
      "GitHub Actions notification launch evidence job",
    ]);
    expect(notificationLaunchRuntimeControls).toContain("Verify provider signatures against raw webhook bodies and reject replayed events before side effects.");
    expect(notificationLaunchRuntimeControls).toContain("Redact raw destinations, provider payloads, message bodies, private URLs, and secrets from CI artifacts and logs.");
    expect(notificationLaunchRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "notifications-typecheck",
      "notifications-tests",
      "provider-sandbox-sends",
      "expo-push-device-smoke",
      "queue-worker-retry-dead-letter",
      "delivery-provider-thread-persistence",
      "preference-suppression-quiet-hours",
      "webhook-signature-replay",
      "tenant-isolation-redaction",
      "ci-secret-safe-artifacts",
    ]);
    expect(notificationLaunchArtifactPaths).toContain("coverage/notification-launch-runtime.json");
    expect(notificationLaunchArtifactPaths).toContain("test-results/notification-launch-runtime");
    expect(notificationsSource).toContain("Provider SDK credentials and live worker execution remain gated");
    expect(notificationsSource).toContain("queue, delivery-log, suppression, and opt-out contracts are wired");
    expect(notificationsSource).not.toContain("worker queue, delivery logs, and opt-out enforcement are not wired");
    expect(notificationPreviewRoute).toContain("template and consent delivery-plan previews");
    expect(notificationPreviewRoute).toContain("provider dispatch, durable queue writes, and live sends remain evidence-gated");
    expect(notificationPreviewRoute).not.toContain("static render/consent previews only");
  });

  it("pins the NotificationLaunchRun persistence model and migration", () => {
    const runData = buildNotificationLaunchRunData({
      tenantId: "tenant_static",
      runId: "notification_static",
      commitSha: "abc123",
      status: "blocked",
      notificationsTypecheckPassed: true,
      notificationsTestsPassed: true,
      providerSdksConfigured: false,
      resendSandboxSendPassed: false,
      twilioSandboxSendPassed: false,
      expoPushDeviceSendPassed: false,
      queueWorkerImplemented: false,
      deliveryPersistenceConfigured: false,
      providerEventPersistenceConfigured: false,
      messageThreadPersistenceConfigured: false,
      messagePersistenceConfigured: false,
      preferenceCenterImplemented: false,
      unsubscribeStopSuppressionTested: false,
      quietHoursRateLimitTested: false,
      signedWebhookVerificationPassed: false,
      retryDeadLetterFlowTested: false,
      tenantIsolationTestsPassed: false,
      redactionPrivacyReviewPassed: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactsCaptured: false,
      notificationLaunchRunPersisted: false,
      coveredControls: ["Redact raw destinations, provider payloads, message bodies, private URLs, and secrets from CI artifacts and logs."],
      capturedArtifacts: [
        "coverage/notification-launch-runtime.json",
        "coverage/notification-typecheck.txt",
        "coverage/notification-test.txt",
      ],
      completedCommands: [
        "pnpm --filter @inkroute/notifications typecheck",
        "pnpm --filter @inkroute/notifications test",
      ],
      notificationTypecheckArtifactPath: "coverage/notification-typecheck.txt",
      notificationTestArtifactPath: "coverage/notification-test.txt",
    });

    expect(notificationLaunchRunPersistenceContract.model).toBe("NotificationLaunchRun");
    expect(notificationLaunchRunPersistenceContract.tenantRelation).toBe("notificationLaunchRuns");
    expect(notificationLaunchRunPersistenceContract.migration).toBe("20260609033400_add_notification_launch_runs");
    expect(notificationLaunchRunPersistenceContract.jsonFields).toEqual([
      "commandMatrix",
      "controlManifest",
      "artifactManifest",
      "providerSendManifest",
      "suppressionManifest",
      "webhookReplayManifest",
    ]);
    expect(notificationLaunchRunPersistenceContract.evidenceBooleans).toContain("providerSdksConfigured");
    expect(notificationLaunchRunPersistenceContract.evidenceBooleans).toContain("retryDeadLetterFlowTested");
    expect(notificationLaunchRunPersistenceContract.evidenceBooleans).toContain("secretSafeArtifactsCaptured");
    expect(notificationLaunchRunPersistenceContract.artifactFields).toContain("webhookSignatureReplayArtifactPath");
    expect(notificationLaunchRunPersistenceContract.artifactFields).toContain("ciRunUrl");
    expect(prismaSchema).toContain("notificationLaunchRuns NotificationLaunchRun[]");
    expect(prismaSchema).toContain("model NotificationLaunchRun");
    expect(prismaSchema).toContain("model ProviderEvent");
    expect(prismaSchema).toContain("providerEvents ProviderEvent[]");
    expect(prismaSchema).toContain("model NotificationJob");
    expect(prismaSchema).toContain("model DeadLetterJob");
    expect(prismaSchema).toContain("model NotificationWorkerAuditLog");
    expect(prismaSchema).toContain("notificationJobs NotificationJob[]");
    expect(prismaSchema).toContain("deadLetterJobs   DeadLetterJob[]");
    expect(prismaSchema).toContain("notificationWorkerAuditLogs NotificationWorkerAuditLog[]");
    expect(prismaSchema).toContain("model NotificationChannelPreference");
    expect(prismaSchema).toContain("model NotificationSuppression");
    expect(prismaSchema).toContain("notificationChannelPreferences NotificationChannelPreference[]");
    expect(prismaSchema).toContain("notificationSuppressions NotificationSuppression[]");
    expect(providerEventMigration).toContain('CREATE TABLE "ProviderEvent"');
    expect(providerEventMigration).toContain('"rawPayloadStored" BOOLEAN NOT NULL DEFAULT false');
    expect(preferenceSuppressionMigration).toContain('CREATE TABLE "NotificationChannelPreference"');
    expect(preferenceSuppressionMigration).toContain('CREATE TABLE "NotificationSuppression"');
    expect(preferenceSuppressionMigration).toContain('"rawPayloadStored" BOOLEAN NOT NULL DEFAULT false');
    expect(prismaSchema).toContain("providerSendManifest");
    expect(prismaSchema).toContain("messagePersistenceConfigured");
    expect(prismaSchema).toContain("@@unique([tenantId, runId])");
    expect(notificationLaunchMigration).toContain('CREATE TABLE "NotificationLaunchRun"');
    expect(notificationLaunchMigration).toContain('"suppressionManifest" JSONB NOT NULL');
    expect(notificationLaunchMigration).toContain('"secretSafeArtifactsCaptured" BOOLEAN NOT NULL DEFAULT false');
    expect(notificationLaunchMigration).toContain('CREATE UNIQUE INDEX "NotificationLaunchRun_tenantId_runId_key"');
    expect(notificationWorkerMigration).toContain('CREATE TABLE "NotificationJob"');
    expect(notificationWorkerMigration).toContain('CREATE TABLE "DeadLetterJob"');
    expect(notificationWorkerMigration).toContain('CREATE TABLE "NotificationWorkerAuditLog"');
    expect(notificationWorkerMigration).toContain(
      'CREATE UNIQUE INDEX "NotificationJob_tenantId_idempotencyKey_sourceAction_key"',
    );
    expect(runData).toMatchObject({
      tenantId: "tenant_static",
      runId: "notification_static",
      commitSha: "abc123",
      status: "blocked",
      notificationsTypecheckPassed: true,
      notificationsTestsPassed: true,
      providerSdksConfigured: false,
      notificationTypecheckArtifactPath: "coverage/notification-typecheck.txt",
    });
    expect(runData.commandMatrix).toBe(notificationLaunchRuntimeMatrix);
    expect(runData.controlManifest).toEqual([
      "Redact raw destinations, provider payloads, message bodies, private URLs, and secrets from CI artifacts and logs.",
    ]);
    expect(runData.providerSendManifest.resendSandboxSendPassed).toBe(false);
    expect(String(persistNotificationLaunchRun)).toContain("repository.notificationLaunchRun.upsert");
  });

  it("keeps package scripts, launch helper, dashboard reads, and webhook boundaries wired", () => {
    expect(notificationsPackageJson).toContain('"typecheck"');
    expect(notificationsPackageJson).toContain('"test"');
    expect(notificationsSource).toContain("buildNotificationLaunchEvidencePlan");
    expect(notificationsSource).toContain("buildNotificationPreferenceSuppressionPlan");
    expect(notificationsSource).toContain("buildNotificationProviderHandoffWorkerPlan");
    expect(notificationsTests).toContain("buildNotificationLaunchEvidencePlan");
    expect(notificationsTests).toContain("buildNotificationPreferenceSuppressionPlan");
    expect(notificationsTests).toContain("buildNotificationProviderHandoffWorkerPlan");
    expect(redactionPrivacyContract).toContain("buildNotificationRedactionPrivacyDecision");
    expect(redactionPrivacyContract).toContain("Notification artifacts must not contain raw message bodies.");
    expect(redactionPrivacyContract).toContain("Notification artifact must include redaction label");
    expect(tenantIsolationContract).toContain("buildNotificationTenantIsolationDecision");
    expect(tenantIsolationContract).toContain("Notification data access must reject cross-tenant requests before repository calls.");
    expect(tenantIsolationContract).toContain("NotificationDelivery");
    expect(tenantIsolationContract).toContain("ProviderEvent");
    expect(webhookReplayContract).toContain("buildNotificationWebhookReplayDecision");
    expect(webhookReplayContract).toContain("Raw webhook body must be available");
    expect(webhookReplayContract).toContain("Provider webhook replay detected; reject before side effects.");
    expect(messageReadTest).toContain("body/provider/contact redaction");
    expect(templateReadTest).toContain('assertPermission(actor, "notification:read")');
    expect(emailWebhook).toContain("webhook");
    expect(smsWebhook).toContain("webhook");
    expect(emailWebhook).toContain("PROVIDER_EMAIL_WEBHOOK_RECONCILIATION_NOT_CONFIGURED");
    expect(emailWebhook).toContain("localEmailWebhookPersistenceDisabled");
    expect(smsWebhook).toContain("PROVIDER_SMS_WEBHOOK_RECONCILIATION_NOT_CONFIGURED");
    expect(smsWebhook).toContain("localSmsWebhookPersistenceDisabled");
    expect(notificationLaunchQueueWorkerPlans.map((plan) => plan.status)).toEqual(["ready", "ready"]);
    expect(notificationLaunchQueueWorkerPlans.map((plan) => plan.nextState)).toEqual(["processing", "dead_lettered"]);
    expect(notificationLaunchPreferenceSuppressionPlans.map((plan) => plan.status)).toEqual(["ready", "ready"]);
    expect(notificationLaunchPreferenceSuppressionPlans.flatMap((plan) => plan.requiredWrites)).toContain("NotificationSuppression");
    expect(notificationLaunchWebhookReplayDecisions.map((decision) => decision.status)).toEqual(["allow", "reject"]);
    expect(notificationLaunchWebhookReplayDecisions[0].requiredWrites).toContain("ProviderEvent");
    expect(notificationLaunchRedactionPrivacyDecisions.map((decision) => decision.status)).toEqual(["pass", "block"]);
    expect(notificationLaunchRedactionPrivacyDecisions[0].requiredLabels).toContain("destinationHash");
    expect(notificationLaunchTenantIsolationDecisions.map((decision) => decision.status)).toEqual(["allow", "deny"]);
    expect(notificationLaunchTenantIsolationDecisions[0].requiredControls).toBe(notificationTenantIsolationRequiredControls);
    expect(notificationLaunchWebhookReplayDecisions[0].requiredControls).toBe(notificationWebhookReplayRequiredControls);
  });

  it("keeps notification provider blockers explicit until provider evidence exists", () => {
    expect(notificationLaunchRuntimeReadiness.status).toBe("blocked");
    expect(notificationLaunchRuntimeReadiness.missingScripts).toEqual([]);
    expect(notificationLaunchRuntimeReadiness.requiredCommands).toBe(notificationLaunchRuntimeCommands);
    expect(notificationLaunchRuntimeReadiness.requiredControls).toBe(notificationLaunchRuntimeControls);
    expect(notificationLaunchRuntimeReadiness.requiredEvidence).toBe(notificationLaunchRequiredEvidence);
    expect(notificationLaunchRuntimeReadiness.requiredEvidence).not.toContain(
      "queue worker retry, idempotency, and dead-letter evidence",
    );
    expect(notificationLaunchRuntimeReadiness.requiredEvidence).not.toContain(
      "tenant-scoped NotificationDelivery, ProviderEvent, and MessageThread persistence evidence",
    );
    expect(notificationLaunchRuntimeReadiness.requiredEvidence).not.toContain(
      "preference center, unsubscribe, STOP, quiet-hours, and rate-limit evidence",
    );
    expect(notificationLaunchRuntimeReadiness.requiredEvidence).not.toContain("redacted artifact and privacy review evidence");
    expect(notificationLaunchRuntimeReadiness.requiredEvidence).not.toContain(
      "tenant-scoped NotificationDelivery, ProviderEvent, and MessageThread persistence evidence",
    );
    expect(notificationLaunchRuntimeReadiness.blockers).toContain(
      "Resend, Twilio, and Expo provider SDK runtimes must be configured.",
    );
    expect(notificationLaunchRuntimeReadiness.blockers).not.toContain(
      "Notification queue worker must be implemented before provider-backed delivery.",
    );
    expect(notificationsSource).toContain(
      "Notification queue worker source-contract and execution evidence must be captured before provider-backed delivery.",
    );
    expect(notificationLaunchRuntimeReadiness.blockers).not.toContain("Notification retry and dead-letter flows must be tested.");
    expect(notificationLaunchRuntimeReadiness.blockers).not.toContain("Tenant-scoped NotificationDelivery persistence must be configured.");
    expect(notificationLaunchRuntimeReadiness.blockers).not.toContain("Tenant-scoped ProviderEvent persistence must be configured.");
    expect(notificationLaunchRuntimeReadiness.blockers).not.toContain("Tenant-scoped MessageThread persistence must be configured.");
    expect(notificationLaunchRuntimeReadiness.blockers).not.toContain("Preference center and tenant channel settings must be implemented.");
    expect(notificationLaunchRuntimeReadiness.blockers).not.toContain("Email unsubscribe and SMS STOP suppression must be tested before launch.");
    expect(notificationLaunchRuntimeReadiness.blockers).not.toContain("SMS quiet-hours and notification rate-limit behavior must be tested.");
    expect(notificationLaunchRuntimeReadiness.blockers).not.toContain("Notification payload redaction and privacy review must pass.");
    expect(notificationLaunchRuntimeReadiness.blockers).not.toContain("Notification delivery, provider event, and message thread tenant isolation tests must pass.");
    expect(notificationLaunchRuntimeReadiness.blockers).toContain(
      "Provider webhook signature and replay verification tests must pass.",
    );
  });

  it("blocks notification launch closure until providers, queue, persistence, suppression, webhooks, CI, artifacts, controls, and commands are proven", () => {
    const decision = buildNotificationLaunchEvidenceDecision({
      notificationsTypecheckPassed: true,
      notificationsTestsPassed: true,
      providerSdksConfigured: false,
      resendSandboxSendPassed: false,
      twilioSandboxSendPassed: false,
      expoPushDeviceSendPassed: false,
      queueWorkerImplemented: true,
      deliveryPersistenceConfigured: true,
      providerEventPersistenceConfigured: true,
      messageThreadPersistenceConfigured: true,
      messagePersistenceConfigured: true,
      preferenceCenterImplemented: true,
      unsubscribeStopSuppressionTested: true,
      quietHoursRateLimitTested: true,
      signedWebhookVerificationPassed: false,
      retryDeadLetterFlowTested: true,
      tenantIsolationTestsPassed: true,
      redactionPrivacyReviewPassed: true,
      ciEvidenceCaptured: false,
      secretSafeArtifactsCaptured: false,
      notificationLaunchRunPersisted: false,
       coveredControls: ["Redact raw destinations, provider payloads, message bodies, private URLs, and secrets from CI artifacts and logs."],
      capturedArtifacts: [
        "coverage/notification-launch-runtime.json",
        "coverage/notification-typecheck.txt",
        "coverage/notification-test.txt",
        "coverage/notification-queue-worker.json",
        "coverage/notification-preference-suppression.json",
        "coverage/notification-retry-dead-letter.json",
        "coverage/notification-redaction-privacy.json",
        "coverage/notification-tenant-isolation.json",
      ],
      completedCommands: [
        "pnpm --filter @inkroute/notifications typecheck",
        "pnpm --filter @inkroute/notifications test",
        "notification queue worker integration tests",
        "message thread/preference suppression integration tests",
      ],
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingControls).toEqual([
      "Resolve consent, preference, suppression, quiet-hours, and rate-limit state immediately before every send.",
      "Persist NotificationDelivery, ProviderEvent, MessageThread, Message, audit, and idempotency records with tenant scope.",
      "Verify provider signatures against raw webhook bodies and reject replayed events before side effects.",
      "Process unsubscribe, STOP/HELP, bounce/complaint, invalid push token, retry, and dead-letter flows before future delivery attempts.",
    ]);
    expect(decision.missingArtifacts).toEqual([
      "coverage/notification-provider-sandbox.json",
      "coverage/notification-resend-sandbox.json",
      "coverage/notification-twilio-sandbox.json",
      "coverage/notification-expo-push-device.json",
      "coverage/notification-persistence.json",
      "coverage/notification-webhook-signature-replay.json",
      "coverage/notification-ci-evidence.json",
      "coverage/notification-secret-safe-artifacts.json",
      "test-results/notification-launch-runtime",
    ]);
    expect(decision.missingCommands).toEqual([
      "notification provider sandbox tests",
      "provider webhook signature/replay tests",
      "Expo push device smoke",
      "GitHub Actions notification launch evidence job",
    ]);
    expect(decision.requiredControls).toBe(notificationLaunchRuntimeControls);
    expect(decision.requiredArtifacts).toBe(notificationLaunchArtifactPaths);
    expect(decision.requiredCommands).toBe(notificationLaunchRuntimeCommands);
    expect(decision.requiredEvidence).toEqual(
      buildNotificationLaunchDecisionRequiredEvidence(notificationLaunchRuntimeReadiness.requiredEvidence),
    );
    expect(decision.requiredEvidence).toBe(notificationLaunchRequiredEvidence);
    expect(decision.blockers).toContain("Resend, Twilio, and Expo provider SDK runtimes must be configured.");
    expect(decision.blockers).toContain("NotificationLaunchRun persistence row must be captured for durable auditability.");
    expect(decision.blockers).toContain("Every required notification launch control must be covered.");
  });

  it("completes notification launch closure when providers, queue, persistence, suppression, webhooks, CI, artifacts, controls, and commands are proven", () => {
    const decision = buildNotificationLaunchEvidenceDecision({
      notificationsTypecheckPassed: true,
      notificationsTestsPassed: true,
      providerSdksConfigured: true,
      resendSandboxSendPassed: true,
      twilioSandboxSendPassed: true,
      expoPushDeviceSendPassed: true,
      queueWorkerImplemented: true,
      deliveryPersistenceConfigured: true,
      providerEventPersistenceConfigured: true,
      messageThreadPersistenceConfigured: true,
      messagePersistenceConfigured: true,
      preferenceCenterImplemented: true,
      unsubscribeStopSuppressionTested: true,
      quietHoursRateLimitTested: true,
      signedWebhookVerificationPassed: true,
      retryDeadLetterFlowTested: true,
      tenantIsolationTestsPassed: true,
      redactionPrivacyReviewPassed: true,
      ciEvidenceCaptured: true,
      secretSafeArtifactsCaptured: true,
      notificationLaunchRunPersisted: true,
      coveredControls: notificationLaunchRuntimeControls,
      capturedArtifacts: notificationLaunchArtifactPaths,
      completedCommands: notificationLaunchRuntimeCommands,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingControls).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingCommands).toEqual([]);
    expect(decision.blockers).toEqual([]);
  });

  it("keeps notification launch execution and artifact review local, redacted, and provider-gated", () => {
    const executionPlan = buildNotificationLaunchExecutionPlan();
    expect(executionPlan.localCommands).toBe(notificationLaunchLocalCommands);
    expect(executionPlan.localCommands).toEqual([
      "pnpm --filter @inkroute/notifications typecheck",
      "pnpm --filter @inkroute/notifications test",
      "notification queue worker integration tests",
      "message thread/preference suppression integration tests",
    ]);
    expect(executionPlan.externalCommands).toBe(notificationLaunchExternalCommands);
    expect(executionPlan.externalCommands).toEqual([
      "notification provider sandbox tests",
      "provider webhook signature/replay tests",
      "Expo push device smoke",
      "GitHub Actions notification launch evidence job",
    ]);
    expect(executionPlan.localArtifacts).toBe(notificationLaunchLocalArtifacts);
    expect(executionPlan.externalArtifacts).toBe(notificationLaunchExternalArtifacts);
    expect(executionPlan.localArtifacts).toContain("coverage/notification-redaction-privacy.json");
    expect(executionPlan.externalArtifacts).toContain("coverage/notification-provider-sandbox.json");
    expect(executionPlan.externalArtifacts).toContain("test-results/notification-launch-runtime");
    expect(executionPlan.providerExecutionAllowed).toBe(false);
    expect(executionPlan.deviceExecutionAllowed).toBe(false);
    expect(executionPlan.ciExecutionAllowed).toBe(false);
    expect(executionPlan.databaseExecutionAllowed).toBe(false);
    expect(executionPlan.executionPolicy).toBe(notificationLaunchExecutionPolicy);
    expect(executionPlan.executionPolicy).toEqual({
      codexMayClassifyStaticNotificationLaunchReadiness: true,
      providerEvidenceRequiredForClosure: true,
      providerDatabaseRequiredForPersistence: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(executionPlan.requiredExternalEvidence).toBe(notificationLaunchRequiredExternalEvidence);
    expect(executionPlan.requiredExternalEvidence).toContain(
      "Provider-backed NotificationLaunchRun persistence row captured through persistNotificationLaunchRun.",
    );

    const artifact = {
      providerToken: "github_pat_abcdefghijklmnopqrstuvwxyz123456",
      destinationEmail: "client@example.com",
      destinationPhone: "+1 555 222 1212",
      messageBody: "Raw client message body",
      nested: {
        databaseUrl: "postgres://inkroute:secret@db.example.com:5432/inkroute",
        providerEventId: "evt_notification_launch_1234567890",
        publicSummary: "notification launch provider evidence captured",
      },
      repositorySelector: "repo:dominator509/InkRoute",
      pullRequestSelector: "pr_notification_launch",
      reviewerHandle: "reviewer_notification_owner",
      codeownerSelector: "CODEOWNER:notifications-platform-team",
    };
    const redactedOnly = buildRedactedNotificationLaunchArtifact(artifact);
    const review = buildNotificationLaunchArtifactReview(artifact);
    const serialized = JSON.stringify(review.artifact);

    expect(JSON.stringify(redactedOnly)).not.toContain("client@example.com");
    expect(serialized).not.toContain("github_pat_abcdefghijklmnopqrstuvwxyz123456");
    expect(serialized).not.toContain("+1 555 222 1212");
    expect(serialized).not.toContain("Raw client message body");
    expect(serialized).not.toContain("postgres://inkroute:secret@db.example.com:5432/inkroute");
    expect(serialized).not.toContain("evt_notification_launch_1234567890");
    expect(serialized).not.toContain("repo:dominator509/InkRoute");
    expect(serialized).not.toContain("pr_notification_launch");
    expect(serialized).not.toContain("reviewer_notification_owner");
    expect(serialized).not.toContain("CODEOWNER:notifications-platform-team");
    expect(review.redactions).toEqual([
      "providerToken",
      "destinationEmail",
      "destinationPhone",
      "messageBody",
      "nested.databaseUrl",
      "nested.providerEventId",
      "nested.publicSummary",
      "repositorySelector",
      "pullRequestSelector",
      "reviewerHandle",
      "codeownerSelector",
    ]);
    expect(review.safeForTracker).toBe(true);
    expect(review.requiredExternalEvidence).toBe(notificationLaunchRequiredExternalEvidence);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming notification launch readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 9 notification launch runtime contracts");
    expect(ciWorkflow).toContain("notification-launch-runtime-static.test.ts");
    expect(ciWorkflow).toContain("notification-launch-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-notification-launch-runtime-static");
    expect(unitManifest).toContain("NotificationLaunchRun Prisma model and app row contract");
    expect(gapTracker).toContain("NotificationLaunchRun");
    expect(gapTracker).toContain("apps/web/lib/notificationLaunchRuntime.ts");
    expect(gapTracker).toContain("persistNotificationLaunchRun upsert seam");
    expect(gapTracker).toContain("preference/unsubscribe DB-first route persistence plus safe public preference and unsubscribe persistence response projections without internal ID echoes are credited through GAP-067");
    expect(gapTracker).toContain("live notification typecheck/tests, provider SDK configuration, sandbox/device sends, live provider-backed queue execution and retry/dead-letter execution evidence, delivery/provider/message persistence integration, live provider-driven STOP/quiet-hours suppression execution, signed webhook replay source controls, tenant isolation, live CI secret-safe redaction/privacy artifact review, CI evidence, provider-backed persistNotificationLaunchRun execution, and secret-safe artifacts remain open");
    expect(gapTracker).toContain("GAP-010 is notification-launch-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("proof inventory");
    expect(gapTracker).toContain("buildNotificationLaunchDecisionRequiredEvidence");
    expect(gapTracker).toContain("notificationLaunchRequiredEvidence");
    expect(gapTracker).toContain("buildNotificationLaunchExecutionPlan");
    expect(gapTracker).toContain("notificationLaunchLocalCommands/notificationLaunchExternalCommands");
    expect(gapTracker).toContain("notificationLaunchExecutionPolicy");
    expect(gapTracker).toContain("notificationLaunchRequiredExternalEvidence");
    expect(gapTracker).toContain("buildRedactedNotificationLaunchArtifact");
    expect(gapTracker).toContain("buildNotificationLaunchArtifactReview");
    expect(gapTracker).toContain("durable NotificationJob/DeadLetterJob/NotificationWorkerAuditLog migration");
    expect(gapTracker).toContain("live provider-backed queue execution and retry/dead-letter execution evidence");
  });

  it("pins current notification launch proof files for GAP-010", () => {
    expect(notificationLaunchRuntimeProofFiles).toContain("packages/notifications/package.json");
    expect(notificationLaunchRuntimeProofFiles).toContain("packages/db/prisma/migrations/20260623093000_add_notification_worker_jobs/migration.sql");
    expect(notificationLaunchRuntimeProofFiles).toContain("packages/db/prisma/migrations/20260613001100_add_provider_events/migration.sql");
    expect(notificationLaunchRuntimeProofFiles).toContain("packages/db/prisma/migrations/20260613001200_add_notification_preferences_suppressions/migration.sql");
    expect(notificationLaunchRuntimeProofFiles).toContain("apps/web/lib/notificationRedactionPrivacyContract.ts");
    expect(notificationLaunchRuntimeProofFiles).toContain("apps/web/lib/notificationTenantIsolationContract.ts");
    expect(notificationLaunchRuntimeProofFiles).toContain("apps/web/lib/notificationWebhookReplayContract.ts");
    expect(notificationLaunchRuntimeProofFiles).toContain("apps/web/lib/notificationLaunchRuntime.ts");
    expect(notificationLaunchRuntimeProofFiles).toContain("apps/web/tests/notification-launch-runtime-static.test.ts");
    for (const proofFile of notificationLaunchRuntimeProofFiles) {
      expect(readRepoFile(proofFile).length).toBeGreaterThan(0);
    }
  });
});



