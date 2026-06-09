import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  providerStorageUploadArtifactPaths,
  providerStorageUploadReadinessAreas,
  providerStorageUploadRuntimeCommands,
  providerStorageUploadRuntimeMatrix,
  providerStorageUploadRuntimeReadiness,
} from "../lib/providerStorageUploadRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("provider storage upload runtime contract", () => {
  const securityPackageJson = readRepoFile("packages/security/package.json");
  const securitySource = readRepoFile("packages/security/src/index.ts");
  const securityTests = readRepoFile("packages/security/tests/upload-policy.test.ts");
  const uploadRoute = readRepoFile("apps/web/app/api/public/[tenantSlug]/secure-upload-intents/route.ts");
  const uploadRouteTest = readRepoFile("apps/web/tests/secure-upload-intents-route.test.ts");
  const portfolioReadTest = readRepoFile("apps/dashboard/tests/portfolio-read-route-static.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins provider storage commands, readiness areas, matrix rows, and artifacts", () => {
    expect(providerStorageUploadRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/security typecheck",
      "pnpm --filter @inkroute/security test",
      "pnpm --filter @inkroute/web typecheck",
      "pnpm vitest run apps/web/tests/secure-upload-intents-route.test.ts",
      "object storage provider upload/download integration tests",
      "malware scan and derivative worker integration tests",
      "private-original public-read denial test",
      "GitHub Actions storage/upload evidence job",
    ]);
    expect(providerStorageUploadReadinessAreas).toContain("private-original-bucket-acl");
    expect(providerStorageUploadReadinessAreas).toContain("transactional-fileasset-link-audit-persistence");
    expect(providerStorageUploadRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "security-typecheck",
      "security-upload-tests",
      "web-upload-typecheck",
      "secure-upload-route-tests",
      "provider-config-secrets",
      "bucket-acl-derivative-policy",
      "signed-upload-download-urls",
      "fileasset-link-audit-persistence",
      "scan-derivative-worker",
      "private-original-denial",
      "tenant-isolation-retention",
      "ci-secret-safe-evidence",
    ]);
    expect(providerStorageUploadArtifactPaths).toContain("coverage/provider-storage-upload-runtime.json");
    expect(providerStorageUploadArtifactPaths).toContain("test-results/provider-storage-upload-runtime");
  });

  it("keeps helper, tests, upload route, and dashboard portfolio redaction wired", () => {
    expect(securityPackageJson).toContain('"typecheck"');
    expect(securityPackageJson).toContain('"test"');
    expect(securitySource).toContain("buildProviderStorageUploadReadinessPlan");
    expect(securityTests).toContain("buildProviderStorageUploadReadinessPlan");
    expect(uploadRoute).toContain("fileAssetPersistencePlan");
    expect(uploadRouteTest).toContain("secure-upload-intents");
    expect(portfolioReadTest).toContain("storage-key redaction");
  });

  it("keeps provider storage blockers explicit until object storage evidence exists", () => {
    expect(providerStorageUploadRuntimeReadiness.status).toBe("blocked");
    expect(providerStorageUploadRuntimeReadiness.missingScripts).toEqual([]);
    expect(providerStorageUploadRuntimeReadiness.requiredCommands).toEqual([...providerStorageUploadRuntimeCommands]);
    expect(providerStorageUploadRuntimeReadiness.requiredEvidence).toContain(
      "storage provider selection plus redacted provider configuration evidence",
    );
    expect(providerStorageUploadRuntimeReadiness.requiredEvidence).toContain(
      "tenant-isolated provider integration, retention, CI, and secret-safe artifact evidence",
    );
    expect(providerStorageUploadRuntimeReadiness.blockers).toContain(
      "Supabase Storage, S3, or equivalent object storage provider must be selected.",
    );
    expect(providerStorageUploadRuntimeReadiness.blockers).toContain(
      "Provider integration tests must prove private originals cannot be publicly fetched.",
    );
  });

  it("wires CI, manifest, tracker, and artifacts without claiming provider storage readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 1 provider storage upload runtime contracts");
    expect(ciWorkflow).toContain("provider-storage-upload-runtime-static.test.ts");
    expect(ciWorkflow).toContain("provider-storage-upload-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-provider-storage-upload-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/providerStorageUploadRuntime.ts");
    expect(gapTracker).toContain("live storage provider selection/config/secrets, provider signed URLs, FileAsset/link/audit persistence, scan/derivative worker, provider integration tests, CI evidence, and secret-safe artifacts remain open");
  });
});
