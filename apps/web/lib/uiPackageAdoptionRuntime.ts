import { buildUiPackageAdoptionEvidencePlan } from "@inkroute/ui";

export type UiPackageAdoptionRuntimeStatus =
  | "wired"
  | "adoption-gated"
  | "accessibility-gated"
  | "visual-gated"
  | "build-gated"
  | "artifact-gated";

export interface UiPackageAdoptionRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: UiPackageAdoptionRuntimeStatus;
}


export interface UiPackageAdoptionRunPersistenceContract {
  readonly prismaModel: "UiPackageAdoptionRun";
  readonly tenantRelation: "uiPackageAdoptionRuns";
  readonly migration: "20260609034000_add_ui_package_adoption_runs";
  readonly storesRunId: true;
  readonly storesCommitSha: true;
  readonly storesReadinessStatus: true;
  readonly storesCommandMatrix: true;
  readonly storesArtifactManifest: true;
  readonly storesPrimitiveAdoptionEvidence: true;
  readonly storesFormNavDialogEvidence: true;
  readonly storesAccessibilityEvidence: true;
  readonly storesKeyboardFocusEvidence: true;
  readonly storesVisualSmokeEvidence: true;
  readonly storesBuildSmokeEvidence: true;
  readonly storesDesignTokenDocsEvidence: true;
  readonly storesSecretSafeArtifacts: true;
}

export const uiPackageAdoptionRunPersistenceContract = {
  prismaModel: "UiPackageAdoptionRun",
  tenantRelation: "uiPackageAdoptionRuns",
  migration: "20260609034000_add_ui_package_adoption_runs",
  storesRunId: true,
  storesCommitSha: true,
  storesReadinessStatus: true,
  storesCommandMatrix: true,
  storesArtifactManifest: true,
  storesPrimitiveAdoptionEvidence: true,
  storesFormNavDialogEvidence: true,
  storesAccessibilityEvidence: true,
  storesKeyboardFocusEvidence: true,
  storesVisualSmokeEvidence: true,
  storesBuildSmokeEvidence: true,
  storesDesignTokenDocsEvidence: true,
  storesSecretSafeArtifacts: true,
} as const satisfies UiPackageAdoptionRunPersistenceContract;

export const uiPackageAdoptionRuntimeCommands = [
  "pnpm --filter @inkroute/ui typecheck",
  "pnpm --filter @inkroute/ui test",
  "shared UI primitive export contract",
  "pnpm ui:adoption-evidence",
  "pnpm --filter @inkroute/web build",
  "pnpm --filter @inkroute/dashboard build",
  "web shared UI adoption smoke",
  "dashboard shared UI adoption smoke",
  "form field, navigation/surface, and dialog primitive adoption smoke",
  "accessibility and keyboard focus smoke",
  "Storybook or visual smoke capture",
  "web/dashboard builds, app smoke tests, and style-regression review",
  "design token documentation and secret-safe visual artifact review",
] as const;

export const uiPackageAdoptionArtifactPaths = [
  "coverage/ui-package-adoption-runtime.json",
  "coverage/ui-package-typecheck.txt",
  "coverage/ui-package-test.txt",
  "coverage/ui-export-contract.json",
  "coverage/ui-web-adoption-smoke.json",
  "coverage/ui-dashboard-adoption-smoke.json",
  "coverage/ui-form-field-adoption.json",
  "coverage/ui-nav-surface-adoption.json",
  "coverage/ui-dialog-adoption.json",
  "coverage/ui-accessibility-smoke.json",
  "coverage/ui-keyboard-focus-smoke.json",
  "coverage/ui-storybook-visual-smoke.json",
  "coverage/ui-visual-regression-artifacts-redacted.json",
  "coverage/ui-web-build.txt",
  "coverage/ui-dashboard-build.txt",
  "coverage/ui-app-smoke-tests.json",
  "coverage/ui-style-regression-review.md",
  "coverage/ui-design-token-docs.json",
  "coverage/ui-secret-safe-artifacts.json",
  "test-results/ui-package-adoption-runtime",
] as const;

