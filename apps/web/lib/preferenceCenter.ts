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

export interface PreferencePrismaClient {
  readonly preferenceToken: {
    create(input: {
      readonly data: { readonly tenantId: string; readonly clientId: string; readonly tokenHash: string; readonly expiresAt: Date };
    }): Promise<unknown>;
  };
  readonly idempotencyKey: {
    findUnique(input: {
      readonly where: { readonly tenantId_scope_key: { readonly tenantId: string; readonly scope: string; readonly key: string } };
    }): Promise<{ readonly metadata?: unknown } | null>;
    create(input: {
      readonly data: { readonly tenantId: string; readonly scope: string; readonly key: string; readonly status: "claimed"; readonly metadata: Record<string, unknown> };
    }): Promise<unknown>;
  };
  readonly notificationChannelPreference: {
    upsert(input: {
      readonly where: { readonly tenantId_subjectType_subjectId_channel: { readonly tenantId: string; readonly subjectType: string; readonly subjectId: string; readonly channel: "email" | "sms" | "push" | "in_app" } };
      readonly create: Record<string, unknown>;
      readonly update: Record<string, unknown>;
    }): Promise<unknown>;
  };
  readonly notificationSuppression: {
    upsert(input: {
      readonly where: { readonly tenantId_channel_destinationHash_reason: { readonly tenantId: string; readonly channel: "email" | "sms" | "push" | "in_app"; readonly destinationHash: string; readonly reason: string } };
      readonly create: Record<string, unknown>;
      readonly update: Record<string, unknown>;
    }): Promise<unknown>;
  };
  readonly tenantNotificationSetting: {
    upsert(input: {
      readonly where: { readonly tenantId_channel: { readonly tenantId: string; readonly channel: "email" | "sms" | "push" | "in_app" } };
      readonly create: Record<string, unknown>;
      readonly update: Record<string, unknown>;
    }): Promise<unknown>;
  };
  readonly auditLog: {
    create(input: { readonly data: Record<string, unknown> }): Promise<unknown>;
  };
}

export interface InMemoryPreferenceRepositoryState {
  readonly preferenceTokens: { readonly tenantId: string; readonly clientId: string; readonly tokenHash: string; readonly expiresAt: string }[];
  readonly idempotencyKeys: Map<string, { readonly tenantId: string; readonly action: PreferenceMutationAction }>;
  readonly clientPreferences: { readonly tenantId: string; readonly plan: PreferenceMutationPlan }[];
  readonly suppressions: { readonly tenantId: string; readonly plan: PreferenceMutationPlan; readonly reason: string }[];
  readonly tenantChannelSettings: { readonly tenantId: string; readonly plan: PreferenceMutationPlan }[];
  readonly preferenceAudits: { readonly tenantId: string; readonly plan: PreferenceMutationPlan; readonly redactedMetadata: Record<string, unknown> }[];
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

const preferencePrivateMetadataKeys = new Set([
  "email",
  "phone",
  "rawToken",
  "token",
  "destination",
  "messageBody",
  "clientName",
  "providerSecret",
]);

function redactPreferenceMetadataValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => redactPreferenceMetadataValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        preferencePrivateMetadataKeys.has(key) ? "[redacted]" : redactPreferenceMetadataValue(entry),
      ]),
    );
  }

  return value;
}

export function buildRedactedPreferenceMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  return redactPreferenceMetadataValue(metadata) as Record<string, unknown>;
}

function buildPreferenceIdempotencyKey(input: { readonly tenantId: string; readonly key: string }): string {
  return `${input.tenantId}:${input.key}`;
}

function metadataAction(metadata: unknown): PreferenceMutationAction | null {
  if (!metadata || typeof metadata !== "object") return null;
  const action = (metadata as { action?: unknown }).action;
  return typeof action === "string" ? (action as PreferenceMutationAction) : null;
}

function preferenceChannelForAction(action: PreferenceMutationAction): "email" | "sms" | "push" | "in_app" {
  if (action === "record_sms_stop" || action === "record_sms_start") return "sms";
  return "email";
}

function preferenceSubjectId(plan: PreferenceMutationPlan): string {
  const payload = plan.writes[0]?.payload as { clientId?: unknown } | undefined;
  return typeof payload?.clientId === "string" ? payload.clientId : "anonymous";
}

function preferenceOptIn(plan: PreferenceMutationPlan): boolean {
  if (plan.action === "unsubscribe_email" || plan.action === "record_sms_stop") return false;
  return true;
}

