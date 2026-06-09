import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  availabilityPersistenceArtifactPaths,
  availabilityPersistenceRuntimeCommands,
  availabilityPersistenceRuntimeMatrix,
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

  it("keeps package helper, dashboard repository contract, hold route, and read route wired", () => {
    expect(calendarPackageJson).toContain('"typecheck"');
    expect(calendarPackageJson).toContain('"test"');
    expect(calendarSource).toContain("buildAvailabilityPersistencePlan");
    expect(calendarSource).toContain("buildAvailabilityRuntimeReadinessPlan");
    expect(calendarTests).toContain("buildAvailabilityRuntimeReadinessPlan");
    expect(persistenceSource).toContain("AvailabilityRepository");
    expect(persistenceSource).toContain("findPersistedConflictIds");
    expect(persistenceSource).toContain("findExistingHoldIds");
    expect(persistenceSource).toContain("runAvailabilityTransaction");
    expect(persistenceStaticTest).toContain("covers every persisted availability mutation action");
    expect(holdRoute).toContain("AVAILABILITY_HOLD_BLOCKED");
    expect(calendarRoute).toContain("AvailabilityWindow");
    expect(readRouteStaticTest).toContain("AvailabilityWindow");
  });

  it("keeps transaction, persisted conflict, concurrent hold, tenant isolation, seeded DB, and CI blockers explicit", () => {
    expect(availabilityPersistenceRuntimeReadiness.status).toBe("blocked");
    expect(availabilityPersistenceRuntimeReadiness.missingScripts).toEqual([]);
    expect(availabilityPersistenceRuntimeReadiness.requiredCommands).toEqual([...availabilityPersistenceRuntimeCommands]);
    expect(availabilityPersistenceRuntimeReadiness.requiredEvidence).toEqual(expect.arrayContaining([
      "persisted conflict detection and concurrent hold rejection evidence",
      "seeded Postgres tenant isolation and availability lifecycle integration test output",
    ]));
    expect(availabilityPersistenceRuntimeReadiness.blockers).toContain("@inkroute/calendar availability tests must pass.");
    expect(availabilityPersistenceRuntimeReadiness.blockers).toContain("Overlapping slot persistence rejection must be tested against DB rows.");
    expect(availabilityPersistenceRuntimeReadiness.blockers).toContain("Seeded Postgres integration tests must prove availability persistence lifecycle.");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming durable DB readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 8 availability persistence runtime contracts");
    expect(ciWorkflow).toContain("availability-persistence-runtime-static.test.ts");
    expect(ciWorkflow).toContain("availability-persistence-runtime-artifacts");
    expect(unitManifest).toContain("unit-availability-persistence-runtime-static");
    expect(gapTracker).toContain("apps/dashboard/lib/availabilityPersistenceRuntime.ts");
    expect(gapTracker).toContain("GAP-056 is availability-persistence-runtime-matrix wired");
    expect(availabilityPersistenceArtifactPaths).toContain("coverage/availability-persistence-secret-safe-artifacts.json");
  });
});
