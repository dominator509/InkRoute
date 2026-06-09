import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  canonicalUrlForPath,
  evaluatePublicCanonicalRequest,
  publicSeoRedirectRules,
  publicTenantCanonicalDomains,
} from "../lib/canonicalRuntime";
import {
  canonicalDomainArtifactPaths,
  canonicalDomainRuntimeCommands,
  canonicalDomainRuntimeMatrix,
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
        "Tenant domain repository must be implemented.",
        "SeoRedirect repository must be implemented.",
        "Persisted SeoRedirect records must execute at runtime.",
        "Runtime sitemap must exclude draft, archived, private, and noindex content.",
        "Custom-domain route tests must pass.",
        "Duplicate canonical runtime tests must pass.",
        "Deployment-domain proof must show configured tenant primary and allowed hosts.",
      ]),
    );
  });

  it("keeps CI, manifest, and tracker evidence tied to GAP-072", () => {
    expect(ciWorkflow).toContain("Run Phase 10 canonical/domain runtime contracts");
    expect(ciWorkflow).toContain("canonical-domain-runtime-static.test.ts");
    expect(ciWorkflow).toContain("canonical-domain-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-canonical-domain-runtime-static");
    expect(unitManifest).toContain("apps/web/lib/canonicalDomainRuntimeEvidence.ts");
    expect(gapTracker).toContain("GAP-072 is canonical-domain-runtime-matrix wired");
  });
});