export function createPrismaPreferenceRepository(client: PreferencePrismaClient): PreferenceRepository {
  return {
    async issuePreferenceToken(input) {
      await client.preferenceToken.create({
        data: {
          tenantId: input.tenantId,
          clientId: input.clientId,
          tokenHash: input.tokenHash,
          expiresAt: new Date(input.expiresAt),
        },
      });
    },
    async claimIdempotencyKey(input) {
      const scope = "preference-center";
      const existing = await client.idempotencyKey.findUnique({
        where: { tenantId_scope_key: { tenantId: input.tenantId, scope, key: input.key } },
      });
      const existingAction = metadataAction(existing?.metadata);

      if (!existing) {
        await client.idempotencyKey.create({
          data: {
            tenantId: input.tenantId,
            scope,
            key: input.key,
            status: "claimed",
            metadata: { action: input.action },
          },
        });
        return "claimed";
      }

      if (existingAction === input.action) return "duplicate";
      throw new Error("PREFERENCE_CENTER_IDEMPOTENCY_KEY_CONFLICT");
    },
    async persistClientPreference(input) {
      const channel = preferenceChannelForAction(input.plan.action);
      const subjectId = preferenceSubjectId(input.plan);
      const optedIn = preferenceOptIn(input.plan);
      await client.notificationChannelPreference.upsert({
        where: { tenantId_subjectType_subjectId_channel: { tenantId: input.tenantId, subjectType: "client", subjectId, channel } },
        create: { tenantId: input.tenantId, subjectType: "client", subjectId, channel, optedIn, source: "preference_center" },
        update: { optedIn, source: "preference_center" },
      });
    },
    async persistSuppression(input) {
      const channel = preferenceChannelForAction(input.plan.action);
      const destinationHash = input.plan.tokenHash ?? `${input.tenantId}:${input.reason}`;
      await client.notificationSuppression.upsert({
        where: { tenantId_channel_destinationHash_reason: { tenantId: input.tenantId, channel, destinationHash, reason: input.reason } },
        create: { tenantId: input.tenantId, channel, destinationHash, reason: input.reason, source: "preference_center", active: true },
        update: { active: true, source: "preference_center" },
      });
    },
    async persistTenantChannelSettings(input) {
      const channel = preferenceChannelForAction(input.plan.action);
      await client.tenantNotificationSetting.upsert({
        where: { tenantId_channel: { tenantId: input.tenantId, channel } },
        create: { tenantId: input.tenantId, channel, metadata: buildRedactedPreferenceMetadata({ action: input.plan.action }) },
        update: { metadata: buildRedactedPreferenceMetadata({ action: input.plan.action }) },
      });
    },
    async persistPreferenceAudit(input) {
      await client.auditLog.create({
        data: {
          tenantId: input.tenantId,
          action: `preference.${input.plan.action}`,
          entityType: "PreferenceCenter",
          metadata: buildRedactedPreferenceMetadata(input.redactedMetadata),
        },
      });
    },
  };
}

export function createInMemoryPreferenceRepository(
  state: InMemoryPreferenceRepositoryState = {
    preferenceTokens: [],
    idempotencyKeys: new Map(),
    clientPreferences: [],
    suppressions: [],
    tenantChannelSettings: [],
    preferenceAudits: [],
  },
): PreferenceRepository & { readonly state: InMemoryPreferenceRepositoryState } {
  return {
    state,
    async issuePreferenceToken(input) {
      state.preferenceTokens.push(input);
    },
    async claimIdempotencyKey(input) {
      const key = buildPreferenceIdempotencyKey(input);
      const existing = state.idempotencyKeys.get(key);

      if (!existing) {
        state.idempotencyKeys.set(key, { tenantId: input.tenantId, action: input.action });
        return "claimed";
      }

      if (existing.action === input.action) {
        return "duplicate";
      }

      throw new Error("PREFERENCE_CENTER_IDEMPOTENCY_KEY_CONFLICT");
    },
    async persistClientPreference(input) {
      state.clientPreferences.push(input);
    },
    async persistSuppression(input) {
      state.suppressions.push(input);
    },
    async persistTenantChannelSettings(input) {
      state.tenantChannelSettings.push(input);
    },
    async persistPreferenceAudit(input) {
      state.preferenceAudits.push({
        ...input,
        redactedMetadata: buildRedactedPreferenceMetadata(input.redactedMetadata),
      });
    },
  };
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
      preferenceTokenHashPersistenceAvailable: true,
      tokenExpiryEnforced: true,
      forgedTokenRejectionTested: false,
      listUnsubscribeHeadersConfigured: true,
      emailUnsubscribePersistenceAvailable: true,
      smsStopPersistenceAvailable: true,
      smsStartPersistenceAvailable: true,
      tenantChannelSettingsUiImplemented: true,
      tenantChannelSettingsPersistenceAvailable: true,
      transactionalVsMarketingControlsEnforced: true,
      suppressionAppliedBeforeSend: false,
      auditLogPersistenceAvailable: true,
      idempotencyStoreAvailable: true,
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
    const issueTokenPayload = plan.writes[0]?.payload;
    await repository.issuePreferenceToken({
      tenantId,
      clientId: String(issueTokenPayload?.clientId ?? "missing_client"),
      tokenHash: plan.tokenHash,
      expiresAt: String(issueTokenPayload?.expiresAt ?? ""),
    });
  }
  if (plan.writes.some((write) => write.model === "ClientNotificationPreference")) await repository.persistClientPreference({ tenantId, plan });
  if (plan.writes.some((write) => write.model === "SuppressionListEntry")) await repository.persistSuppression({ tenantId, plan, reason: plan.action });
  if (plan.writes.some((write) => write.model === "TenantNotificationSetting")) await repository.persistTenantChannelSettings({ tenantId, plan });
  await repository.persistPreferenceAudit({
    tenantId,
    plan,
    redactedMetadata: buildRedactedPreferenceMetadata({
      action: plan.action,
      tokenHash: plan.tokenHash,
      writes: plan.writes.map((write) => write.model),
    }),
  });

  return { status: "processed", plan };
}

export const preferenceCenterContract = buildPreferenceCenterContract();
