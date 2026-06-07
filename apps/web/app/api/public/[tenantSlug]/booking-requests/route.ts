import { Prisma } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { bookingRequestInputSchema } from "@inkroute/validators";
import { encryptTextField, getEncryptionReadiness } from "@inkroute/security";
import { checkRateLimit, getClientIp, persistBookingRequest, resolveTenant } from "../../../../lib/localRuntimeState";
import { prisma } from "@inkroute/db";

type TenantResolution = { tenantId: string; source: "database" | "local-fallback" };

function isDatabaseUnavailable(error: unknown): boolean {
  if (!process.env.DATABASE_URL) {
    return true;
  }

  if (!(error instanceof Error)) return false;
  const code = (error as { code?: string }).code;
  if (typeof code === "string" && ["P1000", "P1001", "P1002", "P1003", "P1008"].includes(code)) return true;

  const message = error.message.toLowerCase();
  return message.includes("connect") && message.includes("database");
}

async function resolveTenantScope(tenantSlug: string): Promise<TenantResolution | null> {
  const normalizedSlug = decodeURIComponent(tenantSlug).toLowerCase().trim();

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: normalizedSlug },
      select: { id: true },
    });

    if (tenant?.id) {
      return { tenantId: tenant.id, source: "database" };
    }
  } catch (error) {
    if (!isDatabaseUnavailable(error)) {
      throw error;
    }
  }

  const local = resolveTenant(normalizedSlug);
  if (!local) return null;
  return { tenantId: local.tenantId, source: "local-fallback" };
}

async function persistBookingRequestToDatabase(tenantId: string, input: typeof bookingRequestInputSchema._output) {
  return prisma.$transaction(async (tx) => {
    const artist = await tx.artist.findFirst({
      where: {
        id: input.artistId,
        tenantId,
      },
      select: { id: true },
    });
    if (!artist) throw new Error("ARTIST_NOT_FOUND");

    let travelCityId: string | null = null;
    if (input.travelCityId) {
      const city = await tx.travelCity.findFirst({
        where: { id: input.travelCityId, tenantId },
        select: { id: true },
      });
      if (!city) throw new Error("TRAVEL_CITY_NOT_FOUND");
      travelCityId = city.id;
    }

    let portfolioAttributionId: string | null = null;
    if (input.portfolioAttributionId) {
      const portfolio = await tx.portfolioItem.findFirst({
        where: { id: input.portfolioAttributionId, tenantId },
        select: { id: true },
      });
      if (!portfolio) throw new Error("PORTFOLIO_ITEM_NOT_FOUND");
      portfolioAttributionId = portfolio.id;
    }

    const normalizedEmail = input.clientEmail.toLowerCase();
    const client = await tx.client.upsert({
      where: { tenantId_email: { tenantId, email: normalizedEmail } },
      update: {
        preferredName: input.clientName,
        phone: input.clientPhone ?? null,
      },
      create: {
        tenantId,
        email: normalizedEmail,
        preferredName: input.clientName,
        phone: input.clientPhone ?? null,
      },
    });
    if (!client.id) {
      throw new Error("CLIENT_UPSERT_FAILED");
    }

    const medicalNotesAttempt = await encryptTextField(input.medicalNotes);
    const booking = await tx.bookingRequest.create({
      data: {
        tenantId,
        artistId: input.artistId,
        clientId: client.id,
        travelCityId,
        status: "submitted",
        clientNameSnapshot: input.clientName,
        clientEmailSnapshot: normalizedEmail,
        clientPhoneSnapshot: input.clientPhone,
        preferredCity: input.preferredCity,
        preferredDate: input.preferredDate ? new Date(input.preferredDate) : null,
        style: input.style,
        placement: input.placement as Prisma.$Enums.BodyPlacement,
        sizeEstimate: input.sizeEstimate,
        budgetMinCents: input.budgetMin ?? null,
        budgetMaxCents: input.budgetMax ?? null,
        ideaSummary: input.ideaSummary,
        medicalNotesEncrypted: medicalNotesAttempt.encryptedValue,
        readinessScore: 0,
        policyAcceptedAt: new Date(),
        portfolioAttributionId,
        source: "public_site",
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
      },
    });

    const event = await tx.bookingStateEvent.create({
      data: {
        tenantId: booking.tenantId,
        bookingRequestId: booking.id,
        actorUserId: null,
        type: "submitted",
        toStatus: booking.status,
        note: "Booking request persisted from public route.",
      },
      select: { id: true, type: true, actorUserId: true, toStatus: true, note: true, createdAt: true },
    });

    const audit = await tx.auditLog.create({
      data: {
        tenantId,
        actorUserId: null,
        action: "booking_request:create",
        entityType: "BookingRequest",
        entityId: booking.id,
        metadata: {
          source: "public_api",
          tenantId,
          artistId: input.artistId,
          travelCityId,
          portfolioAttributionId,
          preferredCity: input.preferredCity,
          readinessScore: 0,
          route: "/api/public/[tenantSlug]/booking-requests",
        },
      },
    });

    return {
      booking,
      event,
      auditId: audit.id,
      readinessScore: booking.readinessScore,
      source: "database",
    };
  });
}

