import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildRedactedPreferenceMetadata,
  createInMemoryPreferenceRepository,
  createPrismaPreferenceRepository,
  executePreferenceMutation,
  preferenceCenterContract,
} from "../lib/preferenceCenter";

const preferenceSource = readFileSync(join(process.cwd(), "apps/web/lib/preferenceCenter.ts"), "utf8");
const preferenceRouteSource = readFileSync(join(process.cwd(), "apps/web/app/api/public/[tenantSlug]/preferences/route.ts"), "utf8");
const unsubscribeRouteSource = readFileSync(join(process.cwd(), "apps/web/app/api/public/[tenantSlug]/unsubscribe/route.ts"), "utf8");
const preferencePageSource = readFileSync(join(process.cwd(), "apps/web/app/preferences/page.tsx"), "utf8");
const settingsPageSource = readFileSync(join(process.cwd(), "apps/dashboard/app/settings/page.tsx"), "utf8");

describe("preference center and unsubscribe contract", () => {
  it("uses notification package preference readiness, mutation, and token hashing helpers", () => {
    expect(preferenceSource).toContain("buildPreferenceCenterRuntimeReadinessPlan");
    expect(preferenceSource).toContain("buildPreferenceMutationPlan");
    expect(preferenceSource).toContain("buildPreferenceTokenHash");
    expect(preferenceSource).toContain("preferenceCenterContract");
  });

  it("covers token issuance, email preferences, unsubscribe, SMS STOP/START, tenant settings, and List-Unsubscribe", () => {
    expect(preferenceSource).toContain('action: "issue_preference_token"');
    expect(preferenceSource).toContain('baseMutation("update_email_preferences")');
    expect(preferenceSource).toContain('baseMutation("unsubscribe_email")');
    expect(preferenceSource).toContain('baseMutation("record_sms_stop")');
    expect(preferenceSource).toContain('baseMutation("record_sms_start")');
    expect(preferenceSource).toContain('action: "update_tenant_channel_settings"');
    expect(preferenceSource).toContain("List-Unsubscribe");
    expect(preferenceSource).toContain("List-Unsubscribe-Post");
  });

  it("defines repository seams for hashed tokens, suppression, tenant settings, audit, and idempotency", () => {
    expect(preferenceSource).toContain("PreferenceRepository");
    expect(preferenceSource).toContain("issuePreferenceToken");
    expect(preferenceSource).toContain("claimIdempotencyKey");
    expect(preferenceSource).toContain("persistClientPreference");
    expect(preferenceSource).toContain("persistSuppression");
    expect(preferenceSource).toContain("persistTenantChannelSettings");
    expect(preferenceSource).toContain("persistPreferenceAudit");
    expect(preferenceSource).toContain("SuppressionListEntry");
    expect(preferenceSource).toContain("TenantNotificationSetting");
  });

  it("redacts nested preference metadata before local audit persistence", () => {
    const metadata = buildRedactedPreferenceMetadata({
      action: "unsubscribe_email",
      email: "client@example.test",
      token: "raw-token-secret",
      nested: {
        phone: "+12065550142",
        messageBody: "private preference note",
      },
    });

    expect(metadata).toEqual({
      action: "unsubscribe_email",
      email: "[redacted]",
      token: "[redacted]",
      nested: {
        phone: "[redacted]",
        messageBody: "[redacted]",
      },
    });
    expect(JSON.stringify(metadata)).not.toContain("client@example.test");
    expect(JSON.stringify(metadata)).not.toContain("raw-token-secret");
    expect(JSON.stringify(metadata)).not.toContain("+12065550142");
  });

  it("executes a local preference repository contract for hash-only token issuance, idempotency, suppression, tenant settings, preferences, and audit", async () => {
    const repository = createInMemoryPreferenceRepository();

    const issued = await executePreferenceMutation(repository, preferenceCenterContract.issueTokenPlan);
    const duplicate = await executePreferenceMutation(repository, preferenceCenterContract.issueTokenPlan);
    const unsubscribed = await executePreferenceMutation(repository, preferenceCenterContract.unsubscribeEmailPlan);
    const smsStopped = await executePreferenceMutation(repository, preferenceCenterContract.smsStopPlan);
    const tenantSettings = await executePreferenceMutation(repository, preferenceCenterContract.tenantSettingsPlan);

    expect(issued.status).toBe("processed");
    expect(duplicate.status).toBe("duplicate");
    expect(unsubscribed.status).toBe("processed");
    expect(smsStopped.status).toBe("processed");
    expect(tenantSettings.status).toBe("processed");
    expect(repository.state.preferenceTokens).toHaveLength(1);
    expect(repository.state.preferenceTokens[0].tokenHash).toMatch(/^pref_hash_/);
    expect(JSON.stringify(repository.state.preferenceTokens)).not.toContain("pref_demo_token");
    expect(repository.state.clientPreferences.length).toBeGreaterThanOrEqual(2);
    expect(repository.state.suppressions.length).toBeGreaterThanOrEqual(2);
    expect(repository.state.tenantChannelSettings).toHaveLength(1);
    expect(repository.state.preferenceAudits.length).toBeGreaterThanOrEqual(4);
  });

  it("maps the Prisma preference repository to hash-only token, preference, suppression, tenant setting, idempotency, and audit writes", async () => {
    const writes: string[] = [];
    const idempotencyRows = new Map<string, { metadata: { action: string } }>();
    const repository = createPrismaPreferenceRepository({
      preferenceToken: {
        create: async ({ data }) => {
          writes.push(`token:${data.tokenHash}`);
          return data;
        },
      },
      idempotencyKey: {
        findUnique: async ({ where }) => idempotencyRows.get(where.tenantId_scope_key.key) ?? null,
        create: async ({ data }) => {
          idempotencyRows.set(data.key, { metadata: { action: String(data.metadata.action) } });
          writes.push(`idempotency:${data.key}`);
          return data;
        },
      },
      notificationChannelPreference: {
        upsert: async ({ where }) => {
          writes.push(`preference:${where.tenantId_subjectType_subjectId_channel.channel}`);
          return where;
        },
      },
      notificationSuppression: {
        upsert: async ({ where }) => {
          writes.push(`suppression:${where.tenantId_channel_destinationHash_reason.reason}`);
          return where;
        },
      },
      tenantNotificationSetting: {
        upsert: async ({ where }) => {
          writes.push(`tenant-setting:${where.tenantId_channel.channel}`);
          return where;
        },
      },
      auditLog: {
        create: async ({ data }) => {
          writes.push(`audit:${data.action}`);
          return data;
        },
      },
    });

    const issued = await executePreferenceMutation(repository, preferenceCenterContract.issueTokenPlan);
    const unsubscribed = await executePreferenceMutation(repository, preferenceCenterContract.unsubscribeEmailPlan);
    const tenantSettings = await executePreferenceMutation(repository, preferenceCenterContract.tenantSettingsPlan);

    expect(issued.status).toBe("processed");
    expect(unsubscribed.status).toBe("processed");
    expect(tenantSettings.status).toBe("processed");
    expect(writes.join(" ")).not.toContain("pref_demo_token");
    expect(writes).toEqual(expect.arrayContaining([
      expect.stringMatching(/^token:pref_hash_/),
      "preference:email",
      "suppression:unsubscribe_email",
      "tenant-setting:email",
      "audit:preference.issue_preference_token",
    ]));
  });

  it("wires preference and unsubscribe APIs with no-store responses and raw-token avoidance", () => {
    expect(preferenceRouteSource).toContain("export async function GET");
    expect(preferenceRouteSource).toContain("export async function POST");
    expect(preferenceRouteSource).toContain("buildPreferencePlanFromRequest");
    expect(preferenceRouteSource).toContain("buildPreferenceTokenHash");
    expect(preferenceRouteSource).toContain("tokenValidationResponse");
    expect(preferenceRouteSource).toContain("PREFERENCE_TOKEN_INVALID");
    expect(preferenceRouteSource).toContain("PREFERENCE_TOKEN_MISSING");
    expect(preferenceRouteSource).toContain("PREFERENCE_TOKEN_FORGED");
    expect(preferenceRouteSource).toContain("PREFERENCE_TOKEN_EXPIRED");
    expect(preferenceRouteSource).toContain("PREFERENCE_TOKEN_REUSED");
    expect(preferenceRouteSource).toContain("PREFERENCE_TOKEN_REVOKED");
    expect(preferenceRouteSource).toContain("preferenceToken.findFirst");
    expect(preferenceRouteSource).toContain("preferenceToken.create");
    expect(preferenceRouteSource).toContain("preferenceToken.expiresAt.getTime() <= Date.now()");
    expect(preferenceRouteSource).toContain("resolvePreferenceTenant");
    expect(preferenceRouteSource).toContain("persistPreferenceMutation");
    expect(preferenceRouteSource).toContain("notificationChannelPreference.upsert");
    expect(preferenceRouteSource).toContain("notificationSuppression.upsert");
    expect(preferenceRouteSource).toContain("idempotencyKey.upsert");
    expect(preferenceRouteSource).toContain("auditLog.create");
    expect(preferenceRouteSource).toContain("preference.public_mutation");
    expect(preferenceRouteSource).toContain('"Cache-Control": "no-store"');
    expect(preferenceRouteSource).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(preferenceRouteSource).not.toContain('}, { status: 400 });');
    expect(preferenceRouteSource).toContain("PROVIDER_PREFERENCE_PERSISTENCE_NOT_CONFIGURED");
    expect(preferenceRouteSource).toContain("localContractMutationFallbackDisabled");
    expect(unsubscribeRouteSource).toContain('action: "unsubscribe_email"');
    expect(unsubscribeRouteSource).toContain("buildPreferenceTokenHash");
    expect(unsubscribeRouteSource).toContain("x-preference-token");
    expect(unsubscribeRouteSource).toContain("x-preference-token-hash");
    expect(unsubscribeRouteSource).toContain("tokenValidationResponse");
    expect(unsubscribeRouteSource).toContain("PREFERENCE_TOKEN_INVALID");
    expect(unsubscribeRouteSource).toContain("PREFERENCE_TOKEN_MISSING");
    expect(unsubscribeRouteSource).toContain("PREFERENCE_TOKEN_FORGED");
    expect(unsubscribeRouteSource).toContain("PREFERENCE_TOKEN_EXPIRED");
    expect(unsubscribeRouteSource).toContain("PREFERENCE_TOKEN_REUSED");
    expect(unsubscribeRouteSource).toContain("PREFERENCE_TOKEN_REVOKED");
    expect(unsubscribeRouteSource).toContain("preferenceToken.findFirst");
    expect(unsubscribeRouteSource).toContain("preferenceToken.update");
    expect(unsubscribeRouteSource).toContain("preferenceToken.expiresAt.getTime() <= Date.now()");
    expect(unsubscribeRouteSource).toContain("usedAt: new Date()");
    expect(unsubscribeRouteSource).toContain("resolveUnsubscribeTenant");
    expect(unsubscribeRouteSource).toContain("persistUnsubscribe");
    expect(unsubscribeRouteSource).toContain("notificationChannelPreference.upsert");
    expect(unsubscribeRouteSource).toContain("notificationSuppression.upsert");
    expect(unsubscribeRouteSource).toContain("idempotencyKey.upsert");
    expect(unsubscribeRouteSource).toContain("auditLog.create");
    expect(unsubscribeRouteSource).toContain("preference.one_click_unsubscribe");
    expect(unsubscribeRouteSource).toContain("listUnsubscribeHeaders");
    expect(unsubscribeRouteSource).toContain("PROVIDER_UNSUBSCRIBE_PERSISTENCE_NOT_CONFIGURED");
    expect(unsubscribeRouteSource).toContain("localContractUnsubscribeFallbackDisabled");
    expect(unsubscribeRouteSource).not.toContain("writePlanOnlyUnsubscribeDisabled");
    expect(unsubscribeRouteSource).toContain("never stores raw preference tokens");
    expect(unsubscribeRouteSource).toContain("rejects missing, forged, expired, reused, or revoked preference tokens");
    expect(preferenceRouteSource).toContain("reject missing, forged, expired, reused, or revoked preference tokens");
    expect(preferenceRouteSource).toContain("localContractMutationFallbackDisabled");
    expect(preferenceRouteSource).toContain("Preference POST returns the local mutation contract");
    expect(preferenceRouteSource).not.toContain("writePlanOnlyMutationDisabled");
    expect(preferenceRouteSource).not.toContain("Preference POST returns the mutation/write plan");
    expect(unsubscribeRouteSource).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(unsubscribeRouteSource).toContain("headers: noStoreHeaders");
    expect(unsubscribeRouteSource).not.toContain('headers: { "Cache-Control": "no-store" }');
  });

  it("surfaces client preference page and dashboard tenant channel settings copy", () => {
    expect(preferencePageSource).toContain("Notification preferences");
    expect(preferencePageSource).toContain("STOP/START");
    expect(preferencePageSource).toContain("List-Unsubscribe");
    expect(settingsPageSource).toContain("Notification preferences");
    expect(settingsPageSource).toContain("Tenant notification settings");
    expect(settingsPageSource).toContain("Suppression before send");
  });
});
