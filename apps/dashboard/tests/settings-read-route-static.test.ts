import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/settings/route.ts"), "utf8");
const settingsPageSource = readFileSync(join(process.cwd(), "apps/dashboard/app/settings/page.tsx"), "utf8");
const settingsActionPanelSource = readFileSync(join(process.cwd(), "apps/dashboard/components/SettingsActionPanel.tsx"), "utf8");

describe("dashboard settings read route contract", () => {
  it("guards settings reads with tenant RBAC, tenant scope, and no-store cache policy", () => {
    expect(routeSource).toContain('evaluateDashboardApiGuard(request, "tenant:read"');
    expect(routeSource).toContain("settingsGuardFailureResponse(guard)");
    expect(routeSource).toContain('code: "FORBIDDEN"');
    expect(routeSource).toContain("dashboardTenantQuerySchema.safeParse");
    expect(routeSource).toContain("Settings query failed validation.");
    expect(routeSource).toContain("tenantId !== actor.tenantId");
    expect(routeSource).toContain('code: "TENANT_MISMATCH"');
    expect(routeSource).toContain('"Cache-Control": "no-store"');
    expect(routeSource).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(routeSource).not.toContain('}, { status: 403 });');
    expect(routeSource).not.toContain('}, { status: 404 });');
    expect(routeSource).not.toContain('}, { status: 500 });');
  });

  it("loads tenant settings without secret-bearing fields and writes audit logs", () => {
    expect(routeSource).toContain("tx.tenant.findUnique");
    expect(routeSource).toContain("domains:");
    expect(routeSource).toContain("members:");
    expect(routeSource).toContain("customRoles:");
    expect(routeSource).toContain("studios:");
    expect(routeSource).toContain("flags:");
    expect(routeSource).toContain("tx.auditLog.create");
    expect(routeSource).toContain('action: "settings:read"');
    expect(routeSource).toContain('entityType: "Tenant"');
    expect(routeSource).toContain("buildSettingsReadResponseProjection");
    expect(routeSource).toContain("buildSafeSettingsTenantRecord");
    expect(routeSource).toContain("tenantIdEchoed: false");
    expect(routeSource).toContain("domainIdsEchoed: false");
    expect(routeSource).toContain("memberIdsEchoed: false");
    expect(routeSource).toContain("userIdsEchoed: false");
    expect(routeSource).toContain("customRoleIdsEchoed: false");
    expect(routeSource).toContain("studioIdsEchoed: false");
    expect(routeSource).toContain("featureFlagIdsEchoed: false");
    expect(routeSource).toContain("internalPersistenceIdsEchoed: false");
    expect(routeSource).not.toContain("id: domain.id");
    expect(routeSource).not.toContain("id: member.id");
    expect(routeSource).not.toContain("userId: member.user.id");
    expect(routeSource).not.toContain("id: role.id");
    expect(routeSource).not.toContain("id: studio.id");
    expect(routeSource).not.toContain("id: flag.id");
  });

  it("redacts member emails and avoids domain verification/provider secret leakage", () => {
    expect(routeSource).toContain("redactEmail");
    expect(routeSource).toContain('return "[redacted-dashboard-field]"');
    expect(routeSource).toContain("hasUserEmail: Boolean(member.user.id)");
    expect(routeSource).toContain("userLinked: Boolean(member.user.id)");
    expect(routeSource).toContain("hasInvitedEmail: Boolean(member.invitedAt)");
    expect(routeSource).toContain("userContactFieldsSelectedFromDatabase: false");
    expect(routeSource).toContain("invitedEmailSelectedFromDatabase: false");
    expect(routeSource).not.toContain("email: true, name: true");
    expect(routeSource).not.toContain("invitedEmail: true");
    expect(routeSource).toContain('"verificationTokenHash"');
    expect(routeSource).not.toContain("verificationTokenHash: true");
    expect(routeSource).toContain('"studio.address"');
    expect(routeSource).not.toContain("addressLine1: true");
    expect(routeSource).not.toContain("addressLine2: true");
  });

  it("keeps local fallback and database outage states explicit", () => {
    expect(routeSource).toContain("dashboardShellContext.tenant");
    expect(routeSource).toContain("dashboardFeatureFlags");
    expect(routeSource).toContain('persistence: "local-fallback"');
    expect(routeSource).toContain("PROVIDER_DASHBOARD_READS_NOT_CONFIGURED");
    expect(routeSource).toContain("localDashboardReadFallbackDisabled");
    expect(routeSource).toContain('code: "DATABASE_UNAVAILABLE"');
  });

  it("documents that settings reads and safe writes are wired while provider secrets remain gated", () => {
    expect(settingsPageSource).toContain("Tenant-scoped redacted settings read API now exists");
    expect(settingsPageSource).toContain("SettingsActionPanel");
    expect(settingsPageSource).not.toContain("Settings reads now use a credential-safe tenant API");
    expect(settingsActionPanelSource).toContain('fetch("/api/settings"');
    expect(settingsActionPanelSource).toContain('method: "PATCH"');
    expect(settingsActionPanelSource).toContain('"idempotency-key"');
    expect(settingsActionPanelSource).toContain("Save settings draft");
    expect(settingsActionPanelSource).toContain("safe profile metadata contract");
    expect(settingsActionPanelSource).toContain("Provider secrets, member invitations, custom roles, and legal policy copy stay evidence-gated");
    expect(settingsActionPanelSource).not.toContain("This action only updates safe");
  });

  it("guards safe settings writes with RBAC, tenant scope, transactions, audit logs, and production fail-close", () => {
    expect(routeSource).toContain("export async function PATCH");
    expect(routeSource).toContain('evaluateDashboardApiGuard(request, "settings:write"');
    expect(routeSource).toContain("settingsGuardFailureResponse(guard)");
    expect(routeSource).toContain("tenantSettingsMutationSchema.safeParse");
    expect(routeSource).toContain("Settings payload failed validation.");
    expect(routeSource).toContain("tenantId !== actor.tenantId");
    expect(routeSource).toContain("prisma.$transaction");
    expect(routeSource).toContain("tx.idempotencyKey.upsert");
    expect(routeSource).toContain("tx.idempotencyKey.update");
    expect(routeSource).toContain("tx.tenant.update");
    expect(routeSource).toContain('action: "settings:update"');
    expect(routeSource).toContain('dashboardMutationAction: "update_settings"');
    expect(routeSource).toContain("idempotencyKeyId");
    expect(routeSource).toContain("PROVIDER_SETTINGS_PERSISTENCE_NOT_CONFIGURED");
    expect(routeSource).toContain("localSettingsWriteFallbackDisabled");
    expect(routeSource).toContain("rawSecretsStored: false");
  });
});
