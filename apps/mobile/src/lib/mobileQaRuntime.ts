import { buildMobileDeviceQaRuntimeReadinessPlan } from "@inkroute/mobile-support";

import { mobileDeviceQaRuntimeReadinessRequiredCommands as canonicalMobileQaRuntimeCommands } from "@inkroute/mobile-support";

export type MobileQaRuntimeStatus =
  | "wired"
  | "component-gated"
  | "simulator-gated"
  | "device-gated"
  | "accessibility-gated"
  | "provider-gated"
  | "artifact-gated"
  | "ci-gated";

export interface MobileQaRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: MobileQaRuntimeStatus;
}

export const mobileQaRuntimeCommands = canonicalMobileQaRuntimeCommands;

export const mobileQaArtifactPaths = [
  "coverage/mobile-qa-runtime.json",
  "coverage/mobile-qa-support-typecheck.txt",
  "coverage/mobile-qa-support-test.txt",
  "coverage/mobile-qa-app-typecheck.txt",
  "coverage/mobile-qa-app-test.txt",
  "coverage/mobile-qa-component-render.json",
  "coverage/mobile-qa-ios-simulator-redacted.json",
  "coverage/mobile-qa-android-emulator-redacted.json",
  "coverage/mobile-qa-physical-device-redacted.json",
  "coverage/mobile-qa-accessibility.json",
  "coverage/mobile-qa-offline-reconnect-redacted.json",
  "coverage/mobile-qa-push-redacted.json",
  "coverage/mobile-qa-crash-redacted.json",
  "coverage/mobile-qa-ota-rollback-redacted.json",
  "coverage/mobile-qa-manifest-sync.json",
  "coverage/mobile-qa-ci-hooks.json",
  "coverage/mobile-qa-artifact-retention.json",
  "coverage/mobile-qa-secret-safe-artifacts.json",
  "test-results/mobile-qa-runtime",
] as const;

export const mobileQaRuntimeProofFiles = [
  "apps/mobile/package.json",
  "packages/mobile/package.json",
  "packages/mobile/src/index.ts",
  "packages/mobile/tests/mobile-support.test.ts",
  "apps/mobile/src/lib/mobileQa.ts",
  "apps/mobile/src/lib/mobileQaRuntime.ts",
  "apps/mobile/tests/mobile-render-contract.test.ts",
  "apps/mobile/tests/mobile-qa-static.test.ts",
  "apps/mobile/tests/mobile-qa-runtime-static.test.ts",
  "apps/mobile/App.tsx",
  "testing/manifests/mobile-device-qa-checklist.json",
  "testing/manifests/unit-test-manifest.json",
  ".github/workflows/ci.yml",
] as const;

export const mobileQaEvidenceFlags = [
  "mobileSupportTypecheckPassed",
  "mobileSupportTestsPassed",
  "mobileTypecheckPassed",
  "mobileTestsPassed",
  "componentRenderTestsPassed",
  "iosSimulatorSmokePassed",
  "androidEmulatorSmokePassed",
  "physicalDeviceSmokePassed",
  "accessibilityChecksPassed",
  "offlineReconnectQaPassed",
  "pushDeliveryQaPassed",
  "crashCaptureQaPassed",
  "otaRollbackQaPassed",
  "qaManifestSynced",
  "ciHooksConfigured",
  "artifactRetentionVerified",
  "secretSafeArtifactsCaptured",
] as const;

export type MobileQaEvidenceFlag = (typeof mobileQaEvidenceFlags)[number];

export interface MobileQaExecutionPolicy {
  readonly codexMayClassifyStaticMobileQaReadiness: true;
  readonly componentRenderRequiredForClosure: true;
  readonly simulatorSmokeRequiredForClosure: true;
  readonly physicalDeviceRequiredForClosure: true;
  readonly accessibilityRequiredForClosure: true;
  readonly providerQaRequiredForClosure: true;
  readonly artifactRetentionRequiredForClosure: true;
  readonly secretSafeArtifactsRequiredForClosure: true;
}

