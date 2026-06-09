import { buildTenantDashboardView } from "@inkroute/config";
import { prisma } from "@inkroute/db";
import { NextRequest, NextResponse } from "next/server";
import { dashboardProjectedClients } from "../../../lib/demo";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../../dashboardAuth";

interface ClientDetailRouteContext {
  params: Promise<{ clientId: string }>;
}

function formatLocation(city?: string | null, region?: string | null, country?: string | null): string {
  return [city, region, country].filter(Boolean).join(", ") || "Unknown";
}

export async function GET(request: NextRequest, context: ClientDetailRouteContext) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "client:read");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to read clients." } }, { status: 403 });
  }

  const { clientId } = await context.params;
  const params = new URL(request.url).searchParams;
  const tenantId = params.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot query a client for another tenant." } }, { status: 403 });
  }

  if (actor.source === "local-fallback") {
    const client = dashboardProjectedClients.find((row) => row.id === clientId);
    if (!client) {
      return NextResponse.json({ ok: false, error: { code: "CLIENT_NOT_FOUND", message: "Client was not found for this tenant." } }, { status: 404 });
    }
    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "local-fallback",
        client,
        gapIds: ["GAP-007", "GAP-037", "GAP-040"],
        boundary: "Local fallback returns a tenant-projected demo client only; database mode is required for live CRM reads.",
      },
      { headers: { "Cache-Control": "no-store" } },
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
      return NextResponse.json({ ok: false, error: { code: "CLIENT_NOT_FOUND", message: "Client was not found for this tenant." } }, { status: 404 });
    }

    const lifetimeValueCents = result.row.bookingRequests.reduce(
      (sum, booking) => sum + booking.payments.filter((payment) => payment.status === "paid").reduce((paymentSum, payment) => paymentSum + payment.amountCents, 0),
      0,
    );
    const view = buildTenantDashboardView({
      collection: "clients",
      tenantId,
      source: "repository",
      records: [
        {
          id: result.row.id,
          tenantId: result.row.tenantId,
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
          medicalNotes: result.row.profile?.medicalNotesEncrypted ?? null,
          privateNotes: result.row.profile?.internalNotes ?? null,
          relatedBookings: result.row.bookingRequests.map((booking) => ({
            id: booking.id,
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
        tenantId,
        persistence: "database",
        client: view.records[0],
        auditId: result.audit.id,
        gapIds: ["GAP-007", "GAP-037", "GAP-040"],
        boundary: "Dashboard client detail reads are tenant-scoped, redacted, no-store, and audited.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          clientId,
          error: { code: "DATABASE_UNAVAILABLE", message: "Client detail reads require the dashboard database connection." },
          gapIds: ["GAP-007", "GAP-037", "GAP-040"],
        },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "CLIENT_DETAIL_READ_FAILED", message: "Client could not be loaded." } }, { status: 500 });
  }
}
