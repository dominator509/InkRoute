import { buildMobileCrashRuntimeReadinessPlan, mobileCrashRuntimeRequiredCommands } from "@inkroute/observability";

export type MobileCrashRuntimeStatus =
  | "wired"
  | "provider-gated"
  | "symbolication-gated"
  | "device-gated"
  | "persistence-gated"
  | "privacy-gated"
  | "ci-gated";

export interface MobileCrashRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: MobileCrashRuntimeStatus;
}

export const mobileCrashRuntimeCommands = mobileCrashRuntimeRequiredCommands;

export const mobileCrashArtifactPaths = [
  "coverage/mobile-crash-runtime.json",
  "coverage/mobile-crash-observability-typecheck.txt",
  "coverage/mobile-crash-observability-test.txt",
  "coverage/mobile-crash-app-typecheck.txt",
  "coverage/mobile-crash-sentry-expo-config-redacted.json",
  "coverage/mobile-crash-fallback-reporter.json",
  "coverage/mobile-crash-release-eas-tags.json",
  "coverage/mobile-crash-before-send-redaction.json",
  "coverage/mobile-crash-pii-redaction-tests.json",
  "coverage/mobile-crash-source-map-upload-redacted.json",
  "coverage/mobile-crash-debug-symbol-upload-redacted.json",
  "coverage/mobile-crash-simulator-forced-redacted.json",
  "coverage/mobile-crash-device-forced-redacted.json",
  "coverage/mobile-crash-error-report-persistence.json",
  "coverage/mobile-crash-dashboard-triage.json",
  "coverage/mobile-crash-offline-buffering.json",
  "coverage/mobile-crash-no-pii-provider-payload.json",
  "coverage/mobile-crash-secret-safe-artifacts.json",
  "test-results/mobile-crash-runtime",
] as const;

export const mobileCrashRuntimeProofFiles = [
  "apps/mobile/package.json",
  "apps/mobile/src/lib/mobileCrash.ts",
  "apps/mobile/src/lib/mobileCrashRuntime.ts",
  "apps/mobile/src/screens/SystemStatusScreen.tsx",
  "apps/mobile/tests/mobile-crash-static.test.ts",
  "apps/mobile/tests/mobile-crash-runtime-static.test.ts",
  "packages/observability/package.json",
  "packages/observability/src/index.ts",
  "packages/observability/tests/redaction-report.test.ts",
  "testing/manifests/unit-test-manifest.json",
  ".github/workflows/ci.yml",
] as const;

export const mobileCrashEvidenceFlags = [
  "observabilityTypecheckPassed",
  "observabilityTestsPassed",
  "mobileTypecheckPassed",
  "sentryExpoSdkConfigured",
  "fallbackReporterWired",
  "releaseEasTagsConfigured",
  "beforeSendRedactionVerified",
  "piiRedactionTestsPassed",
  "sourceMapsUploaded",
  "debugSymbolsUploaded",
  "simulatorForcedCrashCaptured",
  "deviceForcedCrashCaptured",
  "errorReportPersistenceVerified",
  "dashboardTriageSyncVerified",
  "offlineCrashBufferingVerified",
  "noPiiProviderPayloadVerified",
  "ciEvidenceCaptured",
  "secretSafeArtifactsCaptured",
] as const;

export type MobileCrashEvidenceFlag = (typeof mobileCrashEvidenceFlags)[number];

export interface MobileCrashExecutionPolicy {
  readonly codexMayClassifyStaticMobileCrashReadiness: true;
  readonly sentryCredentialsRequiredForClosure: true;
  readonly sourceMapDebugSymbolRequiredForClosure: true;
  readonly forcedCrashRequiredForClosure: true;
  readonly errorReportPersistenceRequiredForClosure: true;
  readonly noPiiProviderPayloadRequiredForClosure: true;
  readonly secretSafeArtifactsRequiredForClosure: true;
}

export interface MobileCrashExecutionPlan {
  readonly policy: typeof mobileCrashExecutionPolicy;
  readonly commandExecutionAllowed: false;
  readonly sentryExecutionAllowed: false;
  readonly sourceMapUploadExecutionAllowed: false;
  readonly forcedCrashExecutionAllowed: false;
  readonly persistenceExecutionAllowed: false;
  readonly dashboardExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly localCommands: typeof mobileCrashLocalCommands;
  readonly externalCommands: typeof mobileCrashExternalCommands;
  readonly requiredExternalEvidence: typeof mobileCrashRequiredExternalEvidence;
}

