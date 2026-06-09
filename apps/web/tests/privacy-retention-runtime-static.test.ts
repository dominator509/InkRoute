import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  privacyRetentionArtifactPaths,
  privacyRetentionRuntimeCommands,
  privacyRetentionRuntimeMatrix,
  privacyRetentionRuntimeReadiness,
} from "../lib/privacyRetentionRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("privacy retention dry-run runtime contract", () => {
  const securityPackageJson = readRepoFile("packages/security/package.json");
  const securitySource = readRepoFile("packages/security/src/index.ts");
  const securityTests = readRepoFile("packages/security/tests/upload-policy.test.ts");
  const schema = readRepoFile("packages/db/prisma/schema.prisma");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins privacy retention commands, matrix rows, and artifact paths", () => {
    expect(privacyRetentionRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/security typecheck",
      "pnpm --filter @inkroute/security test",
      "privacy request worker integration tests",
      "Prisma privacy delete/anonymize dry run",
      "object storage deletion dry run",
      "tenant isolation privacy dry run",
      "backup/restore tombstone replay drill",
      "GitHub Actions privacy retention evidence job",
    ]);
    expect(privacyRetentionRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "security-package-gates",
      "attorney-notification-approval",
      "privacy-worker-persistence",
      "prisma-object-storage-dry-runs",
      "tenant-isolation-legal-hold-dry-runs",
      "backup-restore-tombstone-replay",
      "ci-redacted-evidence",
    ]);
    expect(privacyRetentionArtifactPaths).toContain("coverage/privacy-retention-runtime.json");
    expect(privacyRetentionArtifactPaths).toContain("coverage/privacy-retention-secret-safe-artifacts.json");
    expect(privacyRetentionArtifactPaths).toContain("test-results/privacy-retention-runtime");
  });

  it("keeps security scripts, dry-run evidence helper, privacy tests, and audit persistence visible", () => {
    for (const scriptName of ["typecheck", "test"]) {
      expect(securityPackageJson).toContain(`"${scriptName}"`);
    }
    expect(securitySource).toContain("buildPrivacyRetentionDryRunEvidencePlan");
    expect(securitySource).toContain("PrivacyRequest/PrivacyCase and AuditLog persistence");
    expect(securityTests).toContain("blocks privacy retention dry-run evidence until workers, legal approval, storage, tombstones, CI, and redaction are proven");
    expect(securityTests).toContain("marks privacy retention dry-run evidence ready when legal, workers, storage, tombstones, CI, and redaction align");
    expect(schema).toContain("model AuditLog");
  });

  it("keeps privacy retention evidence blocked until legal, worker, data, tombstone, CI, and redaction proof exists", () => {
    expect(privacyRetentionRuntimeReadiness.status).toBe("blocked");
    expect(privacyRetentionRuntimeReadiness.missingScripts).toEqual([]);
    expect(privacyRetentionRuntimeReadiness.requiredCommands).toEqual([...privacyRetentionRuntimeCommands]);
    expect(privacyRetentionRuntimeReadiness.requiredControls).toEqual([
      "Verify requester identity before export, delete, anonymize, or rectify workers run.",
      "Persist privacy case status, worker output metadata, tombstones, and audit events transactionally.",
      "Execute Prisma and object-storage dry-runs only against non-production fixtures.",
      "Enforce legal holds before any destructive action is planned or executed.",
      "Replay deletion/anonymization tombstones after backup restore before restored data is queryable.",
      "Keep all evidence artifacts redacted, secret-safe, and free of client PII or medical details.",
    ]);
    expect(privacyRetentionRuntimeReadiness.requiredEvidence).toEqual([
      "attorney approval packet for retention schedule, legal holds, destructive actions, and notification templates",
      "persisted identity, export, delete/anonymize, PrivacyRequest/PrivacyCase, tombstone, and AuditLog worker output",
      "Prisma, object-storage, tenant-isolation, and legal-hold privacy dry-run transcripts",
      "backup/restore tombstone replay drill output",
      "redacted CI artifact bundle with retention report and no secrets or client PII",
    ]);
    expect(privacyRetentionRuntimeReadiness.blockers).toContain(
      "Attorney approval must be captured for retention, export, delete, anonymization, notification, and legal-hold behavior.",
    );
    expect(privacyRetentionRuntimeReadiness.blockers).toContain(
      "Delete/anonymize worker dry-runs must persist tombstones, skipped legal holds, and audit events.",
    );
    expect(privacyRetentionRuntimeReadiness.blockers).toContain(
      "Privacy retention artifacts must be redacted and free of secrets, client PII, medical notes, and provider tokens.",
    );
  });

  it("wires CI, manifest, tracker, and artifacts without claiming privacy retention production readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 2 privacy retention runtime contracts");
    expect(ciWorkflow).toContain("privacy-retention-runtime-static.test.ts");
    expect(ciWorkflow).toContain("privacy-retention-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/privacy-retention-runtime.json");
    expect(unitManifest).toContain("unit-web-privacy-retention-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/privacyRetentionRuntime.ts");
    expect(gapTracker).toContain("live attorney approval, persisted DB/storage privacy workers, production dry-run artifacts, backup/restore tombstone replay proof, notification approval, CI evidence, and secret-safe artifact review remain open");
  });
});