function buildLocalResponse(tenantSlug: string, tenantId: string, payload: typeof bookingRequestInputSchema._output, encryptionReadiness: { status: string; keyVersion: string; reason: string }) {
  const persisted = persistBookingRequest(tenantSlug, payload);
  return {
    tenantSlug,
    tenantId,
    persistence: "local-runtime",
    encryption: {
      status: encryptionReadiness.status,
      keyVersion: encryptionReadiness.keyVersion,
      reason: encryptionReadiness.reason,
    },
    booking: persisted.request,
    readinessScore: persisted.readinessScore,
    events: persisted.events,
    requiredNextWork: [
      "Tenant-scoped lookup moved to DB path.",
      "Signature-based anti-bot challenge before write.",
      "Persist reference uploads in private object storage before artist review.",
      "Queue notification draft to client and studio when policy rules are enabled.",
    ],
  };
}

export async function POST(request: NextRequest, context: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await context.params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_JSON",
          message: "Request body must be valid JSON.",
        },
      },
      { status: 400 },
    );
  }

  const parsed = bookingRequestInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Booking request input did not pass shared schema validation.",
          issues: parsed.error.flatten(),
        },
      },
      { status: 400 },
    );
  }

  const resolvedTenant = await resolveTenantScope(tenantSlug);
  if (!resolvedTenant) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "TENANT_NOT_FOUND",
          message: "Booking submission is available only for tenant-known routes in DB-backed mode or demo local tenant.",
        },
      },
      { status: 404 },
    );
  }

  const clientIp = getClientIp(Object.fromEntries(request.headers.entries()));
  const rateLimit = checkRateLimit("public-booking-submit", tenantSlug, `${clientIp}:${resolvedTenant.tenantId}`);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Booking submission is temporarily limited by anti-abuse rule.",
          details: {
            gapIds: ["GAP-031", "GAP-095"],
            maxRequests: rateLimit.maxRequests,
            windowSeconds: rateLimit.windowSeconds,
            remaining: rateLimit.remaining,
            retryAfterSeconds: rateLimit.retryAfterSeconds,
          },
        },
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  const encryptionReadiness = await getEncryptionReadiness();

  if (resolvedTenant.source === "local-fallback") {
    return NextResponse.json(
      {
        ok: true,
        data: buildLocalResponse(tenantSlug, resolvedTenant.tenantId, parsed.data, encryptionReadiness),
      },
      { status: 201 },
    );
  }

  try {
    const persisted = await persistBookingRequestToDatabase(resolvedTenant.tenantId, parsed.data);
    return NextResponse.json(
      {
        ok: true,
        data: {
          tenantSlug,
          tenantId: persisted.booking.tenantId,
          persistence: "database",
          booking: {
            id: persisted.booking.id,
            tenantId: persisted.booking.tenantId,
            artistId: persisted.booking.artistId,
            clientId: persisted.booking.clientId,
            travelCityId: persisted.booking.travelCityId ?? undefined,
            status: persisted.booking.status,
            clientName: persisted.booking.clientNameSnapshot,
            clientEmail: persisted.booking.clientEmailSnapshot,
            preferredCity: persisted.booking.preferredCity,
            preferredDate: persisted.booking.preferredDate?.toISOString(),
            style: persisted.booking.style,
            placement: persisted.booking.placement,
            sizeEstimate: persisted.booking.sizeEstimate,
            budgetMin: persisted.booking.budgetMinCents ?? undefined,
            budgetMax: persisted.booking.budgetMaxCents ?? undefined,
            ideaSummary: persisted.booking.ideaSummary,
            readinessScore: persisted.readinessScore,
            policyAccepted: Boolean(persisted.booking.policyAcceptedAt),
            portfolioAttributionId: persisted.booking.portfolioAttributionId ?? undefined,
            createdAt: persisted.booking.createdAt.toISOString(),
          },
          readinessScore: persisted.readinessScore,
          events: [
            {
              id: persisted.event.id,
              eventType: persisted.event.type,
              actor: "client",
              at: persisted.event.createdAt.toISOString(),
              note: persisted.event.note ?? "Booking request persisted from public route.",
            },
          ],
          auditId: persisted.auditId,
          encryption: {
            status: encryptionReadiness.status,
            keyVersion: encryptionReadiness.keyVersion,
            reason: encryptionReadiness.reason,
          },
      requiredNextWork: [
        "Add signature-based anti-bot challenge before write.",
        "Persist initial MessageThread/Message rows only after user preference and consent.",
        "Queue deposit and notification tasks after artist-side policy check.",
      ],
          gapIds: ["GAP-001", "GAP-002", "GAP-003", "GAP-004", "GAP-005", "GAP-008", "GAP-017", "GAP-021"],
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          ok: true,
          data: buildLocalResponse(tenantSlug, resolvedTenant.tenantId, parsed.data, encryptionReadiness),
          warning: "Database was temporarily unavailable; request persisted to local runtime.",
        },
        { status: 201 },
      );
    }

    if (error instanceof Error) {
      const code = error.message === "ARTIST_NOT_FOUND" ? "ARTIST_NOT_FOUND" : error.message === "TRAVEL_CITY_NOT_FOUND" ? "TRAVEL_CITY_NOT_FOUND" : undefined;
      const message = {
        ARTIST_NOT_FOUND: "Selected artistId was not found for this tenant.",
        TRAVEL_CITY_NOT_FOUND: "Selected travelCityId was not found for this tenant.",
      }[code ?? ""] ?? "Unable to persist booking request.";

      if (code) {
        return NextResponse.json({ ok: false, error: { code, message } }, { status: 400 });
      }
    }

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "BOOKING_PERSISTENCE_FAILED",
          message: "Booking route accepted input but persistence failed while writing production records.",
        },
      },
      { status: 500 },
    );
  }
}
