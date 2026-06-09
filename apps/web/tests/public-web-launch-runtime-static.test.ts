import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  publicWebLaunchArtifactPaths,
  publicWebLaunchReadinessAreas,
  publicWebLaunchRunPersistenceContract,
  publicWebLaunchRuntimeCommands,
  publicWebLaunchRuntimeMatrix,
  publicWebLaunchRuntimeReadiness,
} from "../lib/publicWebLaunchRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("public web launch runtime contract", () => {
  const webPackageJson = readRepoFile("apps/web/package.json");
  const seoSource = readRepoFile("packages/seo/src/index.ts");
  const seoTests = readRepoFile("packages/seo/tests/seo-engine.test.ts");
  const localRuntimeState = readRepoFile("apps/web/lib/localRuntimeState.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const publicWebLaunchMigration = readRepoFile(
    "packages/db/prisma/migrations/20260609033000_add_public_web_launch_runs/migration.sql",
  );
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins public web launch commands, readiness areas, matrix rows, and artifacts", () => {
    expect(publicWebLaunchRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/web typecheck",
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/web test",
      "pnpm test:e2e --project=web-chromium",
      "pnpm test:e2e --project=web-mobile",
      "axe accessibility audit for public routes",
      "Lighthouse performance audit for public launch routes",
      "runtime sitemap/robots/JSON-LD/canonical validation",
      "GitHub Actions public web launch evidence job",
    ]);
    expect(publicWebLaunchReadinessAreas).toContain("tenant-scoped-persistence");
    expect(publicWebLaunchReadinessAreas).toContain("secret-safe-launch-artifacts");
    expect(publicWebLaunchRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "web-typecheck",
      "web-build",
      "web-tests",
      "route-smoke",
      "desktop-playwright",
      "mobile-playwright",
      "accessibility-performance",
      "provider-db-routes",
      "media-derivatives",
      "runtime-seo-output",
      "legal-route-review",
      "ci-secret-safe-artifacts",
    ]);
    expect(publicWebLaunchArtifactPaths).toContain("coverage/public-web-launch-runtime.json");
    expect(publicWebLaunchArtifactPaths).toContain("test-results/public-web-launch-runtime");
  });

  it("pins the PublicWebLaunchRun persistence model and migration", () => {
    expect(publicWebLaunchRunPersistenceContract.model).toBe("PublicWebLaunchRun");
    expect(publicWebLaunchRunPersistenceContract.tenantRelation).toBe("publicWebLaunchRuns");
    expect(publicWebLaunchRunPersistenceContract.migration).toBe("20260609033000_add_public_web_launch_runs");
    expect(publicWebLaunchRunPersistenceContract.jsonFields).toEqual([
      "commandMatrix",
      "readinessAreaManifest",
      "artifactManifest",
      "providerRouteManifest",
      "runtimeSeoManifest",
      "legalRouteReviewManifest",
    ]);
    expect(publicWebLaunchRunPersistenceContract.evidenceBooleans).toContain("webBuildPassed");
    expect(publicWebLaunchRunPersistenceContract.evidenceBooleans).toContain("jsonLdRuntimeVerified");
    expect(publicWebLaunchRunPersistenceContract.evidenceBooleans).toContain("launchArtifactsSecretSafe");
    expect(publicWebLaunchRunPersistenceContract.artifactFields).toContain("runtimeSeoArtifactPath");
    expect(publicWebLaunchRunPersistenceContract.artifactFields).toContain("ciRunUrl");
    expect(prismaSchema).toContain("publicWebLaunchRuns PublicWebLaunchRun[]");
    expect(prismaSchema).toContain("model PublicWebLaunchRun");
    expect(prismaSchema).toContain("runtimeSeoManifest");
    expect(prismaSchema).toContain("localRuntimeFallbackDisabledForProduction");
    expect(prismaSchema).toContain("@@unique([tenantId, runId])");
    expect(publicWebLaunchMigration).toContain('CREATE TABLE "PublicWebLaunchRun"');
    expect(publicWebLaunchMigration).toContain('"runtimeSeoManifest" JSONB NOT NULL');
    expect(publicWebLaunchMigration).toContain('"launchArtifactsSecretSafe" BOOLEAN NOT NULL DEFAULT false');
    expect(publicWebLaunchMigration).toContain('CREATE UNIQUE INDEX "PublicWebLaunchRun_tenantId_runId_key"');
  });

  it("keeps web package scripts, SEO helper tests, and local-runtime boundary wired", () => {
    expect(webPackageJson).toContain('"typecheck"');
    expect(webPackageJson).toContain('"build"');
    expect(webPackageJson).toContain('"test"');
    expect(seoSource).toContain("buildPublicWebLaunchEvidencePlan");
    expect(seoTests).toContain("buildPublicWebLaunchEvidencePlan");
    expect(localRuntimeState).toContain("local");
  });

  it("keeps public launch blockers explicit until runtime/provider/browser evidence exists", () => {
    expect(publicWebLaunchRuntimeReadiness.status).toBe("blocked");
    expect(publicWebLaunchRuntimeReadiness.missingScripts).toEqual([]);
    expect(publicWebLaunchRuntimeReadiness.requiredCommands).toEqual([...publicWebLaunchRuntimeCommands]);
    expect(publicWebLaunchRuntimeReadiness.requiredEvidence).toContain(
      "web typecheck, build, and route smoke output",
    );
    expect(publicWebLaunchRuntimeReadiness.requiredEvidence).toContain(
      "tenant-scoped persistence, provider-backed route, and production local-runtime fallback evidence",
    );
    expect(publicWebLaunchRuntimeReadiness.blockers).toContain("@inkroute/web build must pass.");
    expect(publicWebLaunchRuntimeReadiness.blockers).toContain(
      "Public API routes must use tenant-scoped persistence instead of local runtime state in production.",
    );
  });

  it("wires CI, manifest, tracker, and artifacts without claiming launch readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 3 public web launch runtime contracts");
    expect(ciWorkflow).toContain("public-web-launch-runtime-static.test.ts");
    expect(ciWorkflow).toContain("public-web-launch-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-public-web-launch-runtime-static");
    expect(unitManifest).toContain("PublicWebLaunchRun Prisma model and app row contract");
    expect(gapTracker).toContain("PublicWebLaunchRun");
    expect(gapTracker).toContain("apps/web/lib/publicWebLaunchRuntime.ts");
    expect(gapTracker).toContain("live web typecheck/build/test, route smoke, Playwright, axe/Lighthouse, provider/database route verification, real media derivatives, runtime SEO validation, legal-route review, CI evidence, and secret-safe launch artifacts remain open");
  });
});
