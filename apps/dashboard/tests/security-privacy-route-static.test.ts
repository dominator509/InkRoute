import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/security/privacy-requests/route.ts"), "utf8");
const pageSource = readFileSync(join(process.cwd(), "apps/dashboard/app/trust/page.tsx"), "utf8");

describe("dashboard privacy request route static contract", () => {
  it("keeps privacy mutations tenant- and role-scoped with no-store responses", () => {
    expect(routeSource).toContain("resolveDashboardActor");
    expect(routeSource).toContain('request.headers.get("x-tenant-id")');
    expect(routeSource).toContain("allowedDashboardRoles");
    expect(routeSource).toContain("TENANT_SCOPE_REQUIRED");
    expect(routeSource).toContain("ROLE_NOT_AUTHORIZED");
    expect(routeSource).toContain('"Cache-Control": "no-store"');
  });

  it("validates, redacts, and rate-limits dashboard privacy submissions", () => {
    expect(routeSource).toContain("isPrivacyRequestType");
    expect(routeSource).toContain("redactRecord");
    expect(routeSource).toContain("buildPrivacyRequestDraft");
    expect(routeSource).toContain("checkDashboardMutationRateLimit");
    expect(routeSource).toContain("RATE_LIMIT_EXCEEDED");
    expect(routeSource).toContain('"Retry-After"');
  });

  it("keeps production workflow and audit-persistence gaps explicit", () => {
    expect(routeSource).toContain("Persist PrivacyRequest row + case notes");
    expect(routeSource).toContain("Implement verified export/delete/rectification workers");
    expect(routeSource).toContain("Review workflow, consent text, and customer-facing language with counsel");
    expect(pageSource).toContain("POST /api/security/privacy-requests");
    expect(pageSource).toContain("privacy workers");
    expect(pageSource).toContain("audit persistence");
  });
});
