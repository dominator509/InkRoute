import { buildTenantDashboardView } from "@inkroute/config";
import { prisma } from "@inkroute/db";
import { NextRequest, NextResponse } from "next/server";
import { dashboardProjectedClients } from "../../../lib/demo";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../dashboardAuth";

function formatLocation(city?: string | null, region?: string | null, country?: string | null): string {
  return [city, region, country].filter(Boolean).join(", ") || "Unknown";
}

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

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
          tenantId,
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
        tenantId,
        persistence: "local-fallback",
        count: dashboardProjectedClients.length,
        clients: dashboardProjectedClients.slice(0, limit),
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
          id: row.id,
          tenantId: row.tenantId,
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
          medicalNotes: row.profile?.medicalNotesEncrypted ?? null,
          privateNotes: row.profile?.internalNotes ?? null,
        };
      }),
      redactedFields: ["email", "phone", "medicalNotes", "privateNotes", "internalNotes"],
    });

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "database",
        count: view.records.length,
        clients: view.records,
        auditId: result.audit.id,
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
          tenantId,
          error: { code: "DATABASE_UNAVAILABLE", message: "Client list reads require the dashboard database connection." },
          gapIds: ["GAP-007", "GAP-037", "GAP-040"],
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "CLIENT_LIST_READ_FAILED", message: "Clients could not be loaded." } }, { status: 500, headers: noStoreHeaders });
  }
}
