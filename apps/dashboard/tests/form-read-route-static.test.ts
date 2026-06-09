import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const listRouteSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/forms/route.ts"), "utf8");
const detailRouteSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/forms/[formId]/route.ts"), "utf8");
const formsPageSource = readFileSync(join(process.cwd(), "apps/dashboard/app/forms/page.tsx"), "utf8");
const authSource = readFileSync(join(process.cwd(), "packages/auth/src/index.ts"), "utf8");
const typesSource = readFileSync(join(process.cwd(), "packages/types/src/index.ts"), "utf8");

describe("dashboard form read route contract", () => {
  it("adds explicit form permissions to the shared RBAC vocabulary", () => {
    expect(typesSource).toContain('"form:read"');
    expect(typesSource).toContain('"form:write"');
    expect(authSource).toContain('"form:read"');
    expect(authSource).toContain('"form:write"');
  });

  it("guards form list and detail reads with RBAC, tenant scope, and no-store cache policy", () => {
    for (const source of [listRouteSource, detailRouteSource]) {
      expect(source).toContain('assertPermission(actor, "form:read")');
      expect(source).toContain('code: "FORBIDDEN"');
      expect(source).toContain("tenantId !== actor.tenantId");
      expect(source).toContain('code: "TENANT_MISMATCH"');
      expect(source).toContain('"Cache-Control": "no-store"');
    }
  });

  it("loads intake, consent, and medical safety metadata without returning raw private payloads", () => {
    expect(listRouteSource).toContain("tx.intakeForm.findMany");
    expect(listRouteSource).toContain("tx.consentForm.findMany");
    expect(listRouteSource).toContain("tx.medicalSafetyAcknowledgment.findMany");
    expect(detailRouteSource).toContain("tx.intakeForm.findFirst");
    expect(detailRouteSource).toContain("tx.consentForm.findFirst");

    for (const source of [listRouteSource, detailRouteSource]) {
      expect(source).toContain("tx.auditLog.create");
      expect(source).toContain('"answers"');
      expect(source).toContain('"signatureFileAssetId"');
      expect(source).toContain('"ipAddressHash"');
      expect(source).toContain('"userAgent"');
      expect(source).toContain('"acknowledgments"');
      expect(source).not.toContain("answers: true");
      expect(source).not.toContain("signatureFileAssetId: true");
      expect(source).not.toContain("signerEmail: true");
      expect(source).not.toContain("ipAddressHash: true");
      expect(source).not.toContain("userAgent: true");
      expect(source).not.toContain("acknowledgments: true");
    }
  });

  it("keeps local fallback and database outage states explicit", () => {
    for (const source of [listRouteSource, detailRouteSource]) {
      expect(source).toContain('persistence: "local-fallback"');
      expect(source).toContain('code: "DATABASE_UNAVAILABLE"');
      expect(source).toContain('"GAP-013"');
      expect(source).toContain('"GAP-040"');
    }
  });

  it("documents the wired form read API seam on the dashboard page", () => {
    expect(formsPageSource).toContain("Tenant-scoped redacted form read APIs now expose metadata");
    expect(formsPageSource).toContain("GET /api/forms");
    expect(formsPageSource).toContain("GET /api/forms/[formId]");
    expect(formsPageSource).toContain("attorney-reviewed copy remain gated");
  });
});
