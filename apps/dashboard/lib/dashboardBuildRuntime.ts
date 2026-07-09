import {
  buildDashboardLaunchEvidencePlan,
  dashboardLaunchEvidenceRequiredCommands,
} from "@inkroute/auth";

export { dashboardLaunchEvidenceRequiredCommands as dashboardBuildRuntimeReadinessRequiredCommands };

export type DashboardBuildRuntimeStatus =
  | "wired"
  | "install-gated"
  | "type-gated"
  | "build-gated"
  | "browser-gated"
  | "ci-gated";

export interface DashboardBuildRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: DashboardBuildRuntimeStatus;
}

export const dashboardBuildRuntimeCommands = [
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
] as const;

export const dashboardBuildArtifactPaths = [
  "coverage/dashboard-build-runtime.json",
  "coverage/dashboard-install-output.txt",
  "coverage/dashboard-next-react-types.txt",
  "coverage/dashboard-typecheck.txt",
  "coverage/dashboard-build.txt",
  "coverage/dashboard-test.txt",
  "coverage/dashboard-browser-home.json",
  "coverage/dashboard-browser-bookings.json",
  "coverage/dashboard-browser-clients.json",
  "coverage/dashboard-browser-payments.json",
  "coverage/dashboard-browser-portfolio.json",
  "coverage/dashboard-browser-travel.json",
  "coverage/dashboard-browser-messages.json",
  "coverage/dashboard-browser-settings.json",
  "coverage/dashboard-next15-runtime-smoke.json",
  "coverage/dashboard-build-ci-evidence.json",
  "coverage/dashboard-build-secret-safe-artifacts.json",
  "test-results/dashboard-build-runtime",
] as const;

export const dashboardBuildRuntimeProofFiles = [
  "apps/dashboard/lib/dashboardBuildRuntime.ts",
  "apps/dashboard/tests/dashboard-build-runtime-static.test.ts",
  "apps/dashboard/package.json",
  "apps/dashboard/next.config.mjs",
  "apps/dashboard/app/layout.tsx",
  "apps/dashboard/middleware.ts",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
  "GAP_TRACKER.md",
] as const;

export const dashboardBuildRuntimeMatrix = [
  {
    id: "dependency-install",
    command: "pnpm install",
    artifact: "coverage/dashboard-install-output.txt",
    status: "install-gated",
  },
  {
    id: "next-react-types",
    command: "verify Next 15, React 19, JSX, and route handler types are installed",
    artifact: "coverage/dashboard-next-react-types.txt",
    status: "type-gated",
  },
  {
    id: "dashboard-typecheck",
    command: "pnpm --filter @inkroute/dashboard typecheck",
    artifact: "coverage/dashboard-typecheck.txt",
    status: "type-gated",
  },
  {
    id: "dashboard-build",
    command: "pnpm --filter @inkroute/dashboard build",
    artifact: "coverage/dashboard-build.txt",
    status: "build-gated",
  },
  {
    id: "dashboard-tests",
    command: "pnpm --filter @inkroute/dashboard test",
    artifact: "coverage/dashboard-test.txt",
    status: "browser-gated",
  },
  {
    id: "browser-home",
    command: "dashboard browser smoke: /",
    artifact: "coverage/dashboard-browser-home.json",
    status: "browser-gated",
  },
  {
    id: "browser-bookings-clients",
    command: "dashboard browser smoke: /bookings && dashboard browser smoke: /clients",
    artifact: "coverage/dashboard-browser-bookings.json",
    status: "browser-gated",
  },
  {
    id: "browser-commerce-content",
    command: "dashboard browser smoke: /payments && dashboard browser smoke: /portfolio && dashboard browser smoke: /travel",
    artifact: "coverage/dashboard-browser-payments.json",
    status: "browser-gated",
  },
  {
    id: "browser-messages-settings",
    command: "dashboard browser smoke: /messages && dashboard browser smoke: /settings",
    artifact: "coverage/dashboard-browser-messages.json",
    status: "browser-gated",
  },
  {
    id: "next15-runtime",
    command: "verify Next 15 app-router runtime, metadata, middleware, route handlers, and server components",
    artifact: "coverage/dashboard-next15-runtime-smoke.json",
    status: "build-gated",
  },
  {
    id: "ci-secret-safe-evidence",
    command: "GitHub Actions dashboard build/runtime evidence job",
    artifact: "coverage/dashboard-build-ci-evidence.json",
    status: "ci-gated",
  },
] as const satisfies readonly DashboardBuildRuntimeMatrixEntry[];

