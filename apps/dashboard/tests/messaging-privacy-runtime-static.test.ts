import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  messagingPrivacyArtifactPaths,
  messagingPrivacyRuntimeCommands,
  messagingPrivacyRuntimeMatrix,
  messagingPrivacyRuntimeReadiness,
} from "../lib/messagingPrivacyRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("messaging privacy runtime contract", () => {
  const notificationsPackageJson = readRepoFile("packages/notifications/package.json");
  const notificationsSource = readRepoFile("packages/notifications/src/index.ts");
  const privacySource = readRepoFile("apps/dashboard/lib/messagingPrivacy.ts");
  const routeSource = readRepoFile("apps/dashboard/app/api/messages/privacy/route.ts");
  const pageSource = readRepoFile("apps/dashboard/app/messages/page.tsx");
  const staticTest = readRepoFile("apps/dashboard/tests/messaging-privacy-static.test.ts");
  const messageReadTest = readRepoFile("apps/dashboard/tests/message-read-route-static.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins GAP-068 commands, matrix rows, and artifacts", () => {
    expect(messagingPrivacyRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/notifications typecheck",
      "pnpm --filter @inkroute/notifications test",
      "pnpm --filter @inkroute/dashboard typecheck",
      "pnpm vitest run apps/dashboard/tests/messaging-privacy-static.test.ts",
      "dashboard messaging role-visibility tests",
      "messaging privacy API authorization tests",
      "secure attachment authorization tests",
      "message export/delete/retention Postgres integration tests",
      "messaging spam moderation and rate-limit tests",
    ]);
    expect(messagingPrivacyRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "notifications-typecheck",
      "notifications-tests",
      "dashboard-typecheck",
      "static-contract",
      "redaction-service",
      "role-visibility",
      "api-authorization",
      "unauthorized-role-denial",
      "attachment-authorization",
      "export-workflow",
      "delete-workflow",
      "retention-workflow",
      "retention-job",
      "provider-payload-omission",
      "moderation-rate-limit",
      "audit-log",
      "idempotency-key",
      "postgres-retention",
      "ci-messaging-privacy-job",
      "secret-safe-artifacts",
    ]);
    expect(messagingPrivacyArtifactPaths).toContain("coverage/messaging-privacy-runtime.json");
    expect(messagingPrivacyArtifactPaths).toContain("test-results/messaging-privacy-runtime");
  });

  it("keeps package helpers, dashboard privacy contract, API boundary, page surface, and static guards wired", () => {
    expect(notificationsPackageJson).toContain('"typecheck"');
    expect(notificationsPackageJson).toContain('"test"');
    expect(notificationsSource).toContain("buildMessagingPrivacyRuntimeReadinessPlan");
    expect(notificationsSource).toContain("buildMessagingPrivacyPlan");
    expect(privacySource).toContain("executeMessagingPrivacyPlan");
    expect(privacySource).toContain("persistRetentionWorkflow");
    expect(privacySource).toContain("authorizeAttachment");
    expect(routeSource).toContain('assertPermission(actor, "message:write")');
    expect(routeSource).toContain("buildMessagingPrivacyPlanFromRequest");
    expect(pageSource).toContain("Messaging privacy contract");
    expect(staticTest).toContain("covers redaction, role visibility, export, delete, retention, moderation, and attachment authorization");
    expect(messageReadTest).toContain("message body redaction");
  });

  it("keeps authorization, attachment, workflow, retention, moderation, Postgres, CI, and artifact blockers explicit", () => {
    expect(messagingPrivacyRuntimeReadiness.status).toBe("blocked");
    expect(messagingPrivacyRuntimeReadiness.missingScripts).toEqual([]);
    expect(messagingPrivacyRuntimeReadiness.requiredEvidence).toEqual(expect.arrayContaining([
      "role-gated messaging UI/API and unauthorized-role denial evidence",
      "secure attachment authorization and policy test evidence",
      "persistence-backed export, delete, retention job, and Postgres integration evidence",
      "moderation/rate-limit, audit, idempotency, and spam test evidence",
    ]));
    expect(messagingPrivacyRuntimeReadiness.blockers).toContain("Unauthorized role denial tests must pass for messaging UI/API.");
    expect(messagingPrivacyRuntimeReadiness.blockers).toContain("Message export workflow persistence must be available.");
    expect(messagingPrivacyRuntimeReadiness.blockers).toContain("Message retention job must be configured.");
    expect(messagingPrivacyRuntimeReadiness.blockers).toContain("Postgres retention/delete/export integration tests must pass.");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming durable privacy workflow readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 9 messaging privacy runtime contracts");
    expect(ciWorkflow).toContain("messaging-privacy-runtime-static.test.ts");
    expect(ciWorkflow).toContain("messaging-privacy-runtime-artifacts");
    expect(unitManifest).toContain("unit-messaging-privacy-runtime-static");
    expect(gapTracker).toContain("apps/dashboard/lib/messagingPrivacyRuntime.ts");
    expect(gapTracker).toContain("GAP-068 is messaging-privacy-runtime-matrix wired");
    expect(messagingPrivacyArtifactPaths).toContain("coverage/messaging-privacy-secret-safe-artifacts.json");
  });
});
