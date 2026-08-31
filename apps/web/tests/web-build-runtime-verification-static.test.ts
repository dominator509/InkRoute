import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildRedactedWebBuildRuntimeVerificationArtifact,
  buildWebBuildRuntimeVerificationArtifactReview,
  buildWebBuildRuntimeRunData,
  buildWebBuildRuntimeVerificationEvidenceDecision,
  buildWebBuildRuntimeVerificationExecutionPlan,
  persistWebBuildRuntimeRun,
  webBuildRuntimeRunPersistenceContract,
  webBuildRuntimeVerificationEvidenceFlags,
  webBuildRuntimeVerificationExecutionPolicy,
  webBuildRuntimeVerificationExternalCommands,
  webBuildRuntimeVerificationArtifactPaths,
  webBuildRuntimeVerificationCommands,
  webBuildRuntimeVerificationLocalCommands,
  webBuildRuntimeVerificationMatrix,
  webBuildRuntimeVerificationProofFiles,
  webBuildRuntimeVerificationRequiredExternalEvidence,
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
    const runData = buildWebBuildRuntimeRunData({
      tenantId: "tenant_static",
      runId: "web_build_static",
      commitSha: "abc123",
      status: "blocked",
      commands: ["pnpm --filter @inkroute/web typecheck"],
      artifacts: ["coverage/web-build-typecheck.txt"],
      prismaClientEvidenceCaptured: true,
      typecheckEvidenceCaptured: false,
      buildEvidenceCaptured: false,
      browserSmokeEvidenceCaptured: false,
      fallbackEvidenceCaptured: true,
      exactOptionalEvidenceCaptured: true,
      secretSafeArtifactsCaptured: true,
      typecheckOutputPath: "coverage/web-build-typecheck.txt",
      buildOutputPath: "coverage/web-build-next-build.txt",
    });

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
    expect(runData).toMatchObject({
      tenantId: "tenant_static",
      runId: "web_build_static",
      commitSha: "abc123",
      status: "blocked",
      commandMatrix: ["pnpm --filter @inkroute/web typecheck"],
      artifactManifest: ["coverage/web-build-typecheck.txt"],
      prismaClientEvidenceCaptured: true,
      typecheckEvidenceCaptured: false,
      fallbackEvidenceCaptured: true,
      exactOptionalEvidenceCaptured: true,
      secretSafeArtifactsCaptured: true,
      typecheckOutputPath: "coverage/web-build-typecheck.txt",
      buildOutputPath: "coverage/web-build-next-build.txt",
    });
    expect(String(persistWebBuildRuntimeRun)).toContain("repository.webBuildRuntimeRun.upsert");
    expect(prismaSchema).toContain("model WebBuildRuntimeRun");
    expect(prismaSchema).toContain("webBuildRuntimeRuns WebBuildRuntimeRun[]");
    expect(prismaSchema).toContain("typecheckEvidenceCaptured");
    expect(prismaSchema).toContain("browserSmokeEvidenceCaptured");
    expect(migration).toContain('CREATE TABLE "WebBuildRuntimeRun"');
    expect(migration).toContain('"commandMatrix" JSONB NOT NULL');
    expect(migration).toContain('"artifactManifest" JSONB NOT NULL');
    expect(migration).toContain('"WebBuildRuntimeRun_tenantId_runId_key"');
  });

  it("blocks web build/runtime completion when generated client, typecheck, build, smoke, CI, or safe evidence is missing", () => {
    const decision = buildWebBuildRuntimeVerificationEvidenceDecision({
      commands: ["pnpm db:generate"],
      artifacts: ["coverage/web-build-prisma-generate.txt"],
      evidence: {
        prismaClientGenerated: true,
      },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingCommands).toContain("pnpm --filter @inkroute/web build");
    expect(decision.missingArtifacts).toContain("coverage/web-build-secret-safe-artifacts.json");
    expect(decision.missingEvidence).toContain("webTypecheckPassed");
    expect(decision.missingEvidence).toContain("dbBackedBookingRouteSmokePassed");
    expect(decision.blockers).toContain("Web typecheck must pass.");
    expect(decision.blockers).toContain("DB-backed booking route smoke must pass with generated Prisma Client present.");
  });

  it("completes web build/runtime verification only when every command, artifact, and evidence flag is present", () => {
    const completeEvidence = Object.fromEntries(webBuildRuntimeVerificationEvidenceFlags.map((flag) => [flag, true]));
    const decision = buildWebBuildRuntimeVerificationEvidenceDecision({
      commands: webBuildRuntimeVerificationCommands,
      artifacts: webBuildRuntimeVerificationArtifactPaths,
      evidence: completeEvidence,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingCommands).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingEvidence).toEqual([]);
    expect(decision.requiredEvidence).toBe(webBuildRuntimeVerificationEvidenceFlags);
  });

  it("separates static web build review from external execution and redacts private artifacts", () => {
    const executionPlan = buildWebBuildRuntimeVerificationExecutionPlan();
    const artifactReview = buildWebBuildRuntimeVerificationArtifactReview({
      tenantDomain: "tenant.example.com",
      databaseUrl: "postgres://inkroute:secret@db.example.com:5432/inkroute",
      prismaConnectionString: "prisma://accelerate.example.com/?api_key=sk_private",
      clientEmail: "client@example.com",
      nested: {
        sessionToken: "session_private",
        buildLog: "tenant.example.com rendered private booking route",
        browserSmokeOutput: "visited /booking/private-client",
        routePath: "/booking/private-client",
        renderedHtml: "<main>private client booking</main>",
        stackTrace: "Error: private route failed",
        publicSummary: "web build runtime evidence captured",
      },
    });
    const directRedaction = buildRedactedWebBuildRuntimeVerificationArtifact({
      publicSummary: "safe web build evidence",
      paymentCardFingerprint: "card_private",
    });

    expect(executionPlan.localCommands).toBe(webBuildRuntimeVerificationLocalCommands);
    expect(executionPlan.localCommands).toEqual([
      "static compile-unblocker source review",
      "static exact-optional-property payload review",
      "static WebBuildRuntimeRun persistence contract review",
    ]);
    expect(executionPlan.externalCommands).toBe(webBuildRuntimeVerificationExternalCommands);
    expect(executionPlan.externalCommands).toEqual([
      "pnpm db:generate",
      "pnpm --filter @inkroute/web typecheck",
      "pnpm --filter @inkroute/web build",
      "web browser smoke for public booking and content routes",
      "Prisma DB-backed booking route smoke",
      "local DB-unavailable fallback smoke",
      "provider-backed persistWebBuildRuntimeRun execution",
      "CI web build/runtime artifact capture",
    ]);
    expect(executionPlan.commandExecutionAllowed).toBe(false);
    expect(executionPlan.prismaGenerateExecutionAllowed).toBe(false);
    expect(executionPlan.databaseExecutionAllowed).toBe(false);
    expect(executionPlan.buildExecutionAllowed).toBe(false);
    expect(executionPlan.browserExecutionAllowed).toBe(false);
    expect(executionPlan.ciExecutionAllowed).toBe(false);
    expect(executionPlan.providerPersistenceExecutionAllowed).toBe(false);
    expect(executionPlan.executionPolicy).toBe(webBuildRuntimeVerificationExecutionPolicy);
    expect(executionPlan.executionPolicy).toEqual({
      codexMayClassifyStaticCompileUnblockers: true,
      generatedPrismaClientRequiredForClosure: true,
      webTypecheckAndBuildRequiredForClosure: true,
      browserSmokeRequiredForClosure: true,
      providerDatabaseRequiredForPersistence: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(executionPlan.requiredExternalEvidence).toBe(webBuildRuntimeVerificationRequiredExternalEvidence);
    expect(executionPlan.requiredExternalEvidence).toContain("pnpm db:generate output with generated Prisma Client present");
    expect(executionPlan.requiredExternalEvidence).toContain("pnpm --filter @inkroute/web build output");
    expect(executionPlan.requiredExternalEvidence).toContain("secret-safe web build/runtime artifact review");
    expect(artifactReview.requiredExternalEvidence).toEqual(executionPlan.requiredExternalEvidence);
    expect(artifactReview.redactions).toEqual([
      "tenantDomain",
      "databaseUrl",
      "prismaConnectionString",
      "clientEmail",
      "nested.sessionToken",
    ]);
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("tenant.example.com");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("postgres://");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("prisma://");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("client@example.com");
    expect(JSON.stringify(artifactReview.artifact)).toContain("web build runtime evidence captured");
    expect(artifactReview.secretSafe).toBe(true);
    expect(directRedaction.redactions).toEqual(["paymentCardFingerprint"]);
    expect(JSON.stringify(directRedaction.artifact)).toContain("safe web build evidence");
  });

  it("wires manifest and tracker evidence for GAP-027", () => {
    expect(unitManifest).toContain("unit-web-build-runtime-verification-static");
    expect(unitManifest).toContain("WebBuildRuntimeRun Prisma model and app row contract");
    expect(gapTracker).toContain("apps/web/lib/webBuildRuntimeVerification.ts");
    expect(gapTracker).toContain("persistWebBuildRuntimeRun upsert seam");
    expect(gapTracker).toContain("buildWebBuildRuntimeVerificationExecutionPlan");
    expect(gapTracker).toContain("webBuildRuntimeVerificationLocalCommands/webBuildRuntimeVerificationExternalCommands");
    expect(gapTracker).toContain("buildRedactedWebBuildRuntimeVerificationArtifact");
    expect(gapTracker).toContain("buildWebBuildRuntimeVerificationArtifactReview");
    expect(gapTracker).toContain("provider-backed persistWebBuildRuntimeRun execution");
    expect(gapTracker).toContain("GAP-027 is web-build-runtime-verification wired with evidence classifier");
    expect(gapTracker).toContain("proof inventory");
  });

  it("pins current web build runtime proof files for GAP-027", () => {
    expect(webBuildRuntimeVerificationProofFiles).toContain("apps/web/package.json");
    expect(webBuildRuntimeVerificationProofFiles).toContain("apps/web/lib/webBuildRuntimeVerification.ts");
    expect(webBuildRuntimeVerificationProofFiles).toContain("apps/web/tests/web-build-runtime-verification-static.test.ts");
    for (const proofFile of webBuildRuntimeVerificationProofFiles) {
      expect(readRepoFile(proofFile).length).toBeGreaterThan(0);
    }
  });
});

