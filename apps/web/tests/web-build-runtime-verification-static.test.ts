import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  webBuildRuntimeRunPersistenceContract,
  webBuildRuntimeVerificationArtifactPaths,
  webBuildRuntimeVerificationCommands,
  webBuildRuntimeVerificationMatrix,
} from "../lib/webBuildRuntimeVerification";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("web build/runtime verification contract", () => {
  const rootPackageJson = readRepoFile("package.json");
  const webPackageJson = readRepoFile("apps/web/package.json");
  const prismaRuntime = readRepoFile("packages/db/src/prisma.ts");
  const bookingRoute = readRepoFile("apps/web/app/api/public/[tenantSlug]/booking-requests/route.ts");
  const dashboardPrivacyRoute = readRepoFile("apps/dashboard/app/api/security/privacy-requests/route.ts");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const migration = readRepoFile("packages/db/prisma/migrations/20260609034900_add_web_build_runtime_runs/migration.sql");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins web build/runtime verification commands, matrix rows, and artifact paths", () => {
    expect(webBuildRuntimeVerificationCommands).toEqual([
      "pnpm db:generate",
      "pnpm --filter @inkroute/web typecheck",
      "pnpm --filter @inkroute/web build",
      "web browser smoke for public booking and content routes",
      "Prisma DB-backed booking route smoke",
      "local DB-unavailable fallback smoke",
    ]);
    expect(webBuildRuntimeVerificationMatrix.map((entry) => entry.id)).toEqual([
      "prisma-client-generation",
      "web-typecheck",
      "web-next-build",
      "browser-smoke",
      "fallback-and-exact-optional-review",
    ]);
    expect(webBuildRuntimeVerificationArtifactPaths).toContain("coverage/web-build-runtime-verification.json");
    expect(webBuildRuntimeVerificationArtifactPaths).toContain("coverage/web-build-next-build.txt");
    expect(webBuildRuntimeVerificationArtifactPaths).toContain("coverage/web-build-secret-safe-artifacts.json");
  });

  it("pins compile-unblocker source contracts without claiming live build proof", () => {
    expect(rootPackageJson).toContain('"db:generate"');
    expect(webPackageJson).toContain('"typecheck"');
    expect(webPackageJson).toContain('"build"');
    expect(prismaRuntime).toContain('dynamicImport("@prisma/client")');
    expect(prismaRuntime).toContain("PRISMA_CLIENT_UNAVAILABLE");
    expect(bookingRoute).toContain("isDatabaseUnavailable");
    expect(bookingRoute).toContain('resolvedTenant.source === "local-fallback"');
    expect(bookingRoute).toContain('persisted.booking.travelCityId ? { travelCityId: persisted.booking.travelCityId } : {}');
    expect(dashboardPrivacyRoute).toContain('...(details !== undefined ? { details } : {})');
    expect(dashboardPrivacyRoute).toContain('...(requestInput.details !== undefined ? { details: requestInput.details } : {})');
  });

  it("pins the WebBuildRuntimeRun persistence model and migration", () => {
    expect(webBuildRuntimeRunPersistenceContract).toEqual({
      prismaModel: "WebBuildRuntimeRun",
      tenantRelation: "webBuildRuntimeRuns",
      migration: "20260609034900_add_web_build_runtime_runs",
      storesRunId: true,
      storesCommitSha: true,
      storesReadinessStatus: true,
      storesCommandMatrix: true,
      storesArtifactManifest: true,
      storesPrismaClientEvidence: true,
      storesTypecheckEvidence: true,
      storesBuildEvidence: true,
      storesBrowserSmokeEvidence: true,
      storesFallbackEvidence: true,
      storesExactOptionalEvidence: true,
      storesSecretSafeArtifacts: true,
    });
    expect(prismaSchema).toContain("model WebBuildRuntimeRun");
    expect(prismaSchema).toContain("webBuildRuntimeRuns WebBuildRuntimeRun[]");
    expect(prismaSchema).toContain("typecheckEvidenceCaptured");
    expect(prismaSchema).toContain("browserSmokeEvidenceCaptured");
    expect(migration).toContain('CREATE TABLE "WebBuildRuntimeRun"');
    expect(migration).toContain('"commandMatrix" JSONB NOT NULL');
    expect(migration).toContain('"artifactManifest" JSONB NOT NULL');
    expect(migration).toContain('"WebBuildRuntimeRun_tenantId_runId_key"');
  });

  it("wires manifest and tracker evidence for GAP-027", () => {
    expect(unitManifest).toContain("unit-web-build-runtime-verification-static");
    expect(unitManifest).toContain("WebBuildRuntimeRun Prisma model and app row contract");
    expect(gapTracker).toContain("apps/web/lib/webBuildRuntimeVerification.ts");
    expect(gapTracker).toContain("WebBuildRuntimeRun Prisma model and app row contract");
  });
});
