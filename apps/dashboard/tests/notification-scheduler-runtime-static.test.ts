import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildNotificationSchedulerArtifactReview,
  buildNotificationSchedulerEvidenceDecision,
  buildNotificationSchedulerExecutionPlan,
  buildRedactedNotificationSchedulerArtifact,
  notificationSchedulerExternalCommands,
  notificationSchedulerExecutionPolicy,
  notificationSchedulerArtifactPaths,
  notificationSchedulerDecisionRequiredEvidence,
  notificationSchedulerLocalCommands,
  notificationSchedulerRequiredExternalEvidence,
  notificationSchedulerRuntimeProofFiles,
  notificationSchedulerRuntimeCommands,
  notificationSchedulerRuntimeMatrix,
  notificationSchedulerRuntimeReadiness,
} from "../lib/notificationSchedulerRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("dashboard notification scheduler runtime contract", () => {
  const notificationsPackageJson = readRepoFile("packages/notifications/package.json");
  const notificationsSource = readRepoFile("packages/notifications/src/index.ts");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const notificationWorkerMigration = readRepoFile(
    "packages/db/prisma/migrations/20260623093000_add_notification_worker_jobs/migration.sql",
  );
  const schedulerSource = readRepoFile("apps/dashboard/lib/notificationScheduler.ts");
  const routeSource = readRepoFile("apps/dashboard/app/api/notifications/scheduler/route.ts");
  const queueRouteSource = readRepoFile("apps/dashboard/app/api/notifications/queue/route.ts");
  const pageSource = readRepoFile("apps/dashboard/app/templates/page.tsx");
  const actionPanelSource = readRepoFile("apps/dashboard/components/NotificationSchedulerActionPanel.tsx");
  const staticTest = readRepoFile("apps/dashboard/tests/notification-scheduler-static.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins GAP-065 commands, matrix rows, and artifacts", () => {
    expect(notificationSchedulerRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/notifications typecheck",
      "pnpm --filter @inkroute/notifications test",
      "pnpm --filter @inkroute/dashboard typecheck",
      "pnpm vitest run apps/dashboard/tests/notification-scheduler-static.test.ts",
      "notification scheduler Postgres queue integration tests",
      "notification retry/backoff and dead-letter integration tests",
      "appointment reschedule/cancel scheduled-job cancellation integration tests",
      "idempotent due-job worker concurrency test",
      "provider dispatch worker integration tests",
    ]);
    expect(notificationSchedulerRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "notifications-typecheck",
      "notifications-tests",
      "dashboard-typecheck",
      "static-contract",
      "queue-backend",
      "notification-job-persistence",
      "dead-letter-persistence",
      "worker-audit-persistence",
      "idempotency-key",
      "scheduler-process",
      "worker-process",
      "provider-dispatch",
      "due-job-concurrency",
      "retry-backoff",
      "cancellation",
      "postgres-queue",
      "ci-scheduler-job",
      "secret-safe-artifacts",
    ]);
    expect(notificationSchedulerArtifactPaths).toContain("coverage/notification-scheduler-runtime.json");
    expect(notificationSchedulerArtifactPaths).toContain("coverage/notification-scheduler-due-job-concurrency.json");
    expect(notificationSchedulerArtifactPaths).toContain("test-results/notification-scheduler-runtime");
  });

  it("keeps package helper, dashboard scheduler contract, API boundary, page surface, and static guard wired", () => {
    expect(notificationsPackageJson).toContain('"typecheck"');
    expect(notificationsPackageJson).toContain('"test"');
    expect(notificationsSource).toContain("buildNotificationSchedulerRuntimeReadinessPlan");
    expect(notificationsSource).toContain("buildNotificationSchedulerPlan");
    expect(schedulerSource).toContain("executeNotificationSchedulerPlan");
    expect(schedulerSource).toContain("createInMemoryNotificationSchedulerRepository");
    expect(schedulerSource).toContain("PrismaNotificationSchedulerWorkerRepositoryClient");
    expect(schedulerSource).toContain("createPrismaNotificationSchedulerWorkerRepository");
    expect(schedulerSource).toContain('notificationSchedulerWorkerIdempotencyScope = "notification.scheduler.worker"');
    expect(schedulerSource).toContain("buildRedactedNotificationSchedulerMetadata");
    expect(schedulerSource).toContain("persistNotificationJobs");
    expect(schedulerSource).toContain("persistDeadLetter");
    expect(schedulerSource).toContain("persistWorkerAuditLog");
    expect(schedulerSource).toContain("client.notificationJob.createMany");
    expect(schedulerSource).toContain("client.deadLetterJob.create");
    expect(schedulerSource).toContain("client.notificationWorkerAuditLog.create");
    expect(prismaSchema).toContain("model NotificationJob");
    expect(prismaSchema).toContain("model DeadLetterJob");
    expect(prismaSchema).toContain("model NotificationWorkerAuditLog");
    expect(prismaSchema).toContain("@@index([tenantId, state, availableAt])");
    expect(notificationWorkerMigration).toContain('CREATE TABLE "NotificationJob"');
    expect(notificationWorkerMigration).toContain('CREATE TABLE "DeadLetterJob"');
    expect(notificationWorkerMigration).toContain('CREATE TABLE "NotificationWorkerAuditLog"');
    expect(routeSource).toContain('assertPermission(actor, "message:write")');
    expect(routeSource).toContain("buildDashboardSchedulerPlanFromAction");
    expect(routeSource).toContain('export const runtime = "nodejs"');
    expect(routeSource).toContain("tx.appointment.findFirst");
    expect(routeSource).toContain("tx.bookingRequest.findFirst");
    expect(routeSource).toContain("tx.idempotencyKey.upsert");
    expect(routeSource).toContain("tx.notification.create");
    expect(routeSource).toContain("tx.notificationDelivery.create");
    expect(routeSource).toContain("tx.notificationProviderHandoff.create");
    expect(routeSource).toContain("tx.auditLog.create");
    expect(routeSource).toContain("idempotencyKeyId");
    expect(routeSource).toContain("idempotencyReplay");
    expect(queueRouteSource).toContain('export const runtime = "nodejs"');
    expect(queueRouteSource).toContain("tx.idempotencyKey.upsert");
    expect(queueRouteSource).toContain("requestHash");
    expect(queueRouteSource).toContain('status: "idempotency_conflict"');
    expect(queueRouteSource).toContain('code: "IDEMPOTENCY_CONFLICT"');
    expect(queueRouteSource).toContain("tx.idempotencyKey.update");
    expect(queueRouteSource).toContain("idempotencyKeyId");
    expect(queueRouteSource).toContain("idempotencyReplay");
    expect(queueRouteSource).toContain("summarizeQueueReplayResult");
    expect(queueRouteSource).toContain("rawIdempotencyResultEchoed: false");
    expect(queueRouteSource).toContain("rawIdempotencyKeyEchoed: false");
    expect(queueRouteSource).not.toContain("result: result.result");
    expect(queueRouteSource).toContain("summarizeDeliveryPlanForResponse");
    expect(queueRouteSource).toContain("notificationResponseAllowlisted: true");
    expect(queueRouteSource).toContain("rawDestinationsEchoed: false");
    expect(queueRouteSource).toContain("tenantIdEchoed: false");
    expect(queueRouteSource).toContain("internalPersistenceIdsEchoed: false");
    expect(queueRouteSource).toContain("clientProfileNameSelectedFromDatabase: false");
    expect(queueRouteSource).toContain("select: { id: true, email: true, phone: true, marketingOptIn: true, smsOptIn: true }");
    expect(queueRouteSource).toContain("bodyPreviewStored: false");
    expect(queueRouteSource).toContain("bodyPreviewEchoed: false");
    expect(queueRouteSource).not.toContain("...result.notification");
    expect(queueRouteSource).not.toContain("preferredName: true");
    expect(queueRouteSource).not.toContain("bodyPreview: input.body.slice");
    expect(routeSource).toContain("plan: buildSafeNotificationSchedulerPlanResponse(plan)");
    expect(routeSource).toContain("rawIdempotencyKeyEchoed: false");
    expect(routeSource).toContain("rawScheduledJobsEchoed: false");
    expect(routeSource).toContain("rawWritePayloadsEchoed: false");
    expect(routeSource).toContain("rawCancellationReasonEchoed: false");
    expect(routeSource).toContain("tenantIdEchoed: false");
    expect(routeSource).toContain("internalPersistenceIdsEchoed: false");
    expect(routeSource).not.toContain("ok: true,\n      tenantId,");
    expect(routeSource).not.toContain("ok: false,\n        tenantId,");
    expect(routeSource).not.toMatch(/^\s+plan,\s*$/m);
    expect(routeSource).toContain("NOTIFICATION_SCHEDULER_PERSISTENCE_NOT_CONFIGURED");
    expect(routeSource).toContain("schedulerLocalContractFallbackDisabled");
    expect(routeSource).not.toContain("schedulerPlanOnlyWritesDisabled");
    expect(pageSource).toContain("Queue scheduler contract");
    expect(pageSource).toContain("NotificationSchedulerActionPanel");
    expect(actionPanelSource).toContain('fetch("/api/notifications/scheduler"');
    expect(actionPanelSource).toContain('action: "schedule_sequence"');
    expect(actionPanelSource).toContain("Queue automation plan");
    expect(actionPanelSource).toContain("wired through the local queue contract");
    expect(actionPanelSource).not.toContain("plan-only");
    expect(staticTest).toContain("covers schedule, process, retry, cancel, and dead-letter actions");
    expect(staticTest).toContain("redacts nested notification scheduler worker metadata");
    expect(staticTest).toContain("executes a local notification scheduler repository contract");
  });

  it("keeps backend, persistence, worker, provider, concurrency, integration, CI, and artifact blockers explicit", () => {
    expect(notificationSchedulerRuntimeReadiness.status).toBe("blocked");
    expect(notificationSchedulerRuntimeReadiness.missingScripts).toEqual([]);
    expect(notificationSchedulerRuntimeReadiness.requiredCommands).toBe(notificationSchedulerRuntimeCommands);
    expect(notificationSchedulerRuntimeReadiness.requiredEvidence).toBe(notificationSchedulerDecisionRequiredEvidence);
    expect(notificationSchedulerRuntimeReadiness.blockers).not.toContain("Notification queue backend must be configured before scheduler promotion.");
    expect(notificationSchedulerRuntimeReadiness.blockers).not.toContain("NotificationJob persistence must be available.");
    expect(notificationSchedulerRuntimeReadiness.blockers).not.toContain("Due-job claiming must be transactional to prevent duplicate sends.");
    expect(notificationSchedulerRuntimeReadiness.blockers).not.toContain("DeadLetterJob persistence must be available.");
    expect(notificationSchedulerRuntimeReadiness.blockers).not.toContain("Worker audit log persistence must be available.");
  });

  it("pins the non-executing GAP-065 notification scheduler execution policy", () => {
    const plan = buildNotificationSchedulerExecutionPlan();

    expect(notificationSchedulerExecutionPolicy).toEqual({
      codexMayClassifyStaticNotificationSchedulerReadiness: true,
      localCommandEvidenceRequiredForClosure: true,
      queueBackendRequiredForClosure: true,
      durableJobRepositoriesRequiredForClosure: true,
      schedulerWorkerDeploymentRequiredForClosure: true,
      providerDispatchRequiredForClosure: true,
      dueJobConcurrencyRequiredForClosure: true,
      retryDeadLetterRequiredForClosure: true,
      cancellationRequiredForClosure: true,
      ciEvidenceRequiredForClosure: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(plan.policy).toBe(notificationSchedulerExecutionPolicy);
    expect(plan.commandExecutionAllowed).toBe(false);
    expect(plan.queueBackendExecutionAllowed).toBe(false);
    expect(plan.durableRepositoryExecutionAllowed).toBe(false);
    expect(plan.schedulerProcessExecutionAllowed).toBe(false);
    expect(plan.workerProcessExecutionAllowed).toBe(false);
    expect(plan.providerDispatchExecutionAllowed).toBe(false);
    expect(plan.concurrencyExecutionAllowed).toBe(false);
    expect(plan.integrationExecutionAllowed).toBe(false);
    expect(plan.ciExecutionAllowed).toBe(false);
    expect(plan.artifactReviewExecutionAllowed).toBe(false);
    expect(plan.localCommands).toBe(notificationSchedulerLocalCommands);
    expect(plan.externalCommands).toBe(notificationSchedulerExternalCommands);
    expect(plan.requiredExternalEvidence).toBe(notificationSchedulerRequiredExternalEvidence);
    expect(notificationSchedulerRequiredExternalEvidence).toEqual([
      "actual notification scheduler command output",
      "queue backend configuration evidence",
      "NotificationJob persistence tests",
      "DeadLetterJob persistence tests",
      "NotificationWorkerAuditLog persistence tests",
      "scheduler IdempotencyKey persistence tests",
      "scheduler and worker process deployment evidence",
      "provider dispatch worker integration evidence",
      "Postgres due-job concurrency tests",
      "retry/backoff and dead-letter integration tests",
      "appointment reschedule/cancel scheduled-job cancellation tests",
      "CI notification scheduler artifacts",
      "secret-safe notification scheduler artifact review",
    ]);
  });

  it("pins recursive notification scheduler artifact redaction and review", () => {
    const redacted = buildRedactedNotificationSchedulerArtifact({
      tenantId: "tenant_private",
      notificationJobPayload: "private message body",
      providerDispatchUrl: "https://private/provider",
      workerAuditLogId: "audit_private",
      publicSummary: "notification scheduler evidence captured",
      nested: {
        deadLetterPayload: "failed private payload",
        publicStatus: "retry-scheduled",
      },
      safeNote:
        "evidence_notification_scheduler_01HZYXZYXZYXZYXZYXZYXZYXZ wrote artifacts/notification-scheduler/private-proof.json",
      safeQueuePath: "test-results/notification-scheduler-runtime/private-queue.json",
      safeWorkerRun: "scheduler_run_01HZYXZYXZYXZYXZYXZYXZYXZ",
    });

    expect(redacted.secretSafe).toBe(true);
    expect(redacted.redactedPaths).toEqual([
      "tenantId",
      "notificationJobPayload",
      "providerDispatchUrl",
      "workerAuditLogId",
      "nested.deadLetterPayload",
      "safeNote",
      "safeQueuePath",
      "safeWorkerRun",
    ]);
    expect(redacted.artifact).toEqual({
      tenantId: "[redacted]",
      notificationJobPayload: "[redacted]",
      providerDispatchUrl: "[redacted]",
      workerAuditLogId: "[redacted]",
      publicSummary: "notification scheduler evidence captured",
      nested: {
        deadLetterPayload: "[redacted]",
        publicStatus: "retry-scheduled",
      },
      safeQueuePath: "[redacted]",
      safeWorkerRun: "[redacted]",
    });
    expect(JSON.stringify(redacted.artifact)).not.toContain(
      "evidence_notification_scheduler_01HZYXZYXZYXZYXZYXZYXZYXZ",
    );
    expect(JSON.stringify(redacted.artifact)).not.toContain(
      "artifacts/notification-scheduler/private-proof.json",
    );
    expect(JSON.stringify(redacted.artifact)).not.toContain(
      "test-results/notification-scheduler-runtime/private-queue.json",
    );
    expect(JSON.stringify(redacted.artifact)).not.toContain(
      "scheduler_run_01HZYXZYXZYXZYXZYXZYXZYXZ",
    );

    const review = buildNotificationSchedulerArtifactReview({
      publicSummary: "safe notification scheduler artifact",
      queueBackendUrl: "https://private/queue",
    });

    expect(review.passed).toBe(true);
    expect(review.blockers).toEqual([]);
    expect(review.artifact.secretSafe).toBe(true);
    expect(review.artifact.redactedPaths).toEqual(["queueBackendUrl"]);
    expect(review.requiredExternalEvidence).toBe(notificationSchedulerRequiredExternalEvidence);
  });

  it("classifies notification scheduler evidence before GAP-065 can close", () => {
    const blockedDecision = buildNotificationSchedulerEvidenceDecision({
      notificationsTypecheckPassed: true,
      notificationsTestsPassed: true,
      dashboardTypecheckPassed: true,
      staticContractTestsPassed: true,
      queueBackendVerified: false,
      notificationJobPersistenceVerified: false,
      deadLetterPersistenceVerified: false,
      workerAuditPersistenceVerified: false,
      idempotencyKeyVerified: false,
      schedulerProcessVerified: false,
      workerProcessVerified: false,
      providerDispatchVerified: false,
      dueJobConcurrencyVerified: false,
      retryBackoffVerified: false,
      cancellationVerified: false,
      postgresQueueVerified: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactReviewPassed: false,
      capturedArtifacts: [
        "coverage/notification-scheduler-runtime.json",
        "coverage/notification-scheduler-notifications-typecheck.txt",
        "coverage/notification-scheduler-notifications-test.txt",
        "coverage/notification-scheduler-dashboard-typecheck.txt",
        "coverage/notification-scheduler-static-contract.json",
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toContain("Notification queue backend evidence is missing.");
    expect(blockedDecision.blockers).toContain("NotificationJob persistence evidence is missing.");
    expect(blockedDecision.blockers).toContain("Provider dispatch worker evidence is missing.");
    expect(blockedDecision.blockers).toContain("Transactional due-job concurrency evidence is missing.");
    expect(blockedDecision.blockers).toContain("Postgres queue integration evidence is missing.");
    expect(blockedDecision.blockers).toContain(
      "Secret-safe notification scheduler artifact review evidence is missing.",
    );
    expect(blockedDecision.missingArtifacts).toContain("coverage/notification-scheduler-queue-backend.json");
    expect(blockedDecision.missingArtifacts).toContain("coverage/notification-scheduler-secret-safe-artifacts.json");
    expect(blockedDecision.requiredCommands).toBe(notificationSchedulerRuntimeCommands);
    expect(blockedDecision.requiredEvidence).toBe(notificationSchedulerDecisionRequiredEvidence);
    expect(blockedDecision.redactedSummary).toEqual({
      capturedArtifactCount: 5,
      requiredArtifactCount: notificationSchedulerArtifactPaths.length,
    });

    const completeDecision = buildNotificationSchedulerEvidenceDecision({
      notificationsTypecheckPassed: true,
      notificationsTestsPassed: true,
      dashboardTypecheckPassed: true,
      staticContractTestsPassed: true,
      queueBackendVerified: true,
      notificationJobPersistenceVerified: true,
      deadLetterPersistenceVerified: true,
      workerAuditPersistenceVerified: true,
      idempotencyKeyVerified: true,
      schedulerProcessVerified: true,
      workerProcessVerified: true,
      providerDispatchVerified: true,
      dueJobConcurrencyVerified: true,
      retryBackoffVerified: true,
      cancellationVerified: true,
      postgresQueueVerified: true,
      ciEvidenceCaptured: true,
      secretSafeArtifactReviewPassed: true,
      capturedArtifacts: notificationSchedulerArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
    expect(completeDecision.requiredEvidence).toBe(notificationSchedulerDecisionRequiredEvidence);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming live queue execution", () => {
    expect(ciWorkflow).toContain("Run Phase 9 notification scheduler runtime contracts");
    expect(ciWorkflow).toContain("notification-scheduler-runtime-static.test.ts");
    expect(ciWorkflow).toContain("notification-scheduler-runtime-artifacts");
    expect(unitManifest).toContain("unit-notification-scheduler-runtime-static");
    expect(gapTracker).toContain("apps/dashboard/lib/notificationSchedulerRuntime.ts");
    expect(gapTracker).toContain("notification scheduler evidence classifier");
    expect(gapTracker).toContain("buildNotificationSchedulerExecutionPlan");
    expect(gapTracker).toContain("notificationSchedulerExecutionPolicy");
    expect(gapTracker).toContain("notificationSchedulerRequiredExternalEvidence");
    expect(gapTracker).toContain("notificationSchedulerDecisionRequiredEvidence");
    expect(gapTracker).toContain("buildRedactedNotificationSchedulerArtifact");
    expect(gapTracker).toContain("buildNotificationSchedulerArtifactReview");
    expect(gapTracker).toContain("non-executing notification scheduler execution policy");
    expect(gapTracker).toContain("local in-memory notification scheduler repository contract");
    expect(gapTracker).toContain("notification scheduler metadata sanitizer");
    expect(gapTracker).toContain("GAP-065 is notification-scheduler-runtime-matrix wired with notification scheduler evidence classifier");
    expect(notificationSchedulerArtifactPaths).toContain("coverage/notification-scheduler-secret-safe-artifacts.json");
  });

  it("pins current notification scheduler proof files for GAP-065", () => {
    expect(notificationSchedulerRuntimeProofFiles).toEqual(expect.arrayContaining([
      "apps/dashboard/package.json",
      "packages/notifications/package.json",
      "packages/notifications/src/index.ts",
      "packages/notifications/tests/delivery-plan.test.ts",
      "packages/db/prisma/schema.prisma",
      "packages/db/prisma/migrations/20260623093000_add_notification_worker_jobs/migration.sql",
      "apps/dashboard/lib/notificationScheduler.ts",
      "apps/dashboard/lib/notificationSchedulerRuntime.ts",
      "apps/dashboard/app/api/notifications/scheduler/route.ts",
      "apps/dashboard/app/templates/page.tsx",
      "apps/dashboard/components/NotificationSchedulerActionPanel.tsx",
      "apps/dashboard/tests/notification-scheduler-static.test.ts",
      "apps/dashboard/tests/notification-scheduler-runtime-static.test.ts",
      "testing/manifests/unit-test-manifest.json",
      ".github/workflows/ci.yml",
    ]));
    for (const file of notificationSchedulerRuntimeProofFiles) {
      expect(readRepoFile(file).length).toBeGreaterThan(0);
    }
  });
});