export interface MobileCrashArtifactReview {
  readonly artifact: unknown;
  readonly redactedArtifact: unknown;
  readonly redactedPaths: readonly string[];
  readonly secretSafe: boolean;
  readonly requiredExternalEvidence: typeof mobileCrashRequiredExternalEvidence;
}

export interface MobileCrashEvidenceInput {
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly evidence?: Partial<Record<MobileCrashEvidenceFlag, boolean>>;
}

export interface MobileCrashEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly requiredCommands: typeof mobileCrashRuntimeCommands;
  readonly missingCommands: readonly string[];
  readonly requiredArtifacts: typeof mobileCrashArtifactPaths;
  readonly missingArtifacts: readonly string[];
  readonly requiredEvidence: typeof mobileCrashEvidenceFlags;
  readonly missingEvidence: readonly MobileCrashEvidenceFlag[];
  readonly blockers: readonly string[];
}

export const mobileCrashExecutionPolicy = {
  codexMayClassifyStaticMobileCrashReadiness: true,
  sentryCredentialsRequiredForClosure: true,
  sourceMapDebugSymbolRequiredForClosure: true,
  forcedCrashRequiredForClosure: true,
  errorReportPersistenceRequiredForClosure: true,
  noPiiProviderPayloadRequiredForClosure: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const satisfies MobileCrashExecutionPolicy;

export const mobileCrashRequiredExternalEvidence = [
  "Sentry Expo SDK credential/configuration evidence",
  "source-map upload evidence",
  "React Native debug-symbol upload evidence",
  "forced simulator crash capture evidence",
  "forced physical-device crash capture evidence",
  "sanitized ErrorReport persistence proof",
  "dashboard triage sync proof",
  "offline crash buffering proof",
  "no-PII provider payload proof",
  "mobile crash typecheck output",
  "CI mobile crash evidence",
  "secret-safe mobile crash artifact review",
] as const;

export const mobileCrashLocalCommands = [
  "pnpm --filter @inkroute/observability typecheck",
  "pnpm --filter @inkroute/observability test",
  "static mobile crash redaction-first reporter review",
  "static mobile crash fallback persistence review",
] as const;

export const mobileCrashExternalCommands = [
  "pnpm --filter @inkroute/mobile typecheck",
  "configure Sentry Expo SDK credentials",
  "upload Expo source maps and React Native debug symbols",
  "Expo simulator forced crash smoke test",
  "Expo physical-device forced crash smoke test",
  "sanitized ErrorReport persistence proof",
  "dashboard triage sync proof",
  "offline crash buffering proof",
  "GitHub Actions mobile crash evidence job",
] as const;

export const mobileCrashRuntimeMatrix = [
  {
    id: "observability-typecheck",
    command: "pnpm --filter @inkroute/observability typecheck",
    artifact: "coverage/mobile-crash-observability-typecheck.txt",
    status: "wired",
  },
  {
    id: "observability-tests",
    command: "pnpm --filter @inkroute/observability test",
    artifact: "coverage/mobile-crash-observability-test.txt",
    status: "wired",
  },
  {
    id: "mobile-typecheck",
    command: "pnpm --filter @inkroute/mobile typecheck",
    artifact: "coverage/mobile-crash-app-typecheck.txt",
    status: "ci-gated",
  },
  {
    id: "sentry-expo-credentials",
    command: "configure Sentry Expo/React Native DSN, org, project, and auth token",
    artifact: "coverage/mobile-crash-sentry-expo-config-redacted.json",
    status: "provider-gated",
  },
  {
    id: "fallback-reporter",
    command: "wire privacy-safe fallback reporter to persisted ErrorReport ingest",
    artifact: "coverage/mobile-crash-fallback-reporter.json",
    status: "wired",
  },
  {
    id: "release-eas-tags",
    command: "attach release, environment, EAS channel, and runtime version tags",
    artifact: "coverage/mobile-crash-release-eas-tags.json",
    status: "wired",
  },
  {
    id: "before-send-redaction",
    command: "prove beforeSend/fallback redaction before external capture",
    artifact: "coverage/mobile-crash-before-send-redaction.json",
    status: "privacy-gated",
  },
  {
    id: "source-map-upload",
    command: "upload Expo JavaScript source maps for mobile releases",
    artifact: "coverage/mobile-crash-source-map-upload-redacted.json",
    status: "symbolication-gated",
  },
  {
    id: "debug-symbol-upload",
    command: "upload React Native debug symbols and resolve stack frames",
    artifact: "coverage/mobile-crash-debug-symbol-upload-redacted.json",
    status: "symbolication-gated",
  },
  {
    id: "simulator-forced-crash",
    command: "Expo simulator forced crash smoke test",
    artifact: "coverage/mobile-crash-simulator-forced-redacted.json",
    status: "device-gated",
  },
  {
    id: "device-forced-crash",
    command: "Expo physical-device forced crash smoke test",
    artifact: "coverage/mobile-crash-device-forced-redacted.json",
    status: "device-gated",
  },
  {
    id: "error-report-persistence",
    command: "persist sanitized mobile crash summaries to ErrorReport",
    artifact: "coverage/mobile-crash-error-report-persistence.json",
    status: "persistence-gated",
  },
  {
    id: "dashboard-triage-sync",
    command: "prove dashboard triage reads sanitized mobile ErrorReport records",
    artifact: "coverage/mobile-crash-dashboard-triage.json",
    status: "persistence-gated",
  },
  {
    id: "offline-buffering",
    command: "verify offline crash buffering without raw PII/provider payloads",
    artifact: "coverage/mobile-crash-offline-buffering.json",
    status: "privacy-gated",
  },
  {
    id: "no-pii-provider-payload",
    command: "prove provider payloads and dashboard summaries exclude raw sensitive values",
    artifact: "coverage/mobile-crash-no-pii-provider-payload.json",
    status: "privacy-gated",
  },
  {
    id: "ci-secret-safe-evidence",
    command: "GitHub Actions mobile crash evidence job",
    artifact: "coverage/mobile-crash-secret-safe-artifacts.json",
    status: "ci-gated",
  },
] as const satisfies readonly MobileCrashRuntimeMatrixEntry[];

const mobileCrashPackageReadiness = buildMobileCrashRuntimeReadinessPlan({
  packageScripts: ["test", "typecheck"],
  observabilityTestsPassed: false,
  observabilityTypecheckPassed: false,
  mobileTypecheckPassed: false,
  sentryExpoSdkConfigured: false,
  fallbackReporterConfigured: true,
  sentryDsnConfigured: false,
  releaseTagsConfigured: true,
  beforeSendRedactionConfigured: true,
  piiRedactionTestsPassed: false,
  sourceMapsUploaded: false,
  debugSymbolsUploaded: false,
  forcedCrashSimulatorVerified: false,
  forcedCrashDeviceVerified: false,
  errorReportPersistenceConfigured: false,
  sanitizedDashboardSyncVerified: false,
  offlineCrashBufferingVerified: false,
  noPiiProviderPayloadVerified: false,
});

export const mobileCrashRuntimeReadiness = {
  ...mobileCrashPackageReadiness,
  requiredEvidence: mobileCrashEvidenceFlags,
};

const missingFrom = (actual: readonly string[] | undefined, required: readonly string[]) => {
  const actualSet = new Set(actual ?? []);
  return required.filter((entry) => !actualSet.has(entry));
};

const sensitiveMobileCrashArtifactKey = /(secret|token|password|private|client|tenant|domain|database|db|url|uri|provider|session|refresh|sentry|dsn|auth|source.?map|debug.?symbol|device|crash|stack|error|report|dashboard|triage|payload|email|phone|medical|payment|tattoo|artifact|path|ci|workflow|run|evidence|repository|repo|branch|pull|pr|reviewer|codeowner|id|key)/i;
const sensitiveMobileCrashArtifactValue =
  /(https?:\/\/[^\s"']+|postgres(?:ql)?:\/\/[^\s"']+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d .()-]{8,}\d|(?:sk|pk|gh[psuor]|github_pat|provider-token|sentry)[A-Za-z0-9_-]*|(?:tenant|client|user|member|session|refresh|sentry|dsn|auth|source.?map|debug.?symbol|device|crash|stack|error|report|dashboard|triage|payload|provider|artifact|workflow|ci|run|evidence|mobile|repository|repo|branch|pull|pr|reviewer|codeowner)[-_:/]?[A-Za-z0-9_.-]{6,}|(?:coverage|artifacts|test-results|reports|docs)\/[A-Za-z0-9_./-]{6,}|[A-Za-z0-9_-]{24,})/giu;

const redactMobileCrashArtifactValue = (
  value: unknown,
  path: string,
  redactedPaths: string[],
): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry, index) => redactMobileCrashArtifactValue(entry, `${path}.${index}`, redactedPaths));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitiveMobileCrashArtifactKey.test(key)) {
          redactedPaths.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, redactMobileCrashArtifactValue(entry, nextPath, redactedPaths)];
      }),
    );
  }

  if (typeof value === "string" && sensitiveMobileCrashArtifactValue.test(value)) {
    sensitiveMobileCrashArtifactValue.lastIndex = 0;
    redactedPaths.push(path);
    return value.replace(sensitiveMobileCrashArtifactValue, "[REDACTED]");
  }

  sensitiveMobileCrashArtifactValue.lastIndex = 0;
  return value;
};

