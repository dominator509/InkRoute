import { describe, expect, it } from "vitest";
import {
  buildDeploymentPlan,
  buildDeploymentPipelineReadinessPlan,
  buildDeploymentSteps,
  buildHandoffTasks,
  buildProductionLaunchChecklist,
  evaluateEnvironmentReadiness,
  maskEnvValue,
  providerOptions,
  summarizeLaunchChecklist,
} from "../src/index";

describe("deployment readiness helpers", () => {
  it("masks secret values without hiding public values", () => {
    expect(maskEnvValue("AUTH_SECRET", "super-secret-value")).toBe("su***ue");
    expect(maskEnvValue("AUTH_SECRET", "short")).toBe("******");
    expect(maskEnvValue("NEXT_PUBLIC_APP_URL", "https://artist.example.com")).toBe("https://artist.example.com");
    expect(maskEnvValue("DATABASE_URL", undefined)).toBe("<missing>");
  });

  it("blocks production when required secrets are placeholders", () => {
    const report = evaluateEnvironmentReadiness(
      {
        NODE_ENV: "production",
        NEXT_PUBLIC_APP_URL: "https://artist.example.com",
        DATABASE_URL: "postgresql://USER:PASSWORD@HOST:5432/inkroute",
      },
      "production",
      "2026-06-03T00:00:00.000Z",
    );

    expect(report.productionBlocked).toBe(true);
    expect(report.missingRequiredNames).toContain("DATABASE_URL");
    expect(report.missingRequiredNames).toContain("AUTH_SECRET");
  });

  it("blocks preview when preview-scoped required secrets are missing", () => {
    const report = evaluateEnvironmentReadiness(
      {
        NODE_ENV: "preview",
        NEXT_PUBLIC_APP_URL: "https://preview.artist.example.com",
        DATABASE_URL: "postgresql://real-user:real-password@db.internal:5432/inkroute",
      },
      "preview",
      "2026-06-03T00:00:00.000Z",
    );

    expect(report.productionBlocked).toBe(true);
    expect(report.missingRequiredNames).toContain("AUTH_SECRET");
    expect(report.results.find((result) => result.name === "DATABASE_URL")).toMatchObject({
      status: "pass",
      hasNonPlaceholderValue: true,
    });
  });

  it("summarizes production launch blockers", () => {
    const checklist = buildProductionLaunchChecklist();
    const summary = summarizeLaunchChecklist(checklist);

    expect(summary.itemCount).toBeGreaterThan(0);
    expect(summary.productionBlockingCount).toBeGreaterThan(0);
    expect(summary.blockerIds).toContain("launch-foundation-install");
    expect(summary.byStatus.blocked).toBeGreaterThan(0);
    expect(summary.byStatus.deployment_gated).toBeGreaterThan(0);
    expect(summary.byStatus.manual).toBeGreaterThan(0);
  });

  it("creates handoff tasks with verification commands", () => {
    const tasks = buildHandoffTasks();
    const codexTask = tasks.find((task) => task.target === "Codex");

    expect(codexTask?.verification).toContain("pnpm install");
    expect(codexTask?.gapIds).toContain("GAP-001");
  });

  it("builds a production-blocked deployment plan while providers are not configured", () => {
    const plan = buildDeploymentPlan("production");

    expect(plan.productionBlockers.length).toBeGreaterThan(0);
    expect(plan.summary).toContain("production-blocking");
    expect(plan.providers).toBe(providerOptions);
    expect(plan.steps.map((step) => step.id)).toContain("install-lockfile");
  });

  it("keeps deployment steps attached to evidence requirements and gap ids", () => {
    const steps = buildDeploymentSteps("production");

    expect(steps.every((step) => step.evidenceRequired.length > 0)).toBe(true);
    expect(steps.every((step) => step.gapIds.length > 0)).toBe(true);
    expect(steps.find((step) => step.id === "mobile-eas-build")).toMatchObject({
      surface: "mobile",
      status: "deployment_gated",
      blocksProduction: true,
    });
  });

  it("keeps provider options tied to setup evidence and gaps", () => {
    expect(providerOptions.every((provider) => provider.setupEvidenceRequired.length > 0)).toBe(true);
    expect(providerOptions.every((provider) => provider.gapIds.length > 0)).toBe(true);
    expect(providerOptions.map((provider) => provider.id)).toContain("github_actions");
  });

  it("summarizes deployment pipeline readiness across providers, secrets, previews, mobile, rollback, and launch evidence", () => {
    const plan = buildDeploymentPipelineReadinessPlan({
      providerProjectsConfigured: true,
      githubEnvironmentsConfigured: true,
      githubSecretsConfigured: false,
      vercelWebProjectConfigured: true,
      vercelDashboardProjectConfigured: false,
      previewDeploySucceeded: false,
      productionDryRunSucceeded: false,
      productionApprovalGateConfigured: false,
      databaseProviderConfigured: false,
      migrationDryRunSucceeded: false,
      backupRestoreDrillCompleted: false,
      storageProviderConfigured: false,
      mobileEasProjectConfigured: false,
      easPreviewBuildSucceeded: false,
      easNativeCredentialsConfigured: false,
      otaRollbackDrillCompleted: false,
      ciQualityGatesRequired: false,
      sentryReleaseUploadConfigured: false,
      environmentStrictCheckPassed: false,
      rollbackRunbookReviewed: false,
      launchEvidenceCollected: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.requiredCommands).toContain("pnpm deploy:check-env:strict");
    expect(plan.requiredCommands).toContain("eas build --profile preview");
    expect(plan.requiredEvidence).toContain("Preview web and dashboard deployment URLs with route smoke output.");
    expect(plan.approvalGates).toContain("Production GitHub environment requires human approval.");
    expect(plan.blockers).toContain("GitHub environment secrets must be configured without placeholder values.");
    expect(plan.blockers).toContain("EAS preview build must succeed for mobile.");
    expect(plan.blockers).toContain("Launch evidence packet must include URLs, command logs, provider screenshots, redacted secrets proof, and rollback evidence.");
  });
});
