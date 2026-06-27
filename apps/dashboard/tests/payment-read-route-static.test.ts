import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const listRouteSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/payments/route.ts"), "utf8");
const detailRouteSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/payments/[paymentId]/route.ts"), "utf8");
const paymentsPageSource = readFileSync(join(process.cwd(), "apps/dashboard/app/payments/page.tsx"), "utf8");
const paymentActionPanelSource = readFileSync(join(process.cwd(), "apps/dashboard/components/PaymentActionPanel.tsx"), "utf8");

describe("dashboard payment read route contract", () => {
  it("guards payment list and detail reads with RBAC, tenant scope, and no-store cache policy", () => {
    for (const source of [listRouteSource, detailRouteSource]) {
      expect(source).toContain('assertPermission(actor, "payment:read")');
      expect(source).toContain('code: "FORBIDDEN"');
      expect(source).toContain("tenantId !== actor.tenantId");
      expect(source).toContain('code: "TENANT_MISMATCH"');
      expect(source).toContain('"Cache-Control": "no-store"');
      expect(source).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
      expect(source).not.toContain('}, { status: 403 });');
      expect(source).not.toContain('}, { status: 500 });');
    }
    expect(detailRouteSource).not.toContain('}, { status: 404 });');
  });

  it("uses Prisma payment reads with projection redaction and general plus payment-specific audit logs", () => {
    expect(listRouteSource).toContain("tx.payment.findMany");
    expect(detailRouteSource).toContain("tx.payment.findFirst");

    for (const source of [listRouteSource, detailRouteSource]) {
      expect(source).toContain("buildTenantDashboardView");
      expect(source).toContain('collection: "payments"');
      expect(source).toContain('"providerPaymentId"');
      expect(source).toContain('"providerSessionId"');
      expect(source).toContain('"receiptUrl"');
      expect(source).toContain('"metadata"');
      expect(source).toContain("tx.auditLog.create");
      expect(source).toContain("tx.paymentAuditLog.create");
      expect(source).toContain('redaction: "buildTenantDashboardView"');
      expect(source).toContain("payment.dashboard_read");
    }
  });

  it("keeps local fallback projected and database outage states explicit", () => {
    for (const source of [listRouteSource, detailRouteSource]) {
      expect(source).toContain("dashboardProjectedPayments");
      expect(source).toContain("PROVIDER_DASHBOARD_READS_NOT_CONFIGURED");
      expect(source).toContain("localDashboardReadFallbackDisabled");
      expect(source).toContain('persistence: "local-fallback"');
      expect(source).toContain('code: "DATABASE_UNAVAILABLE"');
    }
  });

  it("documents that payment reads are wired while Stripe write actions remain credential-gated", () => {
    expect(paymentsPageSource).toContain("Tenant-scoped redacted payment read APIs now exist");
    expect(paymentsPageSource).toContain("Payment reads now have redacted dashboard APIs");
    expect(paymentsPageSource).toContain("Stripe credentials");
  });

  it("replaces the disabled payment placeholder with a gated deposit-session draft action", () => {
    expect(paymentsPageSource).toContain("PaymentActionPanel");
    expect(paymentActionPanelSource).toContain('fetch(`/api/bookings/${bookingId}/state`');
    expect(paymentActionPanelSource).toContain('action: "request_deposit"');
    expect(paymentActionPanelSource).toContain("create_deposit_session");
    expect(paymentActionPanelSource).toContain("does not call Stripe");
    expect(paymentActionPanelSource).toContain("Stripe checkout, refunds, no-show forfeiture, receipts, tax exports, and webhook reconciliation remain evidence-gated");
  });
});
