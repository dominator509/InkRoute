import { buildExpoEasRuntimeEvidencePlan } from "@inkroute/releases";

export type MobileUpdatesRuntimeStatus =
  | "wired"
  | "project-gated"
  | "credential-gated"
  | "build-gated"
  | "ota-gated"
  | "rollback-gated"
  | "monitoring-gated"
  | "ci-gated";

export interface MobileUpdatesRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: MobileUpdatesRuntimeStatus;
}

export const mobileUpdatesRuntimeCommands = [
  "pnpm --filter @inkroute/releases typecheck",
  "pnpm --filter @inkroute/releases test",
  "pnpm --filter @inkroute/mobile typecheck",
  "eas build --profile preview --platform all",
  "eas update --channel preview",
  "eas update:list --channel preview",
  "eas update --channel preview --message rollback-republish-drill --non-interactive",
] as const;

export const mobileUpdatesArtifactPaths = [
  "coverage/mobile-updates-runtime.json",
  "coverage/mobile-updates-releases-typecheck.txt",
  "coverage/mobile-updates-releases-test.txt",
  "coverage/mobile-updates-app-typecheck.txt",
  "coverage/mobile-updates-app-config-project.json",
  "coverage/mobile-updates-eas-json-channels.json",
  "coverage/mobile-updates-credentials-redacted.json",
  "coverage/mobile-updates-preview-native-build-redacted.json",
  "coverage/mobile-updates-production-native-build-redacted.json",
  "coverage/mobile-updates-preview-ota-publish-redacted.json",
  "coverage/mobile-updates-device-receipt-redacted.json",
  "coverage/mobile-updates-rollback-republish-redacted.json",
  "coverage/mobile-updates-compatibility-check.json",
  "coverage/mobile-updates-adoption-monitoring.json",
  "coverage/mobile-updates-release-health-monitoring.json",
  "coverage/mobile-updates-secret-safe-artifacts.json",
  "test-results/mobile-updates-runtime",
] as const;

export const mobileUpdatesRuntimeProofFiles = [
  "apps/mobile/package.json",
  "packages/releases/package.json",
  "packages/releases/src/index.ts",
  "packages/releases/tests/feature-flags.test.ts",
  "apps/mobile/src/lib/mobileUpdates.ts",
  "apps/mobile/src/lib/mobileUpdatesRuntime.ts",
  "apps/mobile/src/screens/SystemStatusScreen.tsx",
  "apps/mobile/tests/mobile-updates-static.test.ts",
  "apps/mobile/tests/mobile-updates-runtime-static.test.ts",
  "apps/mobile/eas.json",
  "apps/mobile/app.json",
  "testing/manifests/unit-test-manifest.json",
  ".github/workflows/ci.yml",
] as const;

export const mobileUpdatesEvidenceFlags = [
  "releasesTypecheckPassed",
  "releasesTestsPassed",
  "mobileTypecheckPassed",
  "appConfigProjectVerified",
  "easJsonChannelsVerified",
  "credentialsConfigured",
  "previewNativeBuildPassed",
  "productionNativeBuildPassed",
  "previewOtaPublished",
  "deviceReceivedPreviewUpdate",
  "rollbackRepublishVerified",
  "compatibilityCheckPassed",
  "adoptionMonitoringVerified",
  "releaseHealthMonitoringConfigured",
  "ciEvidenceCaptured",
  "secretSafeArtifactsCaptured",
] as const;

export type MobileUpdatesEvidenceFlag = (typeof mobileUpdatesEvidenceFlags)[number];

export interface MobileUpdatesExecutionPolicy {
  readonly codexMayClassifyStaticMobileUpdatesReadiness: true;
  readonly easProjectRequiredForClosure: true;
  readonly easCredentialsRequiredForClosure: true;
  readonly nativeBuildRequiredForClosure: true;
  readonly otaPublishRequiredForClosure: true;
  readonly rollbackRepublishRequiredForClosure: true;
  readonly monitoringRequiredForClosure: true;
  readonly secretSafeArtifactsRequiredForClosure: true;
}

