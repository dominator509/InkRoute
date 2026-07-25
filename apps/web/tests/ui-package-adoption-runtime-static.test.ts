import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildRedactedUiPackageAdoptionArtifact,
  buildUiPackageAdoptionArtifactReview,
  buildUiPackageAdoptionEvidenceDecision,
  buildUiPackageAdoptionExecutionPlan,
  buildUiPackageAdoptionRunData,
  persistUiPackageAdoptionRun,
  uiPackageAdoptionArtifactPaths,
  uiPackageAdoptionEvidenceFlags,
  uiPackageAdoptionExternalArtifacts,
  uiPackageAdoptionExternalCommands,
  uiPackageAdoptionExecutionPolicy,
  uiPackageAdoptionRequiredExternalEvidence,
  uiPackageAdoptionRuntimeCommands,
  uiPackageAdoptionRuntimeControls,
  uiPackageAdoptionRuntimeMatrix,
  uiPackageAdoptionRuntimeProofFiles,
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
  const rootPackageJson = readRepoFile("package.json");
  const adoptionEvidenceWriter = readRepoFile("scripts/ui/write-ui-package-adoption-evidence.mjs");
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
    ]);
    expect(uiPackageAdoptionRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "ui-package-gates",
      "export-contract",
      "local-adoption-evidence",
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

  it("pins UI package adoption runtime control helper identity", () => {
    const decision = buildUiPackageAdoptionEvidenceDecision({
      commands: uiPackageAdoptionRuntimeCommands,
      artifacts: uiPackageAdoptionArtifactPaths,
      controls: uiPackageAdoptionRuntimeControls,
      evidence: Object.fromEntries(uiPackageAdoptionEvidenceFlags.map((flag) => [flag, true])) as Record<
        (typeof uiPackageAdoptionEvidenceFlags)[number],
        true
      >,
    });

    expect(decision.requiredControls).toBe(uiPackageAdoptionRuntimeControls);
    expect(gapTracker).toContain("uiPackageAdoptionRuntimeControls");
  });

  it("keeps UI package scripts, exports, readiness helper, tests, docs, and app surfaces visible", () => {
    expect(uiPackageJson).toContain('"typecheck"');
    expect(uiPackageJson).toContain('"test"');
    for (const exportedPrimitive of ["Surface", "SectionHeader", "Field", "FieldLabel", "FieldHint", "FieldError", "NavBar", "NavItem", "Dialog", "DialogPanel", "DialogTitle", "Input", "Textarea", "inkrouteTheme"]) {
      expect(uiExports).toContain(exportedPrimitive);
    }
    expect(uiReadiness).toContain("buildUiPackageAdoptionEvidencePlan");
    expect(uiTests).toContain("buildUiPackageAdoptionEvidencePlan");
    expect(uiReadme).toContain("InkRoute UI");
    expect(rootPackageJson).toContain("ui:adoption-evidence");
    expect(adoptionEvidenceWriter).toContain("ui-storybook-visual-smoke.json");
    expect(adoptionEvidenceWriter).toContain("ui-accessibility-smoke.json");
    expect(adoptionEvidenceWriter).toContain("ui-keyboard-focus-smoke.json");
    expect(adoptionEvidenceWriter).toContain("ui-web-build.txt");
    expect(adoptionEvidenceWriter).toContain("ui-dashboard-build.txt");
    expect(adoptionEvidenceWriter).toContain("ui-app-smoke-tests.json");
    expect(adoptionEvidenceWriter).toContain("ui-style-regression-review.md");
    expect(adoptionEvidenceWriter).toContain("ui-design-token-docs.json");
    expect(adoptionEvidenceWriter).toContain("containsSecrets: false");
    expect(webHome).toContain("InkRoute");
    expect(webHome).toContain('from "@inkroute/ui"');
    expect(webHome).toContain("<Surface");
    expect(webHome).toContain("<NavBar");
    expect(webHome).toContain("<Field");
    expect(webHome).toContain("<Input");
    expect(webHome).toContain("<Textarea");
    expect(webHome).toContain("<Dialog");
    expect(dashboardPage.toLowerCase()).toContain("dashboard");
    expect(dashboardPage).toContain('from "@inkroute/ui"');
    expect(dashboardPage).toContain("<Surface");
    expect(dashboardPage).toContain("<NavBar");
    expect(dashboardPage).toContain("<Field");
    expect(dashboardPage).toContain("<Input");
    expect(dashboardPage).toContain("<Dialog");
  });

  it("keeps UI package adoption blocked until app adoption, accessibility, visual, build, docs, and artifact proof exists", () => {
    expect(uiPackageAdoptionRuntimeReadiness.status).toBe("blocked");
    expect(uiPackageAdoptionRuntimeReadiness.missingScripts).toEqual([]);
    expect(uiPackageAdoptionRuntimeReadiness.requiredCommands).toBe(uiPackageAdoptionRuntimeCommands);
    expect(uiPackageAdoptionRuntimeReadiness.requiredControls).toBe(uiPackageAdoptionRuntimeControls);
    expect(uiPackageAdoptionRuntimeReadiness.requiredEvidence).toBe(uiPackageAdoptionEvidenceFlags);
    expect(uiPackageAdoptionRuntimeReadiness.missingEvidence).not.toContain("webAdoptionCompleted");
    expect(uiPackageAdoptionRuntimeReadiness.missingEvidence).not.toContain("dashboardAdoptionCompleted");
    expect(uiPackageAdoptionRuntimeReadiness.missingEvidence).not.toContain("formFieldAdoptionCompleted");
    expect(uiPackageAdoptionRuntimeReadiness.missingEvidence).not.toContain("navSurfaceAdoptionCompleted");
    expect(uiPackageAdoptionRuntimeReadiness.missingEvidence).not.toContain("dialogAdoptionCompleted");
    expect(uiPackageAdoptionRuntimeReadiness.missingEvidence).not.toContain("accessibilitySmokePassed");
    expect(uiPackageAdoptionRuntimeReadiness.missingEvidence).not.toContain("keyboardFocusSmokePassed");
    expect(uiPackageAdoptionRuntimeReadiness.missingEvidence).not.toContain("storybookOrVisualSmokeConfigured");
    expect(uiPackageAdoptionRuntimeReadiness.missingEvidence).not.toContain("visualRegressionArtifactsCaptured");
    expect(uiPackageAdoptionRuntimeReadiness.missingEvidence).not.toContain("webBuildPassed");
    expect(uiPackageAdoptionRuntimeReadiness.missingEvidence).not.toContain("dashboardBuildPassed");
    expect(uiPackageAdoptionRuntimeReadiness.missingEvidence).not.toContain("appSmokeTestsPassed");
    expect(uiPackageAdoptionRuntimeReadiness.missingEvidence).not.toContain("noStyleRegressionAccepted");
    expect(uiPackageAdoptionRuntimeReadiness.missingEvidence).not.toContain("designTokensDocumented");
    expect(uiPackageAdoptionRuntimeReadiness.missingEvidence).not.toContain("secretSafeArtifactsCaptured");
    expect(uiPackageAdoptionRuntimeReadiness.blockers).not.toContain(
      "Web app must adopt shared UI primitives on at least one production-relevant surface.",
    );
    expect(uiPackageAdoptionRuntimeReadiness.blockers).not.toContain(
      "Dashboard app must adopt shared UI primitives on at least one production-relevant surface.",
    );
    expect(uiPackageAdoptionRuntimeReadiness.blockers).not.toContain("Form field shared primitive adoption must be verified.");
    expect(uiPackageAdoptionRuntimeReadiness.blockers).not.toContain("Navigation and surface shared primitive adoption must be verified.");
    expect(uiPackageAdoptionRuntimeReadiness.blockers).not.toContain("Dialog shared primitive adoption must be verified.");
    expect(uiPackageAdoptionRuntimeReadiness.blockers).not.toContain("Accessibility smoke must pass in app context.");
    expect(uiPackageAdoptionRuntimeReadiness.blockers).not.toContain("Keyboard and focus smoke must pass in app context.");
    expect(uiPackageAdoptionRuntimeReadiness.blockers).not.toContain("Storybook or equivalent visual smoke coverage must be configured.");
    expect(uiPackageAdoptionRuntimeReadiness.blockers).not.toContain("Visual regression artifacts must be captured.");
    expect(uiPackageAdoptionRuntimeReadiness.blockers).not.toContain("Web build must pass after UI package adoption.");
    expect(uiPackageAdoptionRuntimeReadiness.blockers).not.toContain("Dashboard build must pass after UI package adoption.");
    expect(uiPackageAdoptionRuntimeReadiness.blockers).not.toContain("App smoke tests must pass after UI package adoption.");
    expect(uiPackageAdoptionRuntimeReadiness.blockers).not.toContain("Style-regression review must accept the shared primitive adoption.");
    expect(uiPackageAdoptionRuntimeReadiness.blockers).not.toContain("Design-token usage must be documented.");
    expect(uiPackageAdoptionRuntimeReadiness.blockers).not.toContain("UI screenshots, visual artifacts, and reports must be free of secrets, tokens, raw PII, medical, or payment data.");
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
    expect(buildUiPackageAdoptionRunData).toBeTypeOf("function");
    expect(persistUiPackageAdoptionRun).toBeTypeOf("function");
    expect(readRepoFile("apps/web/lib/uiPackageAdoptionRuntime.ts")).toContain("repository.uiPackageAdoptionRun.upsert");
  });

  it("blocks UI package adoption completion when app adoption, accessibility, visual, or artifact evidence is missing", () => {
    const decision = buildUiPackageAdoptionEvidenceDecision({
      commands: ["pnpm --filter @inkroute/ui typecheck"],
      artifacts: ["coverage/ui-package-typecheck.txt"],
      controls: ["preserve-existing-app-visual-language-while-adopting-shared-primitives"],
      evidence: {
        uiTypecheckPassed: true,
        exportedPrimitivesCovered: true,
      },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingCommands).toContain("Storybook or visual smoke capture");
    expect(decision.missingArtifacts).toContain("coverage/ui-secret-safe-artifacts.json");
    expect(decision.missingControls).toContain("secret-pii-medical-payment-safe-visual-artifacts");
    expect(decision.missingEvidence).toContain("webAdoptionCompleted");
    expect(decision.missingEvidence).toContain("storybookOrVisualSmokeConfigured");
    expect(decision.blockers).toContain(
      "Web app must adopt shared UI primitives on at least one production-relevant surface.",
    );
    expect(decision.blockers).toContain("Storybook or equivalent visual smoke coverage must be configured.");
  });

  it("completes UI package adoption only when every command, artifact, control, and evidence flag is present", () => {
    const completeEvidence = Object.fromEntries(uiPackageAdoptionEvidenceFlags.map((flag) => [flag, true]));
    const decision = buildUiPackageAdoptionEvidenceDecision({
      commands: uiPackageAdoptionRuntimeCommands,
      artifacts: uiPackageAdoptionArtifactPaths,
      controls: uiPackageAdoptionRuntimeControls,
      evidence: completeEvidence,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingCommands).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingControls).toEqual([]);
    expect(decision.missingEvidence).toEqual([]);
    expect(decision.requiredEvidence).toBe(uiPackageAdoptionEvidenceFlags);
  });

  it("keeps UI package adoption execution classified, redacted, and persistence-gated", () => {
    const executionPlan = buildUiPackageAdoptionExecutionPlan();
    expect(executionPlan.localCommands).toBe(uiPackageAdoptionRuntimeCommands);
    expect(executionPlan.externalCommands).toBe(uiPackageAdoptionExternalCommands);
    expect(executionPlan.externalCommands).toEqual(["provider-backed persistUiPackageAdoptionRun execution proof"]);
    expect(executionPlan.localArtifacts).toBe(uiPackageAdoptionArtifactPaths);
    expect(executionPlan.externalArtifacts).toBe(uiPackageAdoptionExternalArtifacts);
    expect(executionPlan.externalArtifacts).toEqual(["provider-backed UiPackageAdoptionRun persistence proof"]);
    expect(executionPlan.commandExecutionAllowed).toBe(false);
    expect(executionPlan.visualCaptureExecutionAllowed).toBe(false);
    expect(executionPlan.databaseExecutionAllowed).toBe(false);
    expect(executionPlan.providerPersistenceExecutionAllowed).toBe(false);
    expect(executionPlan.executionPolicy).toBe(uiPackageAdoptionExecutionPolicy);
    expect(executionPlan.executionPolicy).toEqual({
      codexMayClassifyStaticUiPackageAdoptionReadiness: true,
      visualEvidenceRequiredForClosure: true,
      providerDatabaseRequiredForPersistence: true,
      secretSafeVisualArtifactsRequiredForClosure: true,
    });
    expect(executionPlan.requiredExternalEvidence).toBe(uiPackageAdoptionRequiredExternalEvidence);
    expect(executionPlan.requiredExternalEvidence).toContain(
      "Provider-backed UiPackageAdoptionRun persistence row captured through persistUiPackageAdoptionRun.",
    );

    const artifact = {
      visualArtifactId: "ui_visual_artifact_1234567890abcdefghijklmnopqrstuvwxyz",
      screenshotUrl: "https://artifacts.example.com/ui/client@example.com.png",
      clientEmail: "client@example.com",
      clientPhone: "+1 555 222 1212",
      repositorySelector: "repo:dominator509/InkRoute",
      branchSelector: "branch:production/ui-adoption",
      pullRequestSelector: "pr_ui_adoption",
      reviewerHandle: "reviewer_ui_owner",
      codeownerSelector: "CODEOWNER:design-system-team",
      nested: {
        databaseUrl: "postgres://inkroute:secret@db.example.com:5432/inkroute",
        publicSummary: "UI package adoption visual evidence captured",
      },
    };
    const redactedOnly = buildRedactedUiPackageAdoptionArtifact(artifact);
    const review = buildUiPackageAdoptionArtifactReview(artifact);
    const serialized = JSON.stringify(review.artifact);

    expect(JSON.stringify(redactedOnly)).not.toContain("client@example.com");
    expect(serialized).not.toContain("ui_visual_artifact_1234567890abcdefghijklmnopqrstuvwxyz");
    expect(serialized).not.toContain("https://artifacts.example.com/ui/client@example.com.png");
    expect(serialized).not.toContain("+1 555 222 1212");
    expect(serialized).not.toContain("repo:dominator509/InkRoute");
    expect(serialized).not.toContain("branch:production/ui-adoption");
    expect(serialized).not.toContain("pr_ui_adoption");
    expect(serialized).not.toContain("reviewer_ui_owner");
    expect(serialized).not.toContain("CODEOWNER:design-system-team");
    expect(serialized).not.toContain("postgres://inkroute:secret@db.example.com:5432/inkroute");
    expect(review.redactions).toEqual([
      "visualArtifactId",
      "screenshotUrl",
      "clientEmail",
      "clientPhone",
      "repositorySelector",
      "branchSelector",
      "pullRequestSelector",
      "reviewerHandle",
      "codeownerSelector",
      "nested.databaseUrl",
    ]);
    expect(review.safeForTracker).toBe(true);
    expect(review.requiredExternalEvidence).toBe(uiPackageAdoptionRequiredExternalEvidence);
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
    expect(gapTracker).toContain("web/dashboard Surface, form, navigation, and dialog primitive adoption");
    expect(gapTracker).toContain("local accessibility/keyboard, build transcript, app smoke, style-review, visual/token");
    expect(gapTracker).toContain("provider-backed UiPackageAdoptionRun upsert seam is source-wired");

    expect(gapTracker).toContain("proof inventory");
    expect(gapTracker).toContain("buildUiPackageAdoptionExecutionPlan");
    expect(gapTracker).toContain("uiPackageAdoptionRuntimeCommands/uiPackageAdoptionExternalCommands");
    expect(gapTracker).toContain("uiPackageAdoptionExecutionPolicy");
    expect(gapTracker).toContain("uiPackageAdoptionRequiredExternalEvidence");
    expect(gapTracker).toContain("buildRedactedUiPackageAdoptionArtifact");
    expect(gapTracker).toContain("buildUiPackageAdoptionArtifactReview");
    expect(gapTracker).toContain("GAP-016 UI package adoption artifact hardening now redacts repository/branch/PR/reviewer/CODEOWNER selectors");
  });

  it("pins current UI package adoption proof files for GAP-016", () => {
    expect(uiPackageAdoptionRuntimeProofFiles).toContain("packages/ui/package.json");
    expect(uiPackageAdoptionRuntimeProofFiles).toContain("apps/dashboard/package.json");
    expect(uiPackageAdoptionRuntimeProofFiles).toContain("apps/web/package.json");
    expect(uiPackageAdoptionRuntimeProofFiles).toContain("apps/web/app/page.tsx");
    expect(uiPackageAdoptionRuntimeProofFiles).toContain("apps/dashboard/app/page.tsx");
    expect(uiPackageAdoptionRuntimeProofFiles).toContain("apps/web/lib/uiPackageAdoptionRuntime.ts");
    expect(uiPackageAdoptionRuntimeProofFiles).toContain("scripts/ui/write-ui-package-adoption-evidence.mjs");
    expect(uiPackageAdoptionRuntimeProofFiles).toContain("apps/web/tests/ui-package-adoption-runtime-static.test.ts");
    for (const proofFile of uiPackageAdoptionRuntimeProofFiles) {
      expect(readRepoFile(proofFile).length).toBeGreaterThan(0);
    }
  });
});


