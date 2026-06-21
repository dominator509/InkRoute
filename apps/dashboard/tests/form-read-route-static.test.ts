import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const listRouteSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/forms/route.ts"), "utf8");
const detailRouteSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/forms/[formId]/route.ts"), "utf8");
const formsPageSource = readFileSync(join(process.cwd(), "apps/dashboard/app/forms/page.tsx"), "utf8");
const formActionPanelSource = readFileSync(join(process.cwd(), "apps/dashboard/components/FormActionPanel.tsx"), "utf8");
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
      expect(source).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
      expect(source).not.toContain('}, { status: 403 });');
      expect(source).not.toContain('}, { status: 500 });');
    }
    expect(detailRouteSource).not.toContain('}, { status: 404, headers: { "Cache-Control": "no-store" } });');
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
      expect(source).toContain("PROVIDER_DASHBOARD_READS_NOT_CONFIGURED");
      expect(source).toContain("localDashboardReadFallbackDisabled");
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

  it("wires an archive-only form metadata write seam without legal copy or signature side effects", () => {
    expect(detailRouteSource).toContain("export async function PATCH");
    expect(detailRouteSource).toContain('assertPermission(actor, "form:write")');
    expect(detailRouteSource).toContain("archive_form_version");
    expect(detailRouteSource).toContain("PROVIDER_FORM_WRITE_PERSISTENCE_NOT_CONFIGURED");
    expect(detailRouteSource).toContain("localFormWriteFallbackDisabled");
    expect(detailRouteSource).toContain("tx.intakeForm.update");
    expect(detailRouteSource).toContain("tx.consentForm.update");
    expect(detailRouteSource).toContain("tx.auditLog.create");
    expect(detailRouteSource).toContain('action: "form:write:archive"');
    expect(detailRouteSource).toContain("legalCopyChanged: false");
    expect(detailRouteSource).toContain("signatureRequestSent: false");
    expect(detailRouteSource).toContain("rawAnswersTouched: false");
    expect(formsPageSource).toContain("FormActionPanel");
    expect(formActionPanelSource).toContain('fetch("/api/forms/local-consent-form"');
    expect(formActionPanelSource).toContain('action: "archive_form_version"');
    expect(formActionPanelSource).toContain("Archive form draft");
    expect(formActionPanelSource).toContain("archive metadata contract");
    expect(formActionPanelSource).toContain("form publishing, signature requests, private upload retention, and attorney-reviewed copy remain evidence-gated");
    expect(formActionPanelSource).toContain("Consent publishing, signature requests, private upload retention, and raw medical payload handling stay evidence-gated");
    expect(formActionPanelSource).not.toContain("This action only archives form metadata");
  });
});
