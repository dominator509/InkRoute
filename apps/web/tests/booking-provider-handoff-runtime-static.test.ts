import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  bookingProviderHandoffArtifactPaths,
  bookingProviderHandoffReadinessAreas,
  bookingProviderHandoffRuntimeCommands,
  bookingProviderHandoffRuntimeMatrix,
  bookingProviderHandoffRuntimeReadiness,
} from "../lib/bookingProviderHandoffRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("booking provider handoff runtime contract", () => {
  const bookingPackageJson = readRepoFile("packages/booking/package.json");
  const bookingSource = readRepoFile("packages/booking/src/index.ts");
  const bookingTests = readRepoFile("packages/booking/tests/booking-readiness.test.ts");
  const bookingRoute = readRepoFile("apps/web/app/api/public/[tenantSlug]/booking-requests/route.ts");
  const bookingRouteContracts = readRepoFile("apps/web/tests/booking-requests-contract.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins GAP-034 commands, readiness areas, matrix rows, and artifacts", () => {
    expect(bookingProviderHandoffRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/booking typecheck",
      "pnpm --filter @inkroute/booking test",
      "pnpm --filter @inkroute/payments test",
      "pnpm --filter @inkroute/notifications test",
      "pnpm --filter @inkroute/calendar test",
      "Stripe CLI deposit session sandbox test",
      "email/SMS/push notification sandbox delivery tests",
      "Google Calendar tentative hold sandbox test",
      "persisted provider worker execution tests",
      "provider rollback/retry integration tests",
      "GitHub Actions provider handoff evidence job",
    ]);
    expect(bookingProviderHandoffReadinessAreas).toContain("accepted-booking-gate");
    expect(bookingProviderHandoffReadinessAreas).toContain("provider-idempotency");
    expect(bookingProviderHandoffReadinessAreas).toContain("secret-safe-artifacts");
    expect(bookingProviderHandoffRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "booking-typecheck",
      "booking-tests",
      "provider-package-tests",
      "booking-route-provider-handoff-plan",
      "persisted-worker-queue",
      "reference-upload-worker",
      "stripe-deposit-sandbox",
      "notification-sandbox",
      "calendar-sandbox",
      "audit-retry-rollback-operator-review",
      "provider-idempotency",
      "ci-secret-safe-evidence",
    ]);
    expect(bookingProviderHandoffArtifactPaths).toContain("coverage/booking-provider-handoff-runtime.json");
    expect(bookingProviderHandoffArtifactPaths).toContain("test-results/booking-provider-handoff-runtime");
  });

  it("keeps booking helper, package tests, route workflow plan, and route contract tests wired", () => {
    expect(bookingPackageJson).toContain('"typecheck"');
    expect(bookingPackageJson).toContain('"test"');
    expect(bookingSource).toContain("buildBookingProviderHandoffRuntimeEvidencePlan");
    expect(bookingTests).toContain("buildBookingProviderHandoffRuntimeEvidencePlan");
    expect(bookingRoute).toContain("buildBookingProviderHandoffRuntimeEvidencePlan");
    expect(bookingRoute).toContain("providerHandoffRuntimeEvidencePlan");
    expect(bookingRoute).toContain("executeBookingPostPersistWorkflowConsumers");
    expect(bookingRouteContracts).toContain("executes post-persist workflow consumers with tenant-isolated records");
  });

  it("keeps provider handoff blockers explicit until sandbox, worker, rollback, CI, and artifact proof exists", () => {
    expect(bookingProviderHandoffRuntimeReadiness.status).toBe("blocked");
    expect(bookingProviderHandoffRuntimeReadiness.missingScripts).toEqual([]);
    expect(bookingProviderHandoffRuntimeReadiness.requiredCommands).toEqual([...bookingProviderHandoffRuntimeCommands]);
    expect(bookingProviderHandoffRuntimeReadiness.requiredControls).toContain(
      "Create Stripe deposit sessions only after accepted booking state and policy approval.",
    );
    expect(bookingProviderHandoffRuntimeReadiness.requiredEvidence).toEqual(expect.arrayContaining([
      "reference upload, Stripe, notification, and calendar sandbox execution evidence",
      "audit persistence, retry, rollback, and operator-review queue evidence",
      "provider sandbox, CI, and secret-safe artifact evidence",
    ]));
    expect(bookingProviderHandoffRuntimeReadiness.blockers).toContain(
      "Stripe deposit session sandbox test must pass without live-payment mode.",
    );
    expect(bookingProviderHandoffRuntimeReadiness.blockers).toContain(
      "Provider handoffs must enforce idempotency across retries, worker restarts, and webhook replays.",
    );
  });

  it("wires CI, manifest, tracker, and artifacts without claiming provider readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 4 booking provider handoff runtime contracts");
    expect(ciWorkflow).toContain("booking-provider-handoff-runtime-static.test.ts");
    expect(ciWorkflow).toContain("booking-provider-handoff-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-booking-provider-handoff-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/bookingProviderHandoffRuntime.ts");
    expect(gapTracker).toContain("GAP-034 is route-wired with provider handoff runtime evidence");
    expect(bookingProviderHandoffArtifactPaths).toContain("coverage/booking-provider-handoff-secret-safe-artifacts.json");
  });
});
