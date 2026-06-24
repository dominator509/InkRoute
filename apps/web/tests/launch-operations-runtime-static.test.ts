import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildLaunchOperationsRuntimeArtifactReview,
  buildLaunchOperationsRuntimeEvidenceDecision,
  buildLaunchOperationsRuntimeExecutionPlan,
  buildLaunchOperationsRuntimeRedactedEvidenceBundle,
  buildRedactedLaunchOperationsArtifact,
  launchOperationsRuntimeArtifactPaths,
  launchOperationsRuntimeCheckIds,
  launchOperationsRuntimeCommands,
  launchOperationsRuntimeExternalArtifacts,
  launchOperationsRuntimeExternalCommands,
  launchOperationsRuntimeExecutionPolicy,
  launchOperationsRuntimeLocalArtifacts,
  launchOperationsRuntimeLocalCommands,
  launchOperationsRuntimeMatrix,
  launchOperationsRuntimeProofFiles,
  launchOperationsRuntimeReadiness,
  launchOperationsRuntimeRequiredExternalEvidence,
  launchOperationsRunPersistenceContract
} from "../lib/launchOperationsRuntime";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const opsEvidence = read("deployment/manifests/launch-operations-evidence.json");
const opsVerifier = read("deployment/scripts/verify-launch-operations.mjs");
const deploymentTests = read("packages/deployment/tests/deployment-readiness.test.ts");
const ciWorkflow = read(".github/workflows/ci.yml");
const unitManifest = read("testing/manifests/unit-test-manifest.json");
const gapTracker = read("GAP_TRACKER.md");
const prismaSchema = read("packages/db/prisma/schema.prisma");
const prismaMigration = read("packages/db/prisma/migrations/20260609022000_add_launch_operations_runs/migration.sql");

