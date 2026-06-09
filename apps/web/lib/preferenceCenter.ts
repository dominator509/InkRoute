import {
  buildPreferenceCenterRuntimeReadinessPlan,
  buildPreferenceMutationPlan,
  buildPreferenceTokenHash,
  type PreferenceCenterRuntimeReadinessPlan,
  type PreferenceMutationAction,
  type PreferenceMutationPlan,
} from "@inkroute/notifications";

export interface PreferenceRepository {
  issuePreferenceToken(input: { tenantId: string; clientId: string; tokenHash: string; expiresAt: string }): Promise<void>;
  claimIdempotencyKey(input: { tenantId: string; key: string; action: PreferenceMutationAction }): Promise<"claimed" | "duplicate">;
  persistClientPreference(input: { tenantId: string; plan: PreferenceMutationPlan }): Promise<void>;
  persistSuppression(input: { tenantId: string; plan: PreferenceMutationPlan; reason: string }): Promise<void>;
  persistTenantChannelSettings(input: { tenantId: string; plan: PreferenceMutationPlan }): Promise<void>;
  persistPreferenceAudit(input: { tenantId: string; plan: PreferenceMutationPlan; redactedMetadata: Record<string, unknown> }): Promise<void>;
}

export interface PreferenceCenterContract {
  runtimeReadiness: PreferenceCenterRuntimeReadinessPlan;
  issueTokenPlan: PreferenceMutationPlan;
  updateEmailPlan: PreferenceMutationPlan;
  unsubscribeEmailPlan: PreferenceMutationPlan;
  smsStopPlan: PreferenceMutationPlan;
  smsStartPlan: PreferenceMutationPlan;
  tenantSettingsPlan: PreferenceMutationPlan;
  listUnsubscribeHeaders: Record<string, string>;
  requiredRepositoryMethods: readonly (keyof PreferenceRepository)[];
}

const now = "2026-06-09T17:00:00.000Z";
const tokenExpiresAt = "2026-06-16T17:00:00.000Z";
const demoToken = "pref_demo_token";
const demoTokenHash = buildPreferenceTokenHash(demoToken);

function baseMutation(action: PreferenceMutationAction): {
  tenantId: string;
  action: PreferenceMutationAction;
  clientId: string;
  email: string;
  phone: string;
  tokenHash: string;
  tokenExpiresAt: string;
  now: string;
  idempotencyKey: string;
} {
  return {
    tenantId: "tenant_demo",
    action,
    clientId: "client_demo",
    email: "client@example.test",
    phone: "+12065550142",
    tokenHash: demoTokenHash,
    tokenExpiresAt,
    now,
    idempotencyKey: `preference:${action}:demo`,
  };
}

