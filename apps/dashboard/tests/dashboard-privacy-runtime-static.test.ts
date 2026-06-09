import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  dashboardPrivacyArtifactPaths,
  dashboardPrivacyRuntimeCommands,
  dashboardPrivacyRuntimeMatrix,
  dashboardPrivacyRuntimeReadiness,
  dashboardPrivacySurfaces,
} from "../lib/dashboardPrivacyRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("dashboard privacy runtime contract", () => {
  const securityPackageJson = readRepoFile("packages/security/package.json");
  const securitySource = readRepoFile("packages/security/src/index.ts");
  const securityTests = readRepoFile("packages/security/tests/upload-policy.test.ts");
  const privacyRoute = readRepoFile("apps/dashboard/app/api/security/privacy-requests/route.ts");
  const trustRoute = readRepoFile("apps/dashboard/app/api/security/trust-status/route.ts");
  const privacyRouteTest = readRepoFile("apps/dashboard/tests/security-privacy-route-static.test.ts");
  const trustRouteTest = readRepoFile("apps/dashboard/tests/security-trust-route-static.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins GAP-040 surfaces, commands, matrix rows, and artifacts", () => {
    expect(dashboardPrivacySurfaces).toEqual([
      "client_profile",
      "booking_request",
      "consent_form",
      "payment",
      "message",
      "file_asset",
    ]);
    expect(dashboardPrivacyRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/security typecheck",
      "pnpm --filter @inkroute/security test",
      "pnpm --filter @inkroute/dashboard typecheck",
      "pnpm --filter @inkroute/dashboard build",
      "dashboard privacy route/API tests",
      "persisted dashboard export workflow tests",
      "persisted dashboard delete/anonymize workflow tests",
      "private file deletion integration tests",
      "dashboard privacy AuditLog persistence tests",
      "dashboard sanitized log/error evidence sweep",
      "legal/product dashboard privacy approval review",
      "GitHub Actions dashboard privacy evidence job",
    ]);
    expect(dashboardPrivacyRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "security-typecheck",
      "security-tests",
      "dashboard-typecheck-build",
      "route-projection-matrix",
      "privacy-trust-route-tests",
      "persisted-request-store",
      "export-delete-anonymize",
      "private-file-deletion",
      "auditlog-sanitized-logs-errors",
      "legal-product-approval",
      "ci-secret-safe-evidence",
    ]);
    expect(dashboardPrivacyArtifactPaths).toContain("coverage/dashboard-privacy-runtime.json");
    expect(dashboardPrivacyArtifactPaths).toContain("test-results/dashboard-privacy-runtime");
  });

  it("keeps helper, route projections, trust boundaries, and route tests wired", () => {
    expect(securityPackageJson).toContain('"typecheck"');
    expect(securityPackageJson).toContain('"test"');
    expect(securitySource).toContain("buildDashboardPrivacyWorkflowEvidencePlan");
    expect(securityTests).toContain("buildDashboardPrivacyWorkflowEvidencePlan");
    expect(privacyRoute).toContain("buildDashboardPrivacyWorkflowEvidencePlan");
    expect(privacyRoute).toContain("dashboardPrivacyWorkflowEvidencePlan");
    expect(privacyRoute).toContain("redactRecord");
    expect(privacyRoute).toContain('"Cache-Control": "no-store"');
    expect(trustRoute).toContain("buildTrustCenterChecklist");
    expect(trustRoute).toContain('"Cache-Control": "no-store"');
    expect(privacyRouteTest).toContain("Persist PrivacyRequest row + case notes");
    expect(trustRouteTest).toContain("tenant and role gates");
  });

  it("keeps workflow blockers explicit until persisted privacy, deletion, audit, legal, CI, and artifact proof exists", () => {
    expect(dashboardPrivacyRuntimeReadiness.status).toBe("blocked");
    expect(dashboardPrivacyRuntimeReadiness.missingScripts).toEqual([]);
    expect(dashboardPrivacyRuntimeReadiness.missingProjectionSurfaces).toEqual([]);
    expect(dashboardPrivacyRuntimeReadiness.missingRouteTestSurfaces).toEqual([]);
    expect(dashboardPrivacyRuntimeReadiness.requiredCommands).toEqual([...dashboardPrivacyRuntimeCommands]);
    expect(dashboardPrivacyRuntimeReadiness.requiredEvidence).toEqual(expect.arrayContaining([
      "persisted privacy request, export/delete/anonymize, and private storage deletion workflow evidence",
      "redacted AuditLog, sanitized runtime log, and sanitized error-report evidence",
      "attorney/product approval for privacy, consent, medical, deposit/payment, and SMS/message copy",
      "dashboard typecheck/build, CI, and secret-safe artifact evidence",
    ]));
    expect(dashboardPrivacyRuntimeReadiness.blockers).toContain("Persisted privacy request/case store must back dashboard export/delete workflows.");
    expect(dashboardPrivacyRuntimeReadiness.blockers).toContain("Attorney/product approval must be captured for dashboard privacy behavior.");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming legal/runtime privacy readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 5 dashboard privacy runtime contracts");
    expect(ciWorkflow).toContain("dashboard-privacy-runtime-static.test.ts");
    expect(ciWorkflow).toContain("dashboard-privacy-runtime-artifacts");
    expect(unitManifest).toContain("unit-dashboard-privacy-runtime-static");
    expect(gapTracker).toContain("apps/dashboard/lib/dashboardPrivacyRuntime.ts");
    expect(gapTracker).toContain("GAP-040 is privacy-route-evidence wired");
    expect(dashboardPrivacyArtifactPaths).toContain("coverage/dashboard-privacy-secret-safe-artifacts.json");
  });
});
