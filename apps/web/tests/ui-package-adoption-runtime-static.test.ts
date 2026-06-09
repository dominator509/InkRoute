import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  uiPackageAdoptionArtifactPaths,
  uiPackageAdoptionRuntimeCommands,
  uiPackageAdoptionRuntimeMatrix,
  uiPackageAdoptionRuntimeReadiness,
  uiPackageAdoptionRunPersistenceContract,
} from "../lib/uiPackageAdoptionRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("UI package adoption runtime contract", () => {
  const uiPackageJson = readRepoFile("packages/ui/package.json");
  const uiExports = readRepoFile("packages/ui/src/index.ts");
  const uiReadiness = readRepoFile("packages/ui/src/readiness.ts");
  const uiTests = readRepoFile("packages/ui/tests/ui-contract.test.ts");
  const uiReadme = readRepoFile("packages/ui/README.md");
  const webHome = readRepoFile("apps/web/app/page.tsx");
  const dashboardPage = readRepoFile("apps/dashboard/app/page.tsx");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const uiPackageAdoptionRunMigration = readRepoFile("packages/db/prisma/migrations/20260609034000_add_ui_package_adoption_runs/migration.sql");

  it("pins UI package adoption commands, matrix rows, and artifact paths", () => {
    expect(uiPackageAdoptionRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/ui typecheck",
      "pnpm --filter @inkroute/ui test",
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/dashboard build",
      "web shared UI adoption smoke",
      "dashboard shared UI adoption smoke",
      "accessibility and keyboard focus smoke",
      "Storybook or visual smoke capture",
    ]);
    expect(uiPackageAdoptionRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "ui-package-gates",
      "export-contract",
      "web-dashboard-adoption",
      "form-nav-dialog-adoption",
      "accessibility-keyboard-focus",
      "storybook-visual-regression",
      "app-build-smoke-style-review",
      "token-docs-secret-safe-artifacts",
    ]);
    expect(uiPackageAdoptionArtifactPaths).toContain("coverage/ui-package-adoption-runtime.json");
    expect(uiPackageAdoptionArtifactPaths).toContain("coverage/ui-secret-safe-artifacts.json");
    expect(uiPackageAdoptionArtifactPaths).toContain("test-results/ui-package-adoption-runtime");
  });

  it("keeps UI package scripts, exports, readiness helper, tests, docs, and app surfaces visible", () => {
    expect(uiPackageJson).toContain('"typecheck"');
    expect(uiPackageJson).toContain('"test"');
    for (const exportedPrimitive of ["Surface", "SectionHeader", "Field", "FieldLabel", "FieldHint", "FieldError", "NavBar", "NavItem", "Dialog", "DialogPanel", "DialogTitle", "Input", "inkrouteTheme"]) {
      expect(uiExports).toContain(exportedPrimitive);
    }
    expect(uiReadiness).toContain("buildUiPackageAdoptionEvidencePlan");
    expect(uiTests).toContain("buildUiPackageAdoptionEvidencePlan");
    expect(uiReadme).toContain("InkRoute UI");
    expect(webHome).toContain("InkRoute");
    expect(dashboardPage.toLowerCase()).toContain("dashboard");
  });

  it("keeps UI package adoption blocked until app adoption, accessibility, visual, build, docs, and artifact proof exists", () => {
    expect(uiPackageAdoptionRuntimeReadiness.status).toBe("blocked");
    expect(uiPackageAdoptionRuntimeReadiness.missingScripts).toEqual([]);
    expect(uiPackageAdoptionRuntimeReadiness.requiredCommands).toEqual([...uiPackageAdoptionRuntimeCommands]);
    expect(uiPackageAdoptionRuntimeReadiness.requiredControls).toEqual([
      "Preserve existing app visual language while adopting shared primitives incrementally.",
      "Keep labels, hints, errors, dialogs, and navigation keyboard-accessible in app context.",
      "Capture visual evidence from seeded/demo-safe data only.",
      "Do not include secrets, tokens, raw PII, medical, payment, or private URLs in screenshots or visual reports.",
    ]);
    expect(uiPackageAdoptionRuntimeReadiness.requiredEvidence).toEqual([
      "UI package typecheck, test, and export-contract evidence",
      "web/dashboard primitive adoption evidence for forms, navigation, surfaces, and dialogs",
      "accessibility, keyboard, and focus-visible smoke evidence",
      "Storybook or visual smoke/regression evidence and style-regression review",
      "web/dashboard build and app smoke evidence after UI adoption",
      "design-token documentation and secret-safe visual artifact evidence",
    ]);
    expect(uiPackageAdoptionRuntimeReadiness.blockers).toContain(
      "Web app must adopt shared UI primitives on at least one production-relevant surface.",
    );
    expect(uiPackageAdoptionRuntimeReadiness.blockers).toContain(
      "Storybook or equivalent visual smoke coverage must be configured.",
    );
    expect(uiPackageAdoptionRuntimeReadiness.blockers).toContain(
      "UI screenshots, visual artifacts, and reports must be free of secrets, tokens, raw PII, medical, or payment data.",
    );
  });

  it("pins the UiPackageAdoptionRun persistence model and migration", () => {
    expect(uiPackageAdoptionRunPersistenceContract).toEqual({
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
    });
    expect(prismaSchema).toContain("model UiPackageAdoptionRun");
    expect(prismaSchema).toContain("uiPackageAdoptionRuns UiPackageAdoptionRun[]");
    expect(prismaSchema).toContain("primitiveAdoptionEvidenceCaptured");
    expect(prismaSchema).toContain("designTokenDocsEvidenceCaptured");
    expect(prismaSchema).toContain("secretSafeArtifactsCaptured");
    expect(uiPackageAdoptionRunMigration).toContain('CREATE TABLE "UiPackageAdoptionRun"');
    expect(uiPackageAdoptionRunMigration).toContain('"commandMatrix" JSONB NOT NULL');
    expect(uiPackageAdoptionRunMigration).toContain('"artifactManifest" JSONB NOT NULL');
    expect(uiPackageAdoptionRunMigration).toContain('"UiPackageAdoptionRun_tenantId_runId_key"');
  });

  it("wires CI, manifest, tracker, and artifacts without claiming app-wide UI adoption readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 1 UI package adoption runtime contracts");
    expect(ciWorkflow).toContain("ui-package-adoption-runtime-static.test.ts");
    expect(ciWorkflow).toContain("ui-package-adoption-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/ui-package-adoption-runtime.json");
    expect(unitManifest).toContain("unit-web-ui-package-adoption-runtime-static");
    expect(unitManifest).toContain("UiPackageAdoptionRun Prisma model and app row contract");
    expect(gapTracker).toContain("apps/web/lib/uiPackageAdoptionRuntime.ts");
    expect(gapTracker).toContain("UiPackageAdoptionRun Prisma model and app row contract");
    expect(gapTracker).toContain("live web/dashboard primitive adoption, form/nav/dialog coverage, accessibility/keyboard smoke, Storybook or visual smoke, app builds, app smoke tests, style-regression review, design-token documentation, and secret-safe visual artifacts remain open");
  });
});
