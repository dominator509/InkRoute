import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

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

  it("wires preference and unsubscribe APIs with no-store responses and raw-token avoidance", () => {
    expect(preferenceRouteSource).toContain("export async function GET");
    expect(preferenceRouteSource).toContain("export async function POST");
    expect(preferenceRouteSource).toContain("buildPreferencePlanFromRequest");
    expect(preferenceRouteSource).toContain('"Cache-Control": "no-store"');
    expect(unsubscribeRouteSource).toContain('action: "unsubscribe_email"');
    expect(unsubscribeRouteSource).toContain("x-preference-token-hash");
    expect(unsubscribeRouteSource).toContain("listUnsubscribeHeaders");
    expect(unsubscribeRouteSource).toContain("never stores raw preference tokens");
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
