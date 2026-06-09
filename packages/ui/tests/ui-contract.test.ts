import { describe, expect, it } from "vitest";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Field,
  FieldError,
  FieldHint,
  FieldLabel,
  NavBar,
  NavItem,
  SectionHeader,
  Surface,
  buildUiPackageAdoptionEvidencePlan,
  inkrouteTheme,
} from "../src/index";

describe("ui design-system contract", () => {
  it("exports accessible layout, field, nav, dialog, and token primitives", () => {
    expect(typeof Surface).toBe("function");
    expect(typeof SectionHeader).toBe("function");
    expect(typeof Field).toBe("function");
    expect(typeof FieldLabel).toBe("function");
    expect(typeof FieldHint).toBe("function");
    expect(typeof FieldError).toBe("function");
    expect(typeof NavBar).toBe("function");
    expect(typeof NavItem).toBe("function");
    expect(typeof Dialog).toBe("function");
    expect(typeof DialogPanel).toBe("function");
    expect(typeof DialogTitle).toBe("function");
    expect(inkrouteTheme.focusRing).toContain("focus-visible");
  });

  it("summarizes UI package adoption evidence across package checks, app adoption, visual smoke, accessibility, builds, and artifacts", () => {
    const plan = buildUiPackageAdoptionEvidencePlan({
      packageScripts: ["test", "typecheck"],
      uiTypecheckPassed: true,
      uiTestsPassed: true,
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

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
    expect(plan.requiredCommands).toContain("Storybook or visual smoke capture");
    expect(plan.requiredControls).toContain("Preserve existing app visual language while adopting shared primitives incrementally.");
  });

  it("blocks UI package adoption evidence until package checks, app adoption, accessibility, visual smoke, builds, documentation, and safe artifacts exist", () => {
    const plan = buildUiPackageAdoptionEvidencePlan({
      packageScripts: ["test"],
      uiTypecheckPassed: false,
      uiTestsPassed: true,
      exportedPrimitivesCovered: false,
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

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredEvidence).toEqual([
      "UI package typecheck, test, and export-contract evidence",
      "web/dashboard primitive adoption evidence for forms, navigation, surfaces, and dialogs",
      "accessibility, keyboard, and focus-visible smoke evidence",
      "Storybook or visual smoke/regression evidence and style-regression review",
      "web/dashboard build and app smoke evidence after UI adoption",
      "design-token documentation and secret-safe visual artifact evidence",
    ]);
    expect(plan.blockers).toContain("Web app must adopt shared UI primitives on at least one production-relevant surface.");
    expect(plan.blockers).toContain("Storybook or equivalent visual smoke coverage must be configured.");
    expect(plan.blockers).toContain("UI screenshots, visual artifacts, and reports must be free of secrets, tokens, raw PII, medical, or payment data.");
  });
});
