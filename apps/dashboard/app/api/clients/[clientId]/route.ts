import { createHash } from "node:crypto";
import { buildTenantDashboardView } from "@inkroute/config";
import { prisma } from "@inkroute/db";
import { clientPrivateNoteInputSchema, dashboardTenantQuerySchema } from "@inkroute/validators";
import { NextRequest, NextResponse } from "next/server";
import { dashboardProjectedClients } from "../../../../lib/demo";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../../dashboardAuth";

export const runtime = "nodejs";

interface ClientDetailRouteContext {
  params: Promise<{ clientId: string }>;
}

function formatLocation(city?: string | null, region?: string | null, country?: string | null): string {
  return [city, region, country].filter(Boolean).join(", ") || "Unknown";
}

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

function hashIdempotencySubject(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function buildClientDetailReadResponseProjection() {
  return {
    clientDetailReadResponseAllowlisted: true,
    auditIdEchoed: false,
    clientIdEchoed: false,
    tenantIdEchoed: false,
    relatedBookingIdsEchoed: false,
    encryptedMedicalNotesEchoed: false,
    privateNotesEchoed: false,
    internalPersistenceIdsEchoed: false,
  };
}

function buildClientPrivateNoteResponseProjection() {
  return {
    clientPrivateNoteResponseAllowlisted: true,
    auditIdEchoed: false,
    clientIdEchoed: false,
    idempotencyKeyIdEchoed: false,
    rawIdempotencyKeyEchoed: false,
    tenantIdEchoed: false,
    rawNoteEchoed: false,
    internalPersistenceIdsEchoed: false,
  };
}

export async function GET(request: NextRequest, context: ClientDetailRouteContext) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "client:read");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to read clients." } }, { status: 403, headers: noStoreHeaders });
  }

  const { clientId } = await context.params;
  const query = dashboardTenantQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_FAILED", message: "Dashboard client detail query failed validation.", issues: query.error.flatten() } },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const tenantId = query.data.tenantId ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot query a client for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          error: {
            code: "PROVIDER_DASHBOARD_READS_NOT_CONFIGURED",
            message: "Production dashboard client detail reads require DB-backed actor resolution and tenant-scoped repository data; local fallback demo payloads are disabled.",
            gapIds: ["GAP-007", "GAP-037", "GAP-040"],
          },
          tenantScope: { actorTenantMatched: true },
          responseProjection: buildClientDetailReadResponseProjection(),
          productionBoundary: { localDashboardReadFallbackDisabled: true },
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    const client = dashboardProjectedClients.find((row) => row.id === clientId);
    if (!client) {
      return NextResponse.json({ ok: false, error: { code: "CLIENT_NOT_FOUND", message: "Client was not found for this tenant." } }, { status: 404, headers: noStoreHeaders });
    }
    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        persistence: "local-fallback",
        client,
        tenantScope: { actorTenantMatched: true },
        responseProjection: buildClientDetailReadResponseProjection(),
        gapIds: ["GAP-007", "GAP-037", "GAP-040"],
        boundary: "Local fallback returns a tenant-projected demo client only; database mode is required for live CRM reads.",
      },
      { headers: noStoreHeaders },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const row = await tx.client.findFirst({
        where: { id: clientId, tenantId },
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
          profile: { select: { preferredContactMethod: true, internalNotes: true, medicalNotesEncrypted: true, allergiesEncrypted: true, skinConcernsEncrypted: true } },
          bookingRequests: {
            orderBy: { updatedAt: "desc" },
            take: 10,
            select: {
              id: true,
              status: true,
              style: true,
              updatedAt: true,
              payments: { select: { id: true, amountCents: true, status: true } },
            },
          },
        },
      });

      if (!row) return { status: "not_found" as const };

      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "client:read:detail",
          entityType: "Client",
          entityId: row.id,
          metadata: {
            source: "dashboard-api",
            redaction: "buildTenantDashboardView",
            includedBookings: row.bookingRequests.length,
            includesSensitiveProfileFlags: true,
          },
        },
        select: { id: true },
      });

      return { status: "found" as const, row, audit };
    });

    if (result.status === "not_found") {
      return NextResponse.json({ ok: false, error: { code: "CLIENT_NOT_FOUND", message: "Client was not found for this tenant." } }, { status: 404, headers: noStoreHeaders });
    }

    const lifetimeValueCents = result.row.bookingRequests.reduce((sum: number, booking: { payments: { status: string; amountCents: number }[] }) => {
      return sum + booking.payments.filter((payment: { status: string; amountCents: number }) => payment.status === "paid").reduce(
        (paymentSum: number, payment: { amountCents: number }) => paymentSum + payment.amountCents,
        0,
      );
    }, 0);
    const view = buildTenantDashboardView({
      collection: "clients",
      tenantId,
      source: "repository",
      records: [
        {
          preferredName: result.row.preferredName,
          email: result.row.email,
          phone: result.row.phone,
          city: formatLocation(result.row.city, result.row.region, result.row.country),
          tags: [
            result.row.marketingOptIn ? "marketing-ok" : "marketing-off",
            result.row.smsOptIn ? "sms-ok" : "sms-off",
            result.row.profile?.preferredContactMethod ? `prefers-${result.row.profile.preferredContactMethod}` : "contact-unset",
          ],
          lifetimeValueCents,
          lastActivity: result.row.bookingRequests[0] ? `${result.row.bookingRequests[0].status} booking updated` : `Profile updated ${result.row.updatedAt.toISOString()}`,
          riskFlags: [
            ...(result.row.profile?.medicalNotesEncrypted ? ["medical-notes-present"] : []),
            ...(result.row.profile?.allergiesEncrypted ? ["allergy-notes-present"] : []),
            ...(result.row.profile?.skinConcernsEncrypted ? ["skin-concern-notes-present"] : []),
            ...(result.row.profile?.internalNotes ? ["private-notes-present"] : []),
          ],
          medicalNotes: result.row.profile?.medicalNotesEncrypted ? "[redacted-dashboard-field]" : null,
          privateNotes: result.row.profile?.internalNotes ? "[redacted-dashboard-field]" : null,
          hasMedicalNotes: Boolean(result.row.profile?.medicalNotesEncrypted),
          hasPrivateNotes: Boolean(result.row.profile?.internalNotes),
          relatedBookings: result.row.bookingRequests.map((booking: {
            id: string;
            status: string;
            style: string | null;
            updatedAt: Date;
            payments: readonly { status: string }[];
          }) => ({
            status: booking.status,
            style: booking.style,
            updatedAt: booking.updatedAt.toISOString(),
            paidPaymentCount: booking.payments.filter((payment) => payment.status === "paid").length,
          })),
        },
      ],
      redactedFields: ["email", "phone", "medicalNotes", "privateNotes", "internalNotes"],
    });

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        persistence: "database",
        client: view.records[0],
        tenantScope: { actorTenantMatched: true, clientTenantMatched: true },
        responseProjection: buildClientDetailReadResponseProjection(),
        gapIds: ["GAP-007", "GAP-037", "GAP-040"],
        boundary: "Dashboard client detail reads are tenant-scoped, redacted, no-store, and audited.",
      },
      { headers: noStoreHeaders },
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          error: { code: "DATABASE_UNAVAILABLE", message: "Client detail reads require the dashboard database connection." },
          tenantScope: { actorTenantMatched: true },
          responseProjection: buildClientDetailReadResponseProjection(),
          gapIds: ["GAP-007", "GAP-037", "GAP-040"],
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "CLIENT_DETAIL_READ_FAILED", message: "Client could not be loaded." } }, { status: 500, headers: noStoreHeaders });
  }
}