export interface MobileUpdatesExecutionPlan {
  readonly policy: typeof mobileUpdatesExecutionPolicy;
  readonly commandExecutionAllowed: false;
  readonly easProjectExecutionAllowed: false;
  readonly credentialExecutionAllowed: false;
  readonly nativeBuildExecutionAllowed: false;
  readonly otaPublishExecutionAllowed: false;
  readonly rollbackExecutionAllowed: false;
  readonly monitoringExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly localCommands: typeof mobileUpdatesLocalCommands;
  readonly externalCommands: typeof mobileUpdatesExternalCommands;
  readonly requiredExternalEvidence: typeof mobileUpdatesRequiredExternalEvidence;
}

export interface MobileUpdatesArtifactReview {
  readonly artifact: unknown;
  readonly redactedArtifact: unknown;
  readonly redactedPaths: readonly string[];
  readonly secretSafe: boolean;
  readonly requiredExternalEvidence: typeof mobileUpdatesRequiredExternalEvidence;
}

export interface MobileUpdatesEvidenceInput {
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly evidence?: Partial<Record<MobileUpdatesEvidenceFlag, boolean>>;
}

export interface MobileUpdatesEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly requiredCommands: typeof mobileUpdatesRuntimeCommands;
  readonly missingCommands: readonly string[];
  readonly requiredArtifacts: typeof mobileUpdatesArtifactPaths;
  readonly missingArtifacts: readonly string[];
  readonly requiredEvidence: typeof mobileUpdatesEvidenceFlags;
  readonly missingEvidence: readonly MobileUpdatesEvidenceFlag[];
  readonly blockers: readonly string[];
}

