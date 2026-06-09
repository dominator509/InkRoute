import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  smsProviderArtifactPaths,
  smsProviderRuntimeCommands,
  smsProviderRuntimeMatrix,
  smsProviderRuntimeReadiness,
} from "../lib/smsProviderRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("SMS provider runtime contract", () => {
  const notificationsPackageJson = readRepoFile("packages/notifications/package.json");
  const notificationsSource = readRepoFile("packages/notifications/src/index.ts");
  const providerSource = readRepoFile("apps/web/lib/smsProvider.ts");
  const routeSource = readRepoFile("apps/web/app/api/webhooks/sms/route.ts");
  const staticTest = readRepoFile("apps/web/tests/sms-provider-static.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins GAP-062 commands, matrix rows, and artifacts", () => {
    expect(smsProviderRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/notifications typecheck",
      "pnpm --filter @inkroute/notifications test",
      "pnpm vitest run apps/web/tests/sms-provider-static.test.ts",
      "Twilio sandbox sent event test",
      "Twilio sandbox delivered event test",
      "Twilio sandbox failed event test",
      "Twilio STOP suppression test",
      "Twilio HELP inbound-thread test",
      "invalid SMS webhook signature route test",
    ]);
    expect(smsProviderRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "notifications-typecheck",
      "notifications-tests",
      "static-contract",
      "twilio-sdk-credentials",
      "messaging-service",
      "legal-consent-copy",
      "consent-proof",
      "quiet-hours",
      "raw-body-signature",
      "request-url-validation",
      "delivery-persistence",
      "provider-event-persistence",
      "suppression-persistence",
      "inbound-thread-persistence",
      "sandbox-sent",
      "sandbox-delivered",
      "sandbox-failed",
      "stop-suppression",
      "help-inbound-thread",
      "invalid-signature-route",
      "ci-sms-provider-job",
      "secret-safe-artifacts",
    ]);
    expect(smsProviderArtifactPaths).toContain("coverage/sms-provider-runtime.json");
    expect(smsProviderArtifactPaths).toContain("test-results/sms-provider-runtime");
  });

  it("keeps package helpers, provider contract, webhook route, and static guard wired", () => {
    expect(notificationsPackageJson).toContain('"typecheck"');
    expect(notificationsPackageJson).toContain('"test"');
    expect(notificationsSource).toContain("buildSmsProviderSendPlan");
    expect(notificationsSource).toContain("buildSmsWebhookRuntimeReadinessPlan");
    expect(providerSource).toContain("executeSmsProviderSend");
    expect(providerSource).toContain("persistInboundThread");
    expect(providerSource).toContain("buildSmsProviderReconciliation");
    expect(routeSource).toContain("buildSmsWebhookReadinessFromPayload");
    expect(routeSource).toContain("x-twilio-signature");
    expect(staticTest).toContain("requires Twilio send controls");
  });

  it("keeps Twilio, compliance, signature, persistence, sandbox, CI, and artifact blockers explicit", () => {
    expect(smsProviderRuntimeReadiness.status).toBe("blocked");
    expect(smsProviderRuntimeReadiness.requiredCommands).toEqual([...smsProviderRuntimeCommands]);
    expect(smsProviderRuntimeReadiness.requiredEvidence).toContain("Twilio SDK credentials and messaging service evidence");
    expect(smsProviderRuntimeReadiness.requiredEvidence).toContain("legal-approved consent/STOP/HELP copy, stored consent proof, and quiet-hours evidence");
    expect(smsProviderRuntimeReadiness.blockers).toContain("Real Twilio SDK credentials and messaging service must be configured in a secret store.");
    expect(smsProviderRuntimeReadiness.blockers).toContain("SMS webhook route must verify Twilio signatures cryptographically against raw bodies and request URLs.");
    expect(smsProviderRuntimeReadiness.blockers).toContain("Sent, delivered, failed, STOP, and HELP provider flows must be tested against the sandbox.");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming provider readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 9 SMS provider runtime contracts");
    expect(ciWorkflow).toContain("sms-provider-runtime-static.test.ts");
    expect(ciWorkflow).toContain("sms-provider-runtime-artifacts");
    expect(unitManifest).toContain("unit-sms-provider-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/smsProviderRuntime.ts");
    expect(gapTracker).toContain("GAP-062 is sms-provider-runtime-matrix wired");
    expect(smsProviderArtifactPaths).toContain("coverage/sms-provider-secret-safe-artifacts.json");
  });
});