export async function PATCH(request: NextRequest, context: ClientDetailRouteContext) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "client:write");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to update clients." } }, { status: 403, headers: noStoreHeaders });
  }

  const { clientId } = await context.params;
  const query = dashboardTenantQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_FAILED", message: "Dashboard client write query failed validation.", issues: query.error.flatten() } },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const tenantId = query.data.tenantId ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot update a client for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  const parsed = (await request.json().catch(() => null)) as unknown;
  const noteInput = clientPrivateNoteInputSchema.safeParse(parsed);
  if (!noteInput.success) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "VALIDATION_FAILED", message: "Client private-note payload failed validation.", issues: noteInput.error.flatten() },
      },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const note = noteInput.data.privateNote;
  const noteHash = hashIdempotencySubject(note);
  const idempotencyKey = request.headers.get("idempotency-key") ?? `client-private-note:${tenantId}:${clientId}:${noteHash}`;

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          error: {
            code: "PROVIDER_CLIENT_WRITE_PERSISTENCE_NOT_CONFIGURED",
            message: "Production client writes require DB-backed actor resolution, tenant-scoped persistence, audit logs, and retention policy evidence; local fallback writes are disabled.",
            gapIds: ["GAP-007", "GAP-038", "GAP-040"],
          },
          tenantScope: { actorTenantMatched: true },
          responseProjection: buildClientPrivateNoteResponseProjection(),
          productionBoundary: { localClientWriteFallbackDisabled: true },
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        persistence: "local-contract",
        tenantScope: { actorTenantMatched: true },
        responseProjection: buildClientPrivateNoteResponseProjection(),
        gapIds: ["GAP-007", "GAP-038", "GAP-040"],
        boundary: "Local fallback validates the private-note write contract with raw-note redaction and audit metadata; database mode is required for durable CRM writes.",
      },
      { status: 202, headers: noStoreHeaders },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const client = await tx.client.findFirst({
        where: { id: clientId, tenantId },
        select: { id: true },
      });
      if (!client) return { status: "not_found" as const };

      const idempotency = await tx.idempotencyKey.upsert({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-client-private-note", key: idempotencyKey } },
        create: {
          tenantId,
          scope: "dashboard-client-private-note",
          key: idempotencyKey,
          status: "pending",
          requestHash: noteHash,
          metadata: {
            source: "dashboard-api",
            dashboardMutationAction: "append_client_private_note",
            clientIdHash: createHash("sha256").update(clientId).digest("hex"),
            rawClientIdStored: false,
            noteLength: note.length,
            noteHash,
            rawNoteStoredInResult: false,
          },
        },
        update: {},
        select: { id: true, status: true, requestHash: true, result: true },
      });

      if (idempotency.requestHash !== noteHash) {
        return { status: "idempotency_conflict" as const, idempotency };
      }

      if (idempotency.status === "completed") {
        return {
          status: "replayed" as const,
          idempotency,
          auditLogged: true,
        };
      }

      await tx.clientProfile.upsert({
        where: { clientId },
        create: {
          tenantId,
          clientId,
          internalNotes: note,
        },
        update: {
          internalNotes: note,
        },
      });

      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "client:write:private-note",
          entityType: "Client",
          entityId: clientId,
          metadata: {
            source: "dashboard-api",
            dashboardMutationAction: "append_client_private_note",
            idempotencyPersisted: true,
            rawIdempotencyKeyStored: false,
            internalPersistenceIdsStored: false,
            noteHash,
            noteLength: note.length,
            privateNoteStored: true,
            rawNoteReturned: false,
          },
        },
        select: { id: true },
      });

      await tx.idempotencyKey.update({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-client-private-note", key: idempotencyKey } },
        data: {
          status: "completed",
          result: {
            noteHash,
            noteLength: note.length,
            privateNoteStored: true,
            rawNoteReturned: false,
            auditLogged: true,
            internalPersistenceIdsStored: false,
          },
        },
      });

      return { status: "updated" as const, idempotency, auditLogged: Boolean(audit.id), privateNoteStored: true };
    });

    if (result.status === "not_found") {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "CLIENT_NOT_FOUND", message: "Client was not found for this tenant." },
          tenantScope: { actorTenantMatched: true },
          responseProjection: buildClientPrivateNoteResponseProjection(),
          gapIds: ["GAP-007", "GAP-038", "GAP-040"],
        },
        { status: 404, headers: noStoreHeaders },
      );
    }

    if (result.status === "idempotency_conflict") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          error: {
            code: "IDEMPOTENCY_CONFLICT",
            message: "Idempotency key was already used for a different private-note payload.",
          },
          responseProjection: {
            clientPrivateNoteIdempotencyConflictResponseAllowlisted: true,
            clientIdEchoed: false,
            idempotencyKeyIdEchoed: false,
            rawIdempotencyKeyEchoed: false,
            tenantIdEchoed: false,
            rawNoteEchoed: false,
          },
          tenantScope: { actorTenantMatched: true, clientTenantMatched: true },
          gapIds: ["GAP-007", "GAP-038", "GAP-040"],
          boundary: "Private client note idempotency is request-hash guarded and defaults to denial on mismatched replay payloads.",
        },
        { status: 409, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        persistence: "database",
        idempotencyReplay: result.status === "replayed",
        tenantScope: { actorTenantMatched: true, clientTenantMatched: true },
        responseProjection: buildClientPrivateNoteResponseProjection(),
        gapIds: ["GAP-007", "GAP-038", "GAP-040"],
        boundary: "Private client note writes are tenant-scoped, RBAC-gated, idempotency-backed, audited, and never echo the raw note, audit ID, idempotency-key ID, raw idempotency key, or internal persistence IDs.",
      },
      { headers: noStoreHeaders },
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          error: { code: "DATABASE_UNAVAILABLE", message: "Client writes require the dashboard database connection." },
          tenantScope: { actorTenantMatched: true },
          responseProjection: buildClientPrivateNoteResponseProjection(),
          gapIds: ["GAP-007", "GAP-038", "GAP-040"],
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "CLIENT_DETAIL_WRITE_FAILED", message: "Client could not be updated." } }, { status: 500, headers: noStoreHeaders });
  }
}