export const dashboardBuildRuntimeReadiness = buildDashboardLaunchEvidencePlan({
  packageScripts: {
    typecheck: "tsc --noEmit",
    build: "next build",
    test: "playwright test --project=dashboard-chromium",
  },
  dashboardTypecheckPassed: false,
  dashboardBuildPassed: false,
  dashboardUnitTestsPassed: false,
  dashboardPlaywrightSmokePassed: false,
  seededTenantDataAvailable: false,
  providerBackedAuthConfigured: false,
  tenantScopedApisImplemented: true,
  prismaRepositoriesImplemented: true,
  realMutationsEnabled: true,
  mutationAuditLogsPersisted: true,
  providerActionsImplemented: false,
  rbacDenialTestsPassed: false,
  crossTenantDenialTestsPassed: false,
  fieldRedactionVerified: false,
  loadingEmptyErrorStatesVerified: false,
  ciEvidenceCaptured: false,
  dashboardArtifactsSecretSafe: false,
});

export const dashboardBuildRuntimeEvidenceFlags = [
  "dependenciesInstalled",
  "nextReactTypesAvailable",
  "dashboardTypecheckPassed",
  "dashboardBuildPassed",
  "dashboardTestsPassed",
  "browserHomeSmokePassed",
  "browserBookingsSmokePassed",
  "browserClientsSmokePassed",
  "browserPaymentsSmokePassed",
  "browserPortfolioSmokePassed",
  "browserTravelSmokePassed",
  "browserMessagesSmokePassed",
  "browserSettingsSmokePassed",
  "next15RuntimeSmokePassed",
  "ciEvidenceCaptured",
  "secretSafeArtifactsCaptured",
] as const;

export type DashboardBuildRuntimeEvidenceFlag = (typeof dashboardBuildRuntimeEvidenceFlags)[number];

export interface DashboardBuildRuntimeEvidenceInput {
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly evidence?: Partial<Record<DashboardBuildRuntimeEvidenceFlag, boolean>>;
}

export interface DashboardBuildRuntimeEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingCommands: readonly string[];
  readonly missingArtifacts: readonly string[];
  readonly missingEvidence: readonly DashboardBuildRuntimeEvidenceFlag[];
  readonly requiredCommands: typeof dashboardBuildRuntimeCommands;
  readonly requiredArtifacts: typeof dashboardBuildArtifactPaths;
  readonly requiredEvidence: typeof dashboardBuildRuntimeEvidenceFlags;
  readonly blockers: readonly string[];
}

const dashboardBuildRuntimeEvidenceBlockers: Record<DashboardBuildRuntimeEvidenceFlag, string> = {
  dependenciesInstalled: "Workspace dependencies must be installed with a committed lockfile.",
  nextReactTypesAvailable: "Next 15, React 19, JSX, and route handler types must be available.",
  dashboardTypecheckPassed: "@inkroute/dashboard typecheck must pass.",
  dashboardBuildPassed: "@inkroute/dashboard build must pass.",
  dashboardTestsPassed: "@inkroute/dashboard tests must pass.",
  browserHomeSmokePassed: "Dashboard browser smoke for / must pass.",
  browserBookingsSmokePassed: "Dashboard browser smoke for /bookings must pass.",
  browserClientsSmokePassed: "Dashboard browser smoke for /clients must pass.",
  browserPaymentsSmokePassed: "Dashboard browser smoke for /payments must pass.",
  browserPortfolioSmokePassed: "Dashboard browser smoke for /portfolio must pass.",
  browserTravelSmokePassed: "Dashboard browser smoke for /travel must pass.",
  browserMessagesSmokePassed: "Dashboard browser smoke for /messages must pass.",
  browserSettingsSmokePassed: "Dashboard browser smoke for /settings must pass.",
  next15RuntimeSmokePassed: "Next 15 app-router runtime smoke must pass.",
  ciEvidenceCaptured: "CI dashboard build/runtime evidence must be captured.",
  secretSafeArtifactsCaptured:
    "Dashboard build/runtime artifacts must be redacted and free of secrets, provider tokens, raw PII, medical, payment, and private tenant data.",
};

