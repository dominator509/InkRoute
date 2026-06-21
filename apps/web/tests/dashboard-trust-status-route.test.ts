import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../../dashboard/app/api/security/trust-status/route";

function trustStatusRequest(tenantId = "demo-studio-alpha", role = "studio_manager", userId = "trust-reader-1"): NextRequest {
  return new NextRequest("https://local.test/api/dashboard/security/trust-status", {
    method: "GET",
    headers: {
      "x-tenant-id": tenantId,
      "x-user-role": role,
      "x-user-id": userId,
    },
  });
}

describe("dashboard trust status route", () => {
  it("returns tenant-scoped security posture for allowed dashboard readers", async () => {
    const response = await GET(trustStatusRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.tenantId).toBe("demo-studio-alpha");
    expect(body.actor).toMatchObject({ userId: "trust-reader-1", role: "studio_manager" });
    expect(body.summary).toBeDefined();
    expect(body.securityHeaders.length).toBeGreaterThan(0);
    expect(body.tenantIsolationFixtures).toBeDefined();
    expect(body.gapIds).toContain("GAP-103");
  });

  it("fail-closes production trust previews without provider-backed session evidence", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    try {
      const response = await GET(trustStatusRequest("demo-studio-alpha", "studio_manager", "trust-production-reader"));
      const body = await response.json();

      expect(response.status).toBe(503);
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe("DASHBOARD_TRUST_STATUS_PROVIDER_AUTH_NOT_CONFIGURED");
      expect(body.error.message).toContain("header-only trust previews are disabled until provider-backed session evidence is captured");
      expect(body.productionBoundary.scaffoldedTrustPreviewDisabled).toBe(true);
      expect(body.productionBoundary.requiresProviderBackedSession).toBe(true);
      expect(body.productionBoundary.requiresSecurityRuntimeEvidence).toBe(true);
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it("denies trust status reads without matching tenant scope", async () => {
    const response = await GET(trustStatusRequest("other-tenant", "studio_manager", "cross-tenant-reader"));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toMatchObject({
      ok: false,
      error: { code: "TENANT_SCOPE_REQUIRED" },
    });
  });

  it("denies trust status reads for roles outside the security posture allowlist", async () => {
    const response = await GET(trustStatusRequest("demo-studio-alpha", "viewer", "viewer-reader"));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toMatchObject({
      ok: false,
      error: { code: "ROLE_NOT_AUTHORIZED" },
    });
  });
});