export const uiPackageAdoptionRuntimeProofFiles = [
  "apps/dashboard/package.json",
  "apps/web/package.json",
  "packages/ui/package.json",
  "packages/ui/src/index.ts",
  "packages/ui/src/readiness.ts",
  "packages/ui/tests/ui-contract.test.ts",
  "packages/ui/README.md",
  "scripts/ui/write-ui-package-adoption-evidence.mjs",
  "apps/web/app/page.tsx",
  "apps/dashboard/app/page.tsx",
  "apps/web/lib/uiPackageAdoptionRuntime.ts",
  "apps/web/tests/ui-package-adoption-runtime-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609034000_add_ui_package_adoption_runs/migration.sql",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
  "GAP_TRACKER.md",
] as const;

export const uiPackageAdoptionRuntimeMatrix = [
  {
    id: "ui-package-gates",
    command: "pnpm --filter @inkroute/ui typecheck && pnpm --filter @inkroute/ui test",
    artifact: "coverage/ui-package-test.txt",
    status: "wired",
  },
  {
    id: "export-contract",
    command: "shared UI primitive export contract",
    artifact: "coverage/ui-export-contract.json",
    status: "wired",
  },
  {
    id: "local-adoption-evidence",
    command: "pnpm ui:adoption-evidence",
    artifact: "coverage/ui-package-adoption-runtime.json",
    status: "wired",
  },
  {
    id: "web-dashboard-adoption",
    command: "web shared UI adoption smoke && dashboard shared UI adoption smoke",
    artifact: "coverage/ui-web-adoption-smoke.json",
    status: "adoption-gated",
  },
  {
    id: "form-nav-dialog-adoption",
    command: "form field, navigation/surface, and dialog primitive adoption smoke",
    artifact: "coverage/ui-form-field-adoption.json",
    status: "adoption-gated",
  },
  {
    id: "accessibility-keyboard-focus",
    command: "accessibility and keyboard focus smoke",
    artifact: "coverage/ui-accessibility-smoke.json",
    status: "accessibility-gated",
  },
  {
    id: "storybook-visual-regression",
    command: "Storybook or visual smoke capture",
    artifact: "coverage/ui-storybook-visual-smoke.json",
    status: "visual-gated",
  },
  {
    id: "app-build-smoke-style-review",
    command: "web/dashboard builds, app smoke tests, and style-regression review",
    artifact: "coverage/ui-web-build.txt",
    status: "build-gated",
  },
  {
    id: "token-docs-secret-safe-artifacts",
    command: "design token documentation and secret-safe visual artifact review",
    artifact: "coverage/ui-secret-safe-artifacts.json",
    status: "artifact-gated",
  },
] as const satisfies readonly UiPackageAdoptionRuntimeMatrixEntry[];

export const uiPackageAdoptionRuntimeControls = [
  "preserve-existing-app-visual-language-while-adopting-shared-primitives",
  "keyboard-accessible-labels-hints-errors-dialogs-and-navigation",
  "demo-safe-seeded-data-only-for-visual-evidence",
  "secret-pii-medical-payment-safe-visual-artifacts",
] as const;

export const uiPackageAdoptionEvidenceFlags = [
  "uiTypecheckPassed",
  "uiTestsPassed",
  "exportedPrimitivesCovered",
  "webAdoptionCompleted",
  "dashboardAdoptionCompleted",
  "formFieldAdoptionCompleted",
  "navSurfaceAdoptionCompleted",
  "dialogAdoptionCompleted",
  "accessibilitySmokePassed",
  "keyboardFocusSmokePassed",
  "storybookOrVisualSmokeConfigured",
  "visualRegressionArtifactsCaptured",
  "webBuildPassed",
  "dashboardBuildPassed",
  "appSmokeTestsPassed",
  "noStyleRegressionAccepted",
  "designTokensDocumented",
  "secretSafeArtifactsCaptured",
] as const;

export type UiPackageAdoptionEvidenceFlag = (typeof uiPackageAdoptionEvidenceFlags)[number];

export interface UiPackageAdoptionEvidenceInput {
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly controls?: readonly string[];
  readonly evidence?: Partial<Record<UiPackageAdoptionEvidenceFlag, boolean>>;
}

export interface UiPackageAdoptionEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingCommands: readonly string[];
  readonly missingArtifacts: readonly string[];
  readonly missingControls: readonly string[];
  readonly missingEvidence: readonly UiPackageAdoptionEvidenceFlag[];
  readonly requiredCommands: typeof uiPackageAdoptionRuntimeCommands;
  readonly requiredArtifacts: typeof uiPackageAdoptionArtifactPaths;
  readonly requiredControls: typeof uiPackageAdoptionRuntimeControls;
  readonly requiredEvidence: typeof uiPackageAdoptionEvidenceFlags;
  readonly blockers: readonly string[];
}

