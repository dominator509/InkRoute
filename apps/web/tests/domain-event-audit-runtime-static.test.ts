import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  domainEventAuditArtifactPaths,
  domainEventAuditRuntimeCommands,
  domainEventAuditRuntimeMatrix,
  domainEventAuditRuntimeReadiness,
} from "../lib/domainEventAuditRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("domain event and audit transaction runtime contract", () => {
  const bookingPackageJson = readRepoFile("packages/booking/package.json");
  const paymentsPackageJson = readRepoFile("packages/payments/package.json");
  const bookingSource = readRepoFile("packages/booking/src/index.ts");
  const bookingTests = readRepoFile("packages/booking/tests/booking-readiness.test.ts");
  const paymentsSource = readRepoFile("packages/payments/src/index.ts");
  const paymentsTests = readRepoFile("packages/payments/tests/deposit-policy.test.ts");
  const schema = readRepoFile("packages/db/prisma/schema.prisma");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins domain event/audit commands, matrix rows, and artifact paths", () => {
    expect(domainEventAuditRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/booking typecheck",
      "pnpm --filter @inkroute/booking test",
      "pnpm --filter @inkroute/payments typecheck",
      "pnpm --filter @inkroute/payments test",
      "booking/payment lifecycle Prisma transaction integration tests",
      "booking/payment idempotency replay integration tests",
      "provider failure rollback integration tests",
      "cross-tenant lifecycle mutation denial tests",
      "GitHub Actions domain event/audit transaction evidence job",
    ]);
    expect(domainEventAuditRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "booking-payment-package-gates",
      "prisma-transaction-services",
      "tenant-scoped-repositories",
      "state-event-audit-persistence",
      "idempotency-and-replay",
      "provider-rollback-invalid-cross-tenant-denial",
      "database-ci-secret-safe-artifacts",
    ]);
    expect(domainEventAuditArtifactPaths).toContain("coverage/domain-event-audit-runtime.json");
    expect(domainEventAuditArtifactPaths).toContain("coverage/domain-event-secret-safe-artifacts.json");
    expect(domainEventAuditArtifactPaths).toContain("test-results/domain-event-audit-runtime");
  });

  it("keeps booking/payment scripts, transaction helpers, payment plans, and DB models visible", () => {
    for (const scriptName of ["typecheck", "test"]) {
      expect(bookingPackageJson).toContain(`"${scriptName}"`);
      expect(paymentsPackageJson).toContain(`"${scriptName}"`);
    }
    expect(bookingSource).toContain("buildDomainEventAuditTransactionEvidencePlan");
    expect(bookingSource).toContain("createBookingTransitionPlan");
    expect(bookingSource).toContain("buildBookingProviderFailurePlan");
    expect(bookingTests).toContain("buildDomainEventAuditTransactionEvidencePlan");
    expect(paymentsSource).toContain("buildPaymentLifecyclePersistencePlan");
    expect(paymentsTests).toContain("buildPaymentLifecyclePersistencePlan");
    for (const model of ["BookingStateEvent", "AuditLog", "PaymentAuditLog", "Payment", "Deposit", "Refund"]) {
      expect(schema).toContain(`model ${model}`);
    }
  });

  it("keeps transaction evidence blocked until atomic writes, idempotency, denials, DB, CI, and safe artifacts exist", () => {
    expect(domainEventAuditRuntimeReadiness.status).toBe("blocked");
    expect(domainEventAuditRuntimeReadiness.missingScripts).toEqual([]);
    expect(domainEventAuditRuntimeReadiness.requiredCommands).toEqual([...domainEventAuditRuntimeCommands]);
    expect(domainEventAuditRuntimeReadiness.requiredControls).toEqual([
      "Commit state mutation, domain event, audit row, payment audit row, and idempotency key in the same tenant-scoped transaction.",
      "Reject invalid lifecycle transitions, missing tenant scope, missing actor, and duplicate idempotency keys before side effects.",
      "Return original mutation results for idempotency replays without duplicate BookingStateEvent, AuditLog, PaymentAuditLog, or provider rollback writes.",
      "Record provider rollback/failure audit rows before retrying or exposing provider failure states.",
      "Redact client, medical, payment, provider, and private URL data from transaction evidence artifacts.",
    ]);
    expect(domainEventAuditRuntimeReadiness.requiredEvidence).toEqual([
      "booking/payment package test and typecheck evidence",
      "Prisma transaction service and tenant-scoped repository evidence",
      "atomic booking/payment state, event, audit, and payment-audit persistence evidence",
      "idempotency persistence and replay original-result evidence",
      "provider rollback, invalid-transition denial, and cross-tenant denial evidence",
      "database integration, CI, and secret-safe artifact evidence",
    ]);
    expect(domainEventAuditRuntimeReadiness.blockers).toContain(
      "Booking/payment lifecycle services must execute writes inside Prisma transactions.",
    );
    expect(domainEventAuditRuntimeReadiness.blockers).toContain(
      "Replayed lifecycle mutations must return the original committed result without duplicate writes.",
    );
    expect(domainEventAuditRuntimeReadiness.blockers).toContain(
      "Domain event/audit artifacts must be redacted and free of secrets, tokens, raw PII, medical, and payment data.",
    );
  });

  it("wires CI, manifest, tracker, and artifacts without claiming transaction evidence readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 2 domain event audit runtime contracts");
    expect(ciWorkflow).toContain("domain-event-audit-runtime-static.test.ts");
    expect(ciWorkflow).toContain("domain-event-audit-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/domain-event-audit-runtime.json");
    expect(unitManifest).toContain("unit-web-domain-event-audit-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/domainEventAuditRuntime.ts");
    expect(gapTracker).toContain("live Prisma transaction services, tenant-scoped repositories, booking/payment atomicity tests, BookingStateEvent/AuditLog/PaymentAuditLog persistence, idempotency persistence, replay original-result behavior, provider rollback integration, invalid-transition denial, cross-tenant denial, database evidence, CI evidence, and secret-safe artifacts remain open");
  });
});
