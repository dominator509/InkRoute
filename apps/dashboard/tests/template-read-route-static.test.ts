import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/templates/route.ts"), "utf8");
const templatesPageSource = readFileSync(join(process.cwd(), "apps/dashboard/app/templates/page.tsx"), "utf8");
const authSource = readFileSync(join(process.cwd(), "packages/auth/src/index.ts"), "utf8");
const typesSource = readFileSync(join(process.cwd(), "packages/types/src/index.ts"), "utf8");

describe("dashboard notification template read route contract", () => {
  it("adds explicit notification permissions to the shared RBAC vocabulary", () => {
    expect(typesSource).toContain('"notification:read"');
    expect(typesSource).toContain('"notification:write"');
    expect(authSource).toContain('"notification:read"');
    expect(authSource).toContain('"notification:write"');
  });

  it("guards template reads with RBAC, tenant scope, and no-store cache policy", () => {
    expect(routeSource).toContain('assertPermission(actor, "notification:read")');
    expect(routeSource).toContain('code: "FORBIDDEN"');
    expect(routeSource).toContain("tenantId !== actor.tenantId");
    expect(routeSource).toContain('code: "TENANT_MISMATCH"');
    expect(routeSource).toContain('"Cache-Control": "no-store"');
  });

  it("exposes coded template metadata and tenant-scoped queue summaries while auditing reads", () => {
    expect(routeSource).toContain("notificationTemplateCatalog");
    expect(routeSource).toContain("dashboardNotificationAutomationSequence");
    expect(routeSource).toContain("dashboardProviderBoundaryMatrix");
    expect(routeSource).toContain("tx.notification.findMany");
    expect(routeSource).toContain("tx.notificationDelivery.findMany");
    expect(routeSource).toContain("tx.auditLog.create");
    expect(routeSource).toContain('action: "notification:read:templates"');
  });

  it("redacts notification bodies, destination hashes, provider IDs, and provider errors", () => {
    expect(routeSource).toContain("redactBodyPreview");
    expect(routeSource).toContain('"notification.body"');
    expect(routeSource).toContain('"destinationHash"');
    expect(routeSource).toContain('"providerMessageId"');
    expect(routeSource).toContain('"errorMessage"');
    expect(routeSource).not.toContain("body: true");
    expect(routeSource).not.toContain("destinationHash: delivery.destinationHash");
    expect(routeSource).toContain('destinationHash: delivery.destinationHash ? "[redacted-dashboard-field]" : null');
    expect(routeSource).toContain('providerMessageId: delivery.providerMessageId ? "[redacted-dashboard-field]" : null');
    expect(routeSource).toContain('errorMessage: delivery.errorMessage ? "[redacted-dashboard-field]" : null');
  });

  it("keeps local fallback and database outage states explicit", () => {
    expect(routeSource).toContain("dashboardRedactedProviderSendDrafts");
    expect(routeSource).toContain('persistence: "local-fallback"');
    expect(routeSource).toContain('code: "DATABASE_UNAVAILABLE"');
  });

  it("documents the wired template read API seam on the dashboard page", () => {
    expect(templatesPageSource).toContain("tenant-scoped redacted template API");
    expect(templatesPageSource).toContain("GET /api/templates");
    expect(templatesPageSource).toContain("redacted queue/delivery summaries");
    expect(templatesPageSource).toContain("provider credentials");
  });
});