export interface UiPackageAdoptionExecutionPlan {
  readonly localCommands: typeof uiPackageAdoptionRuntimeCommands;
  readonly externalCommands: typeof uiPackageAdoptionExternalCommands;
  readonly localArtifacts: typeof uiPackageAdoptionArtifactPaths;
  readonly externalArtifacts: typeof uiPackageAdoptionExternalArtifacts;
  readonly commandExecutionAllowed: false;
  readonly visualCaptureExecutionAllowed: false;
  readonly databaseExecutionAllowed: false;
  readonly providerPersistenceExecutionAllowed: false;
  readonly executionPolicy: typeof uiPackageAdoptionExecutionPolicy;
  readonly requiredExternalEvidence: typeof uiPackageAdoptionRequiredExternalEvidence;
}

export interface UiPackageAdoptionArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof uiPackageAdoptionRequiredExternalEvidence;
  readonly safeForTracker: boolean;
}

export const uiPackageAdoptionRequiredExternalEvidence = [
  "Actual UI typecheck, test, build, adoption, accessibility, keyboard/focus, visual smoke, app smoke, and style-review command outputs.",
  "Secret-safe visual artifacts captured from seeded/demo-safe data only.",
  "Provider-backed UiPackageAdoptionRun persistence row captured through persistUiPackageAdoptionRun.",
] as const;

export type UiPackageAdoptionExecutionPolicy = {
  readonly codexMayClassifyStaticUiPackageAdoptionReadiness: true;
  readonly visualEvidenceRequiredForClosure: true;
  readonly providerDatabaseRequiredForPersistence: true;
  readonly secretSafeVisualArtifactsRequiredForClosure: true;
};

export const uiPackageAdoptionExecutionPolicy: UiPackageAdoptionExecutionPolicy = {
  codexMayClassifyStaticUiPackageAdoptionReadiness: true,
  visualEvidenceRequiredForClosure: true,
  providerDatabaseRequiredForPersistence: true,
  secretSafeVisualArtifactsRequiredForClosure: true,
};

export const uiPackageAdoptionExternalCommands = ["provider-backed persistUiPackageAdoptionRun execution proof"] as const;

export const uiPackageAdoptionExternalArtifacts = ["provider-backed UiPackageAdoptionRun persistence proof"] as const;

export interface UiPackageAdoptionRunRecordInput {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha: string;
  readonly readinessStatus: UiPackageAdoptionEvidenceDecision["status"];
  readonly styleRegressionReviewPath?: string;
  readonly visualArtifactManifestPath?: string;
}

export interface UiPackageAdoptionRunRepository {
  readonly uiPackageAdoptionRun: {
    readonly upsert: (input: {
      readonly where: { readonly tenantId_runId: { readonly tenantId: string; readonly runId: string } };
      readonly create: Record<string, unknown>;
      readonly update: Record<string, unknown>;
    }) => Promise<unknown>;
  };
}

const uiPackageAdoptionEvidenceBlockers: Record<UiPackageAdoptionEvidenceFlag, string> = {
  uiTypecheckPassed: "UI package typecheck must pass.",
  uiTestsPassed: "UI package tests must pass.",
  exportedPrimitivesCovered: "Shared primitive export contract must be covered.",
  webAdoptionCompleted: "Web app must adopt shared UI primitives on at least one production-relevant surface.",
  dashboardAdoptionCompleted: "Dashboard app must adopt shared UI primitives on at least one production-relevant surface.",
  formFieldAdoptionCompleted: "Form field shared primitive adoption must be verified.",
  navSurfaceAdoptionCompleted: "Navigation and surface shared primitive adoption must be verified.",
  dialogAdoptionCompleted: "Dialog shared primitive adoption must be verified.",
  accessibilitySmokePassed: "Accessibility smoke must pass in app context.",
  keyboardFocusSmokePassed: "Keyboard and focus smoke must pass in app context.",
  storybookOrVisualSmokeConfigured: "Storybook or equivalent visual smoke coverage must be configured.",
  visualRegressionArtifactsCaptured: "Visual regression artifacts must be captured.",
  webBuildPassed: "Web build must pass after UI package adoption.",
  dashboardBuildPassed: "Dashboard build must pass after UI package adoption.",
  appSmokeTestsPassed: "App smoke tests must pass after UI package adoption.",
  noStyleRegressionAccepted: "Style-regression review must accept the shared primitive adoption.",
  designTokensDocumented: "Design-token usage must be documented.",
  secretSafeArtifactsCaptured: "UI screenshots, visual artifacts, and reports must be free of secrets, tokens, raw PII, medical, or payment data.",
};

