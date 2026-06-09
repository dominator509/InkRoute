import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/error-reports/route.ts"), "utf8");
const pageSource = readFileSync(join(process.cwd(), "apps/dashboard/app/errors/page.tsx"), "utf8");

describe("dashboard error report route contract", () => {
  it("guards reads with RBAC, tenant scope, validation, and no-store cache policy", () => {
    expect(routeSource).toContain('assertPermission(actor, "error:read")');
    expect(routeSource).toContain("errorReportFilterSchema.safeParse");
    expect(routeSource).toContain('code: "TENANT_MISMATCH"');
    expect(routeSource).toContain('"Cache-Control": "no-store"');
  });

  it("uses tenant-scoped Prisma reads with read audit logging", () => {
    expect(routeSource).toContain("tx.errorReport.findMany");
    expect(routeSource).toContain("tx.auditLog.create");
    expect(routeSource).toContain('action: "error_report:read:list"');
    expect(routeSource).toContain('entityType: "ErrorReport"');
  });

  it("redacts metadata instead of exposing raw request payloads", () => {
    expect(routeSource).toContain("function redactMetadata");
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
    expect(pageSource).toContain("GET /api/error-reports");
    expect(pageSource).toContain("metadata-redacted reads");
    expect(pageSource).toContain("Capture providers are still scaffolded");
  });
});
