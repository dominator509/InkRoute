import { createHash } from "crypto";
import { prisma } from "@inkroute/db";
import { buildPreferenceTokenHash, type PreferenceMutationAction, type PreferenceMutationPlan } from "@inkroute/notifications";
import { NextResponse, type NextRequest } from "next/server";
import { buildPreferencePlanFromRequest, preferenceCenterContract } from "../../../../../lib/preferenceCenter";

const actions: readonly PreferenceMutationAction[] = ["issue_preference_token", "update_email_preferences", "unsubscribe_email", "record_sms_stop", "record_sms_start", "update_tenant_channel_settings"];
const noStoreHeaders = { "Cache-Control": "no-store" } as const;

function parseAction(value: unknown): PreferenceMutationAction {
  return typeof value === "string" && actions.includes(value as PreferenceMutationAction) ? (value as PreferenceMutationAction) : "update_email_preferences";
}

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

function hashDestination(value: string): string {
  return createHash("sha256").update(value.toLowerCase().trim()).digest("hex");
}

function tokenValidationResponse(reason: string) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "PREFERENCE_TOKEN_INVALID",
        message: "Preference token validation failed before mutation persistence.",
        reason,
        gapIds: ["GAP-067"],
      },
      boundary: "Preference mutations reject missing, forged, expired, reused, or revoked preference tokens before preference/suppression/idempotency/audit writes.",
    },
    { status: 401, headers: noStoreHeaders },
  );
}

function buildSafePreferencePlanResponse(plan: PreferenceMutationPlan) {
  return {
    status: plan.status,
    action: plan.action,
    tokenHashPresent: Boolean(plan.tokenHash),
    rawTokenEchoed: false,
    tokenHashEchoed: false,
    idempotencyKeyRecorded: Boolean(plan.idempotencyKey),
    idempotencyKeyEchoed: false,
    writeModels: plan.writes.map((write) => write.model),
    writePayloadsEchoed: false,
    blockers: plan.blockers,
  };
}

function buildSafePreferenceContractResponse() {
  return {
    runtimeReadiness: preferenceCenterContract.runtimeReadiness,
    listUnsubscribeHeadersConfigured: Boolean(preferenceCenterContract.listUnsubscribeHeaders),
    requiredRepositoryMethods: preferenceCenterContract.requiredRepositoryMethods,
    plans: {
      issueTokenPlan: buildSafePreferencePlanResponse(preferenceCenterContract.issueTokenPlan),
      updateEmailPlan: buildSafePreferencePlanResponse(preferenceCenterContract.updateEmailPlan),
      unsubscribeEmailPlan: buildSafePreferencePlanResponse(preferenceCenterContract.unsubscribeEmailPlan),
      smsStopPlan: buildSafePreferencePlanResponse(preferenceCenterContract.smsStopPlan),
      smsStartPlan: buildSafePreferencePlanResponse(preferenceCenterContract.smsStartPlan),
      tenantSettingsPlan: buildSafePreferencePlanResponse(preferenceCenterContract.tenantSettingsPlan),
    },
    rawContractPlansEchoed: false,
    rawTokenEchoed: false,
    tokenHashEchoed: false,
    rawEmailEchoed: false,
    rawPhoneEchoed: false,
    idempotencyKeyEchoed: false,
    writePayloadsEchoed: false,
  };
}

function buildSafePreferencePersistenceResponse(persisted: Awaited<ReturnType<typeof persistPreferenceMutation>>) {
  return {
    clientMatchedOrCreated: Boolean(persisted.client?.id),
    clientIdEchoed: false,
    clientEmailSelectedFromDatabase: false,
    preferencePersisted: true,
    preferenceIdEchoed: false,
    suppressionPersisted: Boolean(persisted.suppression),
    suppressionIdEchoed: false,
    idempotencyPersisted: true,
    idempotencyKeyIdEchoed: false,
    auditPersisted: true,
    auditIdEchoed: false,
    tenantIdEchoed: false,
    rawTokenStored: false,
    rawTokenEchoed: false,
    tokenHashEchoed: false,
    rawPreferenceWritePayloadsEchoed: false,
    internalPersistenceIdsEchoed: false,
  };
}

