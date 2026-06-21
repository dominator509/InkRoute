import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  canonicalUrlForPath,
  createInMemoryCanonicalDomainRepository,
  evaluateCanonicalRequestWithRepository,
  evaluatePublicCanonicalRequest,
  publicSeoRedirectRules,
  publicTenantCanonicalDomains,
} from "../lib/canonicalRuntime";
import {
  buildCanonicalDomainArtifactReview,
  buildCanonicalDomainEvidenceDecision,
  buildCanonicalDomainExecutionPlan,
  canonicalDomainDecisionRequiredEvidence,
  canonicalDomainExecutionPolicy,
  canonicalDomainArtifactPaths,
  canonicalDomainExternalCommands,
  canonicalDomainLocalCommands,
  canonicalDomainRequiredExternalEvidence,
  canonicalDomainRuntimeCommands,
  canonicalDomainRuntimeMatrix,
  canonicalDomainRuntimeProofFiles,
  canonicalDomainRuntimeReadiness,
} from "../lib/canonicalDomainRuntimeEvidence";

const middlewareSource = readFileSync(join(process.cwd(), "apps/web/middleware.ts"), "utf8");
const cityPageSource = readFileSync(join(process.cwd(), "apps/web/app/cities/[citySlug]/page.tsx"), "utf8");
const stylePageSource = readFileSync(join(process.cwd(), "apps/web/app/styles/[styleSlug]/page.tsx"), "utf8");
const ciWorkflow = readFileSync(join(process.cwd(), ".github/workflows/ci.yml"), "utf8");
const unitManifest = readFileSync(join(process.cwd(), "testing/manifests/unit-test-manifest.json"), "utf8");
const gapTracker = readFileSync(join(process.cwd(), "GAP_TRACKER.md"), "utf8");

