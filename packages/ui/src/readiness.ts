export interface UiPackageAdoptionEvidenceInput {
  packageScripts: readonly string[];
  uiTypecheckPassed: boolean;
  uiTestsPassed: boolean;
  exportedPrimitivesCovered: boolean;
  webAdoptionCompleted: boolean;
  dashboardAdoptionCompleted: boolean;
  formFieldAdoptionCompleted: boolean;
  navSurfaceAdoptionCompleted: boolean;
  dialogAdoptionCompleted: boolean;
  accessibilitySmokePassed: boolean;
  keyboardFocusSmokePassed: boolean;
  storybookOrVisualSmokeConfigured: boolean;
  visualRegressionArtifactsCaptured: boolean;
  webBuildPassed: boolean;
  dashboardBuildPassed: boolean;
  appSmokeTestsPassed: boolean;
  noStyleRegressionAccepted: boolean;
  designTokensDocumented: boolean;
  secretSafeArtifactsCaptured: boolean;
}

export interface UiPackageAdoptionEvidencePlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof uiPackageAdoptionRequiredCommands;
  requiredEvidence: readonly UiPackageAdoptionRequiredEvidence[];
  requiredControls: typeof uiPackageAdoptionRequiredControls;
  blockers: readonly string[];
}

export const uiPackageAdoptionRequiredCommands = [
  "pnpm --filter @inkroute/ui typecheck",
  "pnpm --filter @inkroute/ui test",
  "pnpm --filter @inkroute/web build",
  "pnpm --filter @inkroute/dashboard build",
  "web shared UI adoption smoke",
  "dashboard shared UI adoption smoke",
  "accessibility and keyboard focus smoke",
  "Storybook or visual smoke capture",
] as const;

export const uiPackageAdoptionRequiredControls = [
  "Preserve existing app visual language while adopting shared primitives incrementally.",
  "Keep labels, hints, errors, dialogs, and navigation keyboard-accessible in app context.",
  "Capture visual evidence from seeded/demo-safe data only.",
  "Do not include secrets, tokens, raw PII, medical, payment, or private URLs in screenshots or visual reports.",
] as const;

export const uiPackageAdoptionRequiredEvidence = [
  "UI package typecheck, test, and export-contract evidence",
  "web/dashboard primitive adoption evidence for forms, navigation, surfaces, and dialogs",
  "accessibility, keyboard, and focus-visible smoke evidence",
  "Storybook or visual smoke/regression evidence and style-regression review",
  "web/dashboard build and app smoke evidence after UI adoption",
  "design-token documentation and secret-safe visual artifact evidence",
] as const;

export type UiPackageAdoptionRequiredEvidence = (typeof uiPackageAdoptionRequiredEvidence)[number];

export function buildUiPackageAdoptionEvidencePlan(input: UiPackageAdoptionEvidenceInput): UiPackageAdoptionEvidencePlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: UiPackageAdoptionRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`Missing @inkroute/ui ${script} script.`);
  if (!input.uiTypecheckPassed) blockers.push("@inkroute/ui typecheck must pass before UI package adoption is ready.");
  if (!input.uiTestsPassed) blockers.push("@inkroute/ui tests must pass before UI package adoption is ready.");
  if (!input.exportedPrimitivesCovered) blockers.push("Shared UI primitive export contract must cover tokens, surfaces, fields, navigation, dialogs, and inputs.");
  if (!input.webAdoptionCompleted) blockers.push("Web app must adopt shared UI primitives on at least one production-relevant surface.");
  if (!input.dashboardAdoptionCompleted) blockers.push("Dashboard app must adopt shared UI primitives on at least one production-relevant surface.");
  if (!input.formFieldAdoptionCompleted) blockers.push("Form fields must adopt shared label, hint, error, and input composition.");
  if (!input.navSurfaceAdoptionCompleted) blockers.push("Navigation and surface primitives must be adopted in app context.");
  if (!input.dialogAdoptionCompleted) blockers.push("Dialog primitives must be adopted or smoke-tested with accessible structure.");
  if (!input.accessibilitySmokePassed) blockers.push("Accessibility smoke must pass for shared UI adoption surfaces.");
  if (!input.keyboardFocusSmokePassed) blockers.push("Keyboard and focus-visible smoke must pass for shared UI adoption surfaces.");
  if (!input.storybookOrVisualSmokeConfigured) blockers.push("Storybook or equivalent visual smoke coverage must be configured.");
  if (!input.visualRegressionArtifactsCaptured) blockers.push("Visual smoke or regression artifacts must be captured.");
  if (!input.webBuildPassed) blockers.push("@inkroute/web build must pass after UI primitive adoption.");
  if (!input.dashboardBuildPassed) blockers.push("@inkroute/dashboard build must pass after UI primitive adoption.");
  if (!input.appSmokeTestsPassed) blockers.push("Web/dashboard app smoke tests must pass after UI primitive adoption.");
  if (!input.noStyleRegressionAccepted) blockers.push("UI adoption must preserve existing app visual language without unreviewed style regressions.");
  if (!input.designTokensDocumented) blockers.push("Design tokens and primitive usage must be documented.");
  if (!input.secretSafeArtifactsCaptured) blockers.push("UI screenshots, visual artifacts, and reports must be free of secrets, tokens, raw PII, medical, or payment data.");

  if (!input.uiTypecheckPassed || !input.uiTestsPassed || !input.exportedPrimitivesCovered) {
    requiredEvidence.push(uiPackageAdoptionRequiredEvidence[0]);
  }
  if (!input.webAdoptionCompleted || !input.dashboardAdoptionCompleted || !input.formFieldAdoptionCompleted || !input.navSurfaceAdoptionCompleted || !input.dialogAdoptionCompleted) {
    requiredEvidence.push(uiPackageAdoptionRequiredEvidence[1]);
  }
  if (!input.accessibilitySmokePassed || !input.keyboardFocusSmokePassed) {
    requiredEvidence.push(uiPackageAdoptionRequiredEvidence[2]);
  }
  if (!input.storybookOrVisualSmokeConfigured || !input.visualRegressionArtifactsCaptured || !input.noStyleRegressionAccepted) {
    requiredEvidence.push(uiPackageAdoptionRequiredEvidence[3]);
  }
  if (!input.webBuildPassed || !input.dashboardBuildPassed || !input.appSmokeTestsPassed) {
    requiredEvidence.push(uiPackageAdoptionRequiredEvidence[4]);
  }
  if (!input.designTokensDocumented || !input.secretSafeArtifactsCaptured) {
    requiredEvidence.push(uiPackageAdoptionRequiredEvidence[5]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: uiPackageAdoptionRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === uiPackageAdoptionRequiredEvidence.length
        ? uiPackageAdoptionRequiredEvidence
        : requiredEvidence,
    requiredControls: uiPackageAdoptionRequiredControls,
    blockers,
  };
}