function isDatabaseUnavailable(error: unknown): boolean {
  if (!process.env.DATABASE_URL) return true;
  if (!(error instanceof Error)) return false;
  const code = (error as { code?: string }).code;
  if (typeof code === "string" && ["P1000", "P1001", "P1002", "P1003", "P1008"].includes(code)) return true;
  const message = error.message.toLowerCase();
  return message.includes("connect") && message.includes("database");
}

async function resolvePreferenceTenant(tenantSlug: string): Promise<{ tenantId: string; tenantSlug: string; source: "database" | "unresolved" }> {
  const normalizedSlug = decodeURIComponent(tenantSlug).toLowerCase().trim();
  try {
    const prismaRuntime = prisma as unknown as {
      tenant: {
        findUnique: (options: { where: { slug: string }; select: { id: true; slug: true } }) => Promise<{ id: string; slug: string } | null>;
      };
    };
    const tenant = await prismaRuntime.tenant.findUnique({ where: { slug: normalizedSlug }, select: { id: true, slug: true } });
    if (tenant) return { tenantId: tenant.id, tenantSlug: tenant.slug, source: "database" };
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;
  }
  return { tenantId: normalizedSlug, tenantSlug: normalizedSlug, source: "unresolved" };
}

function preferenceChannelForAction(action: PreferenceMutationAction): "email" | "sms" | "push" {
  if (action === "record_sms_stop" || action === "record_sms_start") return "sms";
  if (action === "update_tenant_channel_settings") return "push";
  return "email";
}

function optedInForAction(action: PreferenceMutationAction, body: Record<string, unknown>): boolean {
  if (action === "unsubscribe_email" || action === "record_sms_stop") return false;
  if (action === "record_sms_start") return true;
  const channel = preferenceChannelForAction(action);
  const explicit = channel === "sms" ? body.smsOptIn : channel === "push" ? body.pushOptIn : body.emailOptIn;
  return typeof explicit === "boolean" ? explicit : true;
}