export const mobileUpdatesExecutionPolicy = {
  codexMayClassifyStaticMobileUpdatesReadiness: true,
  easProjectRequiredForClosure: true,
  easCredentialsRequiredForClosure: true,
  nativeBuildRequiredForClosure: true,
  otaPublishRequiredForClosure: true,
  rollbackRepublishRequiredForClosure: true,
  monitoringRequiredForClosure: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const satisfies MobileUpdatesExecutionPolicy;

export const mobileUpdatesRequiredExternalEvidence = [
  "real non-secret EAS project id/update URL evidence",
  "EAS credentials configured outside source control evidence",
  "preview native build evidence",
  "production native build evidence",
  "preview OTA publish evidence",
  "device receipt proof",
  "rollback republish proof",
  "compatibility check proof",
  "adoption monitoring proof",
  "release-health monitoring proof",
  "mobile updates typecheck output",
  "CI mobile OTA evidence",
  "secret-safe mobile OTA artifact review",
] as const;

export const mobileUpdatesLocalCommands = [
  "pnpm --filter @inkroute/releases typecheck",
  "pnpm --filter @inkroute/releases test",
  "static mobile OTA compatibility classification review",
  "static rollback audit payload redaction review",
] as const;

export const mobileUpdatesExternalCommands = [
  "pnpm --filter @inkroute/mobile typecheck",
  "eas build --profile preview --platform all",
  "eas build --profile production --platform all",
  "eas update --channel preview",
  "eas update:list --channel preview",
  "eas update --channel preview --message rollback-republish-drill --non-interactive",
  "preview device receipt proof",
  "adoption and release-health monitoring proof",
  "GitHub Actions mobile OTA evidence job",
] as const;

export const mobileUpdatesRuntimeMatrix = [
  {
    id: "releases-typecheck",
    command: "pnpm --filter @inkroute/releases typecheck",
    artifact: "coverage/mobile-updates-releases-typecheck.txt",
    status: "wired",
  },
  {
    id: "releases-tests",
    command: "pnpm --filter @inkroute/releases test",
    artifact: "coverage/mobile-updates-releases-test.txt",
    status: "wired",
  },
  {
    id: "mobile-typecheck",
    command: "pnpm --filter @inkroute/mobile typecheck",
    artifact: "coverage/mobile-updates-app-typecheck.txt",
    status: "ci-gated",
  },
  {
    id: "app-config-project",
    command: "commit real non-secret EAS project id, update URL, runtimeVersion, and channel mapping",
    artifact: "coverage/mobile-updates-app-config-project.json",
    status: "project-gated",
  },
  {
    id: "eas-json-channels",
    command: "reconcile eas.json preview and production profiles with release policy",
    artifact: "coverage/mobile-updates-eas-json-channels.json",
    status: "project-gated",
  },
  {
    id: "eas-credentials",
    command: "configure EAS credentials outside source control",
    artifact: "coverage/mobile-updates-credentials-redacted.json",
    status: "credential-gated",
  },
  {
    id: "preview-native-build",
    command: "eas build --profile preview --platform all",
    artifact: "coverage/mobile-updates-preview-native-build-redacted.json",
    status: "build-gated",
  },
  {
    id: "production-native-build",
    command: "eas build --profile production --platform all",
    artifact: "coverage/mobile-updates-production-native-build-redacted.json",
    status: "build-gated",
  },
  {
    id: "preview-ota-publish",
    command: "eas update --channel preview",
    artifact: "coverage/mobile-updates-preview-ota-publish-redacted.json",
    status: "ota-gated",
  },
  {
    id: "device-receipt",
    command: "eas update:list --channel preview and preview-device receipt check",
    artifact: "coverage/mobile-updates-device-receipt-redacted.json",
    status: "ota-gated",
  },
  {
    id: "rollback-republish",
    command: "eas update --channel preview --message rollback-republish-drill --non-interactive",
    artifact: "coverage/mobile-updates-rollback-republish-redacted.json",
    status: "rollback-gated",
  },
  {
    id: "compatibility-check",
    command: "prove OTA update does not require a new native build",
    artifact: "coverage/mobile-updates-compatibility-check.json",
    status: "wired",
  },
  {
    id: "adoption-monitoring",
    command: "verify update adoption and error dashboards before production OTA",
    artifact: "coverage/mobile-updates-adoption-monitoring.json",
    status: "monitoring-gated",
  },
  {
    id: "release-health-monitoring",
    command: "wire EAS update status to release health monitoring and incident triage",
    artifact: "coverage/mobile-updates-release-health-monitoring.json",
    status: "monitoring-gated",
  },
  {
    id: "ci-secret-safe-evidence",
    command: "GitHub Actions mobile OTA evidence job",
    artifact: "coverage/mobile-updates-secret-safe-artifacts.json",
    status: "ci-gated",
  },
] as const satisfies readonly MobileUpdatesRuntimeMatrixEntry[];

export const mobileUpdatesRuntimeEvidence = buildExpoEasRuntimeEvidencePlan({
  packageScripts: ["test", "typecheck"],
  releasesTestsPassed: false,
  releasesTypecheckPassed: false,
  mobileTypecheckPassed: false,
  appJsonProjectIdMatches: false,
  easJsonChannelsMatch: false,
  credentialsConfigured: false,
  easProjectIdConfigured: false,
  updateUrlConfigured: false,
  runtimeVersionPolicyConfigured: true,
  previewChannelConfigured: true,
  productionChannelConfigured: true,
  previewNativeBuildPassed: false,
  productionNativeBuildPassed: false,
  previewOtaPublishVerified: false,
  deviceReceivedPreviewUpdate: false,
  rollbackRepublishVerified: false,
  compatibilityCheckPassed: true,
  adoptionMonitoringVerified: false,
  releaseHealthMonitoringConfigured: false,
});

const missingFrom = (actual: readonly string[] | undefined, required: readonly string[]) => {
  const actualSet = new Set(actual ?? []);
  return required.filter((entry) => !actualSet.has(entry));
};

const sensitiveMobileUpdatesArtifactKey = /(secret|token|password|private|client|tenant|domain|database|db|url|uri|provider|session|refresh|eas|expo|credential|project|update|channel|runtime|device|receipt|rollback|release|health|adoption|monitoring|email|phone|medical|payment|artifact|path|ci|workflow|run|evidence|id|key)/i;
const sensitiveMobileUpdatesArtifactValue =
  /(https?:\/\/[^\s"']+|postgres(?:ql)?:\/\/[^\s"']+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d .()-]{8,}\d|(?:sk|pk|gh[psuor]|github_pat|provider-token|expo|eas)[A-Za-z0-9_-]*|(?:tenant|client|user|member|session|refresh|eas|expo|credential|project|update|channel|runtime|device|receipt|rollback|release|health|adoption|monitoring|provider|artifact|workflow|ci|run|evidence|mobile)[-_:/]?[A-Za-z0-9_.-]{6,}|(?:coverage|artifacts|test-results|reports|docs)\/[A-Za-z0-9_./-]{6,}|[A-Za-z0-9_-]{24,})/giu;

const redactMobileUpdatesArtifactValue = (
  value: unknown,
  path: string,
  redactedPaths: string[],
): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry, index) => redactMobileUpdatesArtifactValue(entry, `${path}.${index}`, redactedPaths));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitiveMobileUpdatesArtifactKey.test(key)) {
          redactedPaths.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, redactMobileUpdatesArtifactValue(entry, nextPath, redactedPaths)];
      }),
    );
  }

  if (typeof value === "string" && sensitiveMobileUpdatesArtifactValue.test(value)) {
    sensitiveMobileUpdatesArtifactValue.lastIndex = 0;
    redactedPaths.push(path);
    return value.replace(sensitiveMobileUpdatesArtifactValue, "[REDACTED]");
  }

  sensitiveMobileUpdatesArtifactValue.lastIndex = 0;
  return value;
};

