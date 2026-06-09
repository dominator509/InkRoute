import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildProviderDeliveryId,
  mapSentryActionToErrorStatus,
  providerIssueOwnershipLookup,
  providerWebhookReconciliationArtifactPaths,
  providerWebhookReconciliationContract,
  sanitizeProviderWebhookPayload,
} from "../lib/providerWebhookReconciliation";

const routeSource = readFileSync(join(process.cwd(), "apps/web/app/api/webhooks/sentry/route.ts"), "utf8");

describe("GAP-082 provider webhook reconciliation", () => {
  it("keeps deterministic idempotency keys and status mapping", () => {
    expect(buildProviderDeliveryId({ action: "resolved" }, { id: "issue_123" })).toBe("sentry:resolved:issue_123");
    expect(mapSentryActionToErrorStatus("resolved")).toBe("resolved");
    expect(mapSentryActionToErrorStatus("ignored")).toBe("ignored");
    expect(mapSentryActionToErrorStatus("assigned")).toBe("triaged");
  });

  it("sanitizes provider payload summaries and resolves tenant ownership hints", () => {
    const payload = sanitizeProviderWebhookPayload({ action: "resolved", data: {} }, { id: "issue_123", title: "Avery avery@example.com token sk_live_secret", tenantId: "tenant_1", fingerprint: "stack_1" });
    expect(JSON.stringify(payload)).not.toContain("avery@example.com");
    expect(JSON.stringify(payload)).not.toContain("sk_live_secret");
    expect(providerIssueOwnershipLookup({ tenantId: "tenant_1", fingerprint: "stack_1" })).toMatchObject({ tenantId: "tenant_1", stackHash: "stack_1", lookupReady: true });
  });

  it("persists provider delivery and status reconciliation through a transaction seam", () => {
    expect(routeSource).toContain("verifySentrySignature");
    expect(routeSource).toContain("timingSafeEqual");
    expect(routeSource).toContain("prisma.$transaction");
    expect(routeSource).toContain("tx.errorReport.findFirst");
    expect(routeSource).toContain("tx.errorReport.update");
    expect(routeSource).toContain("tx.auditLog.create");
    expect(routeSource).toContain('entityType: "ProviderWebhookDelivery"');
    expect(routeSource).toContain("rawPayloadStored: false");
  });

  it("tracks remaining dedicated idempotency and live provider proof blockers", () => {
    expect(providerWebhookReconciliationContract.status).toBe("blocked");
    expect(providerWebhookReconciliationContract.requiredEvidence).toEqual(
      expect.arrayContaining([
        "durable provider-delivery persistence and idempotency constraint evidence",
        "tenant ownership lookup, ErrorReport status mutation, and reconciliation audit evidence",
        "sanitized provider payload and live Sentry webhook replay evidence",
      ]),
    );
    expect(providerWebhookReconciliationArtifactPaths).toContain("coverage/provider-webhook-live-sentry-proof-redacted.json");
    expect(providerWebhookReconciliationArtifactPaths).toContain("test-results/provider-webhook-reconciliation");
  });
});