describe("GAP-072 canonical/domain runtime wiring", () => {
  it("declares tenant primary and allowed hosts for canonical policy", () => {
    expect(publicTenantCanonicalDomains[0]).toMatchObject({
      primaryHost: "inkroute.example",
      forceHttps: true,
    });
    expect(publicTenantCanonicalDomains[0]?.allowedHosts).toEqual(
      expect.arrayContaining(["inkroute.example", "www.inkroute.example", "localhost:3000"]),
    );
  });

  it("executes tenant-scoped persisted-style redirect rules with configured status codes", () => {
    expect(publicSeoRedirectRules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fromPath: "/cities/seattle", toPath: "/cities/seattle-wa", statusCode: 308, isActive: true }),
        expect.objectContaining({ fromPath: "/blackwork", toPath: "/styles/blackwork", statusCode: 301, isActive: true }),
      ]),
    );
    const redirect = evaluatePublicCanonicalRequest({ host: "inkroute.example", path: "/blackwork", protocol: "https" });
    expect(redirect.shouldRedirect).toBe(true);
    expect(redirect.statusCode).toBe(301);
    expect(redirect.destinationPath).toBe("/styles/blackwork");
  });

  it("executes local TenantDomain and SeoRedirect repository reads for canonical policy", () => {
    const repository = createInMemoryCanonicalDomainRepository();
    const redirect = evaluateCanonicalRequestWithRepository(repository, {
      host: "www.inkroute.example",
      path: "/blackwork",
      protocol: "http",
    });

    expect(redirect.policy.hostAllowed).toBe(true);
    expect(redirect.policy.shouldForceHttps).toBe(true);
    expect(redirect.policy.shouldRedirectHost).toBe(true);
    expect(redirect.shouldRedirect).toBe(true);
    expect(redirect.statusCode).toBe(301);
    expect(redirect.destinationPath).toBe("/styles/blackwork");
    expect(repository.snapshot().evaluations).toEqual([
      {
        host: "www.inkroute.example",
        path: "/blackwork",
        protocol: "http",
        shouldRedirect: true,
        shouldNoindex: false,
        destinationPath: "/styles/blackwork",
      },
    ]);
  });

  it("reviews canonical/domain artifacts with recursive DNS verification, provider token, and PII redaction", () => {
    const review = buildCanonicalDomainArtifactReview({
      expectedArtifactPaths: ["coverage/canonical-domain-deployment-domain-proof.json"],
      artifacts: [
        {
          path: "coverage/canonical-domain-deployment-domain-proof.json",
          domainVerificationToken: "domainverification-secret-token",
          providerPayload: { authorization: "Bearer provider-token", ownerEmail: "ari@example.test" },
          nested: [{ dnsRecord: "dns-secret-value", phone: "+1 206 555 0142" }],
        },
      ],
    });

    expect(review.status).toBe("passed");
    expect(JSON.stringify(review.redactedArtifacts)).not.toContain("domainverification-secret-token");
    expect(JSON.stringify(review.redactedArtifacts)).not.toContain("provider-token");
    expect(JSON.stringify(review.redactedArtifacts)).not.toContain("ari@example.test");
    expect(JSON.stringify(review.redactedArtifacts)).not.toContain("206 555 0142");
    expect(review.blockers).toEqual([]);
  });

  it("pins the non-executing GAP-072 canonical/domain execution policy", () => {
    const plan = buildCanonicalDomainExecutionPlan();

    expect(canonicalDomainExecutionPolicy).toEqual({
      codexMayClassifyStaticCanonicalDomainReadiness: true,
      localCommandEvidenceRequiredForClosure: true,
      tenantDomainRepositoryRequiredForClosure: true,
      seoRedirectRepositoryRequiredForClosure: true,
      customDomainRouteRequiredForClosure: true,
      sitemapNoindexCrawlRequiredForClosure: true,
      duplicateCanonicalRuntimeRequiredForClosure: true,
      deploymentDomainProofRequiredForClosure: true,
      ciEvidenceRequiredForClosure: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(plan.policy).toBe(canonicalDomainExecutionPolicy);
    expect(plan.commandExecutionAllowed).toBe(false);
    expect(plan.repositoryExecutionAllowed).toBe(false);
    expect(plan.customDomainExecutionAllowed).toBe(false);
    expect(plan.crawlExecutionAllowed).toBe(false);
    expect(plan.duplicateCanonicalExecutionAllowed).toBe(false);
    expect(plan.deploymentProofExecutionAllowed).toBe(false);
    expect(plan.ciExecutionAllowed).toBe(false);
    expect(plan.artifactReviewExecutionAllowed).toBe(false);
    expect(plan.localCommands).toBe(canonicalDomainLocalCommands);
    expect(plan.externalCommands).toBe(canonicalDomainExternalCommands);
    expect(plan.requiredExternalEvidence).toBe(canonicalDomainRequiredExternalEvidence);
    expect(canonicalDomainRequiredExternalEvidence).toEqual([
      "actual canonical/domain command output",
      "database-backed TenantDomain repository route tests",
      "database-backed SeoRedirect repository route tests",
      "custom-domain canonical/redirect route tests",
      "runtime sitemap exclusion and noindex route tests",
      "duplicate canonical runtime tests",
      "deployment primary/allowed domain proof",
      "CI canonical/domain runtime artifacts",
      "secret-safe canonical/domain artifact review",
    ]);
  });

  it("enforces HTTPS, canonical host redirects, noindex metadata, and middleware headers", () => {
    const hostRedirect = evaluatePublicCanonicalRequest({ host: "www.inkroute.example", path: "/booking", protocol: "http" });
    expect(hostRedirect.policy.hostAllowed).toBe(true);
    expect(hostRedirect.policy.shouldForceHttps).toBe(true);
    expect(hostRedirect.policy.shouldRedirectHost).toBe(true);
    expect(hostRedirect.policy.canonicalUrl).toBe("https://inkroute.example/booking");

    const noindex = evaluatePublicCanonicalRequest({ host: "inkroute.example", path: "/booking/deposit-preview", protocol: "https" });
    expect(noindex.shouldNoindex).toBe(true);

    expect(middlewareSource).toContain("evaluatePublicCanonicalRequest");
    expect(middlewareSource).toContain("NextResponse.redirect(destination, canonical.statusCode)");
    expect(middlewareSource).toContain('response.headers.set("X-Robots-Tag", "noindex, nofollow")');
    expect(middlewareSource).toContain('response.headers.set("X-InkRoute-Canonical-Url", canonical.policy.canonicalUrl)');
  });

  it("uses tenant primary host canonical URLs in rendered city/style metadata", () => {
    expect(canonicalUrlForPath("/cities/seattle-wa")).toBe("https://inkroute.example/cities/seattle-wa");
    expect(cityPageSource).toContain("canonicalUrlForPath(page.canonicalPath)");
    expect(stylePageSource).toContain("canonicalUrlForPath(page.canonicalPath)");
  });

  it("pins the canonical/domain runtime evidence matrix and remaining proof boundaries", () => {
    expect(canonicalDomainRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/seo typecheck",
      "pnpm --filter @inkroute/seo test",
      "pnpm --filter @inkroute/web build",
      "pnpm vitest run apps/web/tests/canonical-domain-runtime-static.test.ts apps/web/tests/sitemap-route.test.ts",
      "custom-domain canonical/redirect route tests",
      "runtime sitemap exclusion and noindex route tests",
      "duplicate canonical runtime tests",
    ]);
    expect(canonicalDomainRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "seo-typecheck",
      "seo-tests",
      "web-build",
      "static-contract",
      "tenant-domain-repository",
      "seo-redirect-repository",
      "custom-domain-route",
      "duplicate-canonical-runtime",
      "sitemap-noindex-crawl",
      "deployment-domain-proof",
      "ci-canonical-domain-job",
      "secret-safe-artifacts",
    ]);
    expect(canonicalDomainArtifactPaths).toContain("coverage/canonical-domain-runtime.json");
    expect(canonicalDomainArtifactPaths).toContain("test-results/canonical-domain-runtime");

    expect(canonicalDomainRuntimeReadiness.status).toBe("blocked");
    expect(canonicalDomainRuntimeReadiness.missingScripts).toEqual([]);
    expect(canonicalDomainRuntimeReadiness.requiredEvidence).toEqual(
      expect.arrayContaining([
        "tenant domain and SeoRedirect repository runtime evidence",
        "sitemap exclusion, noindex, and duplicate canonical runtime test evidence",
        "custom-domain route test and deployment-domain proof evidence",
      ]),
    );
    expect(canonicalDomainRuntimeReadiness.blockers).toEqual(
      expect.arrayContaining([
        "TenantDomain repository runtime evidence must be captured before canonical-domain readiness.",
        "SeoRedirect repository runtime evidence must be captured before canonical-domain readiness.",
        "Persisted SeoRedirect records must execute at runtime.",
        "Runtime sitemap must exclude draft, archived, private, and noindex content.",
        "Custom-domain route tests must pass.",
        "Duplicate canonical runtime tests must pass.",
        "Deployment-domain proof must show configured tenant primary and allowed hosts.",
      ]),
    );
    expect(canonicalDomainRuntimeReadiness.blockers).not.toContain("Tenant domain repository must be implemented.");
    expect(canonicalDomainRuntimeReadiness.blockers).not.toContain("SeoRedirect repository must be implemented.");
  });

  it("classifies GAP-072 canonical/domain evidence as blocked until every artifact is captured", () => {
    const blocked = buildCanonicalDomainEvidenceDecision({
      seoTypecheckPassed: true,
      seoTestsPassed: true,
      webBuildPassed: true,
      staticContractPassed: true,
      tenantDomainRepositoryVerified: false,
      seoRedirectRepositoryVerified: false,
      customDomainRouteTestsPassed: false,
      duplicateCanonicalRuntimePassed: false,
      sitemapNoindexCrawlPassed: false,
      deploymentDomainProofCaptured: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactReviewPassed: false,
      capturedArtifacts: ["coverage/canonical-domain-runtime.json"],
    });

    expect(blocked.status).toBe("blocked");
    expect(blocked.blockers).toEqual(
      expect.arrayContaining([
        "TenantDomain repository runtime evidence is required.",
        "SeoRedirect repository runtime evidence is required.",
        "Custom-domain canonical/redirect route evidence is required.",
        "Deployment-domain proof for primary and allowed hosts is required.",
      ]),
    );
    expect(blocked.missingArtifacts).toContain("coverage/canonical-domain-ci-evidence.json");
    expect(blocked.requiredCommands).toBe(canonicalDomainRuntimeCommands);
    expect(blocked.requiredEvidence).toBe(canonicalDomainDecisionRequiredEvidence);

    const complete = buildCanonicalDomainEvidenceDecision({
      seoTypecheckPassed: true,
      seoTestsPassed: true,
      webBuildPassed: true,
      staticContractPassed: true,
      tenantDomainRepositoryVerified: true,
      seoRedirectRepositoryVerified: true,
      customDomainRouteTestsPassed: true,
      duplicateCanonicalRuntimePassed: true,
      sitemapNoindexCrawlPassed: true,
      deploymentDomainProofCaptured: true,
      ciEvidenceCaptured: true,
      secretSafeArtifactReviewPassed: true,
      capturedArtifacts: canonicalDomainArtifactPaths,
    });

    expect(complete.status).toBe("complete");
    expect(complete.blockers).toEqual([]);
    expect(complete.missingArtifacts).toEqual([]);
    expect(complete.redactedSummary).toContain("CI-safe artifacts captured");
  });

  it("keeps CI, manifest, and tracker evidence tied to GAP-072", () => {
    expect(ciWorkflow).toContain("Run Phase 10 canonical/domain runtime contracts");
    expect(ciWorkflow).toContain("canonical-domain-runtime-static.test.ts");
    expect(ciWorkflow).toContain("canonical-domain-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-canonical-domain-runtime-static");
    expect(unitManifest).toContain("apps/web/lib/canonicalDomainRuntimeEvidence.ts");
    expect(gapTracker).toContain("local in-memory canonical domain repository contract");
    expect(gapTracker).toContain("canonicalDomainDecisionRequiredEvidence");
    expect(gapTracker).toContain("buildCanonicalDomainExecutionPlan");
    expect(gapTracker).toContain("buildRedactedCanonicalDomainArtifact");
    expect(gapTracker).toContain("buildCanonicalDomainArtifactReview");
    expect(gapTracker).toContain("non-executing canonical/domain execution policy");
    expect(gapTracker).toContain("Canonical-domain evidence classifier wired and runtime-matrix gated");
  });

  it("pins current canonical/domain proof files for GAP-072", () => {
    expect(canonicalDomainRuntimeProofFiles).toEqual(expect.arrayContaining([
      "apps/web/package.json",
      "packages/seo/package.json",
      "packages/seo/src/index.ts",
      "packages/seo/tests/seo-engine.test.ts",
      "apps/web/lib/seoEngine.ts",
      "apps/web/lib/canonicalRuntime.ts",
      "apps/web/lib/canonicalDomainRuntimeEvidence.ts",
      "apps/web/middleware.ts",
      "apps/web/app/sitemap.ts",
      "apps/web/app/cities/[citySlug]/page.tsx",
      "apps/web/app/styles/[styleSlug]/page.tsx",
      "apps/web/tests/sitemap-route.test.ts",
      "apps/web/tests/canonical-domain-runtime-static.test.ts",
      "packages/db/prisma/schema.prisma",
      ".github/workflows/ci.yml",
      "testing/manifests/unit-test-manifest.json",
    ]));
    for (const file of canonicalDomainRuntimeProofFiles) {
      expect(readFileSync(join(process.cwd(), file), "utf8").length).toBeGreaterThan(0);
    }
  });
});