export const buildMobileUpdatesExecutionPlan = (): MobileUpdatesExecutionPlan => ({
  policy: mobileUpdatesExecutionPolicy,
  commandExecutionAllowed: false,
  easProjectExecutionAllowed: false,
  credentialExecutionAllowed: false,
  nativeBuildExecutionAllowed: false,
  otaPublishExecutionAllowed: false,
  rollbackExecutionAllowed: false,
  monitoringExecutionAllowed: false,
  ciExecutionAllowed: false,
  localCommands: mobileUpdatesLocalCommands,
  externalCommands: mobileUpdatesExternalCommands,
  requiredExternalEvidence: mobileUpdatesRequiredExternalEvidence,
});

export const buildRedactedMobileUpdatesArtifact = (artifact: unknown): Pick<MobileUpdatesArtifactReview, "redactedArtifact" | "redactedPaths"> => {
  const redactedPaths: string[] = [];
  return {
    redactedArtifact: redactMobileUpdatesArtifactValue(artifact, "", redactedPaths),
    redactedPaths,
  };
};

export const buildMobileUpdatesArtifactReview = (artifact: unknown): MobileUpdatesArtifactReview => {
  const redacted = buildRedactedMobileUpdatesArtifact(artifact);
  return {
    artifact,
    redactedArtifact: redacted.redactedArtifact,
    redactedPaths: redacted.redactedPaths,
    secretSafe: redacted.redactedPaths.length > 0,
    requiredExternalEvidence: mobileUpdatesRequiredExternalEvidence,
  };
};

export const buildMobileUpdatesEvidenceDecision = (
  input: MobileUpdatesEvidenceInput = {},
): MobileUpdatesEvidenceDecision => {
  const missingCommands = missingFrom(input.commands, mobileUpdatesRuntimeCommands);
  const missingArtifacts = missingFrom(input.artifacts, mobileUpdatesArtifactPaths);
  const missingEvidence = mobileUpdatesEvidenceFlags.filter((flag) => input.evidence?.[flag] !== true);
  const blockers = [
    missingCommands.length > 0 ? "Pinned mobile OTA commands must be run and captured." : "",
    missingArtifacts.length > 0
      ? "Mobile OTA artifacts must be retained with EAS config, credentials, build, update, rollback, monitoring, CI, and secret-safe evidence."
      : "",
    missingEvidence.length > 0
      ? "EAS project config, credentials, preview/production builds, OTA receipt, rollback, compatibility, monitoring, CI, and secret-safe evidence must pass."
      : "",
  ].filter(Boolean);

  return {
    status: blockers.length === 0 ? "complete" : "blocked",
    requiredCommands: mobileUpdatesRuntimeCommands,
    missingCommands,
    requiredArtifacts: mobileUpdatesArtifactPaths,
    missingArtifacts,
    requiredEvidence: mobileUpdatesEvidenceFlags,
    missingEvidence,
    blockers,
  };
};