async function persistPreferenceMutation(input: {
  tenantId: string;
  action: PreferenceMutationAction;
  body: Record<string, unknown>;
  planStatus: string;
}) {
  const email = typeof input.body.email === "string" ? input.body.email.toLowerCase().trim() : "";
  const phone = typeof input.body.phone === "string" ? input.body.phone.trim() : "";
  const clientIdFromBody = typeof input.body.clientId === "string" ? input.body.clientId : "";
  const channel = preferenceChannelForAction(input.action);
  const optedIn = optedInForAction(input.action, input.body);
  const anonymousSubjectId = email ? `email:${hashDestination(email)}` : phone ? `phone:${hashDestination(phone)}` : "tenant";
  const idempotencyKey = typeof input.body.idempotencyKey === "string" ? input.body.idempotencyKey : `preference:${input.tenantId}:${input.action}:${anonymousSubjectId}`;
  const tokenHash = typeof input.body.tokenHash === "string"
    ? input.body.tokenHash
    : typeof input.body.token === "string"
      ? buildPreferenceTokenHash(input.body.token)
      : "";
  const requiresClientToken = input.action !== "issue_preference_token" && input.action !== "update_tenant_channel_settings";

  return prisma.$transaction(async (tx) => {
    const txRuntime = tx as unknown as {
      client: {
        upsert: (options: Record<string, unknown>) => Promise<{ id: string }>;
        findFirst: (options: Record<string, unknown>) => Promise<{ id: string } | null>;
      };
      preferenceToken: {
        create: (options: Record<string, unknown>) => Promise<{ id: string }>;
        findFirst: (options: Record<string, unknown>) => Promise<{ id: string; clientId: string; expiresAt: Date; usedAt: Date | null; revokedAt: Date | null } | null>;
      };
      idempotencyKey: {
        upsert: (options: Record<string, unknown>) => Promise<{ id: string; key: string; status: string }>;
        update: (options: Record<string, unknown>) => Promise<{ id: string }>;
      };
      notificationChannelPreference: { upsert: (options: Record<string, unknown>) => Promise<{ id: string; optedIn: boolean }> };
      notificationSuppression: { upsert: (options: Record<string, unknown>) => Promise<{ id: string; active: boolean }> };
      auditLog: { create: (options: Record<string, unknown>) => Promise<{ id: string }> };
    };

    const client = clientIdFromBody
      ? await txRuntime.client.findFirst({ where: { id: clientIdFromBody, tenantId: input.tenantId }, select: { id: true } })
      : email
        ? await txRuntime.client.upsert({
          where: { tenantId_email: { tenantId: input.tenantId, email } },
          create: { tenantId: input.tenantId, email, preferredName: "Preference subscriber", marketingOptIn: optedIn, smsOptIn: channel === "sms" ? optedIn : false },
          update: { ...(channel === "email" ? { marketingOptIn: optedIn } : {}), ...(channel === "sms" ? { smsOptIn: optedIn } : {}) },
          select: { id: true },
        })
        : null;

    if (input.action === "issue_preference_token") {
      const issueTokenHash = tokenHash;
      const tokenExpiresAt = typeof input.body.tokenExpiresAt === "string" ? new Date(input.body.tokenExpiresAt) : null;
      if (!client?.id || !issueTokenHash || !tokenExpiresAt || tokenExpiresAt.getTime() <= Date.now()) throw new Error("PREFERENCE_TOKEN_ISSUE_INVALID");
      await txRuntime.preferenceToken.create({
        data: { tenantId: input.tenantId, clientId: client.id, tokenHash: issueTokenHash, expiresAt: tokenExpiresAt },
        select: { id: true },
      });
    }
    if (requiresClientToken) {
      if (!tokenHash) throw new Error("PREFERENCE_TOKEN_MISSING");
      const preferenceToken = await txRuntime.preferenceToken.findFirst({
        where: {
          tenantId: input.tenantId,
          tokenHash,
          ...(client?.id ? { clientId: client.id } : {}),
        },
        select: { id: true, clientId: true, expiresAt: true, usedAt: true, revokedAt: true },
      });
      if (!preferenceToken) throw new Error("PREFERENCE_TOKEN_FORGED");
      if (preferenceToken.revokedAt) throw new Error("PREFERENCE_TOKEN_REVOKED");
      if (preferenceToken.usedAt) throw new Error("PREFERENCE_TOKEN_REUSED");
      if (preferenceToken.expiresAt.getTime() <= Date.now()) throw new Error("PREFERENCE_TOKEN_EXPIRED");
    }

    const subjectType = client ? "client" : "anonymous";
    const subjectId = client?.id ?? anonymousSubjectId;
    const idempotency = await txRuntime.idempotencyKey.upsert({
      where: { tenantId_scope_key: { tenantId: input.tenantId, scope: "preference-center", key: idempotencyKey } },
      create: {
        tenantId: input.tenantId,
        scope: "preference-center",
        key: idempotencyKey,
        status: "claimed",
        metadata: toJsonValue({ action: input.action, channel, subjectType, subjectId, tokenHashPresent: Boolean(tokenHash), rawTokenStored: false }),
      },
      update: {
        status: "claimed",
        metadata: toJsonValue({ action: input.action, channel, subjectType, subjectId, replayObserved: true, tokenHashPresent: Boolean(tokenHash), rawTokenStored: false }),
      },
      select: { id: true, key: true, status: true },
    });

    const preference = await txRuntime.notificationChannelPreference.upsert({
      where: { tenantId_subjectType_subjectId_channel: { tenantId: input.tenantId, subjectType, subjectId, channel } },
      create: {
        tenantId: input.tenantId,
        subjectType,
        subjectId,
        channel,
        optedIn,
        source: "preference_center",
        metadata: toJsonValue({ action: input.action, tokenHashPresent: Boolean(tokenHash), rawTokenStored: false }),
      },
      update: {
        optedIn,
        source: "preference_center",
        metadata: toJsonValue({ action: input.action, tokenHashPresent: Boolean(tokenHash), rawTokenStored: false }),
      },
      select: { id: true, optedIn: true },
    });

    const shouldSuppress = input.action === "unsubscribe_email" || input.action === "record_sms_stop";
    const suppressionDestination = channel === "sms" ? phone : email;
    const suppression = shouldSuppress && suppressionDestination
      ? await txRuntime.notificationSuppression.upsert({
        where: { tenantId_channel_destinationHash_reason: { tenantId: input.tenantId, channel, destinationHash: hashDestination(suppressionDestination), reason: input.action } },
        create: {
          tenantId: input.tenantId,
          channel,
          provider: channel === "sms" ? "twilio" : "email",
          destinationHash: hashDestination(suppressionDestination),
          reason: input.action,
          source: "preference_center",
          active: true,
          rawPayloadStored: false,
          metadata: toJsonValue({ tokenHashPresent: Boolean(tokenHash), rawTokenStored: false }),
        },
        update: {
          active: true,
          rawPayloadStored: false,
          metadata: toJsonValue({ tokenHashPresent: Boolean(tokenHash), rawTokenStored: false }),
        },
        select: { id: true, active: true },
      })
      : null;

    const audit = await txRuntime.auditLog.create({
      data: {
        tenantId: input.tenantId,
        action: "preference.public_mutation",
        entityType: "NotificationChannelPreference",
        entityId: preference.id,
        metadata: toJsonValue({
          action: input.action,
          channel,
          clientMatched: Boolean(client),
          preferencePersisted: true,
          suppressionPersisted: Boolean(suppression),
          idempotencyPersisted: true,
          internalPersistenceIdsStored: false,
          planStatus: input.planStatus,
          tokenHashPresent: Boolean(tokenHash),
          rawTokenStored: false,
          redactedFields: ["email", "phone", "token"],
          gapIds: ["GAP-010", "GAP-061", "GAP-067", "GAP-069"],
        }),
      },
      select: { id: true },
    });

    await txRuntime.idempotencyKey.update({
      where: { tenantId_scope_key: { tenantId: input.tenantId, scope: "preference-center", key: idempotency.key } },
      data: {
        status: "completed",
        result: toJsonValue({
          preferencePersisted: true,
          suppressionPersisted: Boolean(suppression),
          auditPersisted: Boolean(audit.id),
          tokenHashPresent: Boolean(tokenHash),
          rawTokenStored: false,
          internalPersistenceIdsStored: false,
        }),
      },
      select: { id: true },
    });

    return { client, idempotency, preference, suppression, audit };
  });
}