describe("GAP-120 launch operations runtime wiring", () => {
  it("pins launch operations check ids, commands, matrix entries, and redacted artifacts", () => {
    expect(launchOperationsRuntimeCheckIds).toEqual([
      "on-call-coverage",
      "alert-routing",
      "support-escalation",
      "privacy-request-drill",
      "incident-drill",
      "rollback-drill",
      "production-monitoring",
      "communications-templates"
    ]);
    expect(launchOperationsRuntimeCommands).toEqual([
      "pnpm deploy:verify-ops",
      "assign named primary and backup launch operations owners",
      "verify launch operations on-call coverage",
      "alert routing test",
      "incident drill",
      "rollback drill",
      "privacy export/delete drill",
      "support escalation drill",
      "production monitoring dashboard review",
      "communications template approval",
      "capture explicit launch operations approval",
      "capture CI launch-operations artifacts"
    ]);
    expect(launchOperationsRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "operations-verifier",
      "owner-coverage",
      "on-call-coverage",
      "alert-routing",
      "incident-drill",
      "rollback-drill",
      "privacy-request-drill",
      "support-escalation-drill",
      "monitoring-dashboard",
      "communications-templates-approval",
      "operations-approval",
      "ci-operations-artifacts",
      "redacted-evidence-bundle"
    ]);
    expect(launchOperationsRuntimeMatrix).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "incident-drill", artifact: "coverage/launch-operations-incident-drill-redacted.json" }),
        expect.objectContaining({ id: "privacy-request-drill", artifact: "coverage/launch-operations-privacy-request-drill-redacted.json" }),
        expect.objectContaining({ id: "operations-approval", artifact: "coverage/launch-operations-approval-redacted.json" }),
        expect.objectContaining({ id: "ci-operations-artifacts", command: "capture CI launch-operations artifacts" }),
        expect.objectContaining({ id: "redacted-evidence-bundle", artifact: "coverage/launch-operations-redacted-evidence-bundle.json" })
      ])
    );
    expect(launchOperationsRuntimeArtifactPaths).toContain("coverage/launch-operations-ci-run-redacted.json");
    expect(launchOperationsRuntimeArtifactPaths).toContain("coverage/launch-operations-redacted-evidence-bundle.json");
    expect(launchOperationsRuntimeArtifactPaths).toContain("test-results/launch-operations-runtime");
  });

  it("keeps launch operations evidence, verifier, unsafe-evidence rules, and package tests aligned", () => {
    for (const checkId of launchOperationsRuntimeCheckIds) {
      expect(opsEvidence).toContain(`"id": "${checkId}"`);
      expect(opsVerifier).toContain(`"${checkId}"`);
    }
    expect(opsEvidence).toContain("requiresNamedPrimaryAndBackup");
    expect(opsEvidence).toContain("private phone numbers");
    expect(opsEvidence).toContain("provider alert webhook URLs");
    expect(opsEvidence).toContain("support transcripts with raw customer data");
    expect(opsVerifier).toContain("forbiddenPatterns");
    expect(deploymentTests).toContain("buildLaunchOperationsRuntimeReadinessPlan");
  });

  it("keeps readiness blocked until owners, SLAs, drills, monitoring, templates, verifier, and approval proof exist", () => {
    expect(launchOperationsRuntimeReadiness.status).toBe("blocked");
    expect(launchOperationsRuntimeReadiness.missingChecks).toEqual(
      expect.arrayContaining(["on-call-coverage", "alert-routing", "privacy-request-drill", "rollback-drill"])
    );
    expect(launchOperationsRuntimeReadiness.unassignedOwnerFields).toEqual([
      "incidentCommander",
      "privacyOwner",
      "supportOwner",
      "releaseOwner",
      "securityOwner"
    ]);
    expect(launchOperationsRuntimeReadiness.requiredCommands).toStrictEqual(launchOperationsRuntimeCommands);
    expect(launchOperationsRuntimeReadiness.requiredEvidence).toEqual(
      expect.arrayContaining([
        "Named primary and backup owners for incident, privacy, support, release, and security operations.",
        "Alert routing test proving critical alerts reach the on-call owner within SLA.",
        "Incident drill notes with severity classification, tenant-safe communications, and postmortem template.",
        "Rollback drill labels for web, dashboard, mobile OTA, and database restore or forward-fix.",
        "Privacy request export/delete drill with identity verification and audit log labels.",
        "Support escalation transcript label with privacy-safe redaction and acknowledgement SLA.",
        "Production monitoring dashboard, uptime check, Sentry alert, and release-health proof.",
        "Approved incident, maintenance, and privacy communications templates."
      ])
    );
    expect(launchOperationsRuntimeReadiness.blockers).toEqual(
      expect.arrayContaining([
        "Launch operations evidence must include every required operations check.",
        "Launch operations must have named primary and backup ownership for incident, privacy, support, release, and security.",
        "pnpm deploy:verify-ops must pass.",
        "Alert routing test must prove critical alerts reach the on-call owner.",
        "Communications template approval"
      ])
    );
  });

  it("keeps CI, manifest registration, and tracker status aligned", () => {
    expect(ciWorkflow).toContain("Run Phase 15 launch operations runtime contracts");
    expect(ciWorkflow).toContain("apps/web/tests/launch-operations-runtime-static.test.ts");
    expect(ciWorkflow).toContain("launch-operations-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/launch-operations-runtime.json");
    expect(ciWorkflow).toContain("test-results/launch-operations-runtime");
    expect(unitManifest).toContain("unit-web-launch-operations-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/launchOperationsRuntime.ts");
    expect(gapTracker).toContain("Launch operations evidence classifier wired with execution policy");
    expect(gapTracker).toContain("GAP-120 is launch-operations-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("buildLaunchOperationsRuntimeExecutionPlan");
    expect(gapTracker).toContain("launchOperationsRuntimeExecutionPolicy");
    expect(gapTracker).toContain("launchOperationsRuntimeRequiredExternalEvidence");
    expect(gapTracker).toContain("buildLaunchOperationsRuntimeArtifactReview");
    expect(gapTracker).toContain("buildLaunchOperationsRuntimeRedactedEvidenceBundle");
  });

  it("pins current launch operations runtime proof files for GAP-120", () => {
    expect(launchOperationsRuntimeProofFiles).toEqual(
      expect.arrayContaining([
      "deployment/PRODUCTION_LAUNCH_CHECKLIST.md",
      "packages/deployment/src/index.ts",
        "apps/web/lib/launchOperationsRuntime.ts",
        "apps/web/tests/launch-operations-runtime-static.test.ts",
        "deployment/manifests/launch-operations-evidence.json",
        "deployment/scripts/verify-launch-operations.mjs",
        "packages/db/prisma/migrations/20260609022000_add_launch_operations_runs/migration.sql",
        ".github/workflows/ci.yml"
      ])
    );
    for (const file of launchOperationsRuntimeProofFiles) {
      expect(read(file).length).toBeGreaterThan(0);
    }
  });

  it("pins durable LaunchOperationsRun persistence for staffed operations proof", () => {
    expect(launchOperationsRunPersistenceContract.prismaModel).toBe("LaunchOperationsRun");
    expect(launchOperationsRunPersistenceContract.tenantRelation).toBe("launchOperationsRuns");
    expect(launchOperationsRunPersistenceContract.uniqueKey).toEqual(["tenantId", "runId"]);
    expect(launchOperationsRunPersistenceContract.jsonFields).toEqual([
      "ownerCoverageMatrix",
      "operationCheckMatrix",
      "unsafeEvidenceFindings",
      "artifactManifest"
    ]);
    expect(launchOperationsRunPersistenceContract.requiredBooleanProofs).toEqual(
      expect.arrayContaining([
        "namedPrimaryBackupOwnersAssigned",
        "onCallCoverageVerified",
        "alertRoutingTestPassed",
        "supportEscalationDrillPassed",
        "privacyRequestDrillPassed",
        "incidentDrillPassed",
        "rollbackDrillPassed",
        "productionMonitoringVerified",
        "communicationsTemplatesApproved",
        "explicitOperationsApprovalCaptured"
      ])
    );
    expect(launchOperationsRunPersistenceContract.redactedArtifactFields).toContain("ownerCoverageArtifactPath");
    expect(prismaSchema).toContain("launchOperationsRuns LaunchOperationsRun[]");
    expect(prismaSchema).toContain("model LaunchOperationsRun");
    expect(prismaSchema).toContain("ownerCoverageMatrix                     Json");
    expect(prismaSchema).toContain("communicationsTemplatesApproved         Boolean  @default(false)");
    expect(prismaSchema).toContain("@@unique([tenantId, runId])");
    expect(prismaMigration).toContain('CREATE TABLE "LaunchOperationsRun"');
    expect(prismaMigration).toContain('"operationsApprovalArtifactPath" TEXT');
    expect(unitManifest).toContain("LaunchOperationsRun Prisma model and app row contract");
    expect(gapTracker).toContain("packages/db/prisma/migrations/20260609022000_add_launch_operations_runs/migration.sql");
  });

  it("classifies GAP-120 evidence as blocked until staffed launch operations proof is captured", () => {
    const blockedDecision = buildLaunchOperationsRuntimeEvidenceDecision({
      verifierPassed: true,
      namedPrimaryBackupOwnersAssigned: false,
      onCallCoverageVerified: false,
      alertRoutingTestPassed: false,
      supportEscalationDrillPassed: false,
      privacyRequestDrillPassed: false,
      incidentDrillPassed: false,
      rollbackDrillPassed: false,
      productionMonitoringVerified: false,
      communicationsTemplatesApproved: false,
      unsafeEvidenceScanPassed: true,
      explicitOperationsApprovalCaptured: false,
      ciLaunchOperationsArtifactsCaptured: false,
      requiredCommandsRun: launchOperationsRuntimeCommands.filter(
        (command) =>
          command !== "assign named primary and backup launch operations owners" &&
          command !== "verify launch operations on-call coverage" &&
          command !== "alert routing test" &&
          command !== "incident drill" &&
          command !== "rollback drill" &&
          command !== "privacy export/delete drill" &&
          command !== "support escalation drill" &&
          command !== "communications template approval" &&
          command !== "capture explicit launch operations approval" &&
          command !== "capture CI launch-operations artifacts",
      ),
      capturedArtifacts: [
        "coverage/launch-operations-runtime.json",
        "coverage/launch-operations-verifier.json",
        "test-results/launch-operations-runtime",
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toEqual(
      expect.arrayContaining([
        "Assign named primary and backup owners.",
        "Verify on-call coverage.",
        "Run alert routing test.",
        "Run support escalation drill.",
        "Run privacy request drill.",
        "Run incident drill.",
        "Run rollback drill.",
        "Verify production monitoring dashboards.",
        "Approve communications templates.",
        "Capture explicit operations approval.",
        "Capture CI launch-operations artifacts.",
        "Required command not recorded: assign named primary and backup launch operations owners",
        "Required command not recorded: verify launch operations on-call coverage",
        "Required command not recorded: alert routing test",
        "Required command not recorded: incident drill",
        "Required command not recorded: rollback drill",
        "Required command not recorded: privacy export/delete drill",
        "Required command not recorded: support escalation drill",
        "Required command not recorded: communications template approval",
        "Required command not recorded: capture explicit launch operations approval",
        "Required command not recorded: capture CI launch-operations artifacts",
      ]),
    );
    expect(blockedDecision.missingArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/launch-operations-owner-coverage-redacted.json",
        "coverage/launch-operations-alert-routing-redacted.json",
        "coverage/launch-operations-privacy-request-drill-redacted.json",
        "coverage/launch-operations-monitoring-dashboard-redacted.json",
        "coverage/launch-operations-approval-redacted.json",
        "coverage/launch-operations-ci-run-redacted.json",
        "coverage/launch-operations-redacted-evidence-bundle.json",
      ]),
    );
    expect(blockedDecision.operationsPolicy).toEqual({
      namedPrimaryAndBackupOwnersRequired: true,
      privateContactDetailsForbidden: true,
      explicitOperationsApprovalRequired: true,
    });

    const completeDecision = buildLaunchOperationsRuntimeEvidenceDecision({
      verifierPassed: true,
      namedPrimaryBackupOwnersAssigned: true,
      onCallCoverageVerified: true,
      alertRoutingTestPassed: true,
      supportEscalationDrillPassed: true,
      privacyRequestDrillPassed: true,
      incidentDrillPassed: true,
      rollbackDrillPassed: true,
      productionMonitoringVerified: true,
      communicationsTemplatesApproved: true,
      unsafeEvidenceScanPassed: true,
      explicitOperationsApprovalCaptured: true,
      ciLaunchOperationsArtifactsCaptured: true,
      requiredCommandsRun: launchOperationsRuntimeCommands,
      capturedArtifacts: launchOperationsRuntimeArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
    expect(completeDecision.requiredCommands).toBe(launchOperationsRuntimeCommands);
    expect(completeDecision.requiredEvidence).toBe(launchOperationsRuntimeArtifactPaths);
  });

  it("keeps staffed operations execution disabled while splitting local verifier proof from external staffed proof", () => {
    const plan = buildLaunchOperationsRuntimeExecutionPlan();

    expect(plan.localCommands).toBe(launchOperationsRuntimeLocalCommands);
    expect(plan.externalCommands).toBe(launchOperationsRuntimeExternalCommands);
    expect(plan.localArtifacts).toBe(launchOperationsRuntimeLocalArtifacts);
    expect(plan.externalArtifacts).toBe(launchOperationsRuntimeExternalArtifacts);
    expect(plan.localArtifacts).toEqual([
      "coverage/launch-operations-runtime.json",
      "coverage/launch-operations-verifier.json",
      "test-results/launch-operations-runtime",
    ]);
    expect(plan.externalArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/launch-operations-owner-coverage-redacted.json",
        "coverage/launch-operations-alert-routing-redacted.json",
        "coverage/launch-operations-support-escalation-redacted.json",
        "coverage/launch-operations-privacy-request-drill-redacted.json",
        "coverage/launch-operations-incident-drill-redacted.json",
        "coverage/launch-operations-rollback-drill-redacted.json",
        "coverage/launch-operations-monitoring-dashboard-redacted.json",
        "coverage/launch-operations-communications-templates-redacted.json",
        "coverage/launch-operations-approval-redacted.json",
        "coverage/launch-operations-ci-run-redacted.json",
      ]),
    );
    expect(plan.verifierExecutionAllowed).toBe(false);
    expect(plan.ownerAssignmentExecutionAllowed).toBe(false);
    expect(plan.onCallCoverageExecutionAllowed).toBe(false);
    expect(plan.alertRoutingExecutionAllowed).toBe(false);
    expect(plan.incidentDrillExecutionAllowed).toBe(false);
    expect(plan.rollbackDrillExecutionAllowed).toBe(false);
    expect(plan.privacyDrillExecutionAllowed).toBe(false);
    expect(plan.supportEscalationExecutionAllowed).toBe(false);
    expect(plan.monitoringReviewExecutionAllowed).toBe(false);
    expect(plan.communicationsApprovalExecutionAllowed).toBe(false);
    expect(plan.operationsApprovalExecutionAllowed).toBe(false);
    expect(plan.ciArtifactExecutionAllowed).toBe(false);
    expect(plan.executionPolicy).toBe(launchOperationsRuntimeExecutionPolicy);
    expect(plan.executionPolicy).toEqual({
      codexMayClassifyOpsEvidence: true,
      namedPrimaryAndBackupOwnersRequired: true,
      privateContactDetailsForbidden: true,
      providerAlertWebhookUrlsForbidden: true,
      staffedOperationsRequiredForApproval: true,
      ciProviderRequiredForOperationsArtifacts: true,
    });
    expect(plan.externalEvidenceRequired).toBe(launchOperationsRuntimeRequiredExternalEvidence);
    expect(plan.externalEvidenceRequired).toContain(
      "Redacted launch operations evidence bundle captured without private contact details, provider alert webhooks, raw support transcripts, customer data, monitoring URLs, approval payloads, or CI run URLs.",
    );
  });

  it("redacts launch operations artifacts before review or retention", () => {
    const rawArtifact = {
      ownerContact: { email: "incident@example.com", phone: "+1 555 444 1212" },
      onCallPager: "pager_owner_123",
      alertWebhookUrl: "https://hooks.provider.example.com/secret-alert-webhook",
      supportTranscript: "Customer tenant_demo asked to delete private data for user_123",
      monitoringDashboardUrl: "https://sentry.example.com/org/inkroute/project",
      approvalPayload: { approvedBy: "ops@example.com" },
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/123456",
      nested: {
        authorization: "Bearer launch-ops-token",
        incidentId: "incident_abc123",
      },
    };
    const redacted = buildRedactedLaunchOperationsArtifact(rawArtifact);
    const review = buildLaunchOperationsRuntimeArtifactReview("coverage/launch-operations-owner-coverage-redacted.json", rawArtifact);
    const bundle = buildLaunchOperationsRuntimeRedactedEvidenceBundle("coverage/launch-operations-owner-coverage-redacted.json", rawArtifact);
    const serialized = JSON.stringify(review);

    expect(JSON.stringify(redacted)).not.toContain("incident@example.com");
    expect(serialized).not.toContain("+1 555 444 1212");
    expect(serialized).not.toContain("hooks.provider.example.com");
    expect(serialized).not.toContain("tenant_demo");
    expect(serialized).not.toContain("user_123");
    expect(serialized).not.toContain("sentry.example.com");
    expect(serialized).not.toContain("ops@example.com");
    expect(serialized).not.toContain("github.com/dominator509");
    expect(serialized).not.toContain("Bearer launch-ops-token");
    expect(serialized).not.toContain("incident_abc123");
    expect(review.containsUnredactedSensitiveValues).toBe(false);
    expect(review.redactions).toEqual(
      expect.arrayContaining([
        "alertWebhookUrl",
        "approvalPayload",
        "authorization",
        "ciRunUrl",
        "incidentId",
        "monitoringDashboardUrl",
        "onCallPager",
        "ownerContact",
        "supportTranscript",
      ]),
    );
    expect(review.externalEvidenceRequired).toBe(launchOperationsRuntimeRequiredExternalEvidence);
    expect(bundle.status).toBe("redacted-evidence-bundle-ready");
    expect(bundle.artifactPath).toBe("coverage/launch-operations-redacted-evidence-bundle.json");
    expect(bundle.review.containsUnredactedSensitiveValues).toBe(false);
    expect(bundle.requiredArtifacts).toBe(launchOperationsRuntimeArtifactPaths);
    expect(bundle.externalEvidenceRequired).toBe(launchOperationsRuntimeRequiredExternalEvidence);
    expect(bundle.operationsApprovalExecutionAllowed).toBe(false);
    expect(bundle.ciArtifactExecutionAllowed).toBe(false);
    expect(review.externalEvidenceRequired).toEqual(
      expect.arrayContaining([
        "Named owner, on-call, alert routing, and support escalation proof must be captured outside Codex with private contact details redacted.",
        "Incident, rollback, privacy, and support drills must redact customer data, provider alert webhooks, and raw support transcripts.",
        "Monitoring dashboard and communications approval artifacts must redact provider URLs, contact details, and approval payloads.",
        "Explicit operations approval and CI launch-operations artifacts must remain redacted before repository retention.",
      ]),
    );
  });
});

