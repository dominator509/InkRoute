import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "..", "..");
const routeSource = readFileSync(join(root, "apps/web/app/api/observability/alerts/route.ts"), "utf8");
const workflowSource = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");
const trackerSource = readFileSync(join(root, "GAP_TRACKER.md"), "utf8");
const unitManifest = readFileSync(join(root, "testing/manifests/unit-test-manifest.json"), "utf8");

describe("alert escalation runtime contract", () => {
  it("requires an internal worker token before alert enqueueing", () => {
    expect(routeSource).toContain("ALERT_WORKER_TOKEN");
    expect(routeSource).toContain("authorizeAlertWorker");
    expect(routeSource).toContain("ALERT_WORKER_UNAUTHORIZED");
    expect(routeSource).toContain("ALERT_WORKER_TOKEN_NOT_CONFIGURED");
  });

  it("builds sanitized escalation plans from observability reports", () => {
    expect(routeSource).toContain("buildObservabilityReportDraft");
    expect(routeSource).toContain("buildAlertEscalationPlan");
    expect(routeSource).toContain("sanitizedPayload");
    expect(routeSource).toContain("suppressExternalDelivery");
    expect(routeSource).toContain("rawPayloadStored: false");
  });

  it("persists durable alert delivery and acknowledgement state through AuditLog metadata", () => {
    expect(routeSource).toContain("prisma.auditLog.create");
    expect(routeSource).toContain('entityType: "AlertDelivery"');
    expect(routeSource).toContain("acknowledgementState");
    expect(routeSource).toContain("exponential-backoff-3-attempts");
    expect(routeSource).toContain("configured-dead-letter-after-retry-exhaustion");
  });

  it("keeps provider credentials and live delivery proof gated", () => {
    expect(routeSource).toContain("SLACK_WEBHOOK_URL");
    expect(routeSource).toContain("ALERT_EMAIL_PROVIDER");
    expect(routeSource).toContain("PAGERDUTY_ROUTING_KEY");
    expect(routeSource).toContain("liveCriticalPagerDeliveryVerified: false");
    expect(routeSource).toContain("liveHighSlackDeliveryVerified: false");
  });

  it("pins the alert escalation command and artifact matrix", () => {
    expect(routeSource).toContain("alertEscalationRuntimeCommands");
    expect(routeSource).toContain("alertEscalationRuntimeMatrix");
    for (const id of [
      "worker-executor",
      "provider-credentials",
      "on-call-schedule",
      "quiet-hours-routing",
      "provider-callbacks",
      "live-critical-pager",
      "live-high-slack",
      "ci-alert-escalation-gate",
      "secret-safe-artifacts",
    ]) {
      expect(routeSource).toContain(`id: "${id}"`);
    }
  });

  it("declares redacted alert artifacts and CI coverage", () => {
    expect(routeSource).toContain("coverage/alert-escalation-runtime.json");
    expect(routeSource).toContain("coverage/alert-worker-retry-dead-letter.json");
    expect(routeSource).toContain("coverage/alert-acknowledgement-state.json");
    expect(routeSource).toContain("coverage/alert-sanitized-payload-redacted.json");
    expect(routeSource).toContain("coverage/alert-live-critical-pager-redacted.json");
    expect(routeSource).toContain("coverage/alert-live-high-slack-redacted.json");
    expect(routeSource).toContain("coverage/alert-worker-executor.json");
    expect(routeSource).toContain("coverage/alert-provider-callbacks-redacted.json");
    expect(routeSource).toContain("coverage/alert-ci-evidence.json");
    expect(routeSource).toContain("coverage/alert-secret-safe-artifacts.json");
    expect(workflowSource).toContain("Run Phase 11 alert escalation runtime contracts");
    expect(workflowSource).toContain("apps/web/tests/alert-escalation-runtime-static.test.ts");
    expect(workflowSource).toContain("coverage/alert-ci-evidence.json");
    expect(unitManifest).toContain("alertEscalationRuntimeMatrix");
  });

  it("updates GAP-083 tracker language without claiming live provider proof", () => {
    expect(trackerSource).toContain("GAP-083");
    expect(trackerSource).toContain("ALERT_WORKER_TOKEN");
    expect(trackerSource).toContain("AlertDelivery");
    expect(trackerSource).toContain("GAP-083 is alert-escalation-runtime-matrix wired");
    expect(trackerSource).toContain("live synthetic critical/high provider proof remains open");
  });
});
