import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const listRouteSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/clients/route.ts"), "utf8");
const detailRouteSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/clients/[clientId]/route.ts"), "utf8");
const listPageSource = readFileSync(join(process.cwd(), "apps/dashboard/app/clients/page.tsx"), "utf8");
const detailPageSource = readFileSync(join(process.cwd(), "apps/dashboard/app/clients/[clientId]/page.tsx"), "utf8");
const detailActionPanelSource = readFileSync(
  join(process.cwd(), "apps/dashboard/components/ClientDetailActionPanel.tsx"),
  "utf8",
);

describe("dashboard client read route contract", () => {
  it("guards client list and detail reads with RBAC, tenant scope, and no-store cache policy", () => {
    for (const source of [listRouteSource, detailRouteSource]) {
      expect(source).toContain('assertPermission(actor, "client:read")');
      expect(source).toContain('code: "FORBIDDEN"');
      expect(source).toContain("tenantId !== actor.tenantId");
      expect(source).toContain('code: "TENANT_MISMATCH"');
      expect(source).toContain('"Cache-Control": "no-store"');
    }

    expect(detailRouteSource).toContain("dashboardTenantQuerySchema.safeParse");
    expect(detailRouteSource).toContain('code: "VALIDATION_FAILED"');
    expect(listRouteSource).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(listRouteSource).not.toContain('}, { status: 403 });');
    expect(listRouteSource).not.toContain('}, { status: 500 });');
    expect(detailRouteSource).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(detailRouteSource).not.toContain('}, { status: 403 });');
    expect(detailRouteSource).not.toContain('}, { status: 404 });');
    expect(detailRouteSource).not.toContain('}, { status: 500 });');
  });

  it("uses Prisma repository reads with dashboard projection redaction and sensitive-read audit logs", () => {
    expect(listRouteSource).toContain("tx.client.findMany");
    expect(detailRouteSource).toContain("tx.client.findFirst");

    for (const source of [listRouteSource, detailRouteSource]) {
      expect(source).toContain("buildTenantDashboardView");
      expect(source).toContain('collection: "clients"');
      expect(source).toContain('"email"');
      expect(source).toContain('"phone"');
      expect(source).toContain('"medicalNotes"');
      expect(source).toContain('"privateNotes"');
      expect(source).toContain("tx.auditLog.create");
      expect(source).toContain('redaction: "buildTenantDashboardView"');
      expect(source).toContain("includesSensitiveProfileFlags");
    }
  });

  it("keeps local fallback projected and database outage states explicit", () => {
    for (const source of [listRouteSource, detailRouteSource]) {
      expect(source).toContain("dashboardProjectedClients");
      expect(source).toContain('persistence: "local-fallback"');
      expect(source).toContain("PROVIDER_DASHBOARD_READS_NOT_CONFIGURED");
      expect(source).toContain("localDashboardReadFallbackDisabled");
      expect(source).toContain('code: "DATABASE_UNAVAILABLE"');
    }
  });

  it("documents the client read API seam from client list and detail pages", () => {
    expect(listPageSource).toContain("GET /api/clients");
    expect(listPageSource).toContain("cache: \"no-store\"");
    expect(listPageSource).toContain("tenant-scoped redacted client read API");
    expect(listPageSource).toContain("Demo fallback");
    expect(listPageSource).toContain("Production blocked");
    expect(listPageSource).toContain("Production demo client rows are disabled.");
    expect(detailPageSource).toContain("GET /api/clients/${client.id}");
    expect(detailPageSource).toContain("cache: \"no-store\"");
    expect(detailPageSource).toContain("Production blocked");
    expect(detailPageSource).toContain("Production demo client detail rows are disabled.");
    expect(detailPageSource).toContain("access logging");
  });

  it("wires a gated private-note client write seam without export/delete/provider side effects", () => {
    expect(detailRouteSource).toContain("export async function PATCH");
    expect(detailRouteSource).toContain('export const runtime = "nodejs"');
    expect(detailRouteSource).toContain('assertPermission(actor, "client:write")');
    expect(detailRouteSource).toContain("clientPrivateNoteInputSchema.safeParse");
    expect(detailRouteSource).toContain("Client private-note payload failed validation.");
    expect(detailRouteSource).toContain("PROVIDER_CLIENT_WRITE_PERSISTENCE_NOT_CONFIGURED");
    expect(detailRouteSource).toContain("localClientWriteFallbackDisabled");
    expect(detailRouteSource).toContain("dashboard-client-private-note");
    expect(detailRouteSource).toContain("tx.idempotencyKey.upsert");
    expect(detailRouteSource).toContain("requestHash: true");
    expect(detailRouteSource).toContain('status: "idempotency_conflict"');
    expect(detailRouteSource).toContain('code: "IDEMPOTENCY_CONFLICT"');
    expect(detailRouteSource).toContain('idempotency.status === "completed"');
    expect(detailRouteSource).toContain("tx.clientProfile.upsert");
    expect(detailRouteSource).toContain("tx.auditLog.create");
    expect(detailRouteSource).toContain("tx.idempotencyKey.update");
    expect(detailRouteSource).toContain('action: "client:write:private-note"');
    expect(detailRouteSource).toContain('dashboardMutationAction: "append_client_private_note"');
    expect(detailRouteSource).toContain("noteHash");
    expect(detailRouteSource).toContain("rawNoteReturned: false");
    expect(detailRouteSource).toContain("rawNoteStoredInResult: false");
    expect(detailRouteSource).toContain("idempotencyKeyId");
    expect(detailRouteSource).toContain("idempotencyReplay");
    expect(detailRouteSource).toContain('persistence: "local-contract"');
    expect(detailRouteSource).not.toContain('persistence: "local-plan-only"');
    expect(detailRouteSource).not.toContain('"missing-idempotency-key"');
    expect(detailRouteSource).toContain("private-note write contract with raw-note redaction and audit metadata");
    expect(detailRouteSource).not.toContain("private-note write plan only");
    expect(detailPageSource).toContain("ClientDetailActionPanel");
    expect(detailActionPanelSource).toContain('fetch(`/api/clients/${clientId}`');
    expect(detailActionPanelSource).toContain('action: "append_private_note"');
    expect(detailActionPanelSource).toContain("Save private note");
    expect(detailActionPanelSource).toContain("consent resend, healed-photo requests, exports, deletes, and provider sends remain evidence-gated");
  });

  it("persists client creation idempotency before audited writes", () => {
    expect(listRouteSource).toContain('export const runtime = "nodejs"');
    expect(listRouteSource).toContain("dashboard-client-create");
    expect(listRouteSource).toContain("tx.idempotencyKey.upsert");
    expect(listRouteSource).toContain("idempotency.status === \"completed\"");
    expect(listRouteSource).toContain("tx.client.findFirst");
    expect(listRouteSource).toContain("tx.client.create");
    expect(listRouteSource).toContain("tx.auditLog.create");
    expect(listRouteSource).toContain("tx.idempotencyKey.update");
    expect(listRouteSource).toContain("rawContactStoredInResult: false");
    expect(listRouteSource).toContain("idempotencyKeyId");
    expect(listRouteSource).toContain("idempotencyReplay");
    expect(listRouteSource).toContain("idempotency-backed");
  });
});