const missingFrom = (actual: readonly string[] | undefined, required: readonly string[]) =>
  required.filter((item) => !(actual ?? []).includes(item));

const sensitiveUiPackageAdoptionKeyPattern =
  /(token|secret|password|authorization|cookie|email|phone|name|address|medical|payment|card|tenant|user|client|database|url|uri|dsn|key|id|screenshot|visual|artifact|payload|repository|repo|branch|pull|pr|reviewer|codeowner)/iu;
const sensitiveUiPackageAdoptionValuePattern =
  /(https?:\/\/[^\s"']+|postgres(?:ql)?:\/\/[^\s"']+|repo:[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+|branch:[A-Za-z0-9_./-]+|pr[_:#-]?[A-Za-z0-9_.-]+|reviewer[_:@-]?[A-Za-z0-9_.-]+|CODEOWNER:[A-Za-z0-9_.@/-]+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d .()-]{8,}\d|(?:gh[psuor]_|github_pat_)[A-Za-z0-9_]+|[A-Za-z0-9_-]{24,})/giu;

const buildRedactedUiPackageAdoptionValue = (value: unknown, path: string, redactions: string[]): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry, index) => buildRedactedUiPackageAdoptionValue(entry, `${path}[${index}]`, redactions));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitiveUiPackageAdoptionKeyPattern.test(key)) {
          redactions.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, buildRedactedUiPackageAdoptionValue(entry, nextPath, redactions)];
      }),
    );
  }

  if (typeof value === "string") {
    const redacted = value.replace(sensitiveUiPackageAdoptionValuePattern, "[REDACTED]");
    if (redacted !== value) {
      redactions.push(path || "$");
    }
    return redacted;
  }

  return value;
};

export function buildUiPackageAdoptionExecutionPlan(): UiPackageAdoptionExecutionPlan {
  return {
    localCommands: uiPackageAdoptionRuntimeCommands,
    externalCommands: uiPackageAdoptionExternalCommands,
    localArtifacts: uiPackageAdoptionArtifactPaths,
    externalArtifacts: uiPackageAdoptionExternalArtifacts,
    commandExecutionAllowed: false,
    visualCaptureExecutionAllowed: false,
    databaseExecutionAllowed: false,
    providerPersistenceExecutionAllowed: false,
    executionPolicy: uiPackageAdoptionExecutionPolicy,
    requiredExternalEvidence: uiPackageAdoptionRequiredExternalEvidence,
  };
}

export function buildRedactedUiPackageAdoptionArtifact(artifact: unknown): unknown {
  return buildRedactedUiPackageAdoptionValue(artifact, "", []);
}

export function buildUiPackageAdoptionArtifactReview(artifact: unknown): UiPackageAdoptionArtifactReview {
  const redactions: string[] = [];
  return {
    artifact: buildRedactedUiPackageAdoptionValue(artifact, "", redactions),
    redactions,
    requiredExternalEvidence: uiPackageAdoptionRequiredExternalEvidence,
    safeForTracker: true,
  };
}

export const buildUiPackageAdoptionEvidenceDecision = (
  input: UiPackageAdoptionEvidenceInput,
): UiPackageAdoptionEvidenceDecision => {
  const missingCommands = missingFrom(input.commands, uiPackageAdoptionRuntimeCommands);
  const missingArtifacts = missingFrom(input.artifacts, uiPackageAdoptionArtifactPaths);
  const missingControls = missingFrom(input.controls, uiPackageAdoptionRuntimeControls);
  const missingEvidence = uiPackageAdoptionEvidenceFlags.filter((flag) => input.evidence?.[flag] !== true);
  const blockers = missingEvidence.map((flag) => uiPackageAdoptionEvidenceBlockers[flag]);

  return {
    status:
      missingCommands.length === 0 &&
      missingArtifacts.length === 0 &&
      missingControls.length === 0 &&
      missingEvidence.length === 0
        ? "complete"
        : "blocked",
    missingCommands,
    missingArtifacts,
    missingControls,
    missingEvidence,
    requiredCommands: uiPackageAdoptionRuntimeCommands,
    requiredArtifacts: uiPackageAdoptionArtifactPaths,
    requiredControls: uiPackageAdoptionRuntimeControls,
    requiredEvidence: uiPackageAdoptionEvidenceFlags,
    blockers,
  };
};

