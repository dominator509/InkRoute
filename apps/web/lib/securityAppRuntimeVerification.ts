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
  commitSha?: string | null;
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
  ciRunUrl?: string | null;
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

export type SecurityAppRuntimeRunData = SecurityAppRuntimeRunPersistenceInput & {
  commitSha: string | null;
  ciRunUrl: string | null;
};

export interface SecurityAppRuntimeRunRepository {
  readonly securityAppRuntimeRun: {
    upsert(args: {
      where: { tenantId_runId: { tenantId: string; runId: string } };
      create: SecurityAppRuntimeRunData;
      update: SecurityAppRuntimeRunData;
    }): unknown;
  };
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

export const securityAppRuntimeProofFiles = [
  "apps/dashboard/package.json",
  "apps/mobile/package.json",
  "apps/web/package.json",
  "packages/security/src/index.ts",
  "packages/security/tests/upload-policy.test.ts",
  "apps/web/lib/securityAppRuntimeVerification.ts",
  "apps/web/tests/security-app-runtime-verification-static.test.ts",
  "apps/web/next.config.mjs",
  "apps/dashboard/next.config.mjs",
  "apps/web/tests/security-next-config-static.test.ts",
  "apps/mobile/tests/mobile-security-static.test.ts",
  "apps/web/app/trust/page.tsx",
  "apps/web/app/privacy/page.tsx",
  "apps/web/app/terms/page.tsx",
  "apps/web/app/consent-disclaimer/page.tsx",
  "apps/web/app/api/public/[tenantSlug]/secure-upload-intents/route.ts",
  "apps/web/middleware.ts",
  "apps/dashboard/middleware.ts",
  "apps/dashboard/app/trust/page.tsx",
  "apps/dashboard/app/api/security/trust-status/route.ts",
  "apps/mobile/src/screens/SystemStatusScreen.tsx",
  "apps/mobile/src/lib/mobileDemo.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609007000_add_security_app_runtime_runs/migration.sql",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
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

export const securityAppRuntimeLocalCommands = [
  "pnpm vitest run apps/web/tests/security-next-config-static.test.ts",
  "pnpm vitest run apps/mobile/tests/mobile-security-static.test.ts",
] as const satisfies readonly SecurityAppRuntimeCommand[];

export const securityAppRuntimeExternalCommands = [
  "pnpm --filter @inkroute/web typecheck",
  "pnpm --filter @inkroute/web build",
  "pnpm --filter @inkroute/dashboard typecheck",
  "pnpm --filter @inkroute/dashboard build",
  "pnpm --filter @inkroute/mobile typecheck",
  "web trust/privacy/legal/consent/secure-upload route smoke tests",
  "dashboard trust-status and privacy request route smoke tests",
  "web/dashboard middleware runtime smoke tests",
  "browser runtime security smoke tests",
  "mobile SystemStatus device/emulator smoke tests",
] as const satisfies readonly SecurityAppRuntimeCommand[];

export const securityAppRuntimeRequiredExternalEvidence = [
  "Web/dashboard typecheck and build proof",
  "Mobile typecheck proof",
  "Web/dashboard route and middleware smoke proof",
  "Browser runtime smoke proof",
  "Mobile device/emulator SystemStatus smoke proof",
  "Provider-backed SecurityAppRuntimeRun persistence proof",
  "CI artifact capture",
] as const;

export type SecurityAppRuntimeArtifact = (typeof securityAppRuntimeArtifactPaths)[number];

export const securityAppRuntimeLocalArtifacts = [
  "coverage/security-next-config-static.json",
  "coverage/security-mobile-system-status-static.json",
] as const satisfies readonly SecurityAppRuntimeArtifact[];

const securityAppRuntimeLocalArtifactSet = new Set<SecurityAppRuntimeArtifact>(
  securityAppRuntimeLocalArtifacts,
);

export const securityAppRuntimeExternalArtifacts = securityAppRuntimeArtifactPaths.filter(
  (artifact) => !securityAppRuntimeLocalArtifactSet.has(artifact),
) as readonly SecurityAppRuntimeArtifact[];

export type SecurityAppRuntimeCommand = (typeof securityAppRuntimeCommands)[number];

export type SecurityAppRuntimeExecutionPolicy = {
  localStaticCoverageOnly: true;
  webDashboardBuildRequiresExternalEvidence: true;
  mobileTypecheckRequiresExternalEvidence: true;
  routeSmokeRequiresExternalEvidence: true;
  browserRuntimeRequiresExternalEvidence: true;
  mobileDeviceRequiresExternalEvidence: true;
  persistenceRequiresExternalEvidence: true;
  externalEvidenceRequired: typeof securityAppRuntimeRequiredExternalEvidence;
};

export type SecurityAppRuntimeEvidenceInput = {
  webTypecheckPassed: boolean;
  webBuildPassed: boolean;
  dashboardTypecheckPassed: boolean;
  dashboardBuildPassed: boolean;
  mobileTypecheckPassed: boolean;
  nextConfigStaticPassed: boolean;
  mobileSecurityStaticPassed: boolean;
  webRouteSmokePassed: boolean;
  dashboardRouteSmokePassed: boolean;
  middlewareSmokePassed: boolean;
  browserRuntimeSmokePassed: boolean;
  mobileDeviceSmokePassed: boolean;
  requiredCommandsRun: readonly SecurityAppRuntimeCommand[];
  capturedArtifacts: readonly SecurityAppRuntimeArtifact[];
};

export type SecurityAppRuntimeEvidenceDecision = {
  status: "complete" | "blocked";
  blockers: string[];
  missingArtifacts: SecurityAppRuntimeArtifact[];
  requiredCommands: typeof securityAppRuntimeCommands;
  requiredEvidence: typeof securityAppRuntimeArtifactPaths;
  runtimePolicy: {
    nextBuildsMustUseSharedSecurityPackage: true;
    browserSmokeRequired: true;
    mobileDeviceOrEmulatorSmokeRequired: true;
  };
};

export type SecurityAppRuntimeExecutionPlan = {
  status: "local-plan-ready";
  policy: SecurityAppRuntimeExecutionPolicy;
  externalEvidenceRequired: typeof securityAppRuntimeRequiredExternalEvidence;
  webBuildExecutionAllowed: false;
  dashboardBuildExecutionAllowed: false;
  mobileTypecheckExecutionAllowed: false;
  routeSmokeExecutionAllowed: false;
  browserRuntimeExecutionAllowed: false;
  mobileDeviceExecutionAllowed: false;
  persistenceExecutionAllowed: false;
  localCommands: typeof securityAppRuntimeLocalCommands;
  externalCommands: typeof securityAppRuntimeExternalCommands;
  localArtifacts: typeof securityAppRuntimeLocalArtifacts;
  externalArtifacts: typeof securityAppRuntimeExternalArtifacts;
  disabledReasons: readonly string[];
};

export const securityAppRuntimeExecutionPolicy: SecurityAppRuntimeExecutionPolicy = {
  localStaticCoverageOnly: true,
  webDashboardBuildRequiresExternalEvidence: true,
  mobileTypecheckRequiresExternalEvidence: true,
  routeSmokeRequiresExternalEvidence: true,
  browserRuntimeRequiresExternalEvidence: true,
  mobileDeviceRequiresExternalEvidence: true,
  persistenceRequiresExternalEvidence: true,
  externalEvidenceRequired: securityAppRuntimeRequiredExternalEvidence,
};

export type SecurityAppRuntimeArtifactReview = {
  status: "redacted-review-ready";
  redactedArtifact: unknown;
  requiredArtifacts: typeof securityAppRuntimeArtifactPaths;
  retainedExternalGates: readonly string[];
};

const securityAppRuntimeSensitivePatterns = [
  /(run[_-]?id['":=\s]+)[^"',\s}]+/gi,
  /(commit[_-]?sha['":=\s]+)[^"',\s}]+/gi,
  /(ci[_-]?run[_-]?url['":=\s]+)[^"',\s}]+/gi,
  /(device[_-]?id['":=\s]+)[^"',\s}]+/gi,
  /(artifact[_-]?manifest['":=\s]+)[^"',}]+/gi,
  /(authorization:\s*bearer\s+)[A-Za-z0-9._-]+/gi,
  /(token['":=\s]+)[^"',\s}]+/gi,
  /(secret['":=\s]+)[^"',\s}]+/gi,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
  /\+?\d[\d\s().-]{7,}\d/g,
] as const;

export function buildRedactedSecurityAppRuntimeArtifact(value: unknown): unknown {
  if (typeof value === "string") {
    return securityAppRuntimeSensitivePatterns.reduce(
      (redacted, pattern) => redacted.replace(pattern, (_match, prefix: string | undefined) => `${prefix ?? ""}[REDACTED]`),
      value,
    );
  }

  if (Array.isArray(value)) {
    return value.map((entry) => buildRedactedSecurityAppRuntimeArtifact(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        /email|phone|token|secret|authorization|credential|password|rawBody|stack|ciRunUrl|commitSha|runId|deviceId|artifactManifest|providerPayload|buildLog/i.test(key)
          ? "[REDACTED]"
          : buildRedactedSecurityAppRuntimeArtifact(entry),
      ]),
    );
  }

  return value;
}

export function buildSecurityAppRuntimeExecutionPlan(): SecurityAppRuntimeExecutionPlan {
  return {
    status: "local-plan-ready",
    policy: securityAppRuntimeExecutionPolicy,
    externalEvidenceRequired: securityAppRuntimeRequiredExternalEvidence,
    webBuildExecutionAllowed: false,
    dashboardBuildExecutionAllowed: false,
    mobileTypecheckExecutionAllowed: false,
    routeSmokeExecutionAllowed: false,
    browserRuntimeExecutionAllowed: false,
    mobileDeviceExecutionAllowed: false,
    persistenceExecutionAllowed: false,
    localCommands: securityAppRuntimeLocalCommands,
    externalCommands: securityAppRuntimeExternalCommands,
    localArtifacts: securityAppRuntimeLocalArtifacts,
    externalArtifacts: securityAppRuntimeExternalArtifacts,
    disabledReasons: [
      "Web/dashboard build proof requires real Next build execution.",
      "Mobile typecheck proof requires app dependency typecheck execution.",
      "Web/dashboard route and middleware smoke proof requires runtime route execution.",
      "Browser runtime smoke proof requires browser automation execution.",
      "Mobile SystemStatus smoke proof requires simulator/device execution.",
      "SecurityAppRuntimeRun persistence proof requires provider-backed database execution.",
    ],
  };
}

export function buildSecurityAppRuntimeArtifactReview(rawArtifact: unknown): SecurityAppRuntimeArtifactReview {
  return {
    status: "redacted-review-ready",
    redactedArtifact: buildRedactedSecurityAppRuntimeArtifact(rawArtifact),
    requiredArtifacts: securityAppRuntimeArtifactPaths,
    retainedExternalGates: [
      "Web/dashboard typecheck and build proof",
      "Mobile typecheck proof",
      "Web/dashboard route and middleware smoke proof",
      "Browser runtime smoke proof",
      "Mobile device/emulator SystemStatus smoke proof",
      "Provider-backed SecurityAppRuntimeRun persistence proof",
      "CI artifact capture",
    ],
  };
}

export function buildSecurityAppRuntimeEvidenceDecision(
  input: SecurityAppRuntimeEvidenceInput,
): SecurityAppRuntimeEvidenceDecision {
  const blockers = [
    !input.webTypecheckPassed && "Run web typecheck with shared security package imports.",
    !input.webBuildPassed && "Run web build with security middleware and route imports.",
    !input.dashboardTypecheckPassed && "Run dashboard typecheck with shared security package imports.",
    !input.dashboardBuildPassed && "Run dashboard build with security middleware and trust routes.",
    !input.mobileTypecheckPassed && "Run mobile typecheck with SystemStatus security surfaces.",
    !input.nextConfigStaticPassed && "Run Next config static security package transpilation check.",
    !input.mobileSecurityStaticPassed && "Run mobile security static surface check.",
    !input.webRouteSmokePassed && "Capture web security route smoke proof.",
    !input.dashboardRouteSmokePassed && "Capture dashboard security route smoke proof.",
    !input.middlewareSmokePassed && "Capture web/dashboard middleware runtime smoke proof.",
    !input.browserRuntimeSmokePassed && "Capture browser runtime security smoke proof.",
    !input.mobileDeviceSmokePassed && "Capture mobile device/emulator SystemStatus smoke proof.",
  ].filter(Boolean) as string[];

  const missingArtifacts = securityAppRuntimeArtifactPaths.filter(
    (artifact) => !input.capturedArtifacts.includes(artifact),
  );
  const missingCommands = securityAppRuntimeCommands.filter(
    (command) => !input.requiredCommandsRun.includes(command),
  );

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0 ? "complete" : "blocked",
    blockers: [
      ...blockers,
      ...missingCommands.map((command) => `Required command not recorded: ${command}`),
    ],
    missingArtifacts,
    requiredCommands: securityAppRuntimeCommands,
    requiredEvidence: securityAppRuntimeArtifactPaths,
    runtimePolicy: {
      nextBuildsMustUseSharedSecurityPackage: true,
      browserSmokeRequired: true,
      mobileDeviceOrEmulatorSmokeRequired: true,
    },
  };
}

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

export function buildSecurityAppRuntimeRunData(input: SecurityAppRuntimeRunPersistenceInput): SecurityAppRuntimeRunData {
  return {
    ...input,
    commitSha: input.commitSha ?? null,
    ciRunUrl: input.ciRunUrl ?? null,
  };
}

export function persistSecurityAppRuntimeRun(
  repository: SecurityAppRuntimeRunRepository,
  input: SecurityAppRuntimeRunPersistenceInput,
): unknown {
  const data = buildSecurityAppRuntimeRunData(input);

  return repository.securityAppRuntimeRun.upsert({
    where: { tenantId_runId: { tenantId: data.tenantId, runId: data.runId } },
    create: data,
    update: data,
  });
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

