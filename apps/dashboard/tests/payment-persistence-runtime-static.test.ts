import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  paymentPersistenceArtifactPaths,
  paymentPersistenceRuntimeCommands,
  paymentPersistenceRuntimeMatrix,
  paymentPersistenceRuntimeReadiness,
} from "../lib/paymentPersistenceRuntime";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("payment persistence runtime contract", () => {
  const paymentsPackageJson = readWorkspaceFile("packages/payments/package.json");
  const paymentsSource = readWorkspaceFile("packages/payments/src/index.ts");
  const paymentsTests = readWorkspaceFile("packages/payments/tests/deposit-policy.test.ts");
  const persistenceSource = readWorkspaceFile("apps/dashboard/lib/paymentPersistence.ts");
  const persistenceStaticTest = readWorkspaceFile("apps/dashboard/tests/payment-persistence-static.test.ts");
  const dashboardPage = readWorkspaceFile("apps/dashboard/app/payments/page.tsx");
  const paymentsRoute = readWorkspaceFile("apps/dashboard/app/api/payments/route.ts");
  const paymentDetailRoute = readWorkspaceFile("apps/dashboard/app/api/payments/[paymentId]/route.ts");
  const prismaSchema = readWorkspaceFile("packages/db/prisma/schema.prisma");
  const ciWorkflow = readWorkspaceFile(".github/workflows/ci.yml");
  const unitManifest = readWorkspaceFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readWorkspaceFile("GAP_TRACKER.md");

  it("pins GAP-051 commands, matrix rows, and artifacts", () => {
    expect(paymentPersistenceRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/payments typecheck",
      "pnpm --filter @inkroute/payments test",
      "pnpm --filter @inkroute/db prisma validate",
      "payment persistence seeded Postgres integration tests",
      "dashboard payment repository route/action tests",
    ]);
    expect(paymentPersistenceRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "payments-typecheck",
      "payments-tests",
      "prisma-validate",
      "repository-contract",
      "tenant-scope",
      "lifecycle-transactions",
      "idempotency-store",
      "deposit-create",
      "provider-session",
      "paid-failed-transitions",
      "refund-dispute-transitions",
      "payment-audit-log",
      "booking-state-event",
      "cross-tenant-denial",
      "replay-idempotency",
      "seeded-postgres",
      "dashboard-repository-reads",
      "ci-secret-safe-evidence",
    ]);
    expect(paymentPersistenceArtifactPaths).toContain("coverage/payment-persistence-runtime.json");
    expect(paymentPersistenceArtifactPaths).toContain("test-results/payment-persistence-runtime");
  });

  it("keeps package helper, dashboard service contract, read routes, and schema models wired", () => {
    expect(paymentsPackageJson).toContain('"typecheck"');
    expect(paymentsPackageJson).toContain('"test"');
    expect(paymentsSource).toContain("buildPaymentLifecyclePersistencePlan");
    expect(paymentsSource).toContain("buildPaymentPersistenceRuntimeReadinessPlan");
    expect(paymentsTests).toContain("buildPaymentPersistenceRuntimeReadinessPlan");
    expect(persistenceSource).toContain("TenantPaymentRepository");
    expect(persistenceSource).toContain("executePaymentLifecycleMutation");
    expect(persistenceSource).toContain("claimIdempotencyKey");
    expect(persistenceStaticTest).toContain("covers every required payment lifecycle action");
    expect(dashboardPage).toContain("Payment persistence contract");
    expect(paymentsRoute).toContain("PaymentAuditLog");
    expect(paymentDetailRoute).toContain("PaymentAuditLog");
    expect(prismaSchema).toContain("model PaymentAuditLog");
  });

  it("keeps transaction, idempotency, lifecycle persistence, audit, isolation, and integration blockers explicit", () => {
    expect(paymentPersistenceRuntimeReadiness.status).toBe("blocked");
    expect(paymentPersistenceRuntimeReadiness.missingScripts).toEqual([]);
    expect(paymentPersistenceRuntimeReadiness.requiredCommands).toEqual([...paymentPersistenceRuntimeCommands]);
    expect(paymentPersistenceRuntimeReadiness.requiredEvidence).toEqual(expect.arrayContaining([
      "Prisma models and tenant-scoped payment repository/service implementation",
      "deposit, provider-session, paid, and failed transition persistence test output",
      "refund and dispute persistence test output",
      "PaymentAuditLog and BookingStateEvent persistence evidence for every lifecycle mutation",
      "seeded Postgres integration tests for tenant isolation and idempotent replay",
    ]));
    expect(paymentPersistenceRuntimeReadiness.blockers).toContain("Payment lifecycle mutations must run in database transactions.");
    expect(paymentPersistenceRuntimeReadiness.blockers).toContain("Idempotency store must be implemented for provider sessions, webhooks, refunds, and retries.");
    expect(paymentPersistenceRuntimeReadiness.blockers).toContain("Seeded Postgres integration tests must pass for payment persistence lifecycle.");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming database execution readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 7 payment persistence runtime contracts");
    expect(ciWorkflow).toContain("payment-persistence-runtime-static.test.ts");
    expect(ciWorkflow).toContain("payment-persistence-runtime-artifacts");
    expect(unitManifest).toContain("unit-payment-persistence-runtime-static");
    expect(gapTracker).toContain("apps/dashboard/lib/paymentPersistenceRuntime.ts");
    expect(gapTracker).toContain("GAP-051 is payment-persistence-runtime-matrix wired");
    expect(paymentPersistenceArtifactPaths).toContain("coverage/payment-persistence-secret-safe-artifacts.json");
  });
});
