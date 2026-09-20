import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { rateLimitRules } from "@inkroute/security";
import { checkRateLimit } from "../lib/localRuntimeState";

const readSource = (path: string): string => readFileSync(join(process.cwd(), path), "utf8");

describe("rate-limit fail-closed hardening", () => {
  it("denies requests when the rule id is unknown instead of leaving the route unmetered", () => {
    const decision = checkRateLimit("rule-that-does-not-exist", "demo", "1.2.3.4:tenant_demo");

    expect(decision.allowed).toBe(false);
    expect(decision.status).toBe("rule_not_found");
    expect(decision.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("defines dedicated rules for the public deposit-session and waitlist routes", () => {
    const depositRule = rateLimitRules.find((rule) => rule.id === "public-deposit-session");
    const waitlistRule = rateLimitRules.find((rule) => rule.id === "public-waitlist-submit");

    expect(depositRule).toBeDefined();
    expect(depositRule?.maxRequests).toBeGreaterThan(0);
    expect(depositRule?.windowSeconds).toBeGreaterThan(0);
    expect(waitlistRule).toBeDefined();
    expect(waitlistRule?.maxRequests).toBeGreaterThan(0);
    expect(waitlistRule?.windowSeconds).toBeGreaterThan(0);
  });

  it("allows metered requests under the threshold and throttles above it", () => {
    const identifier = `fail-closed-test-${Date.now()}-deposit`;
    const first = checkRateLimit("public-deposit-session", "demo", identifier);
    expect(first.allowed).toBe(true);
    expect(first.status).toBe("allow");

    let last = first;
    for (let attempt = 0; attempt < 7; attempt += 1) {
      last = checkRateLimit("public-deposit-session", "demo", identifier);
    }
    expect(last.allowed).toBe(false);
    expect(last.status).toBe("throttle");
  });

  it("wires public routes only to rate-limit rules that exist", () => {
    const knownRuleIds = new Set(rateLimitRules.map((rule) => rule.id));
    const routeFiles = [
      "apps/web/app/api/public/[tenantSlug]/booking-requests/route.ts",
      "apps/web/app/api/public/[tenantSlug]/contact/route.ts",
      "apps/web/app/api/public/[tenantSlug]/deposit-sessions/route.ts",
      "apps/web/app/api/public/[tenantSlug]/error-reports/route.ts",
      "apps/web/app/api/public/[tenantSlug]/messages/route.ts",
      "apps/web/app/api/public/[tenantSlug]/privacy-requests/route.ts",
      "apps/web/app/api/public/[tenantSlug]/secure-upload-intents/route.ts",
      "apps/web/app/api/public/[tenantSlug]/waitlists/route.ts",
    ];

    for (const routeFile of routeFiles) {
      const source = readSource(routeFile);
      const matches = [...source.matchAll(/checkRateLimit\("([^"]+)"/g)];
      expect(matches.length).toBeGreaterThan(0);
      for (const match of matches) {
        const ruleId = match[1];
        expect(ruleId).toBeDefined();
        expect(knownRuleIds.has(ruleId as string), `${routeFile} references unknown rate-limit rule "${ruleId}"`).toBe(true);
      }
    }
  });
});
