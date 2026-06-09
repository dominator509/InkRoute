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
  "pnpm --filter @inkroute/web build",
  "pnpm --filter @inkroute/dashboard build",
  "web shared UI adoption smoke",
  "dashboard shared UI adoption smoke",
  "accessibility and keyboard focus smoke",
  "Storybook or visual smoke capture",
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

export const uiPackageAdoptionRuntimeReadiness = buildUiPackageAdoptionEvidencePlan({
  packageScripts: ["test", "typecheck"],
  uiTypecheckPassed: false,
  uiTestsPassed: false,
  exportedPrimitivesCovered: true,
  webAdoptionCompleted: false,
  dashboardAdoptionCompleted: false,
  formFieldAdoptionCompleted: false,
  navSurfaceAdoptionCompleted: false,
  dialogAdoptionCompleted: false,
  accessibilitySmokePassed: false,
  keyboardFocusSmokePassed: false,
  storybookOrVisualSmokeConfigured: false,
  visualRegressionArtifactsCaptured: false,
  webBuildPassed: false,
  dashboardBuildPassed: false,
  appSmokeTestsPassed: false,
  noStyleRegressionAccepted: false,
  designTokensDocumented: false,
  secretSafeArtifactsCaptured: false,
});
