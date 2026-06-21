import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/security/privacy-requests/route.ts"), "utf8");
const pageSource = readFileSync(join(process.cwd(), "apps/dashboard/app/trust/page.tsx"), "utf8");
const actionPanelSource = readFileSync(join(process.cwd(), "apps/dashboard/components/PrivacyRequestActionPanel.tsx"), "utf8");

describe("dashboard privacy request route static contract", () => {
  it("keeps privacy mutations tenant- and role-scoped with no-store responses", () => {
    expect(routeSource).toContain("resolveDashboardActor");
    expect(routeSource).toContain('request.headers.get("x-tenant-id")');
    expect(routeSource).toContain("allowedDashboardRoles");
    expect(routeSource).toContain("function normalizeHeaderValue(value: string | null): string | null");
    expect(routeSource).toContain("const fallbackRole = \"viewer\";");
    expect(routeSource).toContain("const defaultDemoActorId = \"demo-dashboard-user\";");
    expect(routeSource).toContain("const normalizedRole = role.toLowerCase()");
    expect(routeSource).toContain("TENANT_SCOPE_REQUIRED");
    expect(routeSource).toContain("ROLE_NOT_AUTHORIZED");
    expect(routeSource).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(routeSource).toContain("headers: noStoreHeaders");
    expect(routeSource).not.toContain('headers: { "Cache-Control": "no-store" }');
  });

  it("validates, redacts, and rate-limits dashboard privacy submissions", () => {
    expect(routeSource).toContain("isPrivacyRequestType");
    expect(routeSource).toContain("redactRecord");
    expect(routeSource).toContain("buildPrivacyRequestDraft");
    expect(routeSource).toContain("checkDashboardMutationRateLimit");
    expect(routeSource).toContain("RATE_LIMIT_EXCEEDED");
    expect(routeSource).toContain("function rateLimitHeaders");
    expect(routeSource).toContain("headers: rateLimitHeaders(rateLimit.retryAfterSeconds)");
    expect(routeSource).toContain('"Retry-After"');
    expect(routeSource).toContain("DASHBOARD_PRIVACY_REQUEST_PERSISTENCE_NOT_CONFIGURED");
    expect(routeSource).toContain("inMemoryPrivacyRequestPersistenceDisabled");
    expect(routeSource).toContain("requiresDurablePrivacyRequestStore");
  });

  it("keeps production workflow and audit-persistence gaps explicit", () => {
    expect(routeSource).toContain("Persist PrivacyRequest row + case notes");
    expect(routeSource).toContain("Implement verified export/delete/rectification workers");
    expect(routeSource).toContain("Review workflow, consent text, and customer-facing language with counsel");
    expect(pageSource).toContain("POST /api/security/privacy-requests");
    expect(pageSource).toContain("PrivacyRequestActionPanel");
    expect(actionPanelSource).toContain('fetch("/api/security/privacy-requests"');
    expect(actionPanelSource).toContain("Submit privacy access draft");
    expect(actionPanelSource).toContain("Production durable privacy workers, audit persistence, storage export/delete, and attorney-reviewed policy text remain evidence-gated.");
    expect(pageSource).toContain("privacy workers");
    expect(pageSource).toContain("audit persistence");
  });
});