const missingFrom = (actual: readonly string[] | undefined, required: readonly string[]) =>
  required.filter((item) => !(actual ?? []).includes(item));

export const buildDashboardBuildRuntimeEvidenceDecision = (
  input: DashboardBuildRuntimeEvidenceInput,
): DashboardBuildRuntimeEvidenceDecision => {
  const missingCommands = missingFrom(input.commands, dashboardBuildRuntimeCommands);
  const missingArtifacts = missingFrom(input.artifacts, dashboardBuildArtifactPaths);
  const missingEvidence = dashboardBuildRuntimeEvidenceFlags.filter((flag) => input.evidence?.[flag] !== true);
  const blockers = missingEvidence.map((flag) => dashboardBuildRuntimeEvidenceBlockers[flag]);

  return {
    status:
      missingCommands.length === 0 && missingArtifacts.length === 0 && missingEvidence.length === 0
        ? "complete"
        : "blocked",
    missingCommands,
    missingArtifacts,
    missingEvidence,
    requiredCommands: dashboardBuildRuntimeCommands,
    requiredArtifacts: dashboardBuildArtifactPaths,
    requiredEvidence: dashboardBuildRuntimeEvidenceFlags,
    blockers,
  };
};

export interface DashboardBuildRuntimeExecutionPolicy {
  readonly codexMayClassifyStaticBuildReadiness: true;
  readonly dependencyInstallRequiredForClosure: true;
  readonly nextReactTypesRequiredForClosure: true;
  readonly dashboardTypecheckBuildTestRequiredForClosure: true;
  readonly browserSmokeRequiredForClosure: true;
  readonly next15RuntimeSmokeRequiredForClosure: true;
  readonly secretSafeArtifactsRequiredForClosure: true;
}

export interface DashboardBuildRuntimeExecutionPlan {
  readonly localCommands: typeof dashboardBuildRuntimeLocalCommands;
  readonly externalCommands: typeof dashboardBuildRuntimeExternalCommands;
  readonly requiredExternalEvidence: typeof dashboardBuildRuntimeRequiredExternalEvidence;
  readonly commandExecutionAllowed: false;
  readonly dependencyInstallExecutionAllowed: false;
  readonly typecheckExecutionAllowed: false;
  readonly buildExecutionAllowed: false;
  readonly browserExecutionAllowed: false;
  readonly nextRuntimeExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly executionPolicy: typeof dashboardBuildRuntimeExecutionPolicy;
}

export interface DashboardBuildRuntimeArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof dashboardBuildRuntimeRequiredExternalEvidence;
  readonly secretSafe: boolean;
}

export const dashboardBuildRuntimeRequiredExternalEvidence = [
  "pnpm install output with committed lockfile",
  "Next React JSX and route handler type availability evidence",
  "pnpm --filter @inkroute/dashboard typecheck output",
  "pnpm --filter @inkroute/dashboard build output",
  "pnpm --filter @inkroute/dashboard test output",
  "dashboard browser smoke evidence for launch-critical routes",
  "Next 15 app-router runtime smoke evidence",
  "fresh CI dashboard build/runtime artifacts",
  "secret-safe dashboard build/runtime artifact review",
] as const;

export const dashboardBuildRuntimeExecutionPolicy: DashboardBuildRuntimeExecutionPolicy = {
  codexMayClassifyStaticBuildReadiness: true,
  dependencyInstallRequiredForClosure: true,
  nextReactTypesRequiredForClosure: true,
  dashboardTypecheckBuildTestRequiredForClosure: true,
  browserSmokeRequiredForClosure: true,
  next15RuntimeSmokeRequiredForClosure: true,
  secretSafeArtifactsRequiredForClosure: true,
};

export const dashboardBuildRuntimeLocalCommands = [
  "static dashboard package script review",
  "static dashboard Next config review",
  "static dashboard layout and middleware build-surface review",
] as const;

