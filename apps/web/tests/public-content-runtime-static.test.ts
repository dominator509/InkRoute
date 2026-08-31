import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildPublicContentEvidenceDecision,
  buildPublicContentExecutionPlan,
  buildPublicContentArtifactReview,
  buildRedactedPublicContentArtifact,
  buildPublicContentRunData,
  persistPublicContentRun,
  publicContentArtifactPaths,
  publicContentEvidenceFlags,
  publicContentExternalCommands,
  publicContentExecutionPolicy,
  publicContentLocalCommands,
  publicContentRequiredExternalEvidence,
  publicContentRuntimeCommands,
  publicContentRuntimeMatrix,
  publicContentRuntimeProofFiles,
  publicContentRuntimeReadiness,
  publicContentRunPersistenceContract,
} from "../lib/publicContentRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("public content runtime evidence contract", () => {
  const configPackageJson = readRepoFile("packages/config/package.json");
  const configSource = readRepoFile("packages/config/src/index.ts");
  const configTests = readRepoFile("packages/config/tests/public-content.test.ts");
  const validatorSource = readRepoFile("packages/validators/src/common.ts");
  const publicContentApiSource = readRepoFile("apps/web/lib/publicContentApi.ts");
  const publicPortfolioRoute = readRepoFile("apps/web/app/api/public/[tenantSlug]/portfolio/route.ts");
  const publicTravelRoute = readRepoFile("apps/web/app/api/public/[tenantSlug]/travel/route.ts");
  const publicReviewsRoute = readRepoFile("apps/web/app/api/public/[tenantSlug]/reviews/route.ts");
  const publicFaqRoute = readRepoFile("apps/web/app/api/public/[tenantSlug]/faq/route.ts");
  const publicSeoCityRoute = readRepoFile("apps/web/app/api/public/[tenantSlug]/seo/cities/[citySlug]/route.ts");
  const publicSeoStyleRoute = readRepoFile("apps/web/app/api/public/[tenantSlug]/seo/styles/[styleSlug]/route.ts");
  const dashboardReviewRoute = readRepoFile("apps/dashboard/app/api/reviews/route.ts");
  const dashboardReviewTest = readRepoFile("apps/dashboard/tests/review-read-route-static.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const publicContentRunMigration = readRepoFile("packages/db/prisma/migrations/20260609034800_add_public_content_runs/migration.sql");

  it("pins public content commands, matrix rows, and artifact paths", () => {
    expect(publicContentRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/config typecheck",
      "pnpm --filter @inkroute/config test",
      "pnpm --filter @inkroute/web typecheck",
      "pnpm --filter @inkroute/web build",
      "public content seeded DB/API redaction tests",
      "public content browser HTML redaction smoke",
      "public content cache revalidation smoke",
    ]);
    expect(publicContentRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "config-and-web-package-gates",
      "tenant-domain-repository-route-wiring",
      "seeded-db-or-cms-content-reads",
      "api-json-and-rendered-html-redaction",
      "private-portfolio-exclusion",
      "cache-revalidation-smoke",
      "browser-and-ci-evidence",
    ]);
    expect(publicContentArtifactPaths).toContain("coverage/public-content-runtime.json");
    expect(publicContentArtifactPaths).toContain("coverage/public-content-rendered-html-redaction.json");
    expect(publicContentArtifactPaths).toContain("test-results/public-content-runtime");
  });

  it("keeps config scripts, public projection helpers, redaction tests, and dashboard review redaction visible", () => {
    for (const scriptName of ["typecheck", "test"]) {
      expect(configPackageJson).toContain(`"${scriptName}"`);
    }
    expect(configSource).toContain("buildPublicContentBundle");
    expect(configSource).toContain("buildPublicContentRuntimeEvidencePlan");
    expect(configSource).toContain("privateOriginalAvailable: false");
    expect(configTests).toContain("normalizes tenant slugs and rejects unknown tenants");
    expect(configTests).toContain("blocks public content runtime evidence until repository wiring, redaction, cache, browser, and CI proof exist");
    expect(validatorSource).toContain("publicReadQuerySchema");
    expect(publicContentApiSource).toContain("export async function readPublicPortfolioItems");
    expect(publicContentApiSource).toContain("export async function readPublicTravelStops");
    expect(publicContentApiSource).toContain("export async function readPublicTestimonials");
    expect(publicContentApiSource).toContain("resolvePublicTenantScope");
    expect(publicContentApiSource).toContain("prismaRuntime.tenant.findUnique");
    expect(publicContentApiSource).toContain('source: "database"');
    expect(publicContentApiSource).toContain("rows.flatMap");
    expect(publicContentApiSource).toContain("if (!image?.imageUrl) return []");
    expect(publicContentApiSource).not.toContain('?? "/demo/portfolio/placeholder.svg"');
    expect(publicContentApiSource).toContain("tenantIdEchoed: false");
    expect(publicContentApiSource).toContain("internalPersistenceIdsEchoed: false");
    expect(publicContentApiSource).toContain("rawPrivateFieldsEchoed: false");
    expect(publicContentApiSource).toContain("buildSafeLocalPublicContentRouteResponse");
    expect(publicContentApiSource).toContain("buildSafeLocalPublicContentPageResponse");
    expect(publicContentApiSource).toContain("rawLocalRuntimeRecordEchoed: false");
    for (const routeSource of [publicPortfolioRoute, publicTravelRoute, publicReviewsRoute, publicFaqRoute]) {
      expect(routeSource).toContain("publicReadQuerySchema.safeParse");
      expect(routeSource).toContain('code: "VALIDATION_FAILED"');
      expect(routeSource).toContain("buildSafeLocalPublicContentRouteResponse");
      expect(routeSource).toContain("tenantIdEchoed: false");
      expect(routeSource).not.toContain("{ ...local, query");
      expect(routeSource).not.toContain("tenantId: tenant.tenantId,\n            source");
    }
    for (const routeSource of [publicSeoCityRoute, publicSeoStyleRoute]) {
      expect(routeSource).toContain("buildSafeLocalPublicContentPageResponse");
      expect(routeSource).not.toContain("{ ...local, data: local.data[0] }");
    }
    expect(dashboardReviewRoute).toContain("reviews");
    expect(dashboardReviewTest).toContain("private");
  });

  it("keeps public content evidence blocked until persisted repository reads, redaction, cache, browser, and CI proof exist", () => {
    expect(publicContentRuntimeReadiness.status).toBe("blocked");
    expect(publicContentRuntimeReadiness.missingScripts).toEqual([]);
    expect(publicContentRuntimeReadiness.requiredCommands).toBe(publicContentRuntimeCommands);
    expect(publicContentRuntimeReadiness.requiredEvidence).toBe(publicContentEvidenceFlags);
    expect(publicContentRuntimeReadiness.blockers).toContain(
      "Tenant/domain resolver must graduate from the local demo resolver contract to persisted tenant records.",
    );
    expect(publicContentRuntimeReadiness.blockers).not.toContain("Public content repository reads must cover tenant, artist, portfolio, travel, FAQ, testimonial, city, and style data.");
    expect(publicContentRuntimeReadiness.blockers).not.toContain("Public routes and APIs must consume the repository-backed public content bundle.");
    expect(publicContentRuntimeReadiness.blockers).toContain(
      "Public API JSON must be proven free of tenant IDs, artist IDs, attribution keys, private object keys, plan/status fields, and non-public portfolio records.",
    );
    expect(publicContentRuntimeReadiness.blockers).toContain(
      "Browser smoke evidence must cover portfolio, travel, FAQ, testimonials, city, and style pages.",
    );
  });

  it("pins the PublicContentRun persistence model and migration", () => {
    const runData = buildPublicContentRunData({
      tenantId: "tenant_static",
      runId: "public_content_static",
      commitSha: "abc123",
      status: "blocked",
      commands: ["public content seeded DB/API redaction tests"],
      artifacts: ["coverage/public-content-seeded-db-cms-redacted.json"],
      tenantDomainResolverEvidenceCaptured: true,
      repositoryReadEvidenceCaptured: false,
      routeApiAdoptionEvidenceCaptured: false,
      seededContentEvidenceCaptured: true,
      apiJsonRedactionEvidenceCaptured: false,
      renderedHtmlRedactionEvidenceCaptured: false,
      privatePortfolioExclusionEvidenceCaptured: false,
      cacheRevalidationEvidenceCaptured: false,
      browserCiEvidenceCaptured: false,
      secretSafeArtifactsCaptured: true,
      resolverReportPath: "coverage/public-content-resolver-wiring.json",
      redactionReportPath: "coverage/public-content-api-json-redaction.json",
    });

    expect(publicContentRunPersistenceContract).toEqual({
      prismaModel: "PublicContentRun",
      tenantRelation: "publicContentRuns",
      migration: "20260609034800_add_public_content_runs",
      storesRunId: true,
      storesCommitSha: true,
      storesReadinessStatus: true,
      storesCommandMatrix: true,
      storesArtifactManifest: true,
      storesTenantDomainResolverEvidence: true,
      storesRepositoryReadEvidence: true,
      storesRouteApiAdoptionEvidence: true,
      storesSeededContentEvidence: true,
      storesApiJsonRedactionEvidence: true,
      storesRenderedHtmlRedactionEvidence: true,
      storesPrivatePortfolioExclusionEvidence: true,
      storesCacheRevalidationEvidence: true,
      storesBrowserCiEvidence: true,
      storesSecretSafeArtifacts: true,
    });
    expect(runData).toMatchObject({
      tenantId: "tenant_static",
      runId: "public_content_static",
      commitSha: "abc123",
      status: "blocked",
      commandMatrix: ["public content seeded DB/API redaction tests"],
      artifactManifest: ["coverage/public-content-seeded-db-cms-redacted.json"],
      tenantDomainResolverEvidenceCaptured: true,
      repositoryReadEvidenceCaptured: false,
      seededContentEvidenceCaptured: true,
      apiJsonRedactionEvidenceCaptured: false,
      secretSafeArtifactsCaptured: true,
      resolverReportPath: "coverage/public-content-resolver-wiring.json",
      redactionReportPath: "coverage/public-content-api-json-redaction.json",
    });
    expect(String(persistPublicContentRun)).toContain("repository.publicContentRun.upsert");
    expect(prismaSchema).toContain("model PublicContentRun");
    expect(prismaSchema).toContain("publicContentRuns PublicContentRun[]");
    expect(prismaSchema).toContain("tenantDomainResolverEvidenceCaptured");
    expect(prismaSchema).toContain("renderedHtmlRedactionEvidenceCaptured");
    expect(prismaSchema).toContain("secretSafeArtifactsCaptured");
    expect(publicContentRunMigration).toContain('CREATE TABLE "PublicContentRun"');
    expect(publicContentRunMigration).toContain('"commandMatrix" JSONB NOT NULL');
    expect(publicContentRunMigration).toContain('"artifactManifest" JSONB NOT NULL');
    expect(publicContentRunMigration).toContain('"PublicContentRun_tenantId_runId_key"');
  });

  it("blocks public content completion when persisted resolver, repository, redaction, cache, browser, or safe evidence is missing", () => {
    const decision = buildPublicContentEvidenceDecision({
      commands: ["pnpm --filter @inkroute/config typecheck"],
      artifacts: ["coverage/public-content-config-typecheck.txt"],
      evidence: {
        configTypecheckPassed: true,
      },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingCommands).toContain("public content browser HTML redaction smoke");
    expect(decision.missingArtifacts).toContain("coverage/public-content-rendered-html-redaction.json");
    expect(decision.missingEvidence).toContain("tenantDomainResolverBackedByPersistence");
    expect(decision.missingEvidence).toContain("apiJsonRedactionVerified");
    expect(decision.blockers).toContain(
      "Tenant/domain resolver must graduate from the local demo resolver contract to persisted tenant records.",
    );
    expect(decision.blockers).toContain(
      "Public API JSON must be proven free of tenant IDs, artist IDs, attribution keys, private object keys, plan/status fields, and non-public portfolio records.",
    );
  });

  it("completes public content readiness only when every command, artifact, and evidence flag is present", () => {
    const completeEvidence = Object.fromEntries(publicContentEvidenceFlags.map((flag) => [flag, true]));
    const decision = buildPublicContentEvidenceDecision({
      commands: publicContentRuntimeCommands,
      artifacts: publicContentArtifactPaths,
      evidence: completeEvidence,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingCommands).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingEvidence).toEqual([]);
    expect(decision.requiredEvidence).toBe(publicContentEvidenceFlags);
  });

  it("separates local public content review from external execution and redacts private artifacts", () => {
    const executionPlan = buildPublicContentExecutionPlan();
    const artifactReview = buildPublicContentArtifactReview({
      tenantDomain: "tenant.example.com",
      clientEmail: "client@example.com",
      privateFileUrl: "https://files.example.com/private/client.png",
      portfolioAssetId: "file_1234567890abcdefghijklmnopqrstuvwxyz",
      nested: {
        databaseUrl: "postgres://inkroute:secret@db.example.com:5432/inkroute",
        renderedHtml: "<main>client@example.com private portfolio copy</main>",
        apiJson: { tenantSlug: "tenant-demo", privateReviewBody: "private review text" },
        cacheRevalidationTag: "tenant-demo:portfolio:private",
        waitlistRequestBody: "Client wants a private appointment",
        faqDraftBody: "Private FAQ draft",
        publicSummary: "public content evidence captured",
      },
    });
    const directRedaction = buildRedactedPublicContentArtifact({
      publicSummary: "safe public content",
      privatePortfolioUrl: "https://files.example.com/private/portfolio.png",
    });

    expect(executionPlan.localCommands).toBe(publicContentLocalCommands);
    expect(executionPlan.externalCommands).toBe(publicContentExternalCommands);
    expect(executionPlan.commandExecutionAllowed).toBe(false);
    expect(executionPlan.databaseExecutionAllowed).toBe(false);
    expect(executionPlan.browserExecutionAllowed).toBe(false);
    expect(executionPlan.ciExecutionAllowed).toBe(false);
    expect(executionPlan.providerPersistenceExecutionAllowed).toBe(false);
    expect(executionPlan.executionPolicy).toBe(publicContentExecutionPolicy);
    expect(executionPlan.executionPolicy).toEqual({
      codexMayClassifyStaticPublicContentReadiness: true,
      repositoryBackedReadsRequiredForClosure: true,
      renderedRedactionProofRequiredForClosure: true,
      providerDatabaseRequiredForPersistence: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(executionPlan.requiredExternalEvidence).toBe(publicContentRequiredExternalEvidence);
    expect(executionPlan.requiredExternalEvidence).toContain("provider-backed PublicContentRun persistence execution");
    expect(executionPlan.requiredExternalEvidence).toContain("rendered HTML redaction proof");
    expect(executionPlan.requiredExternalEvidence).toContain("secret-safe public content artifact review");
    expect(artifactReview.requiredExternalEvidence).toBe(publicContentRequiredExternalEvidence);
    expect(artifactReview.redactions).toEqual([
      "tenantDomain",
      "clientEmail",
      "privateFileUrl",
      "portfolioAssetId",
      "nested.databaseUrl",
    ]);
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("tenant.example.com");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("client@example.com");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("postgres://");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("file_1234567890");
    expect(JSON.stringify(artifactReview.artifact)).toContain("public content evidence captured");
    expect(artifactReview.secretSafe).toBe(true);
    expect(directRedaction.redactions).toEqual(["privatePortfolioUrl"]);
    expect(JSON.stringify(directRedaction.artifact)).toContain("safe public content");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming repository-backed public content readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 3 public content runtime contracts");
    expect(ciWorkflow).toContain("public-content-runtime-static.test.ts");
    expect(ciWorkflow).toContain("public-content-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/public-content-runtime.json");
    expect(unitManifest).toContain("unit-web-public-content-runtime-static");
    expect(unitManifest).toContain("PublicContentRun Prisma model and app row contract");
    expect(gapTracker).toContain("apps/web/lib/publicContentRuntime.ts");
    expect(gapTracker).toContain("persistPublicContentRun upsert seam");
    expect(gapTracker).toContain("buildPublicContentExecutionPlan");
    expect(gapTracker).toContain("buildRedactedPublicContentArtifact");
    expect(gapTracker).toContain("buildPublicContentArtifactReview");
    expect(gapTracker).toContain("publicContentExecutionPolicy");
    expect(gapTracker).toContain("publicContentRequiredExternalEvidence");
    expect(gapTracker).toContain("GAP-026 is public-content-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("live persisted tenant/domain resolver, provider-backed persistPublicContentRun execution, repository-backed public reads, DB/CMS seed proof, route/API adoption proof, API JSON and rendered HTML redaction proof, cache revalidation, web build, browser smoke, CI evidence, and secret-safe artifact review remain open");
    expect(gapTracker).toContain("proof inventory");
  });

  it("pins current public content proof files for GAP-026", () => {
    expect(publicContentRuntimeProofFiles).toContain("packages/config/package.json");
    expect(publicContentRuntimeProofFiles).toContain("apps/web/package.json");
    expect(publicContentRuntimeProofFiles).toContain("apps/web/lib/publicContentRuntime.ts");
    expect(publicContentRuntimeProofFiles).toContain("apps/web/tests/public-content-runtime-static.test.ts");
    for (const proofFile of publicContentRuntimeProofFiles) {
      expect(readRepoFile(proofFile).length).toBeGreaterThan(0);
    }
  });
});


