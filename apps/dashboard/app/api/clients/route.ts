import { createHash } from "node:crypto";
import { buildTenantDashboardView } from "@inkroute/config";
import { prisma } from "@inkroute/db";
import { clientInputSchema } from "@inkroute/validators";
import { NextRequest, NextResponse } from "next/server";
import { dashboardProjectedClients } from "../../../lib/demo";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../dashboardAuth";

export const runtime = "nodejs";

function formatLocation(city?: string | null, region?: string | null, country?: string | null): string {
  return [city, region, country].filter(Boolean).join(", ") || "Unknown";
}

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

function normalizeOptionalText(value?: string): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

function hashIdempotencySubject(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function buildClientReadResponseProjection() {
  return {
    clientReadResponseAllowlisted: true,
    clientIdEchoed: false,
    clientIdsEchoed: false,
    tenantIdEchoed: false,
    relatedBookingIdsEchoed: false,
    auditIdEchoed: false,
    encryptedMedicalNotesEchoed: false,
    privateNotesEchoed: false,
    internalPersistenceIdsEchoed: false,
  };
}

function buildSafeClientListRecord(record: Record<string, unknown>) {
  const {
    id: _id,
    clientId: _clientId,
    tenantId: _tenantId,
    bookingId: _bookingId,
    bookingIds: _bookingIds,
    relatedBookingId: _relatedBookingId,
    relatedBookingIds: _relatedBookingIds,
    ...safeRecord
  } = record;

  return {
    ...safeRecord,
    relatedBookingLinked: Boolean(_bookingId ?? _relatedBookingId ?? (Array.isArray(_bookingIds) && _bookingIds.length > 0) ?? (Array.isArray(_relatedBookingIds) && _relatedBookingIds.length > 0)),
    responseProjection: {
      clientIdEchoed: false,
      tenantIdEchoed: false,
      relatedBookingIdsEchoed: false,
      internalPersistenceIdsEchoed: false,
    },
  };
}

function buildClientCreateResponseProjection() {
  return {
    clientCreateResponseAllowlisted: true,
    clientIdEchoed: false,
    tenantRecordIdEchoed: false,
    tenantIdEchoed: false,
    auditIdEchoed: false,
    idempotencyKeyIdEchoed: false,
    rawIdempotencyKeyEchoed: false,
    duplicateClientIdEchoed: false,
    internalPersistenceIdsEchoed: false,
  };
}

function buildSafeClientCreateResponse(client: {
  email: string;
  preferredName: string | null;
  phone: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  timezone: string | null;
  marketingOptIn: boolean;
  smsOptIn: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    email: client.email,
    preferredName: client.preferredName,
    phone: client.phone,
    city: client.city,
    region: client.region,
    country: client.country,
    timezone: client.timezone,
    marketingOptIn: client.marketingOptIn,
    smsOptIn: client.smsOptIn,
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "client:read");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to read clients." } }, { status: 403, headers: noStoreHeaders });
  }

  const params = new URL(request.url).searchParams;
  const tenantId = params.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot query clients for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  const limit = Math.min(Math.max(Number(params.get("limit") ?? 50), 1), 100);

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantScope: { actorTenantMatched: true },
          responseProjection: buildClientReadResponseProjection(),
          error: {
            code: "PROVIDER_DASHBOARD_READS_NOT_CONFIGURED",
            message: "Production dashboard client reads require DB-backed actor resolution and tenant-scoped repository data; local fallback demo payloads are disabled.",
            gapIds: ["GAP-007", "GAP-037", "GAP-040"],
          },
          productionBoundary: { localDashboardReadFallbackDisabled: true },
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantIdEchoed: false,
        persistence: "local-fallback",
        count: dashboardProjectedClients.length,
        clients: dashboardProjectedClients.slice(0, limit).map((client) => buildSafeClientListRecord(client as Record<string, unknown>)),
        tenantScope: { actorTenantMatched: true },
        responseProjection: buildClientReadResponseProjection(),
        gapIds: ["GAP-007", "GAP-037", "GAP-040"],
        boundary: "Local fallback returns tenant-projected demo clients only; database mode is required for live CRM reads.",
      },
      { headers: noStoreHeaders },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const rows = await tx.client.findMany({
        where: { tenantId },
        orderBy: { updatedAt: "desc" },
        take: limit,
        select: {
          id: true,
          tenantId: true,
          preferredName: true,
          email: true,
          phone: true,
          city: true,
          region: true,
          country: true,
          marketingOptIn: true,
          smsOptIn: true,
          updatedAt: true,
          profile: { select: { preferredContactMethod: true, internalNotes: true, medicalNotesEncrypted: true } },
          bookingRequests: {
            select: {
              status: true,
              updatedAt: true,
              payments: { select: { amountCents: true, status: true } },
            },
          },
        },
      });

      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "client:read:list",
          entityType: "Client",
          metadata: {
            source: "dashboard-api",
            count: rows.length,
            limit,
            redaction: "buildTenantDashboardView",
            includesSensitiveProfileFlags: true,
          },
        },
        select: { id: true },
      });

      return { rows, audit };
    });

    const view = buildTenantDashboardView({
      collection: "clients",
      tenantId,
      source: "repository",
      records: result.rows.map((row: {
        id: string;
        tenantId: string;
        preferredName: string | null;
        email: string | null;
        phone: string | null;
        city: string | null;
        region: string | null;
        country: string | null;
        marketingOptIn: boolean;
        smsOptIn: boolean;
        updatedAt: Date;
        profile: { preferredContactMethod: string | null; internalNotes: string | null; medicalNotesEncrypted: string | null } | null;
        bookingRequests: Array<{ status: string; updatedAt: Date; payments: Array<{ amountCents: number; status: string }> }>;
      }) => {
        const latestBooking = row.bookingRequests
          .slice()
          .sort(
            (a: { updatedAt: Date }, b: { updatedAt: Date }) => b.updatedAt.getTime() - a.updatedAt.getTime(),
          )[0];
        const lifetimeValueCents = row.bookingRequests.reduce(
          (sum: number, booking: { payments: { status: string; amountCents: number }[] }) =>
            sum +
            booking.payments
              .filter((payment: { status: string }) => payment.status === "paid")
              .reduce((paymentSum: number, payment: { amountCents: number }) => paymentSum + payment.amountCents, 0),
          0,
        );
        return {
          preferredName: row.preferredName,
          email: row.email,
          phone: row.phone,
          city: formatLocation(row.city, row.region, row.country),
          tags: [
            row.marketingOptIn ? "marketing-ok" : "marketing-off",
            row.smsOptIn ? "sms-ok" : "sms-off",
            row.profile?.preferredContactMethod ? `prefers-${row.profile.preferredContactMethod}` : "contact-unset",
          ],
          lifetimeValueCents,
          lastActivity: latestBooking ? `${latestBooking.status} booking updated` : `Profile updated ${row.updatedAt.toISOString()}`,
          riskFlags: [
            ...(row.profile?.medicalNotesEncrypted ? ["medical-notes-present"] : []),
            ...(row.profile?.internalNotes ? ["private-notes-present"] : []),
          ],
          medicalNotes: row.profile?.medicalNotesEncrypted ? "[redacted-dashboard-field]" : null,
          privateNotes: row.profile?.internalNotes ? "[redacted-dashboard-field]" : null,
          hasMedicalNotes: Boolean(row.profile?.medicalNotesEncrypted),
          hasPrivateNotes: Boolean(row.profile?.internalNotes),
        };
      }),
      redactedFields: ["email", "phone", "medicalNotes", "privateNotes", "internalNotes"],
    });

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        persistence: "database",
        count: view.records.length,
        clients: view.records.map((record) => buildSafeClientListRecord(record as Record<string, unknown>)),
        tenantScope: { actorTenantMatched: true },
        responseProjection: buildClientReadResponseProjection(),
        gapIds: ["GAP-007", "GAP-037", "GAP-040"],
        boundary: "Dashboard client list reads are tenant-scoped, redacted, no-store, and audited.",
      },
      { headers: noStoreHeaders },
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          error: { code: "DATABASE_UNAVAILABLE", message: "Client list reads require the dashboard database connection." },
          tenantScope: { actorTenantMatched: true },
          responseProjection: buildClientReadResponseProjection(),
          gapIds: ["GAP-007", "GAP-037", "GAP-040"],
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "CLIENT_LIST_READ_FAILED", message: "Clients could not be loaded." } }, { status: 500, headers: noStoreHeaders });
  }
}

