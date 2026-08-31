import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const listRouteSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/messages/route.ts"), "utf8");
const detailRouteSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/messages/[threadId]/route.ts"), "utf8");
const messagesPageSource = readFileSync(join(process.cwd(), "apps/dashboard/app/messages/page.tsx"), "utf8");
const authSource = readFileSync(join(process.cwd(), "packages/auth/src/index.ts"), "utf8");
const typesSource = readFileSync(join(process.cwd(), "packages/types/src/index.ts"), "utf8");

describe("dashboard message read route contract", () => {
  it("adds explicit message permissions to the shared RBAC vocabulary", () => {
    expect(typesSource).toContain('"message:read"');
    expect(typesSource).toContain('"message:write"');
    expect(authSource).toContain('"message:read"');
    expect(authSource).toContain('"message:write"');
  });

  it("guards message list and detail reads with RBAC, tenant scope, and no-store cache policy", () => {
    for (const source of [listRouteSource, detailRouteSource]) {
      expect(source).toContain('assertPermission(actor, "message:read")');
      expect(source).toContain('code: "FORBIDDEN"');
      expect(source).toContain("tenantId !== actor.tenantId");
      expect(source).toContain('code: "TENANT_MISMATCH"');
      expect(source).toContain('"Cache-Control": "no-store"');
      expect(source).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
      expect(source).not.toContain('}, { status: 403 });');
      expect(source).not.toContain('}, { status: 500 });');
    }
    expect(detailRouteSource).not.toContain('}, { status: 404 });');
    expect(listRouteSource).toContain("dashboardListQuerySchema.safeParse");
    expect(listRouteSource).toContain('code: "VALIDATION_FAILED"');
    expect(listRouteSource).toContain("query.data.limit");
  });

  it("uses Prisma message-thread reads with body/provider/contact redaction and audit logs", () => {
    expect(listRouteSource).toContain("tx.messageThread.findMany");
    expect(detailRouteSource).toContain("tx.messageThread.findFirst");

    for (const source of [listRouteSource, detailRouteSource]) {
      expect(source).toContain("tx.auditLog.create");
      expect(source).toContain("auditLogged: true");
      expect(source).toContain("auditIdEchoed: false");
      expect(source).toContain("internalPersistenceIdsEchoed: false");
      expect(source).not.toContain("auditId: result.audit.id");
      expect(source).toContain("redactedFields");
      expect(source).toContain('"message.body"');
      expect(source).toContain('"providerMessageId"');
      expect(source).toContain('"client.email"');
      expect(source).toContain('"client.phone"');
      expect(source).toContain("clientEmailSelectedFromDatabase: false");
      expect(source).toContain("clientPhoneSelectedFromDatabase: false");
      expect(source).not.toContain("email: true, phone: true");
      expect(source).not.toContain("body: true");
      expect(source).not.toContain("providerMessageId: true");
      expect(source).toContain('bodyPreview: "[redacted-message-body]"');
      expect(source).toContain("bodySelectedFromDatabase: false");
      expect(source).toContain('providerMessageId:');
      expect(source).toContain("providerMessageIdSelectedFromDatabase: false");
      expect(source).toContain('"[redacted-dashboard-field]"');
    }
    expect(detailRouteSource).toContain("threadIdEchoed: false");
    expect(detailRouteSource).toContain("function buildMessageThreadDetailResponseProjection");
    expect(detailRouteSource).toContain("function buildSafeLocalMessageThreadDetail");
    expect(detailRouteSource).toContain("tenantIdEchoed: false");
    expect(detailRouteSource).toContain("clientIdEchoed: false");
    expect(detailRouteSource).toContain("bookingRequestIdEchoed: false");
    expect(detailRouteSource).toContain("appointmentIdEchoed: false");
    expect(detailRouteSource).toContain("messageIdsEchoed: false");
    expect(detailRouteSource).toContain("senderIdsEchoed: false");
    expect(detailRouteSource).toContain("tenantScope: { actorTenantMatched: true");
    expect(detailRouteSource).toContain("threadTenantMatched: true");
    expect(listRouteSource).toContain("buildSafeMessageThreadListRecord");
    expect(listRouteSource).toContain("function buildMessageThreadListResponseProjection");
    expect(listRouteSource).toContain("threadIdsEchoed: false");
    expect(listRouteSource).toContain("tenantIdEchoed: false");
    expect(listRouteSource).toContain("clientIdsEchoed: false");
    expect(listRouteSource).toContain("bookingRequestIdsEchoed: false");
    expect(listRouteSource).toContain("appointmentIdsEchoed: false");
    expect(listRouteSource).toContain("messageIdsEchoed: false");
    expect(listRouteSource).toContain("senderIdsEchoed: false");
    expect(listRouteSource).toContain("auditIdEchoed: false");
    expect(listRouteSource).toContain("tenantScope: { actorTenantMatched: true }");
    expect(listRouteSource).toContain("clientLinked: Boolean");
    expect(listRouteSource).toContain("bookingLinked: Boolean");
    expect(listRouteSource).toContain("appointmentLinked: Boolean");
    expect(listRouteSource).not.toContain("id: row.id");
    expect(listRouteSource).not.toContain("tenantId: row.tenantId");
    expect(listRouteSource).not.toContain("clientId: row.clientId");
    expect(listRouteSource).not.toContain("bookingRequestId: row.bookingRequestId");
    expect(listRouteSource).not.toContain("appointmentId: row.appointmentId");
    expect(listRouteSource).not.toContain("id: latest.id");
    expect(listRouteSource).not.toContain("tenantId,\n          error:");
    expect(detailRouteSource).toContain("clientLinked: Boolean(result.row.clientId)");
    expect(detailRouteSource).toContain("bookingLinked: Boolean(result.row.bookingRequestId)");
    expect(detailRouteSource).toContain("appointmentLinked: Boolean(result.row.appointmentId)");
    expect(detailRouteSource).toContain("senderType: message.senderUserId ? \"dashboard-user\" : message.senderClientId ? \"client\" : \"system\"");
    expect(detailRouteSource).not.toContain("id: result.row.id");
    expect(detailRouteSource).not.toContain("tenantId: result.row.tenantId");
    expect(detailRouteSource).not.toContain("clientId: result.row.clientId");
    expect(detailRouteSource).not.toContain("bookingRequestId: result.row.bookingRequestId");
    expect(detailRouteSource).not.toContain("appointmentId: result.row.appointmentId");
    expect(detailRouteSource).not.toContain("id: message.id");
    expect(detailRouteSource).not.toContain("senderUserId: message.senderUserId");
    expect(detailRouteSource).not.toContain("tenantId,\n          error:");
    expect(detailRouteSource).not.toContain("tenantId,\n        persistence");
    expect(detailRouteSource).not.toContain("senderClientId: message.senderClientId");
  });

  it("keeps local fallback redacted and database outage states explicit", () => {
    for (const source of [listRouteSource, detailRouteSource]) {
      expect(source).toContain("dashboardRedactedMessageThreadDrafts");
      expect(source).toContain('persistence: "local-fallback"');
      expect(source).toContain("PROVIDER_DASHBOARD_READS_NOT_CONFIGURED");
      expect(source).toContain("localDashboardReadFallbackDisabled");
      expect(source).toContain('code: "DATABASE_UNAVAILABLE"');
    }
  });

  it("disables local fallback message write plans in production", () => {
    expect(listRouteSource).toContain("PROVIDER_DASHBOARD_WRITES_NOT_CONFIGURED");
    expect(listRouteSource).toContain("localDashboardWriteFallbackDisabled");
  });

  it("redacts dashboard message write plans before response projection", () => {
    expect(listRouteSource).toContain("function buildSafeDashboardMessagePlanResponse");
    expect(listRouteSource).toContain("rawBodyEchoed: false");
    expect(listRouteSource).toContain("destinationHash: \"[redacted-destination-hash]\"");
    expect(listRouteSource).toContain("destinationHashEchoed: false");
    expect(listRouteSource).toContain("idempotencyKeyEchoed: false");
    expect(listRouteSource).toContain("plan: buildSafeDashboardMessagePlanResponse(plan)");
    expect(listRouteSource).toContain("rawMessageBodyEchoed: false");
    expect(listRouteSource).toContain("rawDestinationHashEchoed: false");
    expect(listRouteSource).toContain("rawIdempotencyKeyEchoed: false");
    expect(listRouteSource).toContain("writesPersisted: true");
    expect(listRouteSource).toContain("messageIdEchoed: false");
    expect(listRouteSource).toContain("notificationIdEchoed: false");
    expect(listRouteSource).toContain("deliveryIdEchoed: false");
    expect(listRouteSource).toContain("providerHandoffIdEchoed: false");
    expect(listRouteSource).toContain("internalPersistenceIdsEchoed: false");
    expect(listRouteSource).toContain("internalPersistenceIdsStored: false");
    expect(listRouteSource).toContain("threadPersisted: true");
    expect(listRouteSource).toContain("messagePersisted: true");
    expect(listRouteSource).toContain("notificationPersisted: true");
    expect(listRouteSource).toContain("deliveryPersisted: true");
    expect(listRouteSource).not.toContain("ids: {");
    expect(listRouteSource).not.toContain("auditId: result.audit.id");
    expect(listRouteSource).not.toContain(
      'sanitizedPayload: {\n            action: "message:write:create_thread_message",\n            source: "dashboard-api",\n            threadId: thread.id',
    );
    expect(listRouteSource).not.toContain(
      'sanitizedPayload: {\n            action: "message:write:create_thread_message",\n            source: "dashboard-api",\n            threadId: thread.id,\n            messageId: message.id',
    );
    expect(listRouteSource).not.toContain(" plan }, { status: 400");
    expect(listRouteSource).not.toContain(" plan,");
  });

  it("documents that message reads are wired while provider sends remain gated", () => {
    expect(messagesPageSource).toContain("Tenant-scoped redacted message read APIs now exist");
    expect(messagesPageSource).toContain("Read APIs wired");
    expect(messagesPageSource).toContain("Message thread reads now enforce message RBAC");
    expect(messagesPageSource).toContain("tenant scope");
    expect(messagesPageSource).toContain("Production sends still require inbound email/SMS routing");
  });
});