export function buildPreferenceCenterContract(): PreferenceCenterContract {
  return {
    runtimeReadiness: buildPreferenceCenterRuntimeReadinessPlan({
      packageScripts: ["test", "typecheck"],
      notificationTestsPassed: false,
      notificationTypecheckPassed: false,
      webRouteTestsPassed: false,
      dashboardTestsPassed: false,
      preferenceCenterPageImplemented: true,
      unsubscribePageImplemented: true,
      preferenceApiImplemented: true,
      signedPreferenceTokensIssued: true,
      preferenceTokenHashPersistenceAvailable: false,
      tokenExpiryEnforced: true,
      forgedTokenRejectionTested: false,
      listUnsubscribeHeadersConfigured: true,
      emailUnsubscribePersistenceAvailable: false,
      smsStopPersistenceAvailable: false,
      smsStartPersistenceAvailable: false,
      tenantChannelSettingsUiImplemented: true,
      tenantChannelSettingsPersistenceAvailable: false,
      transactionalVsMarketingControlsEnforced: true,
      suppressionAppliedBeforeSend: false,
      auditLogPersistenceAvailable: false,
      idempotencyStoreAvailable: false,
      legalApprovedPreferenceCopyAvailable: false,
      routeApiTestsPassed: false,
    }),
    issueTokenPlan: buildPreferenceMutationPlan({
      tenantId: "tenant_demo",
      action: "issue_preference_token",
      clientId: "client_demo",
      token: demoToken,
      tokenExpiresAt,
      now,
      idempotencyKey: "preference:issue:demo",
    }),
    updateEmailPlan: buildPreferenceMutationPlan({
      ...baseMutation("update_email_preferences"),
      emailOptIn: false,
      marketingOptIn: false,
      transactionalAllowed: true,
    }),
    unsubscribeEmailPlan: buildPreferenceMutationPlan({
      ...baseMutation("unsubscribe_email"),
      emailOptIn: false,
      marketingOptIn: false,
      transactionalAllowed: true,
    }),
    smsStopPlan: buildPreferenceMutationPlan({
      ...baseMutation("record_sms_stop"),
      smsOptIn: false,
      marketingOptIn: false,
    }),
    smsStartPlan: buildPreferenceMutationPlan({
      ...baseMutation("record_sms_start"),
      smsOptIn: true,
      transactionalAllowed: true,
      legalCopyApproved: false,
    }),
    tenantSettingsPlan: buildPreferenceMutationPlan({
      tenantId: "tenant_demo",
      action: "update_tenant_channel_settings",
      actorId: "user_mara_demo",
      now,
      idempotencyKey: "preference:tenant-settings:demo",
      tenantChannelSettingsConfigured: true,
      legalCopyApproved: false,
    }),
    listUnsubscribeHeaders: {
      "List-Unsubscribe": "<https://example.test/preferences/unsubscribe?token=redacted>",
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      "X-InkRoute-Preference-Token": demoTokenHash,
    },
    requiredRepositoryMethods: [
      "issuePreferenceToken",
      "claimIdempotencyKey",
      "persistClientPreference",
      "persistSuppression",
      "persistTenantChannelSettings",
      "persistPreferenceAudit",
    ],
  };
}

export function buildPreferencePlanFromRequest(input: {
  tenantId: string;
  action: PreferenceMutationAction;
  now: string;
  clientId?: string;
  actorId?: string;
  email?: string;
  phone?: string;
  token?: string;
  tokenHash?: string;
  tokenExpiresAt?: string;
  idempotencyKey?: string;
  emailOptIn?: boolean;
  smsOptIn?: boolean;
  pushOptIn?: boolean;
  marketingOptIn?: boolean;
  transactionalAllowed?: boolean;
  tenantChannelSettingsConfigured?: boolean;
  legalCopyApproved?: boolean;
}): PreferenceMutationPlan {
  return buildPreferenceMutationPlan(input);
}

export async function executePreferenceMutation(
  repository: PreferenceRepository,
  plan: PreferenceMutationPlan,
): Promise<{ status: "processed" | "blocked" | "duplicate"; plan: PreferenceMutationPlan }> {
  const tenantId = plan.writes[0]?.tenantId ?? "missing_tenant";
  if (plan.status === "blocked" || !plan.idempotencyKey) return { status: "blocked", plan };

  const claim = await repository.claimIdempotencyKey({ tenantId, key: plan.idempotencyKey, action: plan.action });
  if (claim === "duplicate") return { status: "duplicate", plan };

  if (plan.action === "issue_preference_token" && plan.tokenHash) {
    await repository.issuePreferenceToken({ tenantId, clientId: String(plan.writes[0].payload.clientId ?? "missing_client"), tokenHash: plan.tokenHash, expiresAt: String(plan.writes[0].payload.expiresAt ?? "") });
  }
  if (plan.writes.some((write) => write.model === "ClientNotificationPreference")) await repository.persistClientPreference({ tenantId, plan });
  if (plan.writes.some((write) => write.model === "SuppressionListEntry")) await repository.persistSuppression({ tenantId, plan, reason: plan.action });
  if (plan.writes.some((write) => write.model === "TenantNotificationSetting")) await repository.persistTenantChannelSettings({ tenantId, plan });
  await repository.persistPreferenceAudit({ tenantId, plan, redactedMetadata: { action: plan.action, tokenHash: plan.tokenHash, writes: plan.writes.map((write) => write.model) } });

  return { status: "processed", plan };
}

export const preferenceCenterContract = buildPreferenceCenterContract();
