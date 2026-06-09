import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildProviderDeliveryId,
  buildProviderWebhookReconciliationContract,
  buildSentryReconciliationPlan,
  mapSentryActionToErrorStatus,
  providerWebhookReconciliationArtifactPaths,
  providerWebhookReconciliationCommands,
  providerWebhookReconciliationMatrix,
  sanitizeProviderWebhookPayload,
} from "../lib/providerWebhookReconciliation";

const root = join(__dirname, "..", "..");
const routeSource = readFileSync(join(root, "apps/web/app/api/webhooks/sentry/route.ts"), "utf8");
const workflowSource = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");
const unitManifest = readFileSync(join(root, "testing/manifests/unit-test-manifest.json"), "utf8");
const gapTracker = readFileSync(join(root, "GAP_TRACKER.md"), "utf8");

const event = {
  action: "resolved",
  data: {
    id: "issue_123",
    tenantId: "tenant_123",
    fingerprint: "stack_hash_123",
    title: "Crash from artist@example.com",
    culprit: "Bearer abc.def.ghi",
    token: "super-secret-token",
  },
};

describe("provider webhook reconciliation contract", () => {
  it("builds deterministic delivery and idempotency keys", () => {
    expect(buildProviderDeliveryId(event, event.data)).toBe("sentry:resolved:issue_123");

    const plan = buildSentryReconciliationPlan({ event, data: event.data });

    expect(plan).toMatchObject({
      provider: "sentry",
      action: "resolved",
      providerDeliveryId: "sentry:resolved:issue_123",
      idempotencyKey: "sentry:resolved:issue_123",
      targetErrorStatus: "resolved",
      providerFingerprint: "stack_hash_123",
      rawPayloadStored: false,
      ownership: { tenantId: "tenant_123", source: "provider-payload" },
    });
  });

  it("maps provider issue actions to ErrorReport statuses", () => {
    expect(mapSentryActionToErrorStatus("resolved")).toBe("resolved");
    expect(mapSentryActionToErrorStatus("closed")).toBe("resolved");
    expect(mapSentryActionToErrorStatus("ignored")).toBe("ignored");
    expect(mapSentryActionToErrorStatus("archived")).toBe("ignored");
    expect(mapSentryActionToErrorStatus("assigned")).toBe("triaged");
    expect(mapSentryActionToErrorStatus("created")).toBe("open");
  });

  it("keeps provider payload summaries sanitized and artifact-backed", () => {
    const sanitized = sanitizeProviderWebhookPayload(event, event.data);

    expect(JSON.stringify(sanitized)).not.toContain("artist@example.com");
    expect(JSON.stringify(sanitized)).not.toContain("abc.def.ghi");
    expect(JSON.stringify(sanitized)).not.toContain("super-secret-token");
    expect(JSON.stringify(sanitized)).toContain("[redacted-email]");
    expect(JSON.stringify(sanitized)).toContain("[redacted-secret]");
    expect(providerWebhookReconciliationArtifactPaths).toEqual(
      expect.arrayContaining([
        "coverage/provider-webhook-reconciliation.json",
        "coverage/provider-webhook-idempotency.json",
        "coverage/provider-webhook-error-status-mutation.json",
        "coverage/provider-webhook-sanitized-payload-redacted.json",
        "coverage/provider-webhook-live-sentry-proof-redacted.json",
        "test-results/provider-webhook-reconciliation",
      ]),
    );
  });

  it("wires signature verification, transaction persistence, and status mutation seams in the route", () => {
    expect(routeSource).toContain("SENTRY_WEBHOOK_SECRET");
    expect(routeSource).toContain("verifySentrySignature");
    expect(routeSource).toContain("timingSafeEqual");
    expect(routeSource).toContain("prisma.$transaction");
    expect(routeSource).toContain("tx.auditLog.create");
    expect(routeSource).toContain('entityType: "ProviderWebhookDelivery"');
    expect(routeSource).toContain("tx.errorReport.update");
    expect(routeSource).toContain("idempotencyKey");
    expect(routeSource).toContain("rawPayloadStored");
  });

  it("keeps live replay and unique delivery constraints explicitly gated", () => {
    const contract = buildProviderWebhookReconciliationContract();

    expect(contract.status).toBe("blocked");
    expect(contract.blockers).toEqual(
      expect.arrayContaining([
        "route tests must pass before provider webhook reconciliation is production-ready",
        "web typecheck must pass before provider webhook reconciliation is production-ready",
        "durable provider-delivery idempotency constraint is required",
        "live Sentry webhook proof is required",
      ]),
    );
    expect(contract.requiredEvidence).toEqual(
      expect.arrayContaining([
        "webhook secret, signature, timing-safe comparison, and replay-protection evidence",
        "durable provider-delivery persistence and idempotency constraint evidence",
        "tenant ownership lookup, ErrorReport status mutation, and reconciliation audit evidence",
        "sanitized provider payload and live Sentry webhook replay evidence",
      ]),
    );
  });

  it("pins the provider webhook reconciliation command and artifact matrix", () => {
    expect(providerWebhookReconciliationCommands).toEqual([
      "pnpm --filter @inkroute/observability typecheck",
      "pnpm --filter @inkroute/observability test",
      "pnpm vitest run apps/web/tests/provider-webhook-reconciliation-static.test.ts apps/web/tests/observability-routes.test.ts",
      "Sentry webhook signature and replay tests",
      "ProviderWebhookDelivery unique idempotency persistence tests",
      "ErrorReport status mutation integration tests",
      "live Sentry webhook replay proof with redacted payloads",
      "provider webhook no-PII artifact audit",
    ]);
    expect(providerWebhookReconciliationMatrix.map((entry) => entry.id)).toEqual([
      "observability-typecheck",
      "observability-tests",
      "route-static-contracts",
      "signature-replay",
      "idempotency",
      "durable-delivery-constraint",
      "error-status-mutation",
      "sanitized-payload",
      "live-sentry-proof",
      "no-pii-artifact-audit",
      "ci-provider-webhook-reconciliation",
      "secret-safe-artifacts",
    ]);
    expect(providerWebhookReconciliationArtifactPaths).toContain("coverage/provider-webhook-durable-delivery-constraint.json");
    expect(providerWebhookReconciliationArtifactPaths).toContain("coverage/provider-webhook-secret-safe-artifacts.json");
  });

  it("is wired into CI with redacted provider webhook artifacts", () => {
    expect(workflowSource).toContain("Run Phase 11 provider webhook reconciliation contracts");
    expect(workflowSource).toContain("apps/web/tests/provider-webhook-reconciliation-static.test.ts");
    expect(workflowSource).toContain("Upload provider webhook reconciliation artifacts");
    expect(workflowSource).toContain("coverage/provider-webhook-live-sentry-proof-redacted.json");
    expect(workflowSource).toContain("coverage/provider-webhook-ci-evidence.json");
    expect(workflowSource).toContain("test-results/provider-webhook-reconciliation");
    expect(unitManifest).toContain("providerWebhookReconciliationMatrix");
    expect(gapTracker).toContain("GAP-082 is provider-webhook-reconciliation-matrix wired");
  });
});