export interface MobileQaExecutionPlan {
  readonly policy: typeof mobileQaExecutionPolicy;
  readonly commandExecutionAllowed: false;
  readonly expoRenderExecutionAllowed: false;
  readonly simulatorExecutionAllowed: false;
  readonly physicalDeviceExecutionAllowed: false;
  readonly accessibilityExecutionAllowed: false;
  readonly providerQaExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly localCommands: typeof mobileQaLocalCommands;
  readonly externalCommands: typeof mobileQaExternalCommands;
  readonly requiredExternalEvidence: typeof mobileQaRequiredExternalEvidence;
}

export interface MobileQaArtifactReview {
  readonly artifact: unknown;
  readonly redactedArtifact: unknown;
  readonly redactedPaths: readonly string[];
  readonly secretSafe: boolean;
  readonly requiredExternalEvidence: typeof mobileQaRequiredExternalEvidence;
}

export interface MobileQaEvidenceInput {
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly evidence?: Partial<Record<MobileQaEvidenceFlag, boolean>>;
}

export interface MobileQaEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly requiredCommands: typeof mobileQaRuntimeCommands;
  readonly missingCommands: readonly string[];
  readonly requiredArtifacts: typeof mobileQaArtifactPaths;
  readonly missingArtifacts: readonly string[];
  readonly requiredEvidence: typeof mobileQaEvidenceFlags;
  readonly missingEvidence: readonly MobileQaEvidenceFlag[];
  readonly blockers: readonly string[];
}