export const buildMobileCrashExecutionPlan = (): MobileCrashExecutionPlan => ({
  policy: mobileCrashExecutionPolicy,
  commandExecutionAllowed: false,
  sentryExecutionAllowed: false,
  sourceMapUploadExecutionAllowed: false,
  forcedCrashExecutionAllowed: false,
  persistenceExecutionAllowed: false,
  dashboardExecutionAllowed: false,
  ciExecutionAllowed: false,
  localCommands: mobileCrashLocalCommands,
  externalCommands: mobileCrashExternalCommands,
  requiredExternalEvidence: mobileCrashRequiredExternalEvidence,
});

export const buildRedactedMobileCrashArtifact = (artifact: unknown): Pick<MobileCrashArtifactReview, "redactedArtifact" | "redactedPaths"> => {
  const redactedPaths: string[] = [];
  return {
    redactedArtifact: redactMobileCrashArtifactValue(artifact, "", redactedPaths),
    redactedPaths,
  };
};

export const buildMobileCrashArtifactReview = (artifact: unknown): MobileCrashArtifactReview => {
  const redacted = buildRedactedMobileCrashArtifact(artifact);
  return {
    artifact,
    redactedArtifact: redacted.redactedArtifact,
    redactedPaths: redacted.redactedPaths,
    secretSafe: redacted.redactedPaths.length > 0,
    requiredExternalEvidence: mobileCrashRequiredExternalEvidence,
  };
};

