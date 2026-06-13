import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildNotificationPersistenceEvidenceDecision,
  notificationPersistenceArtifactPaths,
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
  const persistenceSource = readRepoFile("apps/dashboard/lib/notificationPersistence.ts");
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
      "provider worker handoff integration tests",
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
      "packages/db/prisma/schema.prisma",
      "packages/types/src/index.ts",
      "packages/auth/src/index.ts",
      "packages/notifications/package.json",
      "packages/notifications/src/index.ts",
      "packages/notifications/tests/delivery-plan.test.ts",
      "apps/dashboard/lib/notificationPersistence.ts",
      "apps/dashboard/lib/notificationPersistenceRuntime.ts",
      "apps/dashboard/app/messages/page.tsx",
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
    expect(prismaSchema).toContain("model MessageThread");
    expect(prismaSchema).toContain("model Message");
    expect(prismaSchema).toContain("model Notification");
    expect(prismaSchema).toContain("model NotificationDelivery");
    expect(persistenceSource).toContain("buildDashboardMessagePersistencePlan");
    expect(persistenceSource).toContain("claimMessageIdempotencyKey");
    expect(routeSource).toContain('assertPermission(actor, "message:write")');
    expect(routeSource).toContain("prisma.$transaction");
    expect(staticTest).toContain("transaction writes");
    expect(messageReadTest).toContain("provider message id redaction");
  });

  it("keeps idempotency, read-state, status transition, worker, Postgres, tenant, CI, and artifact blockers explicit", () => {
    expect(notificationPersistenceRuntimeReadiness.status).toBe("blocked");
    expect(notificationPersistenceRuntimeReadiness.missingScripts).toEqual([]);
    expect(notificationPersistenceRuntimeReadiness.requiredCommands).toEqual([
      "pnpm --filter @inkroute/notifications typecheck",
      "pnpm --filter @inkroute/notifications test",
      "notification repository Postgres integration tests",
      "cross-tenant notification/message isolation tests",
      "delivery status transition and read/unread state integration tests",
    ]);
    expect(notificationPersistenceRuntimeReadiness.requiredEvidence).toEqual(expect.arrayContaining([
      "transactional audit/idempotency write evidence",
      "Postgres tenant-isolation and persistence integration test evidence",
    ]));
    expect(notificationPersistenceRuntimeReadiness.blockers).toContain("Delivery status transition persistence must be available.");
    expect(notificationPersistenceRuntimeReadiness.blockers).toContain("NotificationReadState persistence must be available.");
    expect(notificationPersistenceRuntimeReadiness.blockers).toContain("Idempotency store must be available for persistence mutations.");
    expect(notificationPersistenceRuntimeReadiness.blockers).toContain("Postgres integration tests must pass for notification/message repositories.");
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
      idempotencyKeyVerified: false,
      readStateVerified: false,
      statusTransitionVerified: false,
      providerWorkerHandoffVerified: false,
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
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toContain("IdempotencyKey persistence evidence is missing.");
    expect(blockedDecision.blockers).toContain("NotificationReadState persistence evidence is missing.");
    expect(blockedDecision.blockers).toContain("Delivery status transition evidence is missing.");
    expect(blockedDecision.blockers).toContain("Provider worker handoff evidence is missing.");
    expect(blockedDecision.blockers).toContain("Notification repository Postgres integration evidence is missing.");
    expect(blockedDecision.blockers).toContain(
      "Secret-safe notification persistence artifact review evidence is missing.",
    );
    expect(blockedDecision.missingArtifacts).toContain("coverage/notification-persistence-idempotency-key.json");
    expect(blockedDecision.missingArtifacts).toContain("coverage/notification-persistence-secret-safe-artifacts.json");
    expect(blockedDecision.requiredCommands).toEqual([...notificationPersistenceRuntimeCommands]);
    expect(blockedDecision.requiredEvidence).toContain("provider worker handoff integration evidence");
    expect(blockedDecision.redactedSummary).toEqual({
      capturedArtifactCount: 6,
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
  });

  it("wires CI, manifest, tracker, and artifacts without claiming seeded Postgres readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 9 notification persistence runtime contracts");
    expect(ciWorkflow).toContain("notification-persistence-runtime-static.test.ts");
    expect(ciWorkflow).toContain("notification-persistence-runtime-artifacts");
    expect(unitManifest).toContain("unit-notification-persistence-runtime-static");
    expect(gapTracker).toContain("apps/dashboard/lib/notificationPersistenceRuntime.ts");
    expect(gapTracker).toContain("notification persistence evidence classifier");
    expect(gapTracker).toContain("GAP-064 is notification-persistence-runtime-matrix wired with evidence classifier");
    expect(notificationPersistenceArtifactPaths).toContain("coverage/notification-persistence-secret-safe-artifacts.json");
  });
});