export const mobileQaExecutionPolicy = {
  codexMayClassifyStaticMobileQaReadiness: true,
  componentRenderRequiredForClosure: true,
  simulatorSmokeRequiredForClosure: true,
  physicalDeviceRequiredForClosure: true,
  accessibilityRequiredForClosure: true,
  providerQaRequiredForClosure: true,
  artifactRetentionRequiredForClosure: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const satisfies MobileQaExecutionPolicy;

export const mobileQaRequiredExternalEvidence = [
  "executable Expo component/render test output",
  "iOS simulator smoke evidence",
  "Android emulator smoke evidence",
  "physical-device auth/API/offline/push/crash/OTA evidence",
  "accessibility VoiceOver/TalkBack/text-scaling/contrast evidence",
  "provider/device QA transcripts",
  "CI mobile QA evidence",
  "retained artifact links by checklist id",
  "secret-safe mobile QA artifact review",
] as const;

export const mobileQaLocalCommands = [
  "pnpm --filter @inkroute/mobile-support typecheck",
  "pnpm --filter @inkroute/mobile-support test",
  "static mobile QA manifest/checklist contract review",
  "static checklist-keyed artifact bundle review",
] as const;

export const mobileQaExternalCommands = [
  "pnpm --filter @inkroute/mobile typecheck",
  "pnpm --filter @inkroute/mobile test",
  "pnpm --filter @inkroute/mobile ios",
  "pnpm --filter @inkroute/mobile android",
  "executable Expo component/render tests",
  "manual physical-device QA for auth/api/offline/push/crash/OTA/accessibility",
  "GitHub Actions mobile QA evidence job",
] as const;

export const mobileQaRuntimeMatrix = [
  {
    id: "mobile-support-typecheck",
    command: "pnpm --filter @inkroute/mobile-support typecheck",
    artifact: "coverage/mobile-qa-support-typecheck.txt",
    status: "wired",
  },
  {
    id: "mobile-support-tests",
    command: "pnpm --filter @inkroute/mobile-support test",
    artifact: "coverage/mobile-qa-support-test.txt",
    status: "wired",
  },
  {
    id: "mobile-app-typecheck",
    command: "pnpm --filter @inkroute/mobile typecheck",
    artifact: "coverage/mobile-qa-app-typecheck.txt",
    status: "ci-gated",
  },
  {
    id: "mobile-static-tests",
    command: "pnpm --filter @inkroute/mobile test",
    artifact: "coverage/mobile-qa-app-test.txt",
    status: "ci-gated",
  },
  {
    id: "expo-component-render",
    command: "pnpm --filter @inkroute/mobile test -- apps/mobile/tests/mobile-render-contract.test.ts",
    artifact: "coverage/mobile-qa-component-render.json",
    status: "wired",
  },
  {
    id: "ios-screen-smoke",
    command: "pnpm --filter @inkroute/mobile ios",
    artifact: "coverage/mobile-qa-ios-simulator-redacted.json",
    status: "simulator-gated",
  },
  {
    id: "android-screen-smoke",
    command: "pnpm --filter @inkroute/mobile android",
    artifact: "coverage/mobile-qa-android-emulator-redacted.json",
    status: "simulator-gated",
  },
  {
    id: "physical-device-smoke",
    command: "manual physical-device QA for auth/api/offline/push/crash/OTA/accessibility",
    artifact: "coverage/mobile-qa-physical-device-redacted.json",
    status: "device-gated",
  },
  {
    id: "accessibility-pass",
    command: "manual VoiceOver/TalkBack, text scaling, contrast, and touch-target QA",
    artifact: "coverage/mobile-qa-accessibility.json",
    status: "accessibility-gated",
  },
  {
    id: "offline-reconnect-sync",
    command: "manual airplane-mode queue/reconnect QA",
    artifact: "coverage/mobile-qa-offline-reconnect-redacted.json",
    status: "provider-gated",
  },
  {
    id: "push-token-delivery",
    command: "Expo push token registration and test push",
    artifact: "coverage/mobile-qa-push-redacted.json",
    status: "provider-gated",
  },
  {
    id: "mobile-crash-capture",
    command: "forced safe mobile crash in preview build",
    artifact: "coverage/mobile-qa-crash-redacted.json",
    status: "provider-gated",
  },
  {
    id: "ota-preview-rollback",
    command: "eas update --channel preview --message rollback-republish-drill --non-interactive",
    artifact: "coverage/mobile-qa-ota-rollback-redacted.json",
    status: "provider-gated",
  },
  {
    id: "manifest-sync",
    command: "sync testing/manifests/mobile-device-qa-checklist.json with generated checklist ids",
    artifact: "coverage/mobile-qa-manifest-sync.json",
    status: "wired",
  },
  {
    id: "ci-hooks",
    command: "GitHub Actions mobile QA evidence job",
    artifact: "coverage/mobile-qa-ci-hooks.json",
    status: "ci-gated",
  },
  {
    id: "artifact-retention",
    command: "retain one secret-safe QA artifact bundle per checklist id",
    artifact: "coverage/mobile-qa-artifact-retention.json",
    status: "artifact-gated",
  },
  {
    id: "secret-safe-artifacts",
    command: "review mobile QA evidence for secrets, PII, medical data, payment data, and raw tokens",
    artifact: "coverage/mobile-qa-secret-safe-artifacts.json",
    status: "artifact-gated",
  },
] as const satisfies readonly MobileQaRuntimeMatrixEntry[];

const mobileQaRuntimeReadinessPlan = buildMobileDeviceQaRuntimeReadinessPlan({
  packageScripts: {
    test: "vitest run apps/mobile/tests/**/*.test.ts",
    typecheck: "tsc --noEmit",
    ios: "expo start --ios",
    android: "expo start --android",
  },
  mobileSupportTestsPassed: false,
  mobileSupportTypecheckPassed: false,
  mobileAppTypecheckPassed: false,
  mobileStaticTestsPassed: false,
  expoComponentRenderTestsPassed: false,
  iosSimulatorSmokePassed: false,
  androidEmulatorSmokePassed: false,
  physicalDeviceSmokePassed: false,
  accessibilityChecksPassed: false,
  offlineQaPassed: false,
  pushQaPassed: false,
  crashQaPassed: false,
  otaRollbackQaPassed: false,
  qaManifestSynced: true,
  ciHooksConfigured: false,
  qaArtifactsAttached: false,
});

export const mobileQaRuntimeReadiness = {
  ...mobileQaRuntimeReadinessPlan,
  requiredCommands: mobileQaRuntimeCommands,
  requiredEvidence: mobileQaEvidenceFlags,
};

const missingFrom = (actual: readonly string[] | undefined, required: readonly string[]) => {
  const actualSet = new Set(actual ?? []);
  return required.filter((entry) => !actualSet.has(entry));
};

const sensitiveMobileQaArtifactKey = /(secret|token|password|private|client|tenant|domain|database|db|url|uri|provider|session|refresh|device|simulator|emulator|screenshot|video|artifact|receipt|push|crash|ota|auth|api|offline|accessibility|email|phone|medical|payment|tattoo|path|ci|workflow|run|evidence|id|key)/i;
const sensitiveMobileQaArtifactValue =
  /(https?:\/\/[^\s"']+|postgres(?:ql)?:\/\/[^\s"']+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d .()-]{8,}\d|(?:sk|pk|gh[psuor]|github_pat|provider-token)[A-Za-z0-9_-]*|(?:tenant|client|user|member|session|refresh|device|simulator|emulator|screenshot|video|artifact|receipt|push|crash|ota|auth|api|offline|accessibility|provider|workflow|ci|run|evidence|mobile)[-_:/]?[A-Za-z0-9_.-]{6,}|(?:coverage|artifacts|test-results|reports|docs)\/[A-Za-z0-9_./-]{6,}|[A-Za-z0-9_-]{24,})/giu;

const redactMobileQaArtifactValue = (
  value: unknown,
  path: string,
  redactedPaths: string[],
): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry, index) => redactMobileQaArtifactValue(entry, `${path}.${index}`, redactedPaths));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitiveMobileQaArtifactKey.test(key)) {
          redactedPaths.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, redactMobileQaArtifactValue(entry, nextPath, redactedPaths)];
      }),
    );
  }

  if (typeof value === "string" && sensitiveMobileQaArtifactValue.test(value)) {
    sensitiveMobileQaArtifactValue.lastIndex = 0;
    redactedPaths.push(path);
    return value.replace(sensitiveMobileQaArtifactValue, "[REDACTED]");
  }

  sensitiveMobileQaArtifactValue.lastIndex = 0;
  return value;
};

