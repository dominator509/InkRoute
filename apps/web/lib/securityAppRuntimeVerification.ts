import { buildSecurityAppRuntimeVerificationPlan } from "@inkroute/security";

export type SecurityAppRuntimeSurface = "web" | "dashboard" | "mobile" | "api" | "middleware" | "browser" | "device";

export interface SecurityAppRuntimeTarget {
  id: string;
  surface: SecurityAppRuntimeSurface;
  command: string;
  artifact: string;
  status: "wired" | "execution-gated" | "device-gated";
}

export interface SecurityAppRuntimeRunPersistenceInput {
  tenantId: string;
  runId: string;
  commitSha?: string;
  status: "blocked" | "running" | "passed" | "failed" | "device_gated";
  targetMatrix: readonly SecurityAppRuntimeTarget[];
  artifactManifest: readonly string[];
  webTypecheckPassed: boolean;
  webBuildPassed: boolean;
  dashboardTypecheckPassed: boolean;
  dashboardBuildPassed: boolean;
  mobileTypecheckPassed: boolean;
  routeSmokePassed: boolean;
  middlewareSmokePassed: boolean;
  browserRuntimeSmokePassed: boolean;
  mobileDeviceSmokePassed: boolean;
  deviceGatedTargets: readonly string[];
  ciRunUrl?: string;
}

export interface SecurityAppRuntimeRunPersistenceContract {
  modelName: "SecurityAppRuntimeRun";
  row: SecurityAppRuntimeRunPersistenceInput;
  transactionWrites: readonly ["SecurityAppRuntimeRun", "AuditLog"];
  requiredRuntimeFlags: readonly [
    "webTypecheckPassed",
    "webBuildPassed",
    "dashboardTypecheckPassed",
    "dashboardBuildPassed",
    "mobileTypecheckPassed",
    "routeSmokePassed",
    "middlewareSmokePassed",
    "browserRuntimeSmokePassed",
    "mobileDeviceSmokePassed",
  ];
  artifactFields: readonly ["targetMatrix", "artifactManifest", "deviceGatedTargets"];
  tenantIsolationKey: "tenantId";
}

export const securityAppRuntimeArtifactPaths = [
  "coverage/security-app-runtime-verification.json",
  "coverage/security-web-typecheck.log",
  "coverage/security-web-build.log",
  "coverage/security-dashboard-typecheck.log",
  "coverage/security-dashboard-build.log",
  "coverage/security-mobile-typecheck.log",
  "coverage/security-next-config-static.json",
  "coverage/security-mobile-system-status-static.json",
  "coverage/security-web-route-smoke.json",
  "coverage/security-dashboard-route-smoke.json",
  "coverage/security-middleware-smoke.json",
  "coverage/security-browser-runtime-smoke.json",
  "coverage/security-mobile-device-smoke.json",
  "test-results/security-app-runtime",
] as const;

export const securityAppRuntimeTargets: readonly SecurityAppRuntimeTarget[] = [
  { id: "web-typecheck", surface: "web", command: "pnpm --filter @inkroute/web typecheck", artifact: "coverage/security-web-typecheck.log", status: "execution-gated" },
  { id: "web-build", surface: "web", command: "pnpm --filter @inkroute/web build", artifact: "coverage/security-web-build.log", status: "execution-gated" },
  { id: "dashboard-typecheck", surface: "dashboard", command: "pnpm --filter @inkroute/dashboard typecheck", artifact: "coverage/security-dashboard-typecheck.log", status: "execution-gated" },
  { id: "dashboard-build", surface: "dashboard", command: "pnpm --filter @inkroute/dashboard build", artifact: "coverage/security-dashboard-build.log", status: "execution-gated" },
  { id: "mobile-typecheck", surface: "mobile", command: "pnpm --filter @inkroute/mobile typecheck", artifact: "coverage/security-mobile-typecheck.log", status: "execution-gated" },
  { id: "next-config-static", surface: "web", command: "pnpm vitest run apps/web/tests/security-next-config-static.test.ts", artifact: "coverage/security-next-config-static.json", status: "wired" },
  { id: "mobile-security-static", surface: "mobile", command: "pnpm vitest run apps/mobile/tests/mobile-security-static.test.ts", artifact: "coverage/security-mobile-system-status-static.json", status: "wired" },
  { id: "web-security-routes", surface: "api", command: "web trust/privacy/legal/consent/secure-upload route smoke tests", artifact: "coverage/security-web-route-smoke.json", status: "execution-gated" },
  { id: "dashboard-security-routes", surface: "api", command: "dashboard trust-status and privacy request route smoke tests", artifact: "coverage/security-dashboard-route-smoke.json", status: "execution-gated" },
  { id: "middleware-runtime", surface: "middleware", command: "web/dashboard middleware runtime smoke tests", artifact: "coverage/security-middleware-smoke.json", status: "execution-gated" },
  { id: "browser-runtime", surface: "browser", command: "browser runtime security smoke tests", artifact: "coverage/security-browser-runtime-smoke.json", status: "execution-gated" },
  { id: "mobile-device", surface: "device", command: "mobile SystemStatus device/emulator smoke tests", artifact: "coverage/security-mobile-device-smoke.json", status: "device-gated" },
] as const;

export const securityAppRuntimeCommands = securityAppRuntimeTargets.map((target) => target.command);

export function buildSecurityAppRuntimeRunPersistenceContract(
  input: SecurityAppRuntimeRunPersistenceInput,
): SecurityAppRuntimeRunPersistenceContract {
  return {
    modelName: "SecurityAppRuntimeRun",
    row: input,
    transactionWrites: ["SecurityAppRuntimeRun", "AuditLog"],
    requiredRuntimeFlags: [
      "webTypecheckPassed",
      "webBuildPassed",
      "dashboardTypecheckPassed",
      "dashboardBuildPassed",
      "mobileTypecheckPassed",
      "routeSmokePassed",
      "middlewareSmokePassed",
      "browserRuntimeSmokePassed",
      "mobileDeviceSmokePassed",
    ],
    artifactFields: ["targetMatrix", "artifactManifest", "deviceGatedTargets"],
    tenantIsolationKey: "tenantId",
  };
}

export const securityAppRuntimeVerificationPlan = buildSecurityAppRuntimeVerificationPlan({
  packageScripts: ["test", "typecheck"],
  securityTestsPassed: false,
  securityTypecheckPassed: false,
  webTypecheckPassed: false,
  webBuildPassed: false,
  dashboardTypecheckPassed: false,
  dashboardBuildPassed: false,
  mobileTypecheckPassed: false,
  nextConfigStaticTestsPassed: true,
  mobileSecurityStaticTestsPassed: true,
  webSecurityRoutesSmokePassed: false,
  dashboardSecurityRoutesSmokePassed: false,
  webMiddlewareRuntimeSmokePassed: false,
  dashboardMiddlewareRuntimeSmokePassed: false,
  mobileSystemStatusScreenSmokePassed: false,
  browserRuntimeSmokePassed: false,
  deviceRuntimeSmokePassed: false,
  ciRuntimeEvidenceCollected: true,
});

export const securityAppRuntimeRunPersistencePreview = buildSecurityAppRuntimeRunPersistenceContract({
  tenantId: "tenant_demo",
  runId: "security-app-runtime-demo",
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
  deviceGatedTargets: securityAppRuntimeTargets.filter((target) => target.status === "device-gated").map((target) => target.id),
});
