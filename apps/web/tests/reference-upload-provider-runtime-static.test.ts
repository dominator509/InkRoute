import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  referenceUploadProviderArtifactPaths,
  referenceUploadProviderReadinessAreas,
  referenceUploadProviderRuntimeCommands,
  referenceUploadProviderRuntimeMatrix,
  referenceUploadProviderRuntimeReadiness,
} from "../lib/referenceUploadProviderRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("reference upload provider runtime contract", () => {
  const securityPackageJson = readRepoFile("packages/security/package.json");
  const securitySource = readRepoFile("packages/security/src/index.ts");
  const securityTests = readRepoFile("packages/security/tests/upload-policy.test.ts");
  const uploadRoute = readRepoFile("apps/web/app/api/public/[tenantSlug]/secure-upload-intents/route.ts");
  const uploadRouteTest = readRepoFile("apps/web/tests/secure-upload-intents-route.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins GAP-033 commands, readiness areas, matrix rows, and artifacts", () => {
    expect(referenceUploadProviderRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/security typecheck",
      "pnpm --filter @inkroute/security test",
      "pnpm --filter @inkroute/web typecheck",
      "pnpm vitest run apps/web/tests/secure-upload-intents-route.test.ts",
      "reference image provider-signed upload integration test",
      "reference image magic-byte and malware scan integration test",
      "FileAsset/BookingReferenceImage/AuditLog persistence integration test",
      "private reference anonymous and cross-tenant fetch-denial tests",
      "GitHub Actions reference upload provider evidence job",
    ]);
    expect(referenceUploadProviderReadinessAreas).toContain("signed-upload-intent-route-wiring");
    expect(referenceUploadProviderReadinessAreas).toContain("booking-reference-image-persistence");
    expect(referenceUploadProviderReadinessAreas).toContain("cross-tenant-private-fetch-denial");
    expect(referenceUploadProviderRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "security-typecheck",
      "security-upload-tests",
      "web-upload-typecheck",
      "secure-upload-route-tests",
      "signed-upload-intent-route",
      "provider-signed-upload-url",
      "byte-upload-verification",
      "magic-byte-validation",
      "malware-scan-quarantine",
      "fileasset-booking-reference-auditlog-persistence",
      "private-acl-fetch-denial",
      "cross-tenant-fetch-denial",
      "ci-secret-safe-evidence",
    ]);
    expect(referenceUploadProviderArtifactPaths).toContain("coverage/reference-upload-provider-runtime.json");
    expect(referenceUploadProviderArtifactPaths).toContain("test-results/reference-upload-provider-runtime");
  });

  it("keeps helper, tests, route response, and route tests wired to signed reference plans", () => {
    expect(securityPackageJson).toContain('"typecheck"');
    expect(securityPackageJson).toContain('"test"');
    expect(securitySource).toContain("buildReferenceUploadProviderEvidencePlan");
    expect(securityTests).toContain("buildReferenceUploadProviderEvidencePlan");
    expect(uploadRoute).toContain("buildReferenceUploadProviderEvidencePlan");
    expect(uploadRoute).toContain("referenceUploadProviderEvidencePlan");
    expect(uploadRoute).toContain('input.kind === "reference_private"');
    expect(uploadRouteTest).toContain("referenceUploadProviderEvidencePlan");
    expect(uploadRouteTest).toContain("provider-signed URL");
  });

  it("keeps provider blockers explicit until storage, scan, persistence, denial, CI, and artifact proof exists", () => {
    expect(referenceUploadProviderRuntimeReadiness.status).toBe("blocked");
    expect(referenceUploadProviderRuntimeReadiness.missingScripts).toEqual([]);
    expect(referenceUploadProviderRuntimeReadiness.requiredCommands).toEqual([...referenceUploadProviderRuntimeCommands]);
    expect(referenceUploadProviderRuntimeReadiness.requiredEvidence).toContain(
      "secure upload intent route, provider-signed URL, and byte upload verification evidence",
    );
    expect(referenceUploadProviderRuntimeReadiness.requiredEvidence).toContain(
      "FileAsset, BookingReferenceImage, and AuditLog persistence evidence",
    );
    expect(referenceUploadProviderRuntimeReadiness.blockers).toContain(
      "Provider-signed upload URL must be issued for reference_private uploads.",
    );
    expect(referenceUploadProviderRuntimeReadiness.blockers).toContain(
      "Private reference fetch-denial tests must prove anonymous public reads fail.",
    );
  });

  it("wires CI, manifest, tracker, and secret-safe artifacts without claiming provider readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 4 reference upload provider runtime contracts");
    expect(ciWorkflow).toContain("reference-upload-provider-runtime-static.test.ts");
    expect(ciWorkflow).toContain("reference-upload-provider-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-reference-upload-provider-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/referenceUploadProviderRuntime.ts");
    expect(gapTracker).toContain("GAP-033 is route-wired with signed upload intent, private access, persistence, and provider evidence plans");
    expect(referenceUploadProviderArtifactPaths).toContain("coverage/reference-upload-secret-safe-artifacts.json");
  });
});
