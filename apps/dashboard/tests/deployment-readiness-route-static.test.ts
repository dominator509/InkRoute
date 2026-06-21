import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/deployment/readiness/route.ts"), "utf8");
const pageSource = readFileSync(join(process.cwd(), "apps/dashboard/app/deployment/page.tsx"), "utf8");
const actionPanelSource = readFileSync(join(process.cwd(), "apps/dashboard/components/DeploymentReadinessActionPanel.tsx"), "utf8");

describe("dashboard deployment readiness route static contract", () => {
  it("guards readiness reads with RBAC, tenant scope, and no-store responses", () => {
    expect(routeSource).toContain('assertPermission(actor, "release:read")');
    expect(routeSource).toContain('code: "FORBIDDEN"');
    expect(routeSource).toContain("tenantId !== actor.tenantId");
    expect(routeSource).toContain('code: "TENANT_MISMATCH"');
    expect(routeSource).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(routeSource).toContain("headers: noStoreHeaders");
    expect(routeSource).not.toContain('headers: { "Cache-Control": "no-store" }');
  });

  it("audit-logs DB-backed readiness reads without exposing secret values", () => {
    expect(routeSource).toContain("prisma.auditLog.create");
    expect(routeSource).toContain('action: "deployment:readiness:read"');
    expect(routeSource).toContain('entityType: "DeploymentReadiness"');
    expect(routeSource).toContain("missingRequiredNames");
    expect(routeSource).toContain("redactedFields");
    expect(routeSource).toContain('"DATABASE_URL"');
    expect(routeSource).toContain('"SENTRY_AUTH_TOKEN"');
    expect(routeSource).toContain('"VERCEL_TOKEN"');
    expect(routeSource).toContain("auditId: audit.id");
  });

  it("keeps mutation operations provider-gated and no-store", () => {
    expect(routeSource).toContain('assertPermission(actor, "release:write")');
    expect(routeSource).toContain("deploymentReadinessMutationSchema.safeParse");
    expect(routeSource).toContain("request-production-approval");
    expect(routeSource).toContain("statusCode: 409");
    expect(routeSource).toContain("does not perform external provider calls");
  });

  it("documents the no-store readiness API seam on the dashboard page", () => {
    expect(pageSource).toContain("deployment readiness control room");
    expect(pageSource).toContain("script contract");
    expect(pageSource).toContain("no-store tenant-scoped readiness API");
    expect(pageSource).toContain("DeploymentReadinessActionPanel");
    expect(pageSource).not.toContain("deployment readiness scaffold");
    expect(pageSource).not.toContain('label="scaffolded"');
    expect(pageSource).not.toContain("Deployment actions disabled");
    expect(actionPanelSource).toContain('fetch("/api/deployment/readiness"');
    expect(actionPanelSource).toContain('"readiness-review"');
    expect(actionPanelSource).toContain("Request readiness review");
    expect(actionPanelSource).toContain("provider deploys, migrations, EAS updates, Sentry uploads, and rollback execution remain gated");
  });
});
