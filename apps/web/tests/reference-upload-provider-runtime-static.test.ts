import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildRedactedReferenceUploadProviderArtifact,
  buildReferenceUploadProviderArtifactReview,
  buildReferenceUploadProviderEvidenceDecision,
  buildReferenceUploadProviderExecutionPlan,
  referenceUploadProviderArtifactPaths,
  referenceUploadProviderEvidenceFlags,
  referenceUploadProviderExternalCommands,
  referenceUploadProviderExecutionPolicy,
  referenceUploadProviderLocalCommands,
  referenceUploadProviderReadinessAreas,
  referenceUploadProviderRequiredExternalEvidence,
  referenceUploadProviderRuntimeCommands,
  referenceUploadProviderRuntimeMatrix,
  referenceUploadProviderRuntimeProofFiles,
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
    expect(uploadRoute).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(uploadRouteTest).toContain("referenceUploadProviderEvidencePlan");
    expect(uploadRouteTest).toContain("provider-signed URL");
    expect(uploadRouteTest).toContain('response.headers.get("Cache-Control")).toBe("no-store")');
  });

  it("keeps provider blockers explicit until storage, scan, persistence, denial, CI, and artifact proof exists", () => {
    expect(referenceUploadProviderRuntimeReadiness.status).toBe("blocked");
    expect(referenceUploadProviderRuntimeReadiness.missingScripts).toEqual([]);
    expect(referenceUploadProviderRuntimeReadiness.requiredCommands).toBe(referenceUploadProviderRuntimeCommands);
    expect(referenceUploadProviderRuntimeReadiness.requiredEvidence).toBe(referenceUploadProviderEvidenceFlags);
    expect(referenceUploadProviderRuntimeReadiness.blockers).toContain(
      "Provider-signed upload URL must be issued for reference_private uploads.",
    );
    expect(referenceUploadProviderRuntimeReadiness.blockers).toContain(
      "Private reference fetch-denial tests must prove anonymous public reads fail.",
    );
  });

  it("blocks reference upload provider completion when provider, scan, persistence, denial, CI, or safe evidence is missing", () => {
    const decision = buildReferenceUploadProviderEvidenceDecision({
      commands: ["pnpm --filter @inkroute/security typecheck"],
      artifacts: ["coverage/reference-upload-security-typecheck.txt"],
      readinessAreas: ["signed-upload-intent-route-wiring"],
      evidence: {
        securityTypecheckPassed: true,
        uploadIntentRouteUsesSignedPlan: true,
      },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingCommands).toContain("reference image provider-signed upload integration test");
    expect(decision.missingArtifacts).toContain("coverage/reference-upload-secret-safe-artifacts.json");
    expect(decision.missingReadinessAreas).toContain("provider-signed-upload-url-issuance");
    expect(decision.missingEvidence).toContain("providerSignedUploadUrlIssued");
    expect(decision.missingEvidence).toContain("privateFetchDenied");
    expect(decision.blockers).toContain("Provider-signed upload URL must be issued for reference_private uploads.");
    expect(decision.blockers).toContain("Private reference fetch-denial tests must prove anonymous public reads fail.");
  });

  it("completes reference upload provider readiness only when every command, artifact, readiness area, and evidence flag is present", () => {
    const completeEvidence = Object.fromEntries(referenceUploadProviderEvidenceFlags.map((flag) => [flag, true]));
    const decision = buildReferenceUploadProviderEvidenceDecision({
      commands: referenceUploadProviderRuntimeCommands,
      artifacts: referenceUploadProviderArtifactPaths,
      readinessAreas: referenceUploadProviderReadinessAreas,
      evidence: completeEvidence,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingCommands).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingReadinessAreas).toEqual([]);
    expect(decision.missingEvidence).toEqual([]);
    expect(decision.requiredEvidence).toBe(referenceUploadProviderEvidenceFlags);
  });

  it("separates static reference upload review from provider execution and redacts private artifacts", () => {
    const executionPlan = buildReferenceUploadProviderExecutionPlan();
    const artifactReview = buildReferenceUploadProviderArtifactReview({
      tenantDomain: "tenant.example.com",
      signedUploadUrl: "https://storage.example.com/private-object?signature=sk_private",
      clientEmail: "client@example.com",
      malwareScanProviderToken: "provider-token-private",
      nested: {
        privateObjectKey: "tenant/private-object/reference.png",
        publicSummary: "reference upload provider evidence captured",
      },
    });
    const directRedaction = buildRedactedReferenceUploadProviderArtifact({
      publicSummary: "safe reference upload evidence",
      checksumSignature: "sha256-private",
    });

    expect(executionPlan.localCommands).toBe(referenceUploadProviderLocalCommands);
    expect(executionPlan.externalCommands).toBe(referenceUploadProviderExternalCommands);
    expect(executionPlan.commandExecutionAllowed).toBe(false);
    expect(executionPlan.providerStorageExecutionAllowed).toBe(false);
    expect(executionPlan.malwareScanExecutionAllowed).toBe(false);
    expect(executionPlan.databaseExecutionAllowed).toBe(false);
    expect(executionPlan.privateFetchExecutionAllowed).toBe(false);
    expect(executionPlan.ciExecutionAllowed).toBe(false);
    expect(executionPlan.executionPolicy).toBe(referenceUploadProviderExecutionPolicy);
    expect(executionPlan.executionPolicy).toEqual({
      codexMayClassifyStaticUploadRouteReadiness: true,
      providerSignedUrlRequiredForClosure: true,
      byteAndMagicValidationRequiredForClosure: true,
      malwareScanAndQuarantineRequiredForClosure: true,
      transactionalPersistenceRequiredForClosure: true,
      privateAclAndFetchDenialRequiredForClosure: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(executionPlan.requiredExternalEvidence).toBe(referenceUploadProviderRequiredExternalEvidence);
    expect(executionPlan.requiredExternalEvidence).toContain("provider-signed reference_private upload URL transcript");
    expect(executionPlan.requiredExternalEvidence).toContain("transactional FileAsset BookingReferenceImage AuditLog persistence evidence");
    expect(executionPlan.requiredExternalEvidence).toContain("secret-safe reference upload artifact review");
    expect(artifactReview.requiredExternalEvidence).toBe(referenceUploadProviderRequiredExternalEvidence);
    expect(artifactReview.redactions).toEqual([
      "tenantDomain",
      "signedUploadUrl",
      "clientEmail",
      "malwareScanProviderToken",
      "nested.privateObjectKey",
    ]);
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("tenant.example.com");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("storage.example.com");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("client@example.com");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("provider-token");
    expect(JSON.stringify(artifactReview.artifact)).toContain("reference upload provider evidence captured");
    expect(artifactReview.secretSafe).toBe(true);
    expect(directRedaction.redactions).toEqual(["checksumSignature"]);
    expect(JSON.stringify(directRedaction.artifact)).toContain("safe reference upload evidence");
  });

  it("wires CI, manifest, tracker, and secret-safe artifacts without claiming provider readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 4 reference upload provider runtime contracts");
    expect(ciWorkflow).toContain("reference-upload-provider-runtime-static.test.ts");
    expect(ciWorkflow).toContain("reference-upload-provider-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-reference-upload-provider-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/referenceUploadProviderRuntime.ts");
    expect(gapTracker).toContain("buildReferenceUploadProviderExecutionPlan");
    expect(gapTracker).toContain("buildRedactedReferenceUploadProviderArtifact");
    expect(gapTracker).toContain("buildReferenceUploadProviderArtifactReview");
    expect(gapTracker).toContain("referenceUploadProviderExecutionPolicy");
    expect(gapTracker).toContain("referenceUploadProviderRequiredExternalEvidence");
    expect(gapTracker).toContain("GAP-033 is reference-upload-provider-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("GAP-033 is route-wired with signed upload intent, private access, persistence, and provider evidence plans");
    expect(gapTracker).toContain("proof inventory");
    expect(referenceUploadProviderArtifactPaths).toContain("coverage/reference-upload-secret-safe-artifacts.json");
  });

  it("pins current reference upload provider proof files for GAP-033", () => {
    expect(referenceUploadProviderRuntimeProofFiles).toContain("packages/security/package.json");
    expect(referenceUploadProviderRuntimeProofFiles).toContain("apps/web/package.json");
    expect(referenceUploadProviderRuntimeProofFiles).toContain("apps/web/lib/referenceUploadProviderRuntime.ts");
    expect(referenceUploadProviderRuntimeProofFiles).toContain("apps/web/tests/reference-upload-provider-runtime-static.test.ts");
    for (const proofFile of referenceUploadProviderRuntimeProofFiles) {
      expect(readRepoFile(proofFile).length).toBeGreaterThan(0);
    }
  });
});


