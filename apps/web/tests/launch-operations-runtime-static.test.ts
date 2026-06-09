import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  launchOperationsRuntimeArtifactPaths,
  launchOperationsRuntimeCheckIds,
  launchOperationsRuntimeCommands,
  launchOperationsRuntimeMatrix,
  launchOperationsRuntimeReadiness
} from "../lib/launchOperationsRuntime";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const opsEvidence = read("deployment/manifests/launch-operations-evidence.json");
const opsVerifier = read("deployment/scripts/verify-launch-operations.mjs");
const deploymentTests = read("packages/deployment/tests/deployment-readiness.test.ts");
const ciWorkflow = read(".github/workflows/ci.yml");
const unitManifest = read("testing/manifests/unit-test-manifest.json");
const gapTracker = read("GAP_TRACKER.md");

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
      "alert routing test",
      "incident drill",
      "rollback drill",
      "privacy export/delete drill",
      "support escalation drill",
      "production monitoring dashboard review",
      "communications template approval"
    ]);
    expect(launchOperationsRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "operations-verifier",
      "owner-coverage",
      "alert-routing",
      "incident-rollback-drills",
      "privacy-support-drills",
      "monitoring-dashboard",
      "communications-templates-approval",
      "ci-operations-artifacts"
    ]);
    expect(launchOperationsRuntimeArtifactPaths).toContain("coverage/launch-operations-ci-run-redacted.json");
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
    expect(launchOperationsRuntimeReadiness.requiredCommands).toEqual(launchOperationsRuntimeCommands);
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
    expect(gapTracker).toContain("live staffed launch operations proof remains open");
  });
});
