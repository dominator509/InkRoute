import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildMessagingPrivacyArtifactReview,
  buildMessagingPrivacyEvidenceDecision,
  buildMessagingPrivacyExecutionPlan,
  buildRedactedMessagingPrivacyArtifact,
  messagingPrivacyArtifactPaths,
  messagingPrivacyDecisionRequiredEvidence,
  messagingPrivacyExecutionPolicy,
  messagingPrivacyExternalCommands,
  messagingPrivacyLocalCommands,
  messagingPrivacyRequiredExternalEvidence,
  messagingPrivacyRuntimeCommands,
  messagingPrivacyRuntimeMatrix,
  messagingPrivacyRuntimeProofFiles,
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
    expect(privacySource).toContain("createPrismaMessagingPrivacyRepository");
    expect(privacySource).toContain("MessagingPrivacyPrismaRepositoryClient");
    expect(privacySource).toContain("messagePrivacyEvent");
    expect(privacySource).toContain("messageAuditLog");
    expect(privacySource).toContain("createInMemoryMessagingPrivacyRepository");
    expect(privacySource).toContain("buildRedactedMessagingPrivacyPayload");
    expect(privacySource).toContain("messagingPrivacyActionRolePolicy");
    expect(privacySource).toContain("messagingPrivacyRoleMismatchBlocker");
    expect(privacySource).toContain("messagingPrivacySecureAttachmentBlocker");
    expect(privacySource).toContain("persistRetentionWorkflow");
    expect(privacySource).toContain("authorizeAttachment");
    expect(routeSource).toContain('assertPermission(actor, "message:write")');
    expect(routeSource).toContain("mapDashboardRoleToMessagingPrivacyRole(actor.role)");
    expect(routeSource).toContain("MESSAGING_PRIVACY_ROLE_MISMATCH");
    expect(routeSource).toContain("MESSAGING_PRIVACY_ROLE_FORBIDDEN");
    expect(routeSource).toContain("buildMessagingPrivacyPlanFromRequest");
    expect(routeSource).toContain("MESSAGING_PRIVACY_WORKFLOW_PERSISTENCE_NOT_CONFIGURED");
    expect(routeSource).toContain("messagingPrivacyLocalContractFallbackDisabled");
    expect(routeSource).not.toContain("messagingPrivacyPlanOnlyWritesDisabled");
    expect(pageSource).toContain("Messaging privacy contract");
    expect(staticTest).toContain("covers redaction, role visibility, export, delete, retention, moderation, and attachment authorization");
    expect(messageReadTest).toContain("uses Prisma message-thread reads with body/provider/contact redaction and audit logs");
  });

  it("keeps authorization, attachment, workflow, retention, moderation, Postgres, CI, and artifact blockers explicit", () => {
    expect(messagingPrivacyRuntimeReadiness.status).toBe("blocked");
    expect(messagingPrivacyRuntimeReadiness.missingScripts).toEqual([]);
    expect(messagingPrivacyRuntimeReadiness.requiredEvidence).toBe(messagingPrivacyDecisionRequiredEvidence);
    expect(messagingPrivacyRuntimeReadiness.blockers).toContain("Unauthorized role denial tests must pass for messaging UI/API.");
    expect(messagingPrivacyRuntimeReadiness.blockers).not.toContain("Message export workflow persistence must be available.");
    expect(messagingPrivacyRuntimeReadiness.blockers).not.toContain("Message delete workflow persistence must be available.");
    expect(messagingPrivacyRuntimeReadiness.blockers).not.toContain("Message retention workflow persistence must be available.");
    expect(messagingPrivacyRuntimeReadiness.blockers).toContain("Message retention job must be configured.");
    expect(messagingPrivacyRuntimeReadiness.blockers).toContain("Postgres retention/delete/export integration tests must pass.");
  });

  it("pins the non-executing GAP-068 messaging privacy execution policy", () => {
    const plan = buildMessagingPrivacyExecutionPlan();

    expect(messagingPrivacyExecutionPolicy).toEqual({
      codexMayClassifyStaticMessagingPrivacyReadiness: true,
      localCommandEvidenceRequiredForClosure: true,
      roleVisibilityRequiredForClosure: true,
      apiAuthorizationRequiredForClosure: true,
      attachmentAuthorizationRequiredForClosure: true,
      exportDeleteRetentionRequiredForClosure: true,
      providerPayloadOmissionRequiredForClosure: true,
      moderationRateLimitRequiredForClosure: true,
      postgresRetentionRequiredForClosure: true,
      ciEvidenceRequiredForClosure: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(plan.policy).toBe(messagingPrivacyExecutionPolicy);
    expect(plan.commandExecutionAllowed).toBe(false);
    expect(plan.authorizationExecutionAllowed).toBe(false);
    expect(plan.attachmentAuthorizationExecutionAllowed).toBe(false);
    expect(plan.workflowExecutionAllowed).toBe(false);
    expect(plan.retentionJobExecutionAllowed).toBe(false);
    expect(plan.moderationExecutionAllowed).toBe(false);
    expect(plan.postgresExecutionAllowed).toBe(false);
    expect(plan.ciExecutionAllowed).toBe(false);
    expect(plan.artifactReviewExecutionAllowed).toBe(false);
    expect(plan.localCommands).toBe(messagingPrivacyLocalCommands);
    expect(plan.externalCommands).toBe(messagingPrivacyExternalCommands);
    expect(plan.requiredExternalEvidence).toBe(messagingPrivacyRequiredExternalEvidence);
    expect(messagingPrivacyRequiredExternalEvidence).toEqual([
      "actual messaging privacy command output",
      "dashboard messaging role-visibility tests",
      "messaging privacy API authorization tests",
      "unauthorized-role runtime denial tests",
      "secure attachment authorization tests",
      "message export/delete/retention workflow tests",
      "message retention job execution tests",
      "provider payload/private URL omission tests",
      "messaging spam moderation and rate-limit tests",
      "MessageAuditLog and IdempotencyKey evidence",
      "message export/delete/retention Postgres integration tests",
      "CI messaging privacy artifacts",
      "secret-safe messaging privacy artifact review",
    ]);
  });

  it("pins recursive messaging privacy artifact redaction and review", () => {
    const redacted = buildRedactedMessagingPrivacyArtifact({
      tenantId: "tenant_private",
      messageBody: "private message",
      signedAttachmentUrl: "https://private/attachment",
      providerPayload: "private provider payload",
      publicSummary: "messaging privacy evidence captured",
      nested: {
        medicalNote: "private medical note",
        publicStatus: "redacted",
      },
    });

    expect(redacted.secretSafe).toBe(true);
    expect(redacted.redactedPaths).toEqual([
      "tenantId",
      "messageBody",
      "signedAttachmentUrl",
      "providerPayload",
      "nested.medicalNote",
    ]);
    expect(redacted.artifact).toEqual({
      tenantId: "[redacted]",
      messageBody: "[redacted]",
      signedAttachmentUrl: "[redacted]",
      providerPayload: "[redacted]",
      publicSummary: "messaging privacy evidence captured",
      nested: {
        medicalNote: "[redacted]",
        publicStatus: "redacted",
      },
    });

    const review = buildMessagingPrivacyArtifactReview({
      publicSummary: "safe messaging privacy artifact",
      retentionExportUrl: "https://private/export",
    });

    expect(review.passed).toBe(true);
    expect(review.blockers).toEqual([]);
    expect(review.artifact.secretSafe).toBe(true);
    expect(review.artifact.redactedPaths).toEqual(["retentionExportUrl"]);
    expect(review.requiredExternalEvidence).toBe(messagingPrivacyRequiredExternalEvidence);
  });

  it("classifies messaging privacy evidence before GAP-068 can close", () => {
    const blockedDecision = buildMessagingPrivacyEvidenceDecision({
      notificationsTypecheckPassed: true,
      notificationsTestsPassed: true,
      dashboardTypecheckPassed: true,
      staticContractTestsPassed: true,
      redactionServiceVerified: true,
      roleVisibilityVerified: false,
      apiAuthorizationVerified: false,
      unauthorizedRoleDenialVerified: false,
      attachmentAuthorizationVerified: false,
      exportWorkflowVerified: false,
      deleteWorkflowVerified: false,
      retentionWorkflowVerified: false,
      retentionJobVerified: false,
      providerPayloadOmissionVerified: true,
      moderationRateLimitVerified: false,
      auditLogVerified: false,
      idempotencyKeyVerified: false,
      postgresRetentionVerified: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactReviewPassed: false,
      capturedArtifacts: [
        "coverage/messaging-privacy-runtime.json",
        "coverage/messaging-privacy-notifications-typecheck.txt",
        "coverage/messaging-privacy-notifications-test.txt",
        "coverage/messaging-privacy-dashboard-typecheck.txt",
        "coverage/messaging-privacy-static-contract.json",
        "coverage/messaging-privacy-redaction-service.json",
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toContain("Role-based message visibility evidence is missing.");
    expect(blockedDecision.blockers).toContain("Unauthorized-role denial evidence is missing.");
    expect(blockedDecision.blockers).toContain("Secure attachment authorization evidence is missing.");
    expect(blockedDecision.blockers).toContain("Message export workflow persistence evidence is missing.");
    expect(blockedDecision.blockers).toContain("Postgres retention/export/delete integration evidence is missing.");
    expect(blockedDecision.blockers).toContain("Secret-safe messaging privacy artifact review evidence is missing.");
    expect(blockedDecision.missingArtifacts).toContain("coverage/messaging-privacy-role-visibility.json");
    expect(blockedDecision.missingArtifacts).toContain("coverage/messaging-privacy-secret-safe-artifacts.json");
    expect(blockedDecision.requiredCommands).toBe(messagingPrivacyRuntimeCommands);
    expect(blockedDecision.requiredEvidence).toBe(messagingPrivacyDecisionRequiredEvidence);
    expect(blockedDecision.redactedSummary).toEqual({
      capturedArtifactCount: 6,
      requiredArtifactCount: messagingPrivacyArtifactPaths.length,
    });

    const completeDecision = buildMessagingPrivacyEvidenceDecision({
      notificationsTypecheckPassed: true,
      notificationsTestsPassed: true,
      dashboardTypecheckPassed: true,
      staticContractTestsPassed: true,
      redactionServiceVerified: true,
      roleVisibilityVerified: true,
      apiAuthorizationVerified: true,
      unauthorizedRoleDenialVerified: true,
      attachmentAuthorizationVerified: true,
      exportWorkflowVerified: true,
      deleteWorkflowVerified: true,
      retentionWorkflowVerified: true,
      retentionJobVerified: true,
      providerPayloadOmissionVerified: true,
      moderationRateLimitVerified: true,
      auditLogVerified: true,
      idempotencyKeyVerified: true,
      postgresRetentionVerified: true,
      ciEvidenceCaptured: true,
      secretSafeArtifactReviewPassed: true,
      capturedArtifacts: messagingPrivacyArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
    expect(completeDecision.requiredEvidence).toBe(messagingPrivacyDecisionRequiredEvidence);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming provider-backed privacy workflow readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 9 messaging privacy runtime contracts");
    expect(ciWorkflow).toContain("messaging-privacy-runtime-static.test.ts");
    expect(ciWorkflow).toContain("messaging-privacy-runtime-artifacts");
    expect(unitManifest).toContain("unit-messaging-privacy-runtime-static");
    expect(gapTracker).toContain("apps/dashboard/lib/messagingPrivacyRuntime.ts");
    expect(gapTracker).toContain("messaging privacy evidence classifier");
    expect(gapTracker).toContain("buildMessagingPrivacyExecutionPlan");
    expect(gapTracker).toContain("messagingPrivacyExecutionPolicy");
    expect(gapTracker).toContain("messagingPrivacyRequiredExternalEvidence");
    expect(gapTracker).toContain("messagingPrivacyDecisionRequiredEvidence");
    expect(gapTracker).toContain("buildRedactedMessagingPrivacyArtifact");
    expect(gapTracker).toContain("buildMessagingPrivacyArtifactReview");
    expect(gapTracker).toContain("non-executing messaging privacy execution policy");
    expect(gapTracker).toContain("createPrismaMessagingPrivacyRepository");
    expect(gapTracker).toContain("MessagePrivacyEvent");
    expect(gapTracker).toContain("MessageAuditLog");
    expect(gapTracker).toContain("GAP-068 is messaging-privacy-runtime-matrix wired with messaging privacy evidence classifier");
    expect(messagingPrivacyArtifactPaths).toContain("coverage/messaging-privacy-secret-safe-artifacts.json");
  });

  it("pins current messaging privacy proof files for GAP-068", () => {
    expect(messagingPrivacyRuntimeProofFiles).toEqual(expect.arrayContaining([
      "apps/dashboard/package.json",
      "packages/notifications/package.json",
      "packages/notifications/src/index.ts",
      "packages/notifications/tests/delivery-plan.test.ts",
      "packages/types/package.json",
  "packages/types/src/index.ts",
      "packages/auth/src/index.ts",
      "apps/dashboard/lib/messagingPrivacy.ts",
      "apps/dashboard/lib/messagingPrivacyRuntime.ts",
      "apps/dashboard/app/messages/page.tsx",
      "apps/dashboard/app/api/messages/route.ts",
      "apps/dashboard/app/api/messages/[threadId]/route.ts",
      "apps/dashboard/app/api/messages/privacy/route.ts",
      "apps/dashboard/tests/message-read-route-static.test.ts",
      "apps/dashboard/tests/messaging-privacy-static.test.ts",
      "apps/dashboard/tests/messaging-privacy-runtime-static.test.ts",
      "packages/db/prisma/schema.prisma",
      "packages/db/prisma/migrations/20260622192000_add_message_privacy_events/migration.sql",
      "testing/manifests/unit-test-manifest.json",
      ".github/workflows/ci.yml",
      "SECURITY.md",
    ]));
    for (const file of messagingPrivacyRuntimeProofFiles) {
      expect(readRepoFile(file).length).toBeGreaterThan(0);
    }
  });
});


