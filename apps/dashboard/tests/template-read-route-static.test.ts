import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/templates/route.ts"), "utf8");
const templatesPageSource = readFileSync(join(process.cwd(), "apps/dashboard/app/templates/page.tsx"), "utf8");
const schedulerActionPanelSource = readFileSync(
  join(process.cwd(), "apps/dashboard/components/NotificationSchedulerActionPanel.tsx"),
  "utf8",
);
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
    expect(routeSource).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(routeSource).not.toContain('}, { status: 403 });');
    expect(routeSource).not.toContain('}, { status: 500 });');
  });

  it("exposes coded template metadata and tenant-scoped queue summaries while auditing reads", () => {
    expect(routeSource).toContain("notificationTemplateCatalog");
    expect(routeSource).toContain("dashboardNotificationAutomationSequence");
    expect(routeSource).toContain("dashboardProviderBoundaryMatrix");
    expect(routeSource).toContain("tx.notification.findMany");
    expect(routeSource).toContain("tx.notificationDelivery.findMany");
    expect(routeSource).toContain("tx.auditLog.create");
    expect(routeSource).toContain('action: "notification:read:templates"');
    expect(routeSource).toContain("auditLogged: true");
    expect(routeSource).toContain("auditIdEchoed: false");
    expect(routeSource).toContain("internalPersistenceIdsEchoed: false");
    expect(routeSource).toContain("function buildTemplateReadResponseProjection");
    expect(routeSource).toContain("tenantIdEchoed: false");
    expect(routeSource).toContain("notificationIdsEchoed: false");
    expect(routeSource).toContain("deliveryIdsEchoed: false");
    expect(routeSource).toContain("clientIdsEchoed: false");
    expect(routeSource).toContain("bookingRequestIdsEchoed: false");
    expect(routeSource).toContain("appointmentIdsEchoed: false");
    expect(routeSource).toContain("providerErrorEchoed: false");
    expect(routeSource).toContain("clientLinked: Boolean(notification.clientId)");
    expect(routeSource).toContain("notificationLinked: Boolean(delivery.notificationId)");
    expect(routeSource).not.toContain("auditId: result.audit.id");
    expect(routeSource).not.toContain("id: notification.id");
    expect(routeSource).not.toContain("clientId: notification.clientId");
    expect(routeSource).not.toContain("bookingRequestId: notification.bookingRequestId");
    expect(routeSource).not.toContain("appointmentId: notification.appointmentId");
    expect(routeSource).not.toContain("id: delivery.id");
    expect(routeSource).not.toContain("notificationId: delivery.notificationId");
  });

  it("redacts notification bodies, destination hashes, provider IDs, and provider errors", () => {
    expect(routeSource).toContain('"notification.body"');
    expect(routeSource).toContain('"destinationHash"');
    expect(routeSource).toContain('"providerMessageId"');
    expect(routeSource).toContain('"errorMessage"');
    expect(routeSource).not.toContain("body: true");
    expect(routeSource).not.toContain("destinationHash: true");
    expect(routeSource).not.toContain("providerMessageId: true");
    expect(routeSource).not.toContain("errorMessage: true");
    expect(routeSource).toContain('bodyPreview: "[redacted-notification-body]"');
    expect(routeSource).toContain("bodySelectedFromDatabase: false");
    expect(routeSource).not.toContain("destinationHash: delivery.destinationHash");
    expect(routeSource).toContain('destinationHash: "[redacted-dashboard-field]"');
    expect(routeSource).toContain("destinationHashSelectedFromDatabase: false");
    expect(routeSource).toContain('providerMessageId: "[redacted-dashboard-field]"');
    expect(routeSource).toContain("providerMessageIdSelectedFromDatabase: false");
    expect(routeSource).toContain('errorMessage: "[redacted-dashboard-field]"');
    expect(routeSource).toContain("errorMessageSelectedFromDatabase: false");
  });

  it("keeps local fallback and database outage states explicit", () => {
    expect(routeSource).toContain("dashboardRedactedProviderSendDrafts");
    expect(routeSource).toContain('persistence: "local-fallback"');
    expect(routeSource).toContain("PROVIDER_DASHBOARD_READS_NOT_CONFIGURED");
    expect(routeSource).toContain("localDashboardReadFallbackDisabled");
    expect(routeSource).toContain('code: "DATABASE_UNAVAILABLE"');
  });

  it("documents the wired template read API seam on the dashboard page", () => {
    expect(templatesPageSource).toContain("tenant-scoped redacted template API");
    expect(templatesPageSource).toContain("GET /api/templates");
    expect(templatesPageSource).toContain("redacted queue/delivery summaries");
    expect(templatesPageSource).toContain("local scheduler action contract");
    expect(templatesPageSource).toContain("provider credentials");
    expect(templatesPageSource).toContain("NotificationSchedulerActionPanel");
    expect(templatesPageSource).not.toContain("renders templates and delivery plans only");
    expect(schedulerActionPanelSource).toContain('fetch("/api/notifications/scheduler"');
    expect(schedulerActionPanelSource).toContain('action: "schedule_sequence"');
    expect(schedulerActionPanelSource).toContain("provider sends, queue persistence, retries, dead letters, and delivery reconciliation remain gated");
  });
});
