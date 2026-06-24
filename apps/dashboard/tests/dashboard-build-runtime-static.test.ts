import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildDashboardBuildRuntimeArtifactReview,
  buildDashboardBuildRuntimeEvidenceDecision,
  buildDashboardBuildRuntimeExecutionPlan,
  buildRedactedDashboardBuildRuntimeArtifact,
  dashboardBuildArtifactPaths,
  dashboardBuildRuntimeExternalCommands,
  dashboardBuildRuntimeExecutionPolicy,
  dashboardBuildRuntimeEvidenceFlags,
  dashboardBuildRuntimeLocalCommands,
  dashboardBuildRuntimeReadinessRequiredCommands,
  dashboardBuildRuntimeRequiredExternalEvidence,
  dashboardBuildRuntimeCommands,
  dashboardBuildRuntimeMatrix,
  dashboardBuildRuntimeProofFiles,
  dashboardBuildRuntimeReadiness,
} from "../lib/dashboardBuildRuntime";
import { dashboardLaunchEvidenceRequiredEvidence } from "@inkroute/auth";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("dashboard build/runtime verification contract", () => {
  const dashboardPackageJson = readRepoFile("apps/dashboard/package.json");
  const nextConfig = readRepoFile("apps/dashboard/next.config.mjs");
  const dashboardLayout = readRepoFile("apps/dashboard/app/layout.tsx");
  const dashboardMiddleware = readRepoFile("apps/dashboard/middleware.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins GAP-039 install, typecheck, build, browser smoke commands, matrix rows, and artifacts", () => {
    expect(dashboardBuildRuntimeCommands).toEqual([
      "pnpm install",
      "pnpm --filter @inkroute/dashboard typecheck",
      "pnpm --filter @inkroute/dashboard build",
      "pnpm --filter @inkroute/dashboard test",
      "dashboard browser smoke: /",
      "dashboard browser smoke: /bookings",
      "dashboard browser smoke: /clients",
      "dashboard browser smoke: /payments",
      "dashboard browser smoke: /portfolio",
      "dashboard browser smoke: /travel",
      "dashboard browser smoke: /messages",
      "dashboard browser smoke: /settings",
      "GitHub Actions dashboard build/runtime evidence job",
    ]);
    expect(dashboardBuildRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "dependency-install",
      "next-react-types",
      "dashboard-typecheck",
      "dashboard-build",
      "dashboard-tests",
      "browser-home",
      "browser-bookings-clients",
      "browser-commerce-content",
      "browser-messages-settings",
      "next15-runtime",
      "ci-secret-safe-evidence",
    ]);
    expect(dashboardBuildArtifactPaths).toContain("coverage/dashboard-build-runtime.json");
    expect(dashboardBuildArtifactPaths).toContain("coverage/dashboard-install-output.txt");
    expect(dashboardBuildArtifactPaths).toContain("test-results/dashboard-build-runtime");
  });

  it("pins current GAP-039 proof files", () => {
    expect(dashboardBuildRuntimeProofFiles).toContain("apps/dashboard/package.json");
    expect(dashboardBuildRuntimeProofFiles).toContain("apps/dashboard/tests/dashboard-build-runtime-static.test.ts");
    for (const file of dashboardBuildRuntimeProofFiles) {
      expect(readRepoFile(file).length).toBeGreaterThan(0);
    }
  });

  it("keeps dashboard Next/React dependencies, scripts, config, layout, and middleware build surfaces visible", () => {
    expect(dashboardPackageJson).toContain('"next"');
    expect(dashboardPackageJson).toContain('"react"');
    expect(dashboardPackageJson).toContain('"react-dom"');
    expect(dashboardPackageJson).toContain('"@types/react"');
    expect(dashboardPackageJson).toContain('"typecheck"');
    expect(dashboardPackageJson).toContain('"build"');
    expect(dashboardPackageJson).toContain('"test"');
    expect(nextConfig).toContain("transpilePackages");
    expect(dashboardLayout).toContain("export const metadata");
    expect(dashboardLayout).toContain("Private artist/admin dashboard control surface");
    expect(dashboardLayout).not.toContain("Private artist/admin dashboard scaffold");
    expect(dashboardLayout).toContain("DashboardLayout");
    expect(dashboardMiddleware).toContain("export const config");
  });

  it("keeps build/runtime readiness blocked until install, Next build, and browser rendering evidence exists", () => {
    expect(dashboardBuildRuntimeReadiness.status).toBe("blocked");
    expect(dashboardBuildRuntimeReadiness.missingScripts).toEqual([]);
    expect(dashboardBuildRuntimeReadiness.requiredCommands).toBe(dashboardBuildRuntimeReadinessRequiredCommands);
    expect(dashboardBuildRuntimeReadiness.requiredEvidence).toBe(dashboardLaunchEvidenceRequiredEvidence);
    expect(dashboardBuildRuntimeReadiness.tenantScopedApisImplemented).toBe(true);
    expect(dashboardBuildRuntimeReadiness.prismaRepositoriesImplemented).toBe(true);
    expect(dashboardBuildRuntimeReadiness.realMutationsEnabled).toBe(true);
    expect(dashboardBuildRuntimeReadiness.mutationAuditLogsPersisted).toBe(true);
    expect(dashboardBuildRuntimeReadiness.providerActionsImplemented).toBe(false);
    expect(dashboardBuildRuntimeReadiness.blockers).toContain("@inkroute/dashboard typecheck must pass.");
    expect(dashboardBuildRuntimeReadiness.blockers).toContain("@inkroute/dashboard build must pass.");
    expect(dashboardBuildRuntimeReadiness.blockers).toContain("Dashboard Playwright smoke tests must pass with seeded tenant data.");
  });

  it("blocks dashboard build/runtime completion when install, type, build, route smoke, CI, or safe evidence is missing", () => {
    const decision = buildDashboardBuildRuntimeEvidenceDecision({
      commands: ["pnpm install"],
      artifacts: ["coverage/dashboard-install-output.txt"],
      evidence: {
        dependenciesInstalled: true,
      },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingCommands).toContain("pnpm --filter @inkroute/dashboard build");
    expect(decision.missingArtifacts).toContain("coverage/dashboard-build-secret-safe-artifacts.json");
    expect(decision.missingEvidence).toContain("nextReactTypesAvailable");
    expect(decision.missingEvidence).toContain("browserBookingsSmokePassed");
    expect(decision.blockers).toContain("Next 15, React 19, JSX, and route handler types must be available.");
    expect(decision.blockers).toContain("Dashboard browser smoke for /bookings must pass.");
  });

  it("completes dashboard build/runtime verification only when every command, artifact, and evidence flag is present", () => {
    const completeEvidence = Object.fromEntries(dashboardBuildRuntimeEvidenceFlags.map((flag) => [flag, true]));
    const decision = buildDashboardBuildRuntimeEvidenceDecision({
      commands: dashboardBuildRuntimeCommands,
      artifacts: dashboardBuildArtifactPaths,
      evidence: completeEvidence,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingCommands).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingEvidence).toEqual([]);
    expect(decision.requiredEvidence).toBe(dashboardBuildRuntimeEvidenceFlags);
  });

  it("separates static dashboard build review from install/build/browser execution and redacts private artifacts", () => {
    const executionPlan = buildDashboardBuildRuntimeExecutionPlan();
    const artifactReview = buildDashboardBuildRuntimeArtifactReview({
      tenantDomain: "tenant.example.com",
      clientEmail: "client@example.com",
      buildEnv: "DATABASE_URL=postgres://inkroute:secret@db.example.com:5432/inkroute",
      authorizationHeader: "authorization: bearer provider-token",
      nested: {
        privateBuildLog: "private-tenant stack trace",
        publicSummary: "dashboard build runtime evidence captured",
      },
    });
    const directRedaction = buildRedactedDashboardBuildRuntimeArtifact({
      publicSummary: "safe dashboard build evidence",
      sourceMapUrl: "https://assets.example.com/private.map",
    });

    expect(executionPlan.localCommands).toBe(dashboardBuildRuntimeLocalCommands);
    expect(executionPlan.localCommands).toEqual([
      "static dashboard package script review",
      "static dashboard Next config review",
      "static dashboard layout and middleware build-surface review",
    ]);
    expect(executionPlan.externalCommands).toBe(dashboardBuildRuntimeExternalCommands);
    expect(executionPlan.externalCommands).toEqual([
      "pnpm install",
      "pnpm --filter @inkroute/dashboard typecheck",
      "pnpm --filter @inkroute/dashboard build",
      "pnpm --filter @inkroute/dashboard test",
      "dashboard browser smoke: /",
      "dashboard browser smoke: /bookings",
      "dashboard browser smoke: /clients",
      "dashboard browser smoke: /payments",
      "dashboard browser smoke: /portfolio",
      "dashboard browser smoke: /travel",
      "dashboard browser smoke: /messages",
      "dashboard browser smoke: /settings",
      "GitHub Actions dashboard build/runtime evidence job",
    ]);
    expect(executionPlan.commandExecutionAllowed).toBe(false);
    expect(executionPlan.dependencyInstallExecutionAllowed).toBe(false);
    expect(executionPlan.typecheckExecutionAllowed).toBe(false);
    expect(executionPlan.buildExecutionAllowed).toBe(false);
    expect(executionPlan.browserExecutionAllowed).toBe(false);
    expect(executionPlan.nextRuntimeExecutionAllowed).toBe(false);
    expect(executionPlan.ciExecutionAllowed).toBe(false);
    expect(executionPlan.executionPolicy).toBe(dashboardBuildRuntimeExecutionPolicy);
    expect(executionPlan.executionPolicy).toEqual({
      codexMayClassifyStaticBuildReadiness: true,
      dependencyInstallRequiredForClosure: true,
      nextReactTypesRequiredForClosure: true,
      dashboardTypecheckBuildTestRequiredForClosure: true,
      browserSmokeRequiredForClosure: true,
      next15RuntimeSmokeRequiredForClosure: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(executionPlan.requiredExternalEvidence).toBe(dashboardBuildRuntimeRequiredExternalEvidence);
    expect(executionPlan.requiredExternalEvidence).toContain("pnpm install output with committed lockfile");
    expect(executionPlan.requiredExternalEvidence).toContain("dashboard browser smoke evidence for launch-critical routes");
    expect(executionPlan.requiredExternalEvidence).toContain("secret-safe dashboard build/runtime artifact review");
    expect(artifactReview.requiredExternalEvidence).toBe(dashboardBuildRuntimeRequiredExternalEvidence);
    expect(artifactReview.redactions).toEqual([
      "tenantDomain",
      "clientEmail",
      "buildEnv",
      "authorizationHeader",
      "nested.privateBuildLog",
    ]);
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("tenant.example.com");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("client@example.com");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("DATABASE_URL");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("provider-token");
    expect(JSON.stringify(artifactReview.artifact)).toContain("dashboard build runtime evidence captured");
    expect(artifactReview.secretSafe).toBe(true);
    expect(directRedaction.redactions).toEqual(["sourceMapUrl"]);
    expect(JSON.stringify(directRedaction.artifact)).toContain("safe dashboard build evidence");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming build verification has run", () => {
    expect(ciWorkflow).toContain("Run Phase 5 dashboard build/runtime verification contracts");
    expect(ciWorkflow).toContain("dashboard-build-runtime-static.test.ts");
    expect(ciWorkflow).toContain("dashboard-build-runtime-artifacts");
    expect(unitManifest).toContain("unit-dashboard-build-runtime-static");
    expect(gapTracker).toContain("apps/dashboard/lib/dashboardBuildRuntime.ts");
    expect(gapTracker).toContain("buildDashboardBuildRuntimeExecutionPlan");
    expect(gapTracker).toContain("dashboardBuildRuntimeLocalCommands/dashboardBuildRuntimeExternalCommands");
    expect(gapTracker).toContain("dashboardBuildRuntimeExecutionPolicy");
    expect(gapTracker).toContain("dashboardBuildRuntimeRequiredExternalEvidence");
    expect(gapTracker).toContain("buildRedactedDashboardBuildRuntimeArtifact");
    expect(gapTracker).toContain("buildDashboardBuildRuntimeArtifactReview");
    expect(gapTracker).toContain("GAP-039 is dashboard-build-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("GAP-039 is build-runtime-matrix wired");
    expect(dashboardBuildArtifactPaths).toContain("coverage/dashboard-build-secret-safe-artifacts.json");
  });
});

