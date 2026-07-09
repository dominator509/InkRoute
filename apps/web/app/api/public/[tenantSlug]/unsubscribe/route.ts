import { createHash } from "crypto";
import { prisma } from "@inkroute/db";
import { buildPreferenceTokenHash, type PreferenceMutationPlan } from "@inkroute/notifications";
import { NextResponse, type NextRequest } from "next/server";
import { buildPreferencePlanFromRequest, preferenceCenterContract } from "../../../../../lib/preferenceCenter";

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

function hashDestination(value: string): string {
  return createHash("sha256").update(value.toLowerCase().trim()).digest("hex");
}

function unsubscribeIdempotencyKey(parts: readonly string[]): string {
  return `unsubscribe:${createHash("sha256").update(JSON.stringify(parts)).digest("hex")}`;
}

function tokenValidationResponse(reason: string) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "PREFERENCE_TOKEN_INVALID",
        message: "Preference token validation failed before unsubscribe persistence.",
        reason,
        gapIds: ["GAP-067"],
      },
      boundary: "Unsubscribe rejects missing, forged, expired, reused, or revoked preference tokens before preference/suppression/idempotency/audit writes.",
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

function buildSafeUnsubscribePersistenceResponse(persisted: Awaited<ReturnType<typeof persistUnsubscribe>>) {
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

async function resolveUnsubscribeTenant(tenantSlug: string): Promise<{ tenantId: string; tenantSlug: string; source: "database" | "unresolved" }> {
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

async function persistUnsubscribe(input: {
  tenantId: string;
  clientId: string;
  email: string;
  tokenHash: string;
  tokenExpiresAt?: string;
  idempotencyKey: string;
  planStatus: string;
}) {
  const emailHash = input.email ? hashDestination(input.email) : "";
  const subjectId = input.clientId !== "missing_client" ? input.clientId : emailHash ? `email:${emailHash}` : "anonymous";

  return prisma.$transaction(async (tx) => {
    const txRuntime = tx as unknown as {
      client: {
        upsert: (options: Record<string, unknown>) => Promise<{ id: string }>;
        findFirst: (options: Record<string, unknown>) => Promise<{ id: string } | null>;
      };
      preferenceToken: {
        findFirst: (options: Record<string, unknown>) => Promise<{ id: string; clientId: string; expiresAt: Date; usedAt: Date | null; revokedAt: Date | null } | null>;
        update: (options: Record<string, unknown>) => Promise<{ id: string }>;
      };
      idempotencyKey: {
        upsert: (options: Record<string, unknown>) => Promise<{ id: string; key: string }>;
        update: (options: Record<string, unknown>) => Promise<{ id: string }>;
      };
      notificationChannelPreference: { upsert: (options: Record<string, unknown>) => Promise<{ id: string; optedIn: boolean }> };
      notificationSuppression: { upsert: (options: Record<string, unknown>) => Promise<{ id: string; active: boolean }> };
      auditLog: { create: (options: Record<string, unknown>) => Promise<{ id: string }> };
    };

    if (!input.tokenHash) throw new Error("PREFERENCE_TOKEN_MISSING");
    const preferenceToken = await txRuntime.preferenceToken.findFirst({
      where: {
        tenantId: input.tenantId,
        tokenHash: input.tokenHash,
        ...(input.clientId !== "missing_client" ? { clientId: input.clientId } : {}),
      },
      select: { id: true, clientId: true, expiresAt: true, usedAt: true, revokedAt: true },
    });
    if (!preferenceToken) throw new Error("PREFERENCE_TOKEN_FORGED");
    if (preferenceToken.revokedAt) throw new Error("PREFERENCE_TOKEN_REVOKED");
    if (preferenceToken.usedAt) throw new Error("PREFERENCE_TOKEN_REUSED");
    if (preferenceToken.expiresAt.getTime() <= Date.now()) throw new Error("PREFERENCE_TOKEN_EXPIRED");

    const client = input.clientId !== "missing_client"
      ? await txRuntime.client.findFirst({ where: { id: input.clientId, tenantId: input.tenantId }, select: { id: true } })
      : input.email
        ? await txRuntime.client.upsert({
          where: { tenantId_email: { tenantId: input.tenantId, email: input.email.toLowerCase() } },
          create: { tenantId: input.tenantId, email: input.email.toLowerCase(), preferredName: "Unsubscribed client", marketingOptIn: false, smsOptIn: false },
          update: { marketingOptIn: false },
          select: { id: true },
        })
        : null;

    const preferenceSubjectId = client?.id ?? subjectId;
    const idempotency = await txRuntime.idempotencyKey.upsert({
      where: { tenantId_scope_key: { tenantId: input.tenantId, scope: "one-click-unsubscribe", key: input.idempotencyKey } },
      create: {
        tenantId: input.tenantId,
        scope: "one-click-unsubscribe",
        key: input.idempotencyKey,
        status: "claimed",
        metadata: toJsonValue({
          tokenHashPresent: Boolean(input.tokenHash),
          tokenExpiresAt: input.tokenExpiresAt ?? null,
          rawTokenStored: false,
        }),
      },
      update: {
        metadata: toJsonValue({
          replayObserved: true,
          tokenHashPresent: Boolean(input.tokenHash),
          tokenExpiresAt: input.tokenExpiresAt ?? null,
          rawTokenStored: false,
        }),
      },
      select: { id: true, key: true },
    });

    const preference = await txRuntime.notificationChannelPreference.upsert({
      where: { tenantId_subjectType_subjectId_channel: { tenantId: input.tenantId, subjectType: client ? "client" : "anonymous", subjectId: preferenceSubjectId, channel: "email" } },
      create: {
        tenantId: input.tenantId,
        subjectType: client ? "client" : "anonymous",
        subjectId: preferenceSubjectId,
        channel: "email",
        optedIn: false,
        source: "one_click_unsubscribe",
        metadata: toJsonValue({ tokenHashPresent: Boolean(input.tokenHash), rawTokenStored: false }),
      },
      update: {
        optedIn: false,
        source: "one_click_unsubscribe",
        metadata: toJsonValue({ tokenHashPresent: Boolean(input.tokenHash), rawTokenStored: false }),
      },
      select: { id: true, optedIn: true },
    });

    const suppression = input.email
      ? await txRuntime.notificationSuppression.upsert({
        where: { tenantId_channel_destinationHash_reason: { tenantId: input.tenantId, channel: "email", destinationHash: emailHash, reason: "unsubscribe_email" } },
        create: {
          tenantId: input.tenantId,
          channel: "email",
          provider: "email",
          destinationHash: emailHash,
          reason: "unsubscribe_email",
          source: "one_click_unsubscribe",
          active: true,
          rawPayloadStored: false,
          metadata: toJsonValue({ tokenHashPresent: Boolean(input.tokenHash), rawTokenStored: false }),
        },
        update: {
          active: true,
          rawPayloadStored: false,
          metadata: toJsonValue({ tokenHashPresent: Boolean(input.tokenHash), rawTokenStored: false }),
        },
        select: { id: true, active: true },
      })
      : null;

    const audit = await txRuntime.auditLog.create({
      data: {
        tenantId: input.tenantId,
        action: "preference.one_click_unsubscribe",
        entityType: "NotificationChannelPreference",
        entityId: preference.id,
        metadata: toJsonValue({
          clientMatched: Boolean(client),
          preferencePersisted: true,
          suppressionPersisted: Boolean(suppression),
          idempotencyPersisted: true,
          internalPersistenceIdsStored: false,
          planStatus: input.planStatus,
          tokenHashPresent: Boolean(input.tokenHash),
          rawTokenStored: false,
          redactedFields: ["email", "token"],
          gapIds: ["GAP-010", "GAP-061", "GAP-067", "GAP-069"],
        }),
      },
      select: { id: true },
    });

    await txRuntime.preferenceToken.update({
      where: { id: preferenceToken.id },
      data: { usedAt: new Date() },
      select: { id: true },
    });

    await txRuntime.idempotencyKey.update({
      where: { tenantId_scope_key: { tenantId: input.tenantId, scope: "one-click-unsubscribe", key: idempotency.key } },
      data: {
        status: "completed",
        result: toJsonValue({
          preferencePersisted: true,
          suppressionPersisted: Boolean(suppression),
          auditPersisted: Boolean(audit.id),
          tokenHashPresent: Boolean(input.tokenHash),
          preferenceTokenConsumed: true,
          rawTokenStored: false,
          internalPersistenceIdsStored: false,
        }),
      },
      select: { id: true },
    });

    return { client, preference, suppression, idempotency, audit };
  });
}

export async function POST(request: NextRequest, context: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await context.params;
  const rawToken = request.nextUrl.searchParams.get("token") ?? request.headers.get("x-preference-token") ?? undefined;
  const tokenHash = request.nextUrl.searchParams.get("tokenHash") ?? request.headers.get("x-preference-token-hash") ?? (rawToken ? buildPreferenceTokenHash(rawToken) : undefined);
  const email = request.nextUrl.searchParams.get("email") ?? undefined;
  const tokenExpiresAt = request.nextUrl.searchParams.get("tokenExpiresAt") ?? new Date(Date.now() + 60_000).toISOString();
  const clientId = request.nextUrl.searchParams.get("clientId") ?? "missing_client";
  const idempotencyKey = unsubscribeIdempotencyKey([tenantSlug, tokenHash ?? "missing"]);
  const plan = buildPreferencePlanFromRequest({
    tenantId: tenantSlug,
    action: "unsubscribe_email",
    clientId,
    ...(email ? { email } : {}),
    ...(tokenHash ? { tokenHash } : {}),
    tokenExpiresAt,
    now: new Date().toISOString(),
    idempotencyKey,
    emailOptIn: false,
    marketingOptIn: false,
    transactionalAllowed: true,
  });

  const tenant = await resolveUnsubscribeTenant(tenantSlug);
  if (plan.status === "blocked") {
    return tokenValidationResponse(plan.blockers.join("; "));
  }
  if (tenant.source === "database") {
    try {
      const persisted = await persistUnsubscribe({
        tenantId: tenant.tenantId,
        clientId,
        email: email?.toLowerCase().trim() ?? "",
        tokenHash: tokenHash ?? "",
        tokenExpiresAt,
        idempotencyKey,
        planStatus: plan.status,
      });
      return NextResponse.json(
        {
          ok: plan.status === "ready",
          tenantScope: { routeTenantSlugReceived: true, tenantSlugEchoed: false },
          persistence: "database",
          plan: buildSafePreferencePlanResponse(plan),
          listUnsubscribeHeaders: preferenceCenterContract.listUnsubscribeHeaders,
          persisted: buildSafeUnsubscribePersistenceResponse(persisted),
          gapIds: ["GAP-067"],
          boundary: "One-click unsubscribe persists hash-only preference/suppression/idempotency/audit rows when DB tenant scope is available and returns a safe persistence receipt without client, preference, suppression, idempotency, audit, token, or write-payload internals.",
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
              code: "PROVIDER_UNSUBSCRIBE_PERSISTENCE_NOT_CONFIGURED",
              message: "One-click unsubscribe could not be persisted to hash-only preference, suppression, idempotency, and audit rows.",
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
          code: "PROVIDER_UNSUBSCRIBE_PERSISTENCE_NOT_CONFIGURED",
          message: "Production one-click unsubscribe requires durable hash-only token validation, suppression persistence, audit logs, and idempotency storage; local-contract fallback responses are disabled.",
          gapIds: ["GAP-010", "GAP-061", "GAP-067", "GAP-069"],
        },
        productionBoundary: {
          localContractUnsubscribeFallbackDisabled: true,
          requiredBeforeEnablement: [
            "hash-only preference token validation",
            "SuppressionListEntry persistence",
            "NotificationAuditLog and IdempotencyKey persistence",
            "provider List-Unsubscribe integration evidence",
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
      listUnsubscribeHeaders: preferenceCenterContract.listUnsubscribeHeaders,
      gapIds: ["GAP-067"],
      boundary: "One-click unsubscribe route returns the suppression write plan and never stores raw preference tokens in local runtime.",
    },
    { status: plan.status === "ready" ? 202 : 409, headers: noStoreHeaders },
  );
}
