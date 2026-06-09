import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  canonicalUrlForPath,
  evaluatePublicCanonicalRequest,
  publicSeoRedirectRules,
  publicTenantCanonicalDomains,
} from "../lib/canonicalRuntime";

const middlewareSource = readFileSync(join(process.cwd(), "apps/web/middleware.ts"), "utf8");
const cityPageSource = readFileSync(join(process.cwd(), "apps/web/app/cities/[citySlug]/page.tsx"), "utf8");
const stylePageSource = readFileSync(join(process.cwd(), "apps/web/app/styles/[styleSlug]/page.tsx"), "utf8");

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
});