export const buildMobileCrashEvidenceDecision = (
  input: MobileCrashEvidenceInput = {},
): MobileCrashEvidenceDecision => {
  const missingCommands = missingFrom(input.commands, mobileCrashRuntimeCommands);
  const missingArtifacts = missingFrom(input.artifacts, mobileCrashArtifactPaths);
  const missingEvidence = mobileCrashEvidenceFlags.filter((flag) => input.evidence?.[flag] !== true);
  const blockers = [
    missingCommands.length > 0 ? "Pinned mobile crash commands must be run and captured." : "",
    missingArtifacts.length > 0
      ? "Mobile crash artifacts must be retained with Sentry, symbolication, forced crash, privacy, CI, and secret-safe evidence."
      : "",
    missingEvidence.length > 0
      ? "Sentry/fallback wiring, source maps, debug symbols, forced crashes, persistence, dashboard sync, privacy, offline buffering, CI, and secret-safe evidence must pass."
      : "",
  ].filter(Boolean);

  return {
    status: blockers.length === 0 ? "complete" : "blocked",
    requiredCommands: mobileCrashRuntimeCommands,
    missingCommands,
    requiredArtifacts: mobileCrashArtifactPaths,
    missingArtifacts,
    requiredEvidence: mobileCrashEvidenceFlags,
    missingEvidence,
    blockers,
  };
};