export async function POST(request: NextRequest) {
  let actor;
  try {
    actor = resolveDashboardActor(request);
    assertPermission(actor, "client:write");
  } catch (error) {
    const status = error instanceof Error && error.message === "AUTH_REQUIRED" ? 401 : 403;
    const code = status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN";
    return NextResponse.json(
      { ok: false, error: { code, message: "Actor is not allowed to create clients." } },
      { status, headers: noStoreHeaders },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_JSON", message: "Client body must be valid JSON." } },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const parsed = clientInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Client payload failed validation.",
          issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
        },
      },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const input = parsed.data;
  const tenantId = actor.tenantId;
  const email = input.email.trim().toLowerCase();
  const phone = normalizeOptionalText(input.phone);
  const legalName = normalizeOptionalText(input.legalName);
  const pronouns = normalizeOptionalText(input.pronouns);
  const city = normalizeOptionalText(input.city);
  const region = normalizeOptionalText(input.region);
  const country = normalizeOptionalText(input.country);
  const timezone = normalizeOptionalText(input.timezone);
  const idempotencyKey =
    request.headers.get("idempotency-key") ??
    `client-create:${tenantId}:${hashIdempotencySubject(email)}`;

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          error: {
            code: "PROVIDER_CLIENT_PERSISTENCE_NOT_CONFIGURED",
            message: "Production client creation requires DB-backed dashboard auth, tenant-scoped Client persistence, and AuditLog rows; local fallback mutations are disabled.",
            gapIds: ["GAP-007", "GAP-037", "GAP-038", "GAP-040"],
          },
          tenantScope: { actorTenantMatched: true },
          responseProjection: buildClientCreateResponseProjection(),
          productionBoundary: { localClientMutationFallbackDisabled: true },
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        source: actor.source,
        tenantScope: { actorTenantMatched: true },
        responseProjection: buildClientCreateResponseProjection(),
        error: {
          code: "DATABASE_REQUIRED",
          message: "Client creation requires database-backed dashboard auth so Client and AuditLog rows can be persisted.",
        },
        gapIds: ["GAP-007", "GAP-037", "GAP-038", "GAP-040"],
      },
      { status: 409, headers: noStoreHeaders },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const idempotency = await tx.idempotencyKey.upsert({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-client-create", key: idempotencyKey } },
        create: {
          tenantId,
          scope: "dashboard-client-create",
          key: idempotencyKey,
          status: "claimed",
          metadata: toJsonValue({
            route: "/api/clients",
            action: "create_client",
            emailHash: hashIdempotencySubject(email),
            rawContactStoredInResult: false,
          }),
        },
        update: {
          metadata: toJsonValue({
            route: "/api/clients",
            action: "create_client",
            replayObserved: true,
            emailHash: hashIdempotencySubject(email),
            rawContactStoredInResult: false,
          }),
        },
        select: { id: true, status: true, result: true },
      });
      if (idempotency.status === "completed") {
        const client = await tx.client.findFirst({
          where: { tenantId, email },
          select: {
            id: true,
            tenantId: true,
            email: true,
            preferredName: true,
            phone: true,
            city: true,
            region: true,
            country: true,
            timezone: true,
            marketingOptIn: true,
            smsOptIn: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        if (client) {
          return { status: "replayed" as const, client, idempotency };
        }
      }

      const existing = await tx.client.findUnique({
        where: { tenantId_email: { tenantId, email } },
        select: { id: true },
      });

      if (existing) {
        return { status: "exists" as const, clientId: existing.id };
      }

      const client = await tx.client.create({
        data: {
          tenantId,
          email,
          ...(phone !== undefined ? { phone } : {}),
          preferredName: input.preferredName.trim(),
          ...(legalName !== undefined ? { legalName } : {}),
          ...(pronouns !== undefined ? { pronouns } : {}),
          ...(city !== undefined ? { city } : {}),
          ...(region !== undefined ? { region } : {}),
          ...(country !== undefined ? { country } : {}),
          ...(timezone !== undefined ? { timezone } : {}),
          marketingOptIn: input.marketingOptIn,
          smsOptIn: input.smsOptIn,
        },
        select: {
          id: true,
          tenantId: true,
          email: true,
          preferredName: true,
          phone: true,
          city: true,
          region: true,
          country: true,
          timezone: true,
          marketingOptIn: true,
          smsOptIn: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "client.create",
          entityType: "Client",
          entityId: client.id,
          metadata: {
            source: "dashboard-api",
            marketingOptIn: client.marketingOptIn,
            smsOptIn: client.smsOptIn,
            idempotencyPersisted: true,
            rawIdempotencyKeyStored: false,
            internalPersistenceIdsStored: false,
            redaction: "email/phone are returned only to authenticated dashboard actors with client:write",
          },
        },
        select: { id: true, createdAt: true },
      });

      await tx.idempotencyKey.update({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-client-create", key: idempotencyKey } },
        data: {
          status: "completed",
          result: toJsonValue({
            clientPersisted: true,
            auditLogged: true,
            created: true,
            rawContactStoredInResult: false,
            internalPersistenceIdsStored: false,
          }),
        },
      });

      return { status: "created" as const, client, audit, idempotency };
    });

    if (result.status === "exists") {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "CLIENT_ALREADY_EXISTS", message: "A client with this email already exists for this tenant." },
          responseProjection: buildClientCreateResponseProjection(),
        },
        { status: 409, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantScope: { actorTenantMatched: true },
        persistence: "database",
        client: buildSafeClientCreateResponse(result.client),
        idempotencyReplay: result.status === "replayed",
        responseProjection: buildClientCreateResponseProjection(),
        gapIds: ["GAP-007", "GAP-037", "GAP-038", "GAP-040"],
        boundary: "Dashboard client creation is tenant-scoped, no-store, idempotency-backed, and audited; response receipts do not echo audit IDs, idempotency-key IDs, raw idempotency keys, or duplicate-client IDs, while tenant-isolated mutation tests remain evidence-gated.",
      },
      { status: result.status === "created" ? 201 : 200, headers: noStoreHeaders },
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantScope: { actorTenantMatched: true },
          responseProjection: buildClientCreateResponseProjection(),
          error: { code: "DATABASE_UNAVAILABLE", message: "Client creation requires the dashboard database connection." },
          gapIds: ["GAP-007", "GAP-037", "GAP-038", "GAP-040"],
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    if (error instanceof Error && /Unique constraint/i.test(error.message)) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "CLIENT_ALREADY_EXISTS", message: "A client with this email already exists for this tenant." },
          responseProjection: buildClientCreateResponseProjection(),
        },
        { status: 409, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "CLIENT_CREATE_FAILED", message: "Client could not be persisted." } }, { status: 500, headers: noStoreHeaders });
  }
}