export const buildUiPackageAdoptionRunData = (
  input: UiPackageAdoptionRunRecordInput,
  decision: UiPackageAdoptionEvidenceDecision,
) => ({
  tenantId: input.tenantId,
  runId: input.runId,
  commitSha: input.commitSha,
  status: input.readinessStatus,
  commandMatrix: uiPackageAdoptionRuntimeMatrix,
  artifactManifest: decision.requiredArtifacts,
  primitiveAdoptionEvidenceCaptured:
    !decision.missingEvidence.includes("webAdoptionCompleted") &&
    !decision.missingEvidence.includes("dashboardAdoptionCompleted") &&
    !decision.missingEvidence.includes("exportedPrimitivesCovered"),
  formNavDialogEvidenceCaptured:
    !decision.missingEvidence.includes("formFieldAdoptionCompleted") &&
    !decision.missingEvidence.includes("navSurfaceAdoptionCompleted") &&
    !decision.missingEvidence.includes("dialogAdoptionCompleted"),
  accessibilityEvidenceCaptured: !decision.missingEvidence.includes("accessibilitySmokePassed"),
  keyboardFocusEvidenceCaptured: !decision.missingEvidence.includes("keyboardFocusSmokePassed"),
  visualSmokeEvidenceCaptured:
    !decision.missingEvidence.includes("storybookOrVisualSmokeConfigured") &&
    !decision.missingEvidence.includes("visualRegressionArtifactsCaptured"),
  buildSmokeEvidenceCaptured:
    !decision.missingEvidence.includes("webBuildPassed") &&
    !decision.missingEvidence.includes("dashboardBuildPassed") &&
    !decision.missingEvidence.includes("appSmokeTestsPassed"),
  designTokenDocsEvidenceCaptured: !decision.missingEvidence.includes("designTokensDocumented"),
  secretSafeArtifactsCaptured: !decision.missingEvidence.includes("secretSafeArtifactsCaptured"),
  styleRegressionReviewPath: input.styleRegressionReviewPath ?? "coverage/ui-style-regression-review.md",
  visualArtifactManifestPath: input.visualArtifactManifestPath ?? "coverage/ui-visual-regression-artifacts-redacted.json",
});

export const persistUiPackageAdoptionRun = async (
  repository: UiPackageAdoptionRunRepository,
  input: UiPackageAdoptionRunRecordInput,
  decision: UiPackageAdoptionEvidenceDecision,
) => {
  const data = buildUiPackageAdoptionRunData(input, decision);

  return repository.uiPackageAdoptionRun.upsert({
    where: { tenantId_runId: { tenantId: input.tenantId, runId: input.runId } },
    create: data,
    update: data,
  });
};

const uiPackageAdoptionPackageReadiness = buildUiPackageAdoptionEvidencePlan({
  packageScripts: ["test", "typecheck"],
  uiTypecheckPassed: false,
  uiTestsPassed: false,
  exportedPrimitivesCovered: true,
  webAdoptionCompleted: true,
  dashboardAdoptionCompleted: true,
  formFieldAdoptionCompleted: true,
  navSurfaceAdoptionCompleted: true,
  dialogAdoptionCompleted: true,
  accessibilitySmokePassed: true,
  keyboardFocusSmokePassed: true,
  storybookOrVisualSmokeConfigured: true,
  visualRegressionArtifactsCaptured: true,
  webBuildPassed: true,
  dashboardBuildPassed: true,
  appSmokeTestsPassed: true,
  noStyleRegressionAccepted: true,
  designTokensDocumented: true,
  secretSafeArtifactsCaptured: true,
});

export const uiPackageAdoptionRuntimeReadiness = {
  ...uiPackageAdoptionPackageReadiness,
  requiredCommands: uiPackageAdoptionRuntimeCommands,
  requiredControls: uiPackageAdoptionRuntimeControls,
  requiredEvidence: uiPackageAdoptionEvidenceFlags,
};