export const dashboardBuildRuntimeExternalCommands = [
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
] as const;

export const buildDashboardBuildRuntimeExecutionPlan = (): DashboardBuildRuntimeExecutionPlan => ({
  localCommands: dashboardBuildRuntimeLocalCommands,
  externalCommands: dashboardBuildRuntimeExternalCommands,
  requiredExternalEvidence: dashboardBuildRuntimeRequiredExternalEvidence,
  commandExecutionAllowed: false,
  dependencyInstallExecutionAllowed: false,
  typecheckExecutionAllowed: false,
  buildExecutionAllowed: false,
  browserExecutionAllowed: false,
  nextRuntimeExecutionAllowed: false,
  ciExecutionAllowed: false,
  executionPolicy: dashboardBuildRuntimeExecutionPolicy,
});

const dashboardBuildRuntimeSensitiveArtifactKeyPattern =
  /(secret|token|password|private|client|tenant|domain|database|db|url|uri|provider|session|cookie|csrf|email|phone|medical|payment|stripe|build|env|header|authorization|log|trace|sourcemap|source|map|browser|playwright|screenshot|video|html|dom|route|payload|body|api|booking|portfolio|travel|message|settings|typecheck|test|output|stdout|stderr|ci|workflow|run|commit|artifact|path|next|react|jsx|error|stack|id|key)/i;
const dashboardBuildRuntimeSensitiveArtifactValuePattern =
  /(https?:\/\/[^\s"']+|postgres(?:ql)?:\/\/[^\s"']+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d .()-]{8,}\d|(?:sk|pk|gh[psuor]|github_pat|provider-token)[A-Za-z0-9_-]*|(?:tenant|client|booking|payment|portfolio|travel|message|dashboard|route|browser|trace|screenshot|artifact|workflow|ci|run|commit|database|session|provider|evidence)[-_:/]?[A-Za-z0-9_.-]{6,}|(?:coverage|artifacts|test-results|reports|docs)\/[A-Za-z0-9_./-]{6,}|DATABASE_URL=[^\s"']+|authorization:\s*[^\s"']+|private-tenant|[A-Za-z0-9_-]{24,})/giu;

export const buildRedactedDashboardBuildRuntimeArtifact = (
  artifact: unknown,
): Pick<DashboardBuildRuntimeArtifactReview, "artifact" | "redactions"> => {
  const redactions: string[] = [];

  const redact = (value: unknown, path: string): unknown => {
    if (Array.isArray(value)) {
      return value.map((item, index) => redact(item, `${path}[${index}]`));
    }

    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
          const entryPath = path ? `${path}.${key}` : key;

          if (dashboardBuildRuntimeSensitiveArtifactKeyPattern.test(key)) {
            redactions.push(entryPath);
            return [key, "[REDACTED_DASHBOARD_BUILD_PRIVATE_VALUE]"];
          }

          return [key, redact(entry, entryPath)];
        }),
      );
    }

    if (typeof value === "string") {
      const redactedValue = value.replace(
        dashboardBuildRuntimeSensitiveArtifactValuePattern,
        "[REDACTED_DASHBOARD_BUILD_PRIVATE_VALUE]",
      );
      if (redactedValue !== value) {
        redactions.push(path || "$");
      }
      return redactedValue;
    }

    return value;
  };

  return {
    artifact: redact(artifact, ""),
    redactions,
  };
};

export const buildDashboardBuildRuntimeArtifactReview = (
  artifact: unknown,
): DashboardBuildRuntimeArtifactReview => {
  const redacted = buildRedactedDashboardBuildRuntimeArtifact(artifact);
  const serialized = JSON.stringify(redacted.artifact);
  const leakedPrivateMarkers = [
    "DATABASE_URL",
    "client@example.com",
    "tenant.example.com",
    "authorization:",
    "sk_",
    "provider-token",
    "private-tenant",
  ].some((marker) => serialized.includes(marker));

  return {
    ...redacted,
    requiredExternalEvidence: dashboardBuildRuntimeRequiredExternalEvidence,
    secretSafe: !leakedPrivateMarkers,
  };
};



