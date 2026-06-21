import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildSeoPublicationArtifactReview,
  buildSeoPublicationEvidenceDecision,
  buildSeoPublicationExecutionPlan,
  createInMemorySeoPublicationRepository,
  executeLocalSeoPublicationMutation,
  seoPublicationArtifactPaths,
  seoPublicationDecisionRequiredEvidence,
  seoPublicationExternalCommands,
  seoPublicationExecutionPolicy,
  seoPublicationLocalCommands,
  seoPublicationRequiredExternalEvidence,
  seoPublicationRuntimeCommands,
  seoPublicationRuntimeMatrix,
  seoPublicationRuntimeProofFiles,
  seoPublicationRuntimeReadiness,
} from "../lib/seoPublicationRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("SEO publication runtime contract", () => {
  const seoSource = readRepoFile("packages/seo/src/index.ts");
  const seoPage = readRepoFile("apps/dashboard/app/seo/page.tsx");
  const seoPublicationActionPanel = readRepoFile("apps/dashboard/components/SeoPublicationActionPanel.tsx");
  const routeSource = readRepoFile("apps/dashboard/app/api/seo/route.ts");
  const staticTest = readRepoFile("apps/dashboard/tests/seo-publication-route-static.test.ts");
  const readStaticTest = readRepoFile("apps/dashboard/tests/seo-read-route-static.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins GAP-071 commands, matrix rows, and artifacts", () => {
    expect(seoPublicationRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/seo typecheck",
      "pnpm --filter @inkroute/seo test",
      "pnpm --filter @inkroute/dashboard build",
      "pnpm vitest run apps/dashboard/tests/seo-publication-route-static.test.ts",
      "SEO Prisma integration tests",
      "SEO tenant isolation tests",
      "dashboard SEO publish/edit/archive Playwright or route tests",
    ]);
    expect(seoPublicationRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "seo-typecheck",
      "seo-tests",
      "dashboard-build",
      "static-contract",
      "city-prisma",
      "style-prisma",
      "redirect-prisma",
      "tenant-isolation",
      "rbac-denial",
      "idempotency-store",
      "revalidation-job",
      "associations",
      "audit-log",
      "dashboard-publish-flow",
      "dashboard-edit-flow",
      "dashboard-archive-flow",
      "ci-seo-publication-job",
      "secret-safe-artifacts",
    ]);
    expect(seoPublicationArtifactPaths).toContain("coverage/seo-publication-runtime.json");
    expect(seoPublicationArtifactPaths).toContain("test-results/seo-publication-runtime");
  });

  it("keeps package planner, dashboard route transaction, read/static guards, and publication boundary wired", () => {
    expect(seoSource).toContain("buildSeoPublicationMutationPlan");
    expect(seoSource).toContain("buildSeoPublicationRuntimeReadinessPlan");
    expect(routeSource).toContain('assertPermission(actor, "seo:write")');
    expect(routeSource).toContain("buildSeoPublicationMutationPlan");
    expect(routeSource).toContain("await prisma.$transaction(async (tx) =>");
    expect(routeSource).toContain("tx.seoCityPage.upsert");
    expect(routeSource).toContain("tx.seoStylePage.upsert");
    expect(routeSource).toContain("tx.seoRedirect.upsert");
    expect(staticTest).toContain("persists city, style, redirect, and audit writes inside a Prisma transaction");
    expect(readStaticTest).toContain("seo:read");
    expect(seoPage).toContain("SeoPublicationActionPanel");
    expect(seoPage).not.toContain("Publishing actions remain disabled");
    expect(seoPublicationActionPanel).toContain('fetch("/api/seo"');
    expect(seoPublicationActionPanel).toContain('"idempotency-key"');
    expect(seoPublicationActionPanel).toContain('"SeoCityPage"');
    expect(seoPublicationActionPanel).toContain("Create city SEO draft");
    expect(seoPublicationActionPanel).toContain("Search Console submission, persisted revalidation jobs, and browser flow evidence remain gated");
  });

  it("executes local publication repository seams for idempotency, revalidation, associations, and audit capture", () => {
    const repository = createInMemorySeoPublicationRepository();
    const mutation = {
      tenantId: "tenant_demo",
      actorId: "user_seo_demo",
      model: "SeoCityPage" as const,
      action: "publish" as const,
      entityId: "seo_city_seattle",
      idempotencyKey: "seo:publish:city:seattle",
      revalidationTags: ["seo:SeoCityPage:/cities/seattle"],
      relatedFaqIds: ["faq_aftercare"],
      relatedReviewIds: ["review_ink_01"],
      relatedImageIds: ["image_portfolio_01"],
    };

    expect(executeLocalSeoPublicationMutation(repository, mutation).status).toBe("processed");
    expect(executeLocalSeoPublicationMutation(repository, mutation).status).toBe("duplicate");

    const snapshot = repository.snapshot();
    expect(snapshot.idempotencyKeys).toEqual(["tenant_demo:seo:publish:city:seattle"]);
    expect(snapshot.entities).toEqual([{ tenantId: "tenant_demo", model: "SeoCityPage", entityId: "seo_city_seattle", action: "publish" }]);
    expect(snapshot.revalidationJobs).toEqual([
      { tenantId: "tenant_demo", entityId: "seo_city_seattle", tags: ["seo:SeoCityPage:/cities/seattle"] },
    ]);
    expect(snapshot.associations).toEqual([
      { tenantId: "tenant_demo", entityId: "seo_city_seattle", kind: "faq", relatedId: "faq_aftercare" },
      { tenantId: "tenant_demo", entityId: "seo_city_seattle", kind: "review", relatedId: "review_ink_01" },
      { tenantId: "tenant_demo", entityId: "seo_city_seattle", kind: "image", relatedId: "image_portfolio_01" },
    ]);
    expect(snapshot.auditLogs).toHaveLength(1);
  });

  it("reviews retained SEO publication artifacts with recursive secret, provider payload, and PII redaction", () => {
    const review = buildSeoPublicationArtifactReview({
      expectedArtifactPaths: ["coverage/seo-publication-dashboard-publish-flow-redacted.json"],
      artifacts: [
        {
          path: "coverage/seo-publication-dashboard-publish-flow-redacted.json",
          searchConsolePayload: { authorization: "Bearer searchconsole-token", email: "ari@example.test" },
          draftCopy: "Client phone +1 206 555 0142 and private launch notes",
          nested: [{ providerPayload: { token: "provider-secret" } }],
        },
      ],
    });

    expect(review.status).toBe("passed");
    expect(JSON.stringify(review.redactedArtifacts)).not.toContain("searchconsole-token");
    expect(JSON.stringify(review.redactedArtifacts)).not.toContain("ari@example.test");
    expect(JSON.stringify(review.redactedArtifacts)).not.toContain("206 555 0142");
    expect(JSON.stringify(review.redactedArtifacts)).not.toContain("provider-secret");
    expect(review.blockers).toEqual([]);
  });

  it("keeps association, idempotency, revalidation, integration, tenant, dashboard, CI, and artifact blockers explicit", () => {
    expect(seoPublicationRuntimeReadiness.status).toBe("blocked");
    expect(seoPublicationRuntimeReadiness.missingScripts).toEqual([]);
    expect(seoPublicationRuntimeReadiness.requiredEvidence).toEqual(seoPublicationDecisionRequiredEvidence);
    expect(seoPublicationRuntimeReadiness.blockers).toContain("FAQ, review, and image SEO associations must persist tenant-safely.");
    expect(seoPublicationRuntimeReadiness.blockers).toContain("SEO revalidation jobs must persist after publication commits.");
    expect(seoPublicationRuntimeReadiness.blockers).toContain("SEO publication idempotency store must be available.");
    expect(seoPublicationRuntimeReadiness.blockers).toContain("Dashboard SEO publish/edit/archive flow tests must pass.");
  });

  it("pins the non-executing GAP-071 SEO publication execution policy", () => {
    const plan = buildSeoPublicationExecutionPlan();

    expect(seoPublicationExecutionPolicy).toEqual({
      codexMayClassifyStaticSeoPublicationReadiness: true,
      localCommandEvidenceRequiredForClosure: true,
      seededPrismaRequiredForClosure: true,
      tenantIsolationRequiredForClosure: true,
      durableIdempotencyRequiredForClosure: true,
      durableRevalidationRequiredForClosure: true,
      durableAssociationPersistenceRequiredForClosure: true,
      dashboardBrowserFlowsRequiredForClosure: true,
      ciEvidenceRequiredForClosure: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(plan.policy).toEqual(seoPublicationExecutionPolicy);
    expect(plan.commandExecutionAllowed).toEqual(false);
    expect(plan.seededPrismaExecutionAllowed).toEqual(false);
    expect(plan.tenantIsolationExecutionAllowed).toEqual(false);
    expect(plan.idempotencyExecutionAllowed).toEqual(false);
    expect(plan.revalidationExecutionAllowed).toEqual(false);
    expect(plan.associationExecutionAllowed).toEqual(false);
    expect(plan.browserExecutionAllowed).toEqual(false);
    expect(plan.ciExecutionAllowed).toEqual(false);
    expect(plan.artifactReviewExecutionAllowed).toEqual(false);
    expect(plan.localCommands).toEqual(seoPublicationLocalCommands);
    expect(plan.externalCommands).toEqual(seoPublicationExternalCommands);
    expect(plan.requiredExternalEvidence).toEqual(seoPublicationRequiredExternalEvidence);
    expect(seoPublicationRequiredExternalEvidence).toEqual([
      "actual SEO publication command output",
      "seeded SeoCityPage mutation integration tests",
      "seeded SeoStylePage mutation integration tests",
      "seeded SeoRedirect mutation integration tests",
      "SEO tenant isolation tests",
      "SEO publish RBAC denial tests",
      "dedicated SEO publication idempotency store tests",
      "dedicated SEO revalidation job persistence tests",
      "normalized FAQ/review/image association join persistence tests",
      "dashboard SEO publish/edit/archive browser flow evidence",
      "CI SEO publication artifacts",
      "secret-safe SEO publication artifact review",
    ]);
  });

  it("classifies SEO publication evidence before GAP-071 can close", () => {
    const blockedDecision = buildSeoPublicationEvidenceDecision({
      seoTypecheckPassed: true,
      seoTestsPassed: true,
      dashboardBuildPassed: true,
      staticContractPassed: true,
      cityPrismaIntegrationPassed: false,
      stylePrismaIntegrationPassed: false,
      redirectPrismaIntegrationPassed: false,
      tenantIsolationPassed: false,
      rbacDenialPassed: false,
      idempotencyStoreVerified: false,
      revalidationJobVerified: false,
      associationPersistenceVerified: false,
      auditLogVerified: true,
      dashboardPublishFlowPassed: false,
      dashboardEditFlowPassed: false,
      dashboardArchiveFlowPassed: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactReviewPassed: false,
      capturedArtifacts: [
        "coverage/seo-publication-runtime.json",
        "coverage/seo-publication-seo-typecheck.txt",
        "coverage/seo-publication-seo-test.txt",
        "coverage/seo-publication-dashboard-build.txt",
        "coverage/seo-publication-static-contract.json",
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toContain("Seeded SeoCityPage mutation evidence is missing.");
    expect(blockedDecision.blockers).toContain("SEO tenant-isolation evidence is missing.");
    expect(blockedDecision.blockers).toContain("SEO publication idempotency store evidence is missing.");
    expect(blockedDecision.blockers).toContain("SEO revalidation job persistence evidence is missing.");
    expect(blockedDecision.blockers).toContain("Dashboard SEO publish flow evidence is missing.");
    expect(blockedDecision.blockers).toContain("Secret-safe SEO publication artifact review evidence is missing.");
    expect(blockedDecision.missingArtifacts).toContain("coverage/seo-publication-city-prisma.json");
    expect(blockedDecision.missingArtifacts).toContain("coverage/seo-publication-secret-safe-artifacts.json");
    expect(blockedDecision.requiredCommands).toEqual(seoPublicationRuntimeCommands);
    expect(blockedDecision.requiredEvidence).toEqual(seoPublicationDecisionRequiredEvidence);
    expect(blockedDecision.redactedSummary).toEqual({
      capturedArtifactCount: 5,
      requiredArtifactCount: seoPublicationArtifactPaths.length,
    });

    const completeDecision = buildSeoPublicationEvidenceDecision({
      seoTypecheckPassed: true,
      seoTestsPassed: true,
      dashboardBuildPassed: true,
      staticContractPassed: true,
      cityPrismaIntegrationPassed: true,
      stylePrismaIntegrationPassed: true,
      redirectPrismaIntegrationPassed: true,
      tenantIsolationPassed: true,
      rbacDenialPassed: true,
      idempotencyStoreVerified: true,
      revalidationJobVerified: true,
      associationPersistenceVerified: true,
      auditLogVerified: true,
      dashboardPublishFlowPassed: true,
      dashboardEditFlowPassed: true,
      dashboardArchiveFlowPassed: true,
      ciEvidenceCaptured: true,
      secretSafeArtifactReviewPassed: true,
      capturedArtifacts: seoPublicationArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
    expect(completeDecision.requiredEvidence).toEqual(seoPublicationDecisionRequiredEvidence);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming seeded DB/browser proof", () => {
    expect(ciWorkflow).toContain("Run Phase 10 SEO publication runtime contracts");
    expect(ciWorkflow).toContain("seo-publication-runtime-static.test.ts");
    expect(ciWorkflow).toContain("seo-publication-runtime-artifacts");
    expect(unitManifest).toContain("unit-dashboard-seo-publication-runtime-static");
    expect(gapTracker).toContain("apps/dashboard/lib/seoPublicationRuntime.ts");
    expect(gapTracker).toContain("SEO publication evidence classifier");
    expect(gapTracker).toContain("seoPublicationDecisionRequiredEvidence");
    expect(gapTracker).toContain("buildSeoPublicationExecutionPlan");
    expect(gapTracker).toContain("seoPublicationExecutionPolicy");
    expect(gapTracker).toContain("seoPublicationRequiredExternalEvidence");
    expect(gapTracker).toContain("buildRedactedSeoPublicationArtifact");
    expect(gapTracker).toContain("buildSeoPublicationArtifactReview");
    expect(gapTracker).toContain("non-executing SEO publication execution policy");
    expect(gapTracker).toContain("local in-memory SEO publication repository contract");
    expect(gapTracker).toContain("GAP-071 is seo-publication-runtime-matrix wired");
    expect(seoPublicationArtifactPaths).toContain("coverage/seo-publication-secret-safe-artifacts.json");
  });

  it("pins current SEO publication proof files for GAP-071", () => {
    expect(seoPublicationRuntimeProofFiles).toEqual(expect.arrayContaining([
      "apps/dashboard/package.json",
      "packages/seo/package.json",
      "packages/seo/src/index.ts",
      "packages/seo/tests/seo-engine.test.ts",
      "apps/dashboard/app/seo/page.tsx",
      "apps/dashboard/components/SeoPublicationActionPanel.tsx",
      "apps/dashboard/lib/seoDemo.ts",
      "apps/dashboard/lib/seoPublicationRuntime.ts",
      "packages/db/prisma/schema.prisma",
      "apps/dashboard/app/api/seo/route.ts",
      "apps/dashboard/tests/seo-read-route-static.test.ts",
      "apps/dashboard/tests/seo-publication-route-static.test.ts",
      "apps/dashboard/tests/seo-publication-runtime-static.test.ts",
      "apps/dashboard/app/api/reviews/route.ts",
      "apps/dashboard/tests/review-read-route-static.test.ts",
      ".github/workflows/ci.yml",
      "testing/manifests/unit-test-manifest.json",
    ]));
    for (const file of seoPublicationRuntimeProofFiles) {
      expect(readRepoFile(file).length).toBeGreaterThan(0);
    }
  });
});