export const buildMobileQaExecutionPlan = (): MobileQaExecutionPlan => ({
  policy: mobileQaExecutionPolicy,
  commandExecutionAllowed: false,
  expoRenderExecutionAllowed: false,
  simulatorExecutionAllowed: false,
  physicalDeviceExecutionAllowed: false,
  accessibilityExecutionAllowed: false,
  providerQaExecutionAllowed: false,
  ciExecutionAllowed: false,
  localCommands: mobileQaLocalCommands,
  externalCommands: mobileQaExternalCommands,
  requiredExternalEvidence: mobileQaRequiredExternalEvidence,
});

export const buildRedactedMobileQaArtifact = (artifact: unknown): Pick<MobileQaArtifactReview, "redactedArtifact" | "redactedPaths"> => {
  const redactedPaths: string[] = [];
  return {
    redactedArtifact: redactMobileQaArtifactValue(artifact, "", redactedPaths),
    redactedPaths,
  };
};

export const buildMobileQaArtifactReview = (artifact: unknown): MobileQaArtifactReview => {
  const redacted = buildRedactedMobileQaArtifact(artifact);
  return {
    artifact,
    redactedArtifact: redacted.redactedArtifact,
    redactedPaths: redacted.redactedPaths,
    secretSafe: redacted.redactedPaths.length > 0,
    requiredExternalEvidence: mobileQaRequiredExternalEvidence,
  };
};

export const buildMobileQaEvidenceDecision = (
  input: MobileQaEvidenceInput = {},
): MobileQaEvidenceDecision => {
  const missingCommands = missingFrom(input.commands, mobileQaRuntimeCommands);
  const missingArtifacts = missingFrom(input.artifacts, mobileQaArtifactPaths);
  const missingEvidence = mobileQaEvidenceFlags.filter((flag) => input.evidence?.[flag] !== true);
  const blockers = [
    missingCommands.length > 0 ? "Pinned mobile QA commands must be run and captured." : "",
    missingArtifacts.length > 0
      ? "Mobile QA artifacts must be retained with component, simulator, device, provider, accessibility, CI, and secret-safe evidence."
      : "",
    missingEvidence.length > 0
      ? "Component render, simulator, physical-device, accessibility, provider flow, manifest, CI, retention, and secret-safe evidence must pass."
      : "",
  ].filter(Boolean);

  return {
    status: blockers.length === 0 ? "complete" : "blocked",
    requiredCommands: mobileQaRuntimeCommands,
    missingCommands,
    requiredArtifacts: mobileQaArtifactPaths,
    missingArtifacts,
    requiredEvidence: mobileQaEvidenceFlags,
    missingEvidence,
    blockers,
  };
};



