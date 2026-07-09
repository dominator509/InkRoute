import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/error-reports/route.ts"), "utf8");
const pageSource = readFileSync(join(process.cwd(), "apps/dashboard/app/errors/page.tsx"), "utf8");
const actionPanelSource = readFileSync(join(process.cwd(), "apps/dashboard/components/ErrorAutomationActionPanel.tsx"), "utf8");
const errorDemoSource = readFileSync(join(process.cwd(), "apps/dashboard/lib/errorDemo.ts"), "utf8");

describe("dashboard error report route contract", () => {
  it("guards reads with RBAC, tenant scope, validation, and no-store cache policy", () => {
    expect(routeSource).toContain('assertPermission(actor, "error:read")');
    expect(routeSource).toContain("errorReportFilterSchema.safeParse");
    expect(routeSource).toContain('code: "TENANT_MISMATCH"');
    expect(routeSource).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(routeSource).toContain("headers: noStoreHeaders");
    expect(routeSource).not.toContain('headers: { "Cache-Control": "no-store" }');
    expect(routeSource).not.toContain('}, { status: 403 });');
  });

  it("uses tenant-scoped Prisma reads with read audit logging", () => {
    expect(routeSource).toContain("tx.errorReport.findMany");
    expect(routeSource).toContain("tx.auditLog.create");
    expect(routeSource).toContain('action: "error_report:read:list"');
    expect(routeSource).toContain('entityType: "ErrorReport"');
    expect(routeSource).toContain("auditLogged: true");
    expect(routeSource).toContain("auditIdEchoed: false");
    expect(routeSource).toContain("internalPersistenceIdsEchoed: false");
    expect(routeSource).toContain("function buildErrorReportResponseProjection");
    expect(routeSource).toContain("function buildSafeErrorReportReceipt");
    expect(routeSource).toContain("tenantIdEchoed: false");
    expect(routeSource).toContain("errorReportIdEchoed: false");
    expect(routeSource).toContain("errorReportIdsEchoed: false");
    expect(routeSource).toContain("rawMetadataEchoed: false");
    expect(routeSource).toContain("stackHashEchoed: false");
    expect(routeSource).toContain("stackHashStored: Boolean");
    expect(routeSource).toContain("reports: filtered.map((entry) => buildSafeErrorReportReceipt");
    expect(routeSource).toContain("reports: result.rows.map");
    expect(routeSource).toContain("report: buildSafeErrorReportReceipt");
    expect(routeSource).not.toContain("auditId: result.audit.id");
    expect(routeSource).not.toContain("auditId: persisted.audit.id");
    expect(routeSource).not.toContain("id: entry.id");
    expect(routeSource).not.toContain("tenantId: entry.tenantId");
    expect(routeSource).not.toContain("id: persisted.id");
    expect(routeSource).not.toContain("tenantId: persisted.tenantId");
    expect(routeSource).not.toContain("id: persisted.created.id");
    expect(routeSource).not.toContain("tenantId: persisted.created.tenantId");
  });

  it("redacts metadata instead of exposing raw request payloads", () => {
    expect(routeSource).toContain("function redactMetadata");
    expect(routeSource).toContain("function redactMetadataValue");
    expect(routeSource).toContain("redactMetadataValue(nestedKey, nestedValue)");
    expect(routeSource).toContain("redactedFields");
    expect(routeSource).toContain('"metadata"');
    expect(routeSource).toContain('"userAgent"');
    expect(routeSource).toContain('"token"');
    expect(routeSource).toContain("metadata: redactMetadata(entry.metadata)");
    expect(routeSource).not.toContain("metadata: typeof entry.metadata");
  });

  it("keeps local fallback and provider boundaries explicit", () => {
    expect(routeSource).toContain('persistence: "local-fallback"');
    expect(routeSource).toContain("isDatabaseUnavailable");
    expect(routeSource).toContain("PROVIDER_ERROR_REPORT_PERSISTENCE_NOT_CONFIGURED");
    expect(routeSource).toContain("localErrorReportFallbackDisabled");
    expect(pageSource).toContain("GET /api/error-reports");
    expect(pageSource).toContain("ErrorAutomationActionPanel");
    expect(actionPanelSource).toContain('fetch("/api/observability/github-issues"');
    expect(actionPanelSource).toContain("Create sanitized issue draft");
    expect(pageSource).toContain("metadata-redacted reads");
    expect(pageSource).toContain("Live capture providers remain credential-gated");
    expect(pageSource).toContain("Routing contract wired; provider delivery gated");
    expect(errorDemoSource).toContain("Payment webhook provider evidence is gated before live Stripe reconciliation");
    expect(errorDemoSource).toContain("Email webhook signature verification is provider-evidence gated");
    expect(errorDemoSource).toContain("statusCode: 503");
    expect(errorDemoSource).not.toContain("Payment webhook preview returned 501");
    expect(errorDemoSource).not.toContain("statusCode: 501");
    expect(pageSource).not.toContain("Capture providers are still scaffolded");
    expect(pageSource).not.toContain("Routing plan only");
  });

  it("applies no-store headers to dashboard error-report read and write responses", () => {
    expect(routeSource).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(routeSource).toContain("{ status: 403, headers: noStoreHeaders }");
    expect(routeSource).toContain("{ status: 400, headers: noStoreHeaders }");
    expect(routeSource).toContain("{ status: 503, headers: noStoreHeaders }");
    expect(routeSource).toContain("{ status: 201, headers: noStoreHeaders }");
    expect(routeSource).toContain("{ status: 500, headers: noStoreHeaders }");
  });
});
