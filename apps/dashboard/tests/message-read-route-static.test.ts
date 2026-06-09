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
    }
  });

  it("uses Prisma message-thread reads with body/provider/contact redaction and audit logs", () => {
    expect(listRouteSource).toContain("tx.messageThread.findMany");
    expect(detailRouteSource).toContain("tx.messageThread.findFirst");

    for (const source of [listRouteSource, detailRouteSource]) {
      expect(source).toContain("tx.auditLog.create");
      expect(source).toContain("redactedFields");
      expect(source).toContain('"message.body"');
      expect(source).toContain('"providerMessageId"');
      expect(source).toContain('"client.email"');
      expect(source).toContain('"client.phone"');
      expect(source).toContain('bodyPreview: redactedPreview');
      expect(source).toContain('providerMessageId:');
      expect(source).toContain('"[redacted-dashboard-field]"');
    }
  });

  it("keeps local fallback redacted and database outage states explicit", () => {
    for (const source of [listRouteSource, detailRouteSource]) {
      expect(source).toContain("dashboardRedactedMessageThreadDrafts");
      expect(source).toContain('persistence: "local-fallback"');
      expect(source).toContain('code: "DATABASE_UNAVAILABLE"');
    }
  });

  it("documents that message reads are wired while provider sends remain gated", () => {
    expect(messagesPageSource).toContain("Tenant-scoped redacted message read APIs now exist");
    expect(messagesPageSource).toContain("Read APIs wired");
    expect(messagesPageSource).toContain("Thread reads now have authenticated redacted APIs");
    expect(messagesPageSource).toContain("provider workers");
  });
});