export async function GET(_request: NextRequest, context: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await context.params;
  return NextResponse.json(
    {
      ok: true,
      tenantSlug,
      contract: buildSafePreferenceContractResponse(),
      gapIds: ["GAP-067"],
      boundary: "Preference center route exposes token, unsubscribe, STOP/START, tenant settings, List-Unsubscribe, and legal-copy gates. POST persists DB rows when tenant scope is available.",
    },
    { headers: noStoreHeaders },
  );
}

export async function POST(request: NextRequest, context: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await context.params;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_PREFERENCE_JSON", message: "Preference mutation body must be valid JSON." } }, { status: 400, headers: noStoreHeaders });
  }

  const action = parseAction(body.action);
  const tokenExpiresAt =
    typeof body.tokenExpiresAt === "string"
      ? body.tokenExpiresAt
      : action !== "issue_preference_token" && action !== "update_tenant_channel_settings"
        ? new Date(Date.now() + 60_000).toISOString()
        : undefined;
  const plan = buildPreferencePlanFromRequest({
    tenantId: typeof body.tenantId === "string" ? body.tenantId : tenantSlug,
    action,
    now: typeof body.now === "string" ? body.now : new Date().toISOString(),
    ...(typeof body.clientId === "string" ? { clientId: body.clientId } : {}),
    ...(typeof body.actorId === "string" ? { actorId: body.actorId } : {}),
    ...(typeof body.email === "string" ? { email: body.email } : {}),
    ...(typeof body.phone === "string" ? { phone: body.phone } : {}),
    ...(typeof body.token === "string" ? { token: body.token } : {}),
    ...(typeof body.tokenHash === "string" ? { tokenHash: body.tokenHash } : {}),
    ...(tokenExpiresAt ? { tokenExpiresAt } : {}),
    idempotencyKey: typeof body.idempotencyKey === "string" ? body.idempotencyKey : `preference:${tenantSlug}:${action}`,
    ...(typeof body.emailOptIn === "boolean" ? { emailOptIn: body.emailOptIn } : {}),
    ...(typeof body.smsOptIn === "boolean" ? { smsOptIn: body.smsOptIn } : {}),
    ...(typeof body.pushOptIn === "boolean" ? { pushOptIn: body.pushOptIn } : {}),
    ...(typeof body.marketingOptIn === "boolean" ? { marketingOptIn: body.marketingOptIn } : {}),
    ...(typeof body.transactionalAllowed === "boolean" ? { transactionalAllowed: body.transactionalAllowed } : {}),
    ...(typeof body.tenantChannelSettingsConfigured === "boolean" ? { tenantChannelSettingsConfigured: body.tenantChannelSettingsConfigured } : {}),
    ...(typeof body.legalCopyApproved === "boolean" ? { legalCopyApproved: body.legalCopyApproved } : {}),
  });

  const tenant = await resolvePreferenceTenant(tenantSlug);
  if (plan.status === "blocked") {
    return tokenValidationResponse(plan.blockers.join("; "));
  }
  if (tenant.source === "database") {
    try {
      const persisted = await persistPreferenceMutation({ tenantId: tenant.tenantId, action, body, planStatus: plan.status });
      return NextResponse.json(
        {
          ok: plan.status === "ready",
          tenantScope: { routeTenantSlugReceived: true, tenantSlugEchoed: false },
          persistence: "database",
          plan: buildSafePreferencePlanResponse(plan),
          persisted: buildSafePreferencePersistenceResponse(persisted),
          requiredRepositoryMethods: preferenceCenterContract.requiredRepositoryMethods,
          gapIds: ["GAP-067"],
          boundary: "Preference POST persists hash-only preference/suppression/idempotency/audit rows when DB tenant scope is available and returns a safe persistence receipt without client, preference, suppression, idempotency, audit, token, or write-payload internals; provider List-Unsubscribe evidence remains gated.",
        },
        { status: plan.status === "ready" ? 202 : 409, headers: noStoreHeaders },
      );
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("PREFERENCE_TOKEN_")) {
        return tokenValidationResponse(error.message);
      }
      if (process.env.NODE_ENV === "production" || !isDatabaseUnavailable(error)) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "PROVIDER_PREFERENCE_PERSISTENCE_NOT_CONFIGURED",
              message: "Preference mutation could not be persisted to tenant-scoped preference, suppression, idempotency, and audit rows.",
              gapIds: ["GAP-010", "GAP-061", "GAP-067", "GAP-069"],
            },
          },
          { status: isDatabaseUnavailable(error) ? 503 : 500, headers: noStoreHeaders },
        );
      }
    }
  }

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "PROVIDER_PREFERENCE_PERSISTENCE_NOT_CONFIGURED",
          message: "Production preference mutations require signed token crypto, hash-only persistence, suppression repositories, audit logs, and idempotency storage; local-contract fallback responses are disabled.",
          gapIds: ["GAP-010", "GAP-061", "GAP-067", "GAP-069"],
        },
        productionBoundary: {
          localContractMutationFallbackDisabled: true,
          requiredBeforeEnablement: [
            "signed preference token crypto and hash persistence",
            "ClientNotificationPreference and SuppressionListEntry persistence",
            "NotificationAuditLog and IdempotencyKey persistence",
            "provider List-Unsubscribe and pre-send suppression evidence",
          ],
        },
      },
      { status: 503, headers: noStoreHeaders },
    );
  }

  return NextResponse.json(
    {
      ok: plan.status === "ready",
      tenantSlug,
      persistence: "local-contract",
      plan: buildSafePreferencePlanResponse(plan),
      rawTokenEchoed: false,
      tokenHashEchoed: false,
      rawPreferenceWritePayloadsEchoed: false,
      responseProjection: {
        tenantIdEchoed: false,
        clientIdEchoed: false,
        preferenceIdEchoed: false,
        suppressionIdEchoed: false,
        idempotencyKeyIdEchoed: false,
        auditIdEchoed: false,
        rawTokenEchoed: false,
        tokenHashEchoed: false,
        rawPreferenceWritePayloadsEchoed: false,
        internalPersistenceIdsEchoed: false,
      },
      requiredRepositoryMethods: preferenceCenterContract.requiredRepositoryMethods,
      gapIds: ["GAP-067"],
      boundary: "Preference POST returns the local mutation contract; durable token, suppression, preference, settings, audit, and idempotency repositories remain required for live mutations.",
    },
    { status: plan.status === "ready" ? 202 : 409, headers: noStoreHeaders },
  );
}
