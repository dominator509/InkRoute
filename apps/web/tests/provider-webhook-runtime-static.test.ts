import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  providerWebhookArtifactPaths,
  providerWebhookRuntimeCommands,
  providerWebhookRuntimeMatrix,
  providerWebhookRuntimeReadiness,
} from "../lib/providerWebhookRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("provider webhook runtime contract", () => {
  const notificationsPackageJson = readRepoFile("packages/notifications/package.json");
  const notificationsSource = readRepoFile("packages/notifications/src/index.ts");
  const contractSource = readRepoFile("apps/web/lib/providerWebhookReconciliation.ts");
  const emailRouteSource = readRepoFile("apps/web/app/api/webhooks/email/route.ts");
  const smsRouteSource = readRepoFile("apps/web/app/api/webhooks/sms/route.ts");
  const routeTest = readRepoFile("apps/web/tests/provider-webhook-routes.test.ts");
  const staticTest = readRepoFile("apps/web/tests/provider-webhook-contracts.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins GAP-066 commands, matrix rows, and artifacts", () => {
    expect(providerWebhookRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/notifications typecheck",
      "pnpm --filter @inkroute/notifications test",
      "pnpm vitest run apps/web/tests/provider-webhook-routes.test.ts",
      "pnpm vitest run apps/web/tests/provider-webhook-contracts.test.ts",
      "email provider sandbox webhook replay and invalid-signature tests",
      "Twilio sandbox callback replay and invalid-signature tests",
      "Expo receipt polling invalid-token integration test",
      "concurrent provider callback exactly-once delivery-log test",
    ]);
    expect(providerWebhookRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "notifications-typecheck",
      "notifications-tests",
      "route-tests",
      "contract-tests",
      "email-signature",
      "sms-signature",
      "push-receipt-source",
      "provider-event-persistence",
      "exactly-once-delivery",
      "suppression-persistence",
      "inbound-routing",
      "invalid-push-token",
      "failed-alerting",
      "sandbox-replay",
      "concurrent-callbacks",
      "ci-provider-webhook-job",
      "secret-safe-artifacts",
    ]);
    expect(providerWebhookArtifactPaths).toContain("coverage/provider-webhook-runtime.json");
    expect(providerWebhookArtifactPaths).toContain("test-results/provider-webhook-runtime");
  });

  it("keeps package helper, shared contract, email/SMS routes, and route tests wired", () => {
    expect(notificationsPackageJson).toContain('"typecheck"');
    expect(notificationsPackageJson).toContain('"test"');
    expect(notificationsSource).toContain("buildProviderWebhookRuntimeReadinessPlan");
    expect(contractSource).toContain("ProviderWebhookPersistenceRepository");
    expect(contractSource).toContain("buildProviderWebhookRouteBoundary");
    expect(contractSource).toContain("executeProviderWebhookReconciliation");
    expect(contractSource).toContain("alertFailedWebhook");
    expect(emailRouteSource).toContain("providerWebhookBoundary");
    expect(smsRouteSource).toContain("providerWebhookBoundary");
    expect(routeTest).toContain("rejects email provider webhooks without signature-like headers");
    expect(staticTest).toContain("exactly-once reconciliation");
  });

  it("keeps signature, persistence, reconciliation, sandbox, concurrency, alerting, CI, and artifact blockers explicit", () => {
    expect(providerWebhookRuntimeReadiness.status).toBe("blocked");
    expect(providerWebhookRuntimeReadiness.missingScripts).toEqual([]);
    expect(providerWebhookRuntimeReadiness.requiredEvidence).toEqual(expect.arrayContaining([
      "provider signature verification and raw-body route evidence",
      "durable replay protection and exactly-once ProviderEvent evidence",
      "delivery, suppression, inbound routing, and invalid-token persistence evidence",
      "provider sandbox, invalid-signature, and failed-webhook alerting evidence",
    ]));
    expect(providerWebhookRuntimeReadiness.blockers).toContain("Email provider cryptographic signature verification must be implemented.");
    expect(providerWebhookRuntimeReadiness.blockers).toContain("Delivery-log updates must be exactly-once under replay and concurrent callbacks.");
    expect(providerWebhookRuntimeReadiness.blockers).toContain("Failed webhook verification or reconciliation must emit alerting.");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming provider sandbox readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 9 provider webhook runtime contracts");
    expect(ciWorkflow).toContain("provider-webhook-runtime-static.test.ts");
    expect(ciWorkflow).toContain("provider-webhook-runtime-artifacts");
    expect(unitManifest).toContain("unit-provider-webhook-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/providerWebhookRuntime.ts");
    expect(gapTracker).toContain("GAP-066 is provider-webhook-runtime-matrix wired");
    expect(providerWebhookArtifactPaths).toContain("coverage/provider-webhook-secret-safe-artifacts.json");
  });
});
