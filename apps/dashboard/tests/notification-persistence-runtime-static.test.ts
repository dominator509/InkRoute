import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildNotificationPersistenceArtifactReview,
  buildNotificationPersistenceEvidenceDecision,
  buildNotificationPersistenceExecutionPlan,
  buildRedactedNotificationPersistenceArtifact,
  notificationPersistenceArtifactPaths,
  notificationPersistenceDecisionRequiredEvidence,
  notificationPersistenceExecutionPolicy,
  notificationPersistenceExternalCommands,
  notificationPersistenceLocalCommands,
  notificationPersistenceRequiredExternalEvidence,
  notificationPersistenceRuntimeCommands,
  notificationPersistenceRuntimeMatrix,
  notificationPersistenceRuntimeProofFiles,
  notificationPersistenceRuntimeReadiness,
} from "../lib/notificationPersistenceRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("dashboard notification persistence runtime contract", () => {
  const notificationsPackageJson = readRepoFile("packages/notifications/package.json");
  const notificationsSource = readRepoFile("packages/notifications/src/index.ts");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const notificationPersistenceMigration = readRepoFile(
    "packages/db/prisma/migrations/20260613000800_add_notification_idempotency_read_state/migration.sql",
  );
  const notificationStatusTransitionMigration = readRepoFile(
    "packages/db/prisma/migrations/20260613000900_add_notification_delivery_status_transitions/migration.sql",
  );
  const notificationProviderHandoffMigration = readRepoFile(
    "packages/db/prisma/migrations/20260613001000_add_notification_provider_handoffs/migration.sql",
  );
  const persistenceSource = readRepoFile("apps/dashboard/lib/notificationPersistence.ts");
  const repositoryContractSource = readRepoFile("apps/dashboard/lib/notificationPersistenceRepository.ts");
  const routeSource = readRepoFile("apps/dashboard/app/api/messages/route.ts");
  const staticTest = readRepoFile("apps/dashboard/tests/notification-persistence-static.test.ts");
  const messageReadTest = readRepoFile("apps/dashboard/tests/message-read-route-static.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins GAP-064 commands, matrix rows, and artifacts", () => {
    expect(notificationPersistenceRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/notifications typecheck",
      "pnpm --filter @inkroute/notifications test",
      "pnpm --filter @inkroute/dashboard typecheck",
      "pnpm vitest run apps/dashboard/tests/notification-persistence-static.test.ts",
      "notification repository Postgres integration tests",
      "cross-tenant notification/message isolation tests",
      "delivery status transition and read/unread state integration tests",
      "provider worker handoff source-row and worker-plan tests",
    ]);
    expect(notificationPersistenceRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "notifications-typecheck",
      "notifications-tests",
      "dashboard-typecheck",
      "static-contract",
      "prisma-schema",
      "repository-contract",
      "message-transaction",
      "notification-delivery",
      "audit-log",
      "idempotency-key",
      "read-state",
      "status-transition",
      "provider-worker-handoff",
      "rbac-redaction",
      "tenant-isolation",
      "postgres-integration",
      "ci-notification-persistence-job",
      "secret-safe-artifacts",
    ]);
    expect(notificationPersistenceArtifactPaths).toContain("coverage/notification-persistence-runtime.json");
    expect(notificationPersistenceArtifactPaths).toContain("coverage/notification-persistence-idempotency-key.json");
    expect(notificationPersistenceArtifactPaths).toContain("test-results/notification-persistence-runtime");
  });

  it("pins current notification persistence proof files for GAP-064", () => {
    expect(notificationPersistenceRuntimeProofFiles).toEqual(expect.arrayContaining([
      "apps/dashboard/package.json",
      "packages/db/prisma/schema.prisma",
      "packages/db/prisma/migrations/20260613001000_add_notification_provider_handoffs/migration.sql",
      "packages/types/package.json",
  "packages/types/src/index.ts",
      "packages/auth/src/index.ts",
      "packages/notifications/package.json",
      "packages/notifications/src/index.ts",
      "packages/notifications/tests/delivery-plan.test.ts",
      "apps/dashboard/lib/notificationPersistence.ts",
      "apps/dashboard/lib/notificationPersistenceRepository.ts",
      "apps/dashboard/lib/notificationPersistenceRuntime.ts",
      "apps/dashboard/app/messages/page.tsx",
      "apps/dashboard/components/MessageActionPanel.tsx",
      "apps/dashboard/app/api/messages/route.ts",
      "apps/dashboard/app/api/messages/[threadId]/route.ts",
      "apps/dashboard/tests/message-read-route-static.test.ts",
      "apps/dashboard/tests/notification-persistence-static.test.ts",
      "apps/dashboard/tests/notification-persistence-runtime-static.test.ts",
      "testing/manifests/unit-test-manifest.json",
      ".github/workflows/ci.yml",
    ]));
    for (const file of notificationPersistenceRuntimeProofFiles) {
      expect(readRepoFile(file).length).toBeGreaterThan(0);
    }
  });

  it("keeps package helper, Prisma models, dashboard contract, route writes, and static guards wired", () => {
    expect(notificationsPackageJson).toContain('"typecheck"');
    expect(notificationsPackageJson).toContain('"test"');
    expect(notificationsSource).toContain("buildNotificationPersistenceRuntimeReadinessPlan");
    expect(notificationsSource).toContain("buildMessageThreadDraft");
    expect(notificationsSource).toContain("buildNotificationProviderHandoffWorkerPlan");
    expect(readRepoFile("apps/dashboard/components/MessageActionPanel.tsx")).toContain('fetch("/api/messages"');
    expect(readRepoFile("apps/dashboard/components/MessageActionPanel.tsx")).toContain("Queue safe follow-up");
    expect(prismaSchema).toContain("model MessageThread");
    expect(prismaSchema).toContain("model Message");
    expect(prismaSchema).toContain("model Notification");
    expect(prismaSchema).toContain("model NotificationDelivery");
    expect(prismaSchema).toContain("model IdempotencyKey");
    expect(prismaSchema).toContain("model NotificationReadState");
    expect(prismaSchema).toContain("model NotificationDeliveryStatusTransition");
    expect(prismaSchema).toContain("model NotificationProviderHandoff");
    expect(notificationPersistenceMigration).toContain('CREATE TABLE "IdempotencyKey"');
    expect(notificationPersistenceMigration).toContain('CREATE TABLE "NotificationReadState"');
    expect(notificationStatusTransitionMigration).toContain('CREATE TABLE "NotificationDeliveryStatusTransition"');
    expect(notificationProviderHandoffMigration).toContain('CREATE TABLE "NotificationProviderHandoff"');
    expect(persistenceSource).toContain("buildDashboardMessagePersistencePlan");
    expect(persistenceSource).toContain("claimMessageIdempotencyKey");
    expect(persistenceSource).toContain("upsertNotificationReadState");
    expect(persistenceSource).toContain("createNotificationDeliveryStatusTransition");
    expect(persistenceSource).toContain("createNotificationProviderHandoff");
    expect(persistenceSource).toContain("providerHandoffWorkerPlan");
    expect(persistenceSource).toContain("claim_due_handoff");
    expect(repositoryContractSource).toContain("notificationPersistenceRepositoryContract");
    expect(repositoryContractSource).toContain("tenantScopedFiltersRequired");
    expect(repositoryContractSource).toContain("transactionRequired");
    expect(repositoryContractSource).toContain("rawBodyStorageForbidden");
    expect(repositoryContractSource).toContain("createInMemoryNotificationPersistenceRepository");
    expect(repositoryContractSource).toContain("buildRedactedNotificationPersistencePayload");
    expect(routeSource).toContain('assertPermission(actor, "message:write")');
    expect(routeSource).toContain("prisma.$transaction");
    expect(routeSource).toContain("tx.idempotencyKey.create");
    expect(routeSource).toContain("tx.idempotencyKey.update");
    expect(routeSource).toContain("tx.notificationReadState.upsert");
    expect(routeSource).toContain("tx.notificationDeliveryStatusTransition.create");
    expect(routeSource).toContain("tx.notificationProviderHandoff.create");
    expect(routeSource).toContain('code: "DUPLICATE_MESSAGE_WRITE"');
    expect(staticTest).toContain("transaction writes");
    expect(staticTest).toContain("redacts nested notification persistence payloads");
    expect(staticTest).toContain("executes a local notification persistence repository contract");
    expect(messageReadTest).toContain("providerMessageId:");
  });

  it("keeps worker, Postgres, tenant, CI, and artifact blockers explicit", () => {
    expect(notificationPersistenceRuntimeReadiness.status).toBe("blocked");
    expect(notificationPersistenceRuntimeReadiness.missingScripts).toEqual([]);
    expect(notificationPersistenceRuntimeReadiness.requiredCommands).toEqual(notificationPersistenceRuntimeCommands);
    expect(notificationPersistenceRuntimeReadiness.requiredEvidence).toEqual(notificationPersistenceDecisionRequiredEvidence);
    expect(notificationPersistenceRuntimeReadiness.blockers).not.toContain("Delivery status transition persistence must be available.");
    expect(notificationPersistenceRuntimeReadiness.blockers).not.toContain("NotificationReadState persistence must be available.");
    expect(notificationPersistenceRuntimeReadiness.blockers).not.toContain("NotificationProviderHandoff persistence must be available.");
    expect(notificationPersistenceRuntimeReadiness.blockers).not.toContain("Idempotency store must be available for persistence mutations.");
    expect(notificationPersistenceRuntimeReadiness.blockers).toContain("Postgres integration tests must pass for notification/message repositories.");
  });

  it("pins the non-executing GAP-064 notification persistence execution policy", () => {
    const plan = buildNotificationPersistenceExecutionPlan();

    expect(notificationPersistenceExecutionPolicy).toEqual({
      codexMayClassifyStaticNotificationPersistenceReadiness: true,
      localCommandEvidenceRequiredForClosure: true,
      schemaMigrationEvidenceRequiredForClosure: true,
      repositoryContractRequiredForClosure: true,
      idempotencyReadStateStatusTransitionRequiredForClosure: true,
      providerHandoffRequiredForClosure: true,
      seededPostgresRequiredForClosure: true,
      tenantIsolationRequiredForClosure: true,
      liveProviderWorkerRequiredForClosure: true,
      ciEvidenceRequiredForClosure: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(plan.policy).toEqual(notificationPersistenceExecutionPolicy);
    expect(plan.commandExecutionAllowed).toEqual(false);
    expect(plan.schemaMigrationExecutionAllowed).toEqual(false);
    expect(plan.repositoryExecutionAllowed).toEqual(false);
    expect(plan.seededPostgresExecutionAllowed).toEqual(false);
    expect(plan.providerWorkerExecutionAllowed).toEqual(false);
    expect(plan.tenantIsolationExecutionAllowed).toEqual(false);
    expect(plan.ciExecutionAllowed).toEqual(false);
    expect(plan.artifactReviewExecutionAllowed).toEqual(false);
    expect(plan.localCommands).toEqual(notificationPersistenceLocalCommands);
    expect(plan.externalCommands).toEqual(notificationPersistenceExternalCommands);
    expect(plan.requiredExternalEvidence).toEqual(notificationPersistenceRequiredExternalEvidence);
    expect(notificationPersistenceRequiredExternalEvidence).toEqual([
      "actual notification persistence command output",
      "Prisma schema and migration evidence",
      "repository contract execution evidence",
      "MessageThread/Message/Notification/NotificationDelivery/AuditLog transaction evidence",
      "IdempotencyKey and NotificationReadState persistence evidence",
      "NotificationDeliveryStatusTransition persistence evidence",
      "NotificationProviderHandoff source-row and worker-plan evidence",
      "seeded Postgres tenant isolation/redaction/RBAC/audit execution",
      "live provider worker execution evidence",
      "CI notification persistence artifacts",
      "secret-safe notification persistence artifact review",
    ]);
  });

  it("pins recursive notification persistence artifact redaction and review", () => {
    const redacted = buildRedactedNotificationPersistenceArtifact({
      tenantId: "tenant_private",
      messageBodyPreview: "private message",
      notificationDestinationHash: "hash_private",
      providerHandoffPayload: "payload_private",
      publicSummary: "notification persistence evidence captured",
      nested: {
        auditActorEmail: "artist@example.test",
        publicStatus: "queued",
      },
    });

    expect(redacted.secretSafe).toEqual(true);
    expect(redacted.redactedPaths).toEqual([
      "tenantId",
      "messageBodyPreview",
      "notificationDestinationHash",
      "providerHandoffPayload",
      "nested.auditActorEmail",
    ]);
    expect(redacted.artifact).toEqual({
      tenantId: "[redacted]",
      messageBodyPreview: "[redacted]",
      notificationDestinationHash: "[redacted]",
      providerHandoffPayload: "[redacted]",
      publicSummary: "notification persistence evidence captured",
      nested: {
        auditActorEmail: "[redacted]",
        publicStatus: "queued",
      },
    });

    const review = buildNotificationPersistenceArtifactReview({
      publicSummary: "safe notification persistence artifact",
      providerWorkerHandoffUrl: "https://private/handoff.json",
    });

    expect(review.passed).toEqual(true);
    expect(review.blockers).toEqual([]);
    expect(review.artifact.secretSafe).toEqual(true);
    expect(review.artifact.redactedPaths).toEqual(["providerWorkerHandoffUrl"]);
    expect(review.requiredExternalEvidence).toEqual(notificationPersistenceRequiredExternalEvidence);
  });

  it("classifies notification persistence evidence before GAP-064 can close", () => {
    const blockedDecision = buildNotificationPersistenceEvidenceDecision({
      notificationsTypecheckPassed: true,
      notificationsTestsPassed: true,
      dashboardTypecheckPassed: true,
      staticContractTestsPassed: true,
      prismaSchemaVerified: true,
      repositoryContractVerified: true,
      messageTransactionVerified: true,
      notificationDeliveryVerified: true,
      auditLogVerified: true,
      idempotencyKeyVerified: true,
      readStateVerified: true,
      statusTransitionVerified: true,
      providerWorkerHandoffVerified: true,
      rbacRedactionVerified: true,
      tenantIsolationVerified: false,
      postgresIntegrationVerified: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactReviewPassed: false,
      capturedArtifacts: [
        "coverage/notification-persistence-runtime.json",
        "coverage/notification-persistence-notifications-typecheck.txt",
        "coverage/notification-persistence-notifications-test.txt",
        "coverage/notification-persistence-dashboard-typecheck.txt",
        "coverage/notification-persistence-static-contract.json",
        "coverage/notification-persistence-prisma-schema.json",
        "coverage/notification-persistence-idempotency-key.json",
        "coverage/notification-persistence-read-state.json",
        "coverage/notification-persistence-status-transition.json",
        "coverage/notification-persistence-provider-worker-handoff.json",
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).not.toContain("IdempotencyKey persistence evidence is missing.");
    expect(blockedDecision.blockers).not.toContain("NotificationReadState persistence evidence is missing.");
    expect(blockedDecision.blockers).not.toContain("Delivery status transition evidence is missing.");
    expect(blockedDecision.blockers).not.toContain("Provider worker handoff evidence is missing.");
    expect(blockedDecision.blockers).toContain("Notification repository Postgres integration evidence is missing.");
    expect(blockedDecision.blockers).toContain(
      "Secret-safe notification persistence artifact review evidence is missing.",
    );
    expect(blockedDecision.missingArtifacts).not.toContain("coverage/notification-persistence-idempotency-key.json");
    expect(blockedDecision.missingArtifacts).not.toContain("coverage/notification-persistence-read-state.json");
    expect(blockedDecision.missingArtifacts).not.toContain("coverage/notification-persistence-status-transition.json");
    expect(blockedDecision.missingArtifacts).not.toContain("coverage/notification-persistence-provider-worker-handoff.json");
    expect(blockedDecision.missingArtifacts).toContain("coverage/notification-persistence-secret-safe-artifacts.json");
    expect(blockedDecision.requiredCommands).toEqual(notificationPersistenceRuntimeCommands);
    expect(blockedDecision.requiredEvidence).toEqual(notificationPersistenceDecisionRequiredEvidence);
    expect(blockedDecision.redactedSummary).toEqual({
      capturedArtifactCount: 10,
      requiredArtifactCount: notificationPersistenceArtifactPaths.length,
    });

    const completeDecision = buildNotificationPersistenceEvidenceDecision({
      notificationsTypecheckPassed: true,
      notificationsTestsPassed: true,
      dashboardTypecheckPassed: true,
      staticContractTestsPassed: true,
      prismaSchemaVerified: true,
      repositoryContractVerified: true,
      messageTransactionVerified: true,
      notificationDeliveryVerified: true,
      auditLogVerified: true,
      idempotencyKeyVerified: true,
      readStateVerified: true,
      statusTransitionVerified: true,
      providerWorkerHandoffVerified: true,
      rbacRedactionVerified: true,
      tenantIsolationVerified: true,
      postgresIntegrationVerified: true,
      ciEvidenceCaptured: true,
      secretSafeArtifactReviewPassed: true,
      capturedArtifacts: notificationPersistenceArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
    expect(completeDecision.requiredEvidence).toEqual(notificationPersistenceDecisionRequiredEvidence);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming seeded Postgres readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 9 notification persistence runtime contracts");
    expect(ciWorkflow).toContain("notification-persistence-runtime-static.test.ts");
    expect(ciWorkflow).toContain("notification-persistence-runtime-artifacts");
    expect(unitManifest).toContain("unit-notification-persistence-runtime-static");
    expect(gapTracker).toContain("apps/dashboard/lib/notificationPersistenceRuntime.ts");
    expect(gapTracker).toContain("notification persistence evidence classifier");
    expect(gapTracker).toContain("buildNotificationPersistenceExecutionPlan");
    expect(gapTracker).toContain("notificationPersistenceExecutionPolicy");
    expect(gapTracker).toContain("notificationPersistenceRequiredExternalEvidence");
    expect(gapTracker).toContain("notificationPersistenceDecisionRequiredEvidence");
    expect(gapTracker).toContain("buildRedactedNotificationPersistenceArtifact");
    expect(gapTracker).toContain("buildNotificationPersistenceArtifactReview");
    expect(gapTracker).toContain("non-executing notification persistence execution policy");
    expect(gapTracker).toContain("local in-memory notification persistence repository contract");
    expect(gapTracker).toContain("notification persistence payload sanitizer");
    expect(gapTracker).toContain("GAP-064 is notification-persistence-runtime-matrix wired with notification persistence evidence classifier");
    expect(notificationPersistenceArtifactPaths).toContain("coverage/notification-persistence-secret-safe-artifacts.json");
  });
});


