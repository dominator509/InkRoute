import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildRedactedSecurityAppRuntimeArtifact,
  buildSecurityAppRuntimeArtifactReview,
  buildSecurityAppRuntimeEvidenceDecision,
  buildSecurityAppRuntimeExecutionPlan,
  buildSecurityAppRuntimeRunData,
  buildSecurityAppRuntimeRunPersistenceContract,
  persistSecurityAppRuntimeRun,
  securityAppRuntimeArtifactPaths,
  securityAppRuntimeCommands,
  securityAppRuntimeExternalArtifacts,
  securityAppRuntimeExternalCommands,
  securityAppRuntimeExecutionPolicy,
  securityAppRuntimeLocalArtifacts,
  securityAppRuntimeLocalCommands,
  securityAppRuntimeProofFiles,
  securityAppRuntimeRequiredExternalEvidence,
  securityAppRuntimeRunPersistencePreview,
  securityAppRuntimeTargets,
  securityAppRuntimeVerificationPlan,
} from "../lib/securityAppRuntimeVerification";

function readWorkspaceFile(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("GAP-104 security app runtime verification contract", () => {
  it("maps web, dashboard, mobile, API, middleware, browser, and device runtime targets", () => {
    expect(securityAppRuntimeTargets.map((target) => target.id)).toEqual(
      expect.arrayContaining([
        "web-typecheck",
        "web-build",
        "dashboard-typecheck",
        "dashboard-build",
        "mobile-typecheck",
        "next-config-static",
        "mobile-security-static",
        "web-security-routes",
        "dashboard-security-routes",
        "middleware-runtime",
        "browser-runtime",
        "mobile-device",
      ]),
    );
    expect(securityAppRuntimeCommands).toContain("pnpm --filter @inkroute/web build");
    expect(securityAppRuntimeCommands).toContain("pnpm --filter @inkroute/dashboard build");
    expect(securityAppRuntimeCommands).toContain("mobile SystemStatus device/emulator smoke tests");
    expect(securityAppRuntimeArtifactPaths).toContain("coverage/security-mobile-device-smoke.json");
  });

  it("keeps Next shared package transpilation and mobile SystemStatus security surfaces pinned", () => {
    const webConfig = readWorkspaceFile("apps/web/next.config.mjs");
    const dashboardConfig = readWorkspaceFile("apps/dashboard/next.config.mjs");
    const nextConfigTest = readWorkspaceFile("apps/web/tests/security-next-config-static.test.ts");
    const publicTrustPage = readWorkspaceFile("apps/web/app/trust/page.tsx");
    const mobileStatic = readWorkspaceFile("apps/mobile/tests/mobile-security-static.test.ts");
    const systemStatus = readWorkspaceFile("apps/mobile/src/screens/SystemStatusScreen.tsx");
    const mobileDemo = readWorkspaceFile("apps/mobile/src/lib/mobileDemo.ts");

    expect(webConfig).toContain("@inkroute/security");
    expect(dashboardConfig).toContain("@inkroute/security");
    expect(nextConfigTest).toContain("@inkroute/security");
    expect(mobileStatic).toContain("SystemStatusScreen");
    expect(systemStatus).toContain("Security posture");
    expect(systemStatus).toContain("local runtime contracts");
    expect(systemStatus).not.toContain("local-control contracts");
    expect(publicTrustPage).toContain("Trust control center");
    expect(publicTrustPage).toContain("local security contracts and production blockers");
    expect(publicTrustPage).toContain("Local contracts");
    expect(publicTrustPage).not.toContain("Trust scaffold");
    expect(publicTrustPage).not.toContain("public trust page is a placeholder");
    expect(mobileDemo).toContain("mobileSecuritySummary");
    expect(mobileDemo).toContain("mobileUploadValidationPreview");
  });

  it("keeps runtime readiness blocked until app builds, route smoke, middleware smoke, browser smoke, and device proof execute", () => {
    expect(securityAppRuntimeVerificationPlan.status).toBe("blocked");
    expect(securityAppRuntimeVerificationPlan.blockers).toEqual(
      expect.arrayContaining([
        "Web app typecheck must pass with shared security package imports.",
        "Web app build must pass with security middleware and route imports.",
        "Dashboard app build must pass with security middleware and trust routes.",
        "Mobile app typecheck must pass with SystemStatus security, tenant-isolation, privacy, and upload preview surfaces.",
        "Web route smoke tests must exercise trust, privacy, legal, consent, and secure-upload surfaces.",
        "Mobile SystemStatus screen smoke must prove security posture, privacy, tenant isolation, and upload preview render under app dependencies.",
      ]),
    );
    expect(securityAppRuntimeVerificationPlan.requiredEvidence).toEqual(
      expect.arrayContaining([
        "web/dashboard/mobile typecheck and build command output",
        "web/dashboard route smoke and middleware runtime smoke transcripts",
        "browser runtime, mobile device/emulator, and CI artifact evidence",
      ]),
    );
  });

  it("pins current security app runtime proof files for GAP-104", () => {
    expect(securityAppRuntimeProofFiles).toEqual(
      expect.arrayContaining([
      "apps/web/app/consent-disclaimer/page.tsx",
      "apps/web/app/privacy/page.tsx",
      "apps/web/app/terms/page.tsx",
      "apps/web/app/trust/page.tsx",
      "packages/security/tests/upload-policy.test.ts",
      "apps/dashboard/package.json",
      "apps/mobile/package.json",
      "apps/web/package.json",
        "packages/security/src/index.ts",
        "apps/web/lib/securityAppRuntimeVerification.ts",
        "apps/web/tests/security-app-runtime-verification-static.test.ts",
        "apps/web/next.config.mjs",
        "apps/mobile/src/screens/SystemStatusScreen.tsx",
        "packages/db/prisma/migrations/20260609007000_add_security_app_runtime_runs/migration.sql",
        ".github/workflows/ci.yml",
      ]),
    );
    for (const file of securityAppRuntimeProofFiles) {
      expect(readWorkspaceFile(file).length).toBeGreaterThan(0);
    }
  });

  it("pins durable SecurityAppRuntimeRun rows, runtime flags, device-gated targets, and artifact manifests", () => {
    const schema = readWorkspaceFile("packages/db/prisma/schema.prisma");
    const contract = buildSecurityAppRuntimeRunPersistenceContract({
      tenantId: "tenant_demo",
      runId: "security-app-runtime-demo",
      commitSha: "abc1234",
      status: "device_gated",
      targetMatrix: securityAppRuntimeTargets,
      artifactManifest: securityAppRuntimeArtifactPaths,
      webTypecheckPassed: false,
      webBuildPassed: false,
      dashboardTypecheckPassed: false,
      dashboardBuildPassed: false,
      mobileTypecheckPassed: false,
      routeSmokePassed: false,
      middlewareSmokePassed: false,
      browserRuntimeSmokePassed: false,
      mobileDeviceSmokePassed: false,
      deviceGatedTargets: ["mobile-device"],
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/redacted",
    });

    expect(schema).toContain("model SecurityAppRuntimeRun");
    expect(schema).toContain("targetMatrix");
    expect(schema).toContain("mobileDeviceSmokePassed");
    expect(schema).toContain("@@unique([tenantId, runId])");
    expect(contract.transactionWrites).toEqual(["SecurityAppRuntimeRun", "AuditLog"]);
    expect(contract.requiredRuntimeFlags).toContain("browserRuntimeSmokePassed");
    expect(contract.artifactFields).toContain("deviceGatedTargets");
    expect(contract.tenantIsolationKey).toBe("tenantId");
    expect(securityAppRuntimeRunPersistencePreview.modelName).toBe("SecurityAppRuntimeRun");
    const runData = buildSecurityAppRuntimeRunData(contract.row);
    expect(runData).toMatchObject({
      tenantId: "tenant_demo",
      runId: "security-app-runtime-demo",
      status: "device_gated",
      mobileDeviceSmokePassed: false,
    });
    expect(persistSecurityAppRuntimeRun).toBeTypeOf("function");
    expect(String(persistSecurityAppRuntimeRun)).toContain("repository.securityAppRuntimeRun.upsert");
  });

  it("pins CI, manifest, and tracker references for GAP-104", () => {
    const ci = readWorkspaceFile(".github/workflows/ci.yml");
    const manifest = readWorkspaceFile("testing/manifests/unit-test-manifest.json");
    const tracker = readWorkspaceFile("GAP_TRACKER.md");

    expect(ci).toContain("Run Phase 13 security app runtime verification contracts");
    expect(ci).toContain("apps/web/tests/security-app-runtime-verification-static.test.ts");
    expect(ci).toContain("security-app-runtime-verification-artifacts");
    expect(manifest).toContain("unit-web-security-app-runtime-verification-static");
    expect(manifest).toContain("SecurityAppRuntimeRun Prisma model and app row contract are wired");
    expect(tracker).toContain("apps/web/lib/securityAppRuntimeVerification.ts");
    expect(tracker).toContain("Security app runtime evidence classifier wired and build/device proof gated");
    expect(tracker).toContain("GAP-104 is security-app-runtime-verification-matrix wired with evidence classifier");
    expect(tracker).toContain("persistSecurityAppRuntimeRun upsert seam");
    expect(tracker).toContain("securityAppRuntimeLocalArtifacts");
    expect(tracker).toContain("securityAppRuntimeExternalArtifacts");
  });

  it("classifies GAP-104 evidence as blocked until app runtime, build, browser, and device proof is captured", () => {
    const blockedDecision = buildSecurityAppRuntimeEvidenceDecision({
      webTypecheckPassed: true,
      webBuildPassed: false,
      dashboardTypecheckPassed: true,
      dashboardBuildPassed: false,
      mobileTypecheckPassed: false,
      nextConfigStaticPassed: true,
      mobileSecurityStaticPassed: true,
      webRouteSmokePassed: false,
      dashboardRouteSmokePassed: false,
      middlewareSmokePassed: false,
      browserRuntimeSmokePassed: false,
      mobileDeviceSmokePassed: false,
      requiredCommandsRun: securityAppRuntimeCommands.filter(
        (command) =>
          command !== "pnpm --filter @inkroute/web build" &&
          command !== "pnpm --filter @inkroute/dashboard build" &&
          command !== "mobile SystemStatus device/emulator smoke tests",
      ),
      capturedArtifacts: [
        "coverage/security-app-runtime-verification.json",
        "coverage/security-web-typecheck.log",
        "coverage/security-dashboard-typecheck.log",
        "coverage/security-next-config-static.json",
        "coverage/security-mobile-system-status-static.json",
        "test-results/security-app-runtime",
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toEqual(
      expect.arrayContaining([
        "Run web build with security middleware and route imports.",
        "Run dashboard build with security middleware and trust routes.",
        "Run mobile typecheck with SystemStatus security surfaces.",
        "Capture web security route smoke proof.",
        "Capture dashboard security route smoke proof.",
        "Capture browser runtime security smoke proof.",
        "Capture mobile device/emulator SystemStatus smoke proof.",
        "Required command not recorded: pnpm --filter @inkroute/web build",
        "Required command not recorded: pnpm --filter @inkroute/dashboard build",
        "Required command not recorded: mobile SystemStatus device/emulator smoke tests",
      ]),
    );
    expect(blockedDecision.missingArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/security-web-build.log",
        "coverage/security-dashboard-build.log",
        "coverage/security-mobile-typecheck.log",
        "coverage/security-browser-runtime-smoke.json",
        "coverage/security-mobile-device-smoke.json",
      ]),
    );
    expect(blockedDecision.runtimePolicy).toEqual({
      nextBuildsMustUseSharedSecurityPackage: true,
      browserSmokeRequired: true,
      mobileDeviceOrEmulatorSmokeRequired: true,
    });

    const completeDecision = buildSecurityAppRuntimeEvidenceDecision({
      webTypecheckPassed: true,
      webBuildPassed: true,
      dashboardTypecheckPassed: true,
      dashboardBuildPassed: true,
      mobileTypecheckPassed: true,
      nextConfigStaticPassed: true,
      mobileSecurityStaticPassed: true,
      webRouteSmokePassed: true,
      dashboardRouteSmokePassed: true,
      middlewareSmokePassed: true,
      browserRuntimeSmokePassed: true,
      mobileDeviceSmokePassed: true,
      requiredCommandsRun: securityAppRuntimeCommands,
      capturedArtifacts: securityAppRuntimeArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
    expect(completeDecision.requiredCommands).toBe(securityAppRuntimeCommands);
    expect(completeDecision.requiredEvidence).toBe(securityAppRuntimeArtifactPaths);
  });

  it("keeps GAP-104 build, browser, device, and persistence execution disabled in the local plan", () => {
    const plan = buildSecurityAppRuntimeExecutionPlan();

    expect(plan.webBuildExecutionAllowed).toBe(false);
    expect(plan.dashboardBuildExecutionAllowed).toBe(false);
    expect(plan.mobileTypecheckExecutionAllowed).toBe(false);
    expect(plan.routeSmokeExecutionAllowed).toBe(false);
    expect(plan.browserRuntimeExecutionAllowed).toBe(false);
    expect(plan.mobileDeviceExecutionAllowed).toBe(false);
    expect(plan.persistenceExecutionAllowed).toBe(false);
    expect(plan.policy).toBe(securityAppRuntimeExecutionPolicy);
    expect(plan.externalEvidenceRequired).toBe(securityAppRuntimeRequiredExternalEvidence);
    expect(securityAppRuntimeExecutionPolicy.externalEvidenceRequired).toBe(securityAppRuntimeRequiredExternalEvidence);
    expect(securityAppRuntimeRequiredExternalEvidence).toEqual(expect.arrayContaining([
      "Web/dashboard typecheck and build proof",
      "Mobile typecheck proof",
      "Browser runtime smoke proof",
      "Mobile device/emulator SystemStatus smoke proof",
      "Provider-backed SecurityAppRuntimeRun persistence proof",
    ]));
    expect(plan.localCommands).toBe(securityAppRuntimeLocalCommands);
    expect(plan.externalCommands).toBe(securityAppRuntimeExternalCommands);
    expect(plan.localArtifacts).toBe(securityAppRuntimeLocalArtifacts);
    expect(plan.externalArtifacts).toBe(securityAppRuntimeExternalArtifacts);
    expect(plan.localArtifacts).toEqual([
      "coverage/security-next-config-static.json",
      "coverage/security-mobile-system-status-static.json",
    ]);
    expect(plan.externalArtifacts).toEqual(expect.arrayContaining([
      "coverage/security-web-build.log",
      "coverage/security-dashboard-build.log",
      "coverage/security-browser-runtime-smoke.json",
      "coverage/security-mobile-device-smoke.json",
    ]));
    expect(plan.disabledReasons.join(" ")).toContain("Mobile SystemStatus smoke proof requires simulator/device execution.");
  });

  it("redacts GAP-104 runtime, CI, build, provider, and device artifacts before review", () => {
    const rawArtifact = {
      runId: "security-app-runtime-private",
      commitSha: "privatecommitsha",
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/private",
      deviceId: "ios-device-secret",
      artifactManifest: ["coverage/private-runtime-artifact.json"],
      buildLog: "failed for client@example.com +1 555 808 9090",
      providerPayload: { rawBody: "{\"token\":\"runtime-secret-token\"}" },
      headers: ["Authorization: Bearer app-runtime-secret"],
      stack: "Error: app runtime persistence failed",
    };

    const redacted = buildRedactedSecurityAppRuntimeArtifact(rawArtifact);
    const review = buildSecurityAppRuntimeArtifactReview(rawArtifact);
    const serialized = JSON.stringify({ redacted, review });

    expect(serialized).not.toContain("security-app-runtime-private");
    expect(serialized).not.toContain("privatecommitsha");
    expect(serialized).not.toContain("/actions/runs/private");
    expect(serialized).not.toContain("ios-device-secret");
    expect(serialized).not.toContain("coverage/private-runtime-artifact.json");
    expect(serialized).not.toContain("client@example.com");
    expect(serialized).not.toContain("+1 555 808 9090");
    expect(serialized).not.toContain("runtime-secret-token");
    expect(serialized).not.toContain("app-runtime-secret");
    expect(serialized).toContain("[REDACTED]");
    expect(review.requiredArtifacts).toBe(securityAppRuntimeArtifactPaths);
    expect(review.retainedExternalGates).toEqual(expect.arrayContaining([
      "Web/dashboard typecheck and build proof",
      "Browser runtime smoke proof",
      "Mobile device/emulator SystemStatus smoke proof",
    ]));
  });
});

