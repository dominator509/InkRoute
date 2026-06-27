import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildAvailabilityPersistenceArtifactReview,
  buildAvailabilityPersistenceEvidenceDecision,
  buildAvailabilityPersistenceExecutionPlan,
  buildRedactedAvailabilityPersistenceArtifact,
  availabilityPersistenceArtifactPaths,
  availabilityPersistenceDecisionRequiredEvidence,
  availabilityPersistenceExternalCommands,
  availabilityPersistenceLocalCommands,
  availabilityPersistenceRequiredExternalEvidence,
  availabilityPersistenceRuntimeCommands,
  availabilityPersistenceRuntimeMatrix,
  availabilityPersistenceRuntimeProofFiles,
  availabilityPersistenceRuntimeReadiness,
} from "../lib/availabilityPersistenceRuntime";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("availability persistence runtime contract", () => {
  const calendarPackageJson = readWorkspaceFile("packages/calendar/package.json");
  const calendarSource = readWorkspaceFile("packages/calendar/src/index.ts");
  const calendarTests = readWorkspaceFile("packages/calendar/tests/availability-conflicts.test.ts");
  const persistenceSource = readWorkspaceFile("apps/dashboard/lib/availabilityPersistence.ts");
  const persistenceStaticTest = readWorkspaceFile("apps/dashboard/tests/availability-persistence-static.test.ts");
  const availabilityRoute = readWorkspaceFile("apps/dashboard/app/api/availability/route.ts");
  const holdRoute = readWorkspaceFile("apps/dashboard/app/api/calendar/holds/route.ts");
  const calendarRoute = readWorkspaceFile("apps/dashboard/app/api/calendar/route.ts");
  const readRouteStaticTest = readWorkspaceFile("apps/dashboard/tests/calendar-read-route-static.test.ts");
  const ciWorkflow = readWorkspaceFile(".github/workflows/ci.yml");
  const unitManifest = readWorkspaceFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readWorkspaceFile("GAP_TRACKER.md");

  it("pins GAP-056 commands, matrix rows, and artifacts", () => {
    expect(availabilityPersistenceRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/calendar typecheck",
      "pnpm --filter @inkroute/calendar test",
      "pnpm --filter @inkroute/db prisma validate",
      "availability persistence seeded Postgres integration tests",
      "concurrent slot hold race-condition tests",
      "dashboard/API availability repository tests",
    ]);
    expect(availabilityPersistenceRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "calendar-typecheck",
      "calendar-tests",
      "prisma-validate",
      "schema-models",
      "repository-contract",
      "tenant-scope",
      "window-transaction",
      "slot-hold-transaction",
      "appointment-confirmation",
      "hold-release",
      "calendar-audit-log",
      "idempotency-store",
      "persisted-conflict-rows",
      "concurrent-hold-protection",
      "overlap-rejection",
      "cross-tenant-denial",
      "seeded-postgres",
      "dashboard-api-repository",
      "ci-secret-safe-evidence",
    ]);
    expect(availabilityPersistenceArtifactPaths).toContain("coverage/availability-persistence-runtime.json");
    expect(availabilityPersistenceArtifactPaths).toContain("test-results/availability-persistence-runtime");
  });

  it("pins current availability persistence proof files for GAP-056", () => {
    expect(availabilityPersistenceRuntimeProofFiles).toEqual(expect.arrayContaining([
      "packages/db/package.json",
      "packages/calendar/package.json",
      "packages/calendar/src/index.ts",
      "packages/calendar/tests/availability-conflicts.test.ts",
      "apps/dashboard/lib/availabilityPersistence.ts",
      "apps/dashboard/lib/availabilityPersistenceRuntime.ts",
      "apps/dashboard/app/api/calendar/holds/route.ts",
      "apps/dashboard/app/api/calendar/route.ts",
      "apps/dashboard/tests/availability-persistence-static.test.ts",
      "apps/dashboard/tests/availability-persistence-runtime-static.test.ts",
      "apps/dashboard/tests/calendar-read-route-static.test.ts",
      "apps/web/app/api/public/[tenantSlug]/availability-preview/route.ts",
      "testing/manifests/unit-test-manifest.json",
      ".github/workflows/ci.yml",
    ]));
    for (const file of availabilityPersistenceRuntimeProofFiles) {
      expect(readWorkspaceFile(file).length).toBeGreaterThan(0);
    }
  });

  it("keeps package helper, dashboard repository contract, hold route, and read route wired", () => {
    expect(calendarPackageJson).toContain('"typecheck"');
    expect(calendarPackageJson).toContain('"test"');
    expect(calendarSource).toContain("buildAvailabilityPersistencePlan");
    expect(calendarSource).toContain("buildAvailabilityRuntimeReadinessPlan");
    expect(calendarTests).toContain("buildAvailabilityRuntimeReadinessPlan");
    expect(persistenceSource).toContain("AvailabilityRepository");
    expect(persistenceSource).toContain("createInMemoryAvailabilityRepository");
    expect(persistenceSource).toContain("findPersistedConflictIds");
    expect(persistenceSource).toContain("findExistingHoldIds");
    expect(persistenceSource).toContain("runAvailabilityTransaction");
    expect(persistenceStaticTest).toContain("covers every persisted availability mutation action");
    expect(persistenceStaticTest).toContain("executes a local availability repository contract");
    expect(persistenceStaticTest).toContain("blocks slot holds when local persisted conflict and existing hold lookups find rows");
    expect(availabilityRoute).toContain('export const runtime = "nodejs"');
    expect(availabilityRoute).toContain("dashboard-availability-create");
    expect(availabilityRoute).toContain("const availabilityTransactionOptions");
    expect(availabilityRoute).toContain('isolationLevel: "Serializable"');
    expect(availabilityRoute).toContain("}, availabilityTransactionOptions)");
    expect(availabilityRoute).toContain("tx.idempotencyKey.upsert");
    expect(availabilityRoute).toContain("idempotency.status === \"completed\"");
    expect(availabilityRoute).toContain("tx.availabilityWindow.findFirst");
    expect(availabilityRoute).toContain("startsAt: { lt: endsAt }");
    expect(availabilityRoute).toContain("endsAt: { gt: startsAt }");
    expect(availabilityRoute).toContain("availability_conflict");
    expect(availabilityRoute).toContain("AVAILABILITY_CONFLICT");
    expect(availabilityRoute).toContain("tx.availabilityWindow.create");
    expect(availabilityRoute).toContain("tx.auditLog.create");
    expect(availabilityRoute).toContain("tx.idempotencyKey.update");
    expect(availabilityRoute).toContain("rawNotesStoredInResult: false");
    expect(availabilityRoute).toContain("persistedOverlapGuardRequired: true");
    expect(availabilityRoute).toContain("persistedOverlapGuardApplied: true");
    expect(availabilityRoute).toContain("concurrentHoldProtectionConfigured: true");
    expect(availabilityRoute).toContain("concurrentHoldProtectionVerified: false");
    expect(availabilityRoute).toContain("idempotencyKeyId");
    expect(availabilityRoute).toContain("idempotencyReplay");
    expect(holdRoute).toContain("AVAILABILITY_HOLD_BLOCKED");
    expect(holdRoute).toContain("{ status: 202, headers: noStoreHeaders }");
    expect(holdRoute).not.toContain("{ status: 501, headers: noStoreHeaders }");
    expect(calendarRoute).toContain("tx.availabilityWindow.findMany");
    expect(readRouteStaticTest).toContain("loads calendar connections, events, and availability while omitting provider secrets");
  });

  it("keeps transaction, persisted conflict, concurrent hold, tenant isolation, seeded DB, and CI blockers explicit", () => {
    expect(availabilityPersistenceRuntimeReadiness.status).toBe("blocked");
    expect(availabilityPersistenceRuntimeReadiness.missingScripts).toEqual([]);
    expect(availabilityPersistenceRuntimeReadiness.requiredCommands).toBe(availabilityPersistenceRuntimeCommands);
    expect(availabilityPersistenceRuntimeReadiness.requiredEvidence).toEqual([
      "persisted conflict detection and concurrent hold rejection evidence",
      "seeded Postgres tenant isolation and availability lifecycle integration test output",
    ]);
    expect(availabilityPersistenceRuntimeReadiness.blockers).toContain("@inkroute/calendar availability tests must pass.");
    expect(availabilityPersistenceRuntimeReadiness.blockers).toContain("Overlapping slot persistence rejection must be tested against DB rows.");
    expect(availabilityPersistenceRuntimeReadiness.blockers).toContain("Seeded Postgres integration tests must prove availability persistence lifecycle.");
  });

  it("classifies durable availability persistence evidence before GAP-056 can close", () => {
    const blockedDecision = buildAvailabilityPersistenceEvidenceDecision({
      calendarTypecheckPassed: true,
      calendarTestsPassed: true,
      prismaValidatePassed: true,
      schemaModelsVerified: true,
      repositoryContractVerified: true,
      tenantScopeVerified: true,
      windowTransactionVerified: true,
      slotHoldTransactionVerified: true,
      appointmentConfirmationVerified: false,
      holdReleaseVerified: false,
      auditLogVerified: false,
      idempotencyStoreVerified: false,
      persistedConflictRowsVerified: false,
      concurrentHoldProtectionVerified: false,
      overlapRejectionVerified: false,
      crossTenantDenialVerified: false,
      seededPostgresVerified: false,
      dashboardApiRepositoryVerified: false,
      secretSafeArtifactReviewPassed: false,
      capturedArtifacts: [
        "coverage/availability-persistence-runtime.json",
        "coverage/availability-persistence-calendar-typecheck.txt",
        "coverage/availability-persistence-calendar-test.txt",
        "coverage/availability-persistence-prisma-validate.txt",
        "coverage/availability-persistence-schema-models.json",
        "coverage/availability-persistence-repository-contract.json",
        "coverage/availability-persistence-tenant-scope.json",
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toContain("Appointment confirmation persistence evidence is missing.");
    expect(blockedDecision.blockers).toContain("Persisted conflict-row lookup evidence is missing.");
    expect(blockedDecision.blockers).toContain("Concurrent slot hold protection evidence is missing.");
    expect(blockedDecision.blockers).toContain("Seeded Postgres availability lifecycle evidence is missing.");
    expect(blockedDecision.blockers).toContain(
      "Secret-safe availability persistence artifact review evidence is missing.",
    );
    expect(blockedDecision.missingArtifacts).toContain("coverage/availability-persistence-seeded-postgres.json");
    expect(blockedDecision.missingArtifacts).toContain(
      "coverage/availability-persistence-secret-safe-artifacts.json",
    );
    expect(blockedDecision.requiredCommands).toBe(availabilityPersistenceRuntimeCommands);
    expect(blockedDecision.requiredEvidence).toBe(availabilityPersistenceDecisionRequiredEvidence);
    expect(blockedDecision.redactedSummary).toEqual({
      capturedArtifactCount: 7,
      requiredArtifactCount: availabilityPersistenceArtifactPaths.length,
    });

    const completeDecision = buildAvailabilityPersistenceEvidenceDecision({
      calendarTypecheckPassed: true,
      calendarTestsPassed: true,
      prismaValidatePassed: true,
      schemaModelsVerified: true,
      repositoryContractVerified: true,
      tenantScopeVerified: true,
      windowTransactionVerified: true,
      slotHoldTransactionVerified: true,
      appointmentConfirmationVerified: true,
      holdReleaseVerified: true,
      auditLogVerified: true,
      idempotencyStoreVerified: true,
      persistedConflictRowsVerified: true,
      concurrentHoldProtectionVerified: true,
      overlapRejectionVerified: true,
      crossTenantDenialVerified: true,
      seededPostgresVerified: true,
      dashboardApiRepositoryVerified: true,
      secretSafeArtifactReviewPassed: true,
      capturedArtifacts: availabilityPersistenceArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
  });

  it("keeps GAP-056 execution policy non-executing and external evidence explicit", () => {
    const plan = buildAvailabilityPersistenceExecutionPlan();

    expect(plan.policy.codexMayClassifyStaticAvailabilityPersistenceReadiness).toBe(true);
    expect(plan.policy.durablePrismaRepositoryRequiredForClosure).toBe(true);
    expect(plan.policy.seededPostgresRequiredForClosure).toBe(true);
    expect(plan.policy.overlapRejectionRequiredForClosure).toBe(true);
    expect(plan.policy.concurrentHoldRaceRequiredForClosure).toBe(true);
    expect(plan.policy.crossTenantMutationRequiredForClosure).toBe(true);
    expect(plan.policy.secretSafeArtifactsRequiredForClosure).toBe(true);
    expect(plan.commandExecutionAllowed).toBe(false);
    expect(plan.prismaExecutionAllowed).toBe(false);
    expect(plan.databaseExecutionAllowed).toBe(false);
    expect(plan.concurrentRaceExecutionAllowed).toBe(false);
    expect(plan.crossTenantExecutionAllowed).toBe(false);
    expect(plan.dashboardApiExecutionAllowed).toBe(false);
    expect(plan.ciExecutionAllowed).toBe(false);
    expect(plan.localCommands).toBe(availabilityPersistenceLocalCommands);
    expect(plan.externalCommands).toBe(availabilityPersistenceExternalCommands);
    expect(plan.requiredExternalEvidence).toBe(availabilityPersistenceRequiredExternalEvidence);
    expect(plan.requiredExternalEvidence).toContain("secret-safe availability persistence artifact review");
  });

  it("redacts GAP-056 availability persistence artifacts before secret-safe review", () => {
    const artifact = {
      tenantId: "tenant_private",
      databaseUrl: "postgres://private",
      availabilityHoldToken: "hold_private",
      artistCalendarEmail: "artist@example.test",
      nested: {
        calendarAuditPayload: "audit_private",
        publicSummary: "availability persistence evidence captured",
      },
    };

    const redacted = buildRedactedAvailabilityPersistenceArtifact(artifact);
    expect(redacted.redactedPaths).toEqual([
      "tenantId",
      "databaseUrl",
      "availabilityHoldToken",
      "artistCalendarEmail",
      "nested.calendarAuditPayload",
    ]);
    expect(redacted.redactedArtifact).toMatchObject({
      tenantId: "[REDACTED]",
      databaseUrl: "[REDACTED]",
      availabilityHoldToken: "[REDACTED]",
      artistCalendarEmail: "[REDACTED]",
      nested: {
        calendarAuditPayload: "[REDACTED]",
        publicSummary: "availability persistence evidence captured",
      },
    });

    const review = buildAvailabilityPersistenceArtifactReview({
      publicSummary: "safe availability persistence evidence",
      prismaTransactionLog: "transaction_private",
    });
    expect(review.secretSafe).toBe(true);
    expect(review.redactedPaths).toEqual(["prismaTransactionLog"]);
    expect(review.requiredExternalEvidence).toBe(availabilityPersistenceRequiredExternalEvidence);
    expect(review.requiredExternalEvidence).toContain("concurrent slot hold race-condition tests");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming durable DB readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 8 availability persistence runtime contracts");
    expect(ciWorkflow).toContain("availability-persistence-runtime-static.test.ts");
    expect(ciWorkflow).toContain("availability-persistence-runtime-artifacts");
    expect(unitManifest).toContain("unit-availability-persistence-runtime-static");
    expect(gapTracker).toContain("apps/dashboard/lib/availabilityPersistenceRuntime.ts");
    expect(gapTracker).toContain("durable DB evidence classifier");
    expect(gapTracker).toContain("local in-memory availability repository contract");
    expect(gapTracker).toContain("GAP-056 is availability-persistence-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("buildAvailabilityPersistenceExecutionPlan");
    expect(gapTracker).toContain("availabilityPersistenceExecutionPolicy");
    expect(gapTracker).toContain("availabilityPersistenceRequiredExternalEvidence");
    expect(gapTracker).toContain("buildRedactedAvailabilityPersistenceArtifact");
    expect(gapTracker).toContain("buildAvailabilityPersistenceArtifactReview");
    expect(availabilityPersistenceArtifactPaths).toContain("coverage/availability-persistence-secret-safe-artifacts.json");
  });
});

