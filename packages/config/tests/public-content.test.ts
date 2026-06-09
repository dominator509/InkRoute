import { describe, expect, it } from "vitest";
import {
  buildPublicContentBundle,
  buildPublicContentRuntimeEvidencePlan,
  buildPortfolioImagePerformanceEvidencePlan,
  demoPortfolioItems,
  getPortfolioImageDerivative,
  inkrouteDemoTenant,
  normalizeTenantSlug,
} from "../src/index";

describe("public content bundle", () => {
  it("normalizes tenant slugs and rejects unknown tenants", () => {
    expect(normalizeTenantSlug(" InkRoute-Demo ")).toBe("inkroute-demo");
    expect(buildPublicContentBundle("unknown-studio")).toBeNull();
  });

  it("projects tenant-scoped public content without internal identifiers", () => {
    const bundle = buildPublicContentBundle(inkrouteDemoTenant.slug);

    expect(bundle).not.toBeNull();
    expect(bundle?.tenant).toEqual({
      slug: "inkroute-demo",
      name: "InkRoute Demo Studio",
      publicSiteName: "Mara Vale Tattoo",
      defaultTimezone: "America/Los_Angeles",
    });
    expect(JSON.stringify(bundle)).not.toContain("tenant_demo_nomad");
    expect(JSON.stringify(bundle)).not.toContain("artist_mara_vale");
    expect(JSON.stringify(bundle)).not.toContain("pf_orbital_serpent");
    expect(bundle?.redactedFields).toContain("portfolio.attributionKey");
  });

  it("includes only public portfolio projections with required image fields", () => {
    const bundle = buildPublicContentBundle(inkrouteDemoTenant.slug);

    expect(bundle?.portfolioItems).toHaveLength(demoPortfolioItems.filter((item) => item.isPublic !== false).length);
    expect(bundle?.portfolioItems.every((item) => item.slug && item.imageUrl && item.altText)).toBe(true);
    expect(bundle?.portfolioItems.every((item) => item.image.width > 0 && item.image.height > 0)).toBe(true);
    expect(bundle?.portfolioItems.every((item) => item.image.storageVisibility === "public_derivative")).toBe(true);
    expect(bundle?.portfolioItems.every((item) => item.image.privateOriginalAvailable === false)).toBe(true);
    expect(bundle?.portfolioItems[0]).not.toHaveProperty("id");
    expect(bundle?.portfolioItems[0]).not.toHaveProperty("tenantId");
    expect(bundle?.portfolioItems[0]).not.toHaveProperty("artistId");
    expect(bundle?.portfolioItems[0]).not.toHaveProperty("attributionKey");
  });

  it("derives public portfolio image metadata without exposing private originals", () => {
    const item = demoPortfolioItems[0];
    const derivative = getPortfolioImageDerivative(item);

    expect(derivative).toMatchObject({
      src: item.imageUrl,
      width: 1200,
      height: 1500,
      aspectRatio: "4:5",
      altText: item.altText,
      storageVisibility: "public_derivative",
      privateOriginalAvailable: false,
    });
    expect(derivative.cacheControl).toContain("stale-while-revalidate");
    expect(JSON.stringify(derivative)).not.toContain("tenant_private");
    expect(JSON.stringify(derivative)).not.toContain("client_private");
  });

  it("blocks portfolio image performance evidence until optimized derivatives, private-denial, browser, and Lighthouse proof exist", () => {
    const plan = buildPortfolioImagePerformanceEvidencePlan({
      packageScripts: { test: "vitest run --passWithNoTests" },
      configTestsPassed: true,
      configTypecheckPassed: false,
      webTypecheckPassed: false,
      webBuildPassed: false,
      realPublicDerivativeAssetsAvailable: false,
      storageBackedDerivativeFixturesAvailable: false,
      nextImageMigrationCompleted: false,
      derivativeDimensionsVerified: true,
      blurPlaceholdersGenerated: false,
      exifStrippingVerified: false,
      privateOriginalsSeparated: true,
      privateOriginalAccessDenied: false,
      browserRenderingVerified: false,
      lighthouseImageAuditPassed: false,
      ciArtifactsCaptured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toEqual(expect.arrayContaining([
      "portfolio image browser rendering smoke",
      "private original/reference access-denial tests",
      "Lighthouse image/performance audit",
    ]));
    expect(plan.requiredControls).toContain("Serve only public derivative objects from public portfolio cards.");
    expect(plan.requiredEvidence).toEqual(expect.arrayContaining([
      "real public derivative assets or storage-backed fixture manifest",
      "optimized image component, derivative metadata, blur placeholder, and EXIF-stripping proof",
      "private original/reference separation and public-access denial transcript",
      "web typecheck/build, browser rendering, Lighthouse, and CI artifact evidence",
    ]));
    expect(plan.blockers).toEqual(expect.arrayContaining([
      "Portfolio rendering must migrate to next/image or document an approved equivalent optimization path.",
      "Private original/reference access-denial tests must pass.",
      "Lighthouse image/performance audit must pass or document accepted image-specific exceptions.",
    ]));
  });

  it("marks portfolio image performance evidence ready when derivatives, private-denial, browser, and Lighthouse proof align", () => {
    const plan = buildPortfolioImagePerformanceEvidencePlan({
      packageScripts: { test: "vitest run --passWithNoTests", typecheck: "tsc --noEmit" },
      configTestsPassed: true,
      configTypecheckPassed: true,
      webTypecheckPassed: true,
      webBuildPassed: true,
      realPublicDerivativeAssetsAvailable: true,
      storageBackedDerivativeFixturesAvailable: true,
      nextImageMigrationCompleted: true,
      derivativeDimensionsVerified: true,
      blurPlaceholdersGenerated: true,
      exifStrippingVerified: true,
      privateOriginalsSeparated: true,
      privateOriginalAccessDenied: true,
      browserRenderingVerified: true,
      lighthouseImageAuditPassed: true,
      ciArtifactsCaptured: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
  });

  it("provides public travel and SEO collections with a cache policy", () => {
    const bundle = buildPublicContentBundle("inkroute-demo");

    expect(bundle?.travelStops.length).toBeGreaterThan(0);
    expect(bundle?.cityPages.length).toBeGreaterThan(0);
    expect(bundle?.stylePages.length).toBeGreaterThan(0);
    expect(bundle?.cachePolicy).toEqual({
      strategy: "static-demo",
      revalidateSeconds: 300,
    });
  });

  it("blocks public content runtime evidence until repository wiring, redaction, cache, browser, and CI proof exist", () => {
    const plan = buildPublicContentRuntimeEvidencePlan({
      packageScripts: { test: "vitest run --passWithNoTests" },
      configTestsPassed: true,
      configTypecheckPassed: false,
      webTypecheckPassed: false,
      webBuildPassed: false,
      tenantDomainResolverBackedByPersistence: false,
      publicRepositoryReadsConfigured: false,
      publicRoutesUseRepositoryBundle: false,
      cmsOrDatabaseSeedVerified: false,
      apiJsonRedactionVerified: false,
      renderedHtmlRedactionVerified: false,
      privatePortfolioExcluded: true,
      cacheRevalidationConfigured: false,
      browserSmokePassed: false,
      ciEvidenceCaptured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toEqual(expect.arrayContaining([
      "public content seeded DB/API redaction tests",
      "public content browser HTML redaction smoke",
      "public content cache revalidation smoke",
    ]));
    expect(plan.requiredEvidence).toEqual(expect.arrayContaining([
      "persistent tenant/domain resolver plus public repository route wiring map",
      "seeded DB or CMS public content read transcript",
      "public API JSON and rendered HTML private-field redaction proof",
      "public content cache revalidation configuration and invalidation smoke output",
      "web typecheck/build, browser smoke, and CI artifact evidence",
    ]));
    expect(plan.blockers).toEqual(expect.arrayContaining([
      "Tenant/domain resolver must be backed by persisted tenant records instead of static demo-only matching.",
      "Public API JSON must be proven free of tenant IDs, artist IDs, attribution keys, private object keys, plan/status fields, and non-public portfolio records.",
      "Browser smoke evidence must cover portfolio, travel, FAQ, testimonials, city, and style pages.",
    ]));
  });

  it("marks public content runtime evidence ready when persisted reads, redaction, cache, browser, and CI align", () => {
    const plan = buildPublicContentRuntimeEvidencePlan({
      packageScripts: { test: "vitest run --passWithNoTests", typecheck: "tsc --noEmit" },
      configTestsPassed: true,
      configTypecheckPassed: true,
      webTypecheckPassed: true,
      webBuildPassed: true,
      tenantDomainResolverBackedByPersistence: true,
      publicRepositoryReadsConfigured: true,
      publicRoutesUseRepositoryBundle: true,
      cmsOrDatabaseSeedVerified: true,
      apiJsonRedactionVerified: true,
      renderedHtmlRedactionVerified: true,
      privatePortfolioExcluded: true,
      cacheRevalidationConfigured: true,
      browserSmokePassed: true,
      ciEvidenceCaptured: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
  });
});
