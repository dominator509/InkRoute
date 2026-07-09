import { prisma } from "@inkroute/db";
import { publicContactInputSchema } from "@inkroute/validators";
import { NextResponse, type NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { checkRateLimit, getClientIpFromHeaders, persistContactSubmission, resolveTenant } from "../../../../../lib/localRuntimeState";

export const runtime = "nodejs";

const noStoreHeaders = { "Cache-Control": "no-store" } as const;
type TenantResolution = { tenantId: string; source: "database" | "local-fallback" };

function normalizeTenantSlug(value: string): string {
  return decodeURIComponent(value).toLowerCase().trim();
}

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

function isDatabaseUnavailable(error: unknown): boolean {
  if (!process.env.DATABASE_URL) return true;

  if (!(error instanceof Error)) return false;
  const code = (error as { code?: string }).code;
  if (typeof code === "string" && ["P1000", "P1001", "P1002", "P1003", "P1008"].includes(code)) return true;

  const message = error.message.toLowerCase();
  return message.includes("connect") && message.includes("database");
}

async function resolveContactTenant(tenantSlug: string): Promise<TenantResolution | null> {
  const normalizedSlug = normalizeTenantSlug(tenantSlug);
  try {
    const prismaRuntime = prisma as unknown as {
      tenant: {
        findUnique: (options: { where: { slug: string }; select: { id: true } }) => Promise<{ id: string } | null>;
      };
    };
    const tenant = await prismaRuntime.tenant.findUnique({ where: { slug: normalizedSlug }, select: { id: true } });
    if (tenant?.id) return { tenantId: tenant.id, source: "database" };
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;
  }

  const local = resolveTenant(normalizedSlug);
  if (!local) return null;
  return { tenantId: local.tenantId, source: "local-fallback" };
}

function rateLimitHeaders(retryAfterSeconds: number) {
  return { ...noStoreHeaders, "Retry-After": String(retryAfterSeconds) };
}

function subjectOrDefault(subject: string, name: string) {
  return subject.length > 0 ? subject : `Contact form submission from ${name}`;
}

function destinationHash(value: string) {
  return createHash("sha256").update(value.toLowerCase().trim()).digest("hex");
}

function publicContactIdempotencyFingerprint(input: { tenantId: string; email: string; subject: string; message: string }) {
  return createHash("sha256")
    .update([input.tenantId, input.email.toLowerCase().trim(), input.subject.trim(), input.message.length, input.message.slice(0, 64)].join(":"))
    .digest("hex");
}

function idempotencyStorageFingerprint(value: string) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function buildContactResponseProjection() {
  return {
    clientEmailSelectedFromDatabase: false,
    clientNameSelectedFromDatabase: false,
    rawContactFieldsEchoed: false,
    rawMessageEchoed: false,
    redactedSubmissionEchoed: false,
    destinationHashEchoed: false,
    rawIdempotencyKeyEchoed: false,
    tenantIdEchoed: false,
    internalPersistenceIdsEchoed: false,
    internalPersistenceIdsStored: false,
  };
}

function buildSafeContactDatabaseResponse(result: {
  thread: { subject: string };
  inboundMessage: { status: string };
  handoff: { state: string };
  idempotencyReplayed?: boolean;
  duplicateSideEffectsCreated?: boolean;
}) {
  return {
    contactSubmission: {
      subject: result.thread.subject,
      messageStatus: result.inboundMessage.status,
      idempotencyReplayed: result.idempotencyReplayed === true,
      duplicateSideEffectsCreated: result.duplicateSideEffectsCreated === true,
      responseProjection: buildContactResponseProjection(),
    },
    workflows: {
      notification: {
        status: result.handoff.state,
        provider: "internal-dashboard",
        externalSendDeferred: true,
        responseProjection: {
          notificationIdEchoed: false,
          deliveryIdEchoed: false,
          handoffIdEchoed: false,
        },
      },
    },
  };
}

function buildSafeContactLocalResponse(persisted: ReturnType<typeof persistContactSubmission>) {
  return {
    contactSubmission: {
      subject: persisted.subject,
      createdAt: persisted.createdAt,
      responseProjection: buildContactResponseProjection(),
    },
    workflows: {
      notification: {
        status: "provider_gated",
        boundary: "notification",
        reason: "Contact notification delivery waits for provider sandbox evidence and redacted delivery logs.",
      },
    },
  };
}

export async function POST(request: NextRequest, context: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await context.params;
  const normalizedTenantSlug = normalizeTenantSlug(tenantSlug);
  const tenant = await resolveContactTenant(normalizedTenantSlug);

  if (!tenant) {
    return NextResponse.json(
      { ok: false, error: { code: "TENANT_NOT_FOUND", message: "Contact submissions require a known tenant scope." } },
      { status: 404, headers: noStoreHeaders },
    );
  }

  let input: Record<string, unknown> = {};
  const contentType = request.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      const body = await request.json();
      input = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
    } else {
      const form = await request.formData();
      input = Object.fromEntries(form.entries());
    }
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_CONTACT_BODY", message: "Contact body must be valid JSON or form data." } },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const parsed = publicContactInputSchema.safeParse(input);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Public contact payload failed validation.",
          issues: parsed.error.flatten(),
        },
      },
      { status: 400, headers: noStoreHeaders },
    );
  }
  const { name, email, subject = "", message } = parsed.data;

  const clientIp = getClientIpFromHeaders(request.headers);
  const rateLimit = checkRateLimit("public-booking-submit", normalizedTenantSlug, `contact:${clientIp}:${email.toLowerCase()}`);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Contact submission is temporarily rate-limited.",
          details: { remaining: rateLimit.remaining, retryAfterSeconds: rateLimit.retryAfterSeconds },
        },
      },
      { status: 429, headers: rateLimitHeaders(rateLimit.retryAfterSeconds) },
    );
  }

  if (tenant.source === "database") {
    try {
      const normalizedEmail = email.toLowerCase();
      const displaySubject = subjectOrDefault(subject, name);
      const idempotencyKey =
        request.headers.get("idempotency-key") ??
        `public-contact:${publicContactIdempotencyFingerprint({ tenantId: tenant.tenantId, email: normalizedEmail, subject: displaySubject, message })}`;

      const result = await prisma.$transaction(async (tx) => {
        const idempotency = await tx.idempotencyKey.upsert({
          where: { tenantId_scope_key: { tenantId: tenant.tenantId, scope: "public-contact", key: idempotencyKey } },
          create: {
            tenantId: tenant.tenantId,
            scope: "public-contact",
            key: idempotencyKey,
            status: "claimed",
            metadata: toJsonValue({
              route: "/api/public/[tenantSlug]/contact",
              emailHash: destinationHash(normalizedEmail),
              generatedKeyUsesHashedFingerprint: !request.headers.get("idempotency-key"),
              rawPayloadStored: false,
            }),
          },
          update: {
            metadata: toJsonValue({
              route: "/api/public/[tenantSlug]/contact",
              replayObserved: true,
              emailHash: destinationHash(normalizedEmail),
              generatedKeyUsesHashedFingerprint: !request.headers.get("idempotency-key"),
              rawPayloadStored: false,
            }),
          },
          select: { id: true, key: true, status: true },
        });

        if (idempotency.status === "completed") {
          return {
            status: "replayed" as const,
            thread: { subject: displaySubject },
            inboundMessage: { status: "queued" },
            handoff: { state: "queued" },
            idempotencyReplayed: true,
            duplicateSideEffectsCreated: false,
          };
        }

        const client = await tx.client.upsert({
          where: { tenantId_email: { tenantId: tenant.tenantId, email: normalizedEmail } },
          create: {
            tenantId: tenant.tenantId,
            email: normalizedEmail,
            preferredName: name,
            marketingOptIn: false,
            smsOptIn: false,
          },
          update: {
            preferredName: name,
          },
          select: { id: true },
        });

        const thread = await tx.messageThread.create({
          data: {
            tenantId: tenant.tenantId,
            clientId: client.id,
            subject: displaySubject,
            lastMessageAt: new Date(),
          },
          select: { id: true, subject: true },
        });

        const inboundMessage = await tx.message.create({
          data: {
            tenantId: tenant.tenantId,
            threadId: thread.id,
            senderClientId: client.id,
            channel: "in_app",
            direction: "inbound",
            status: "queued",
            body: message,
          },
          select: { id: true, status: true },
        });

        const notification = await tx.notification.create({
          data: {
            tenantId: tenant.tenantId,
            clientId: client.id,
            type: "public_contact_received",
            title: "New contact form message",
            body: "A public contact form message is ready for dashboard review.",
            status: "queued",
          },
          select: { id: true },
        });

        const delivery = await tx.notificationDelivery.create({
          data: {
            tenantId: tenant.tenantId,
            notificationId: notification.id,
            channel: "in_app",
            status: "queued",
            destinationHash: destinationHash(normalizedEmail),
            provider: "internal-dashboard",
          },
          select: { id: true },
        });

        const handoff = await tx.notificationProviderHandoff.create({
          data: {
            tenantId: tenant.tenantId,
            notificationId: notification.id,
            deliveryId: delivery.id,
            threadId: thread.id,
            messageId: inboundMessage.id,
            channel: "in_app",
            provider: "internal-dashboard",
            state: "queued",
            idempotencyKey: idempotencyStorageFingerprint(idempotency.key),
            destinationHash: destinationHash(normalizedEmail),
            sanitizedPayload: toJsonValue({
              route: "/api/public/[tenantSlug]/contact",
              subject: displaySubject,
              bodyPreview: "[redacted-message-body]",
              emailHash: destinationHash(normalizedEmail),
              clientPersisted: true,
              internalPersistenceIdsStored: false,
              rawIdempotencyKeyStored: false,
              providerDispatchDeferred: true,
            }),
          },
          select: { id: true, state: true },
        });

        const audit = await tx.auditLog.create({
          data: {
            tenantId: tenant.tenantId,
            action: "contact.public_intake",
            entityType: "MessageThread",
            entityId: thread.id,
            metadata: toJsonValue({
            route: "/api/public/[tenantSlug]/contact",
              clientPersisted: true,
              messagePersisted: true,
              notificationPersisted: true,
              deliveryPersisted: true,
              providerHandoffPersisted: true,
              idempotencyPersisted: true,
              internalPersistenceIdsStored: false,
              redactedFields: ["email", "message"],
              rawPayloadStored: false,
              gapIds: ["GAP-010", "GAP-029", "GAP-031", "GAP-064"],
            }),
          },
          select: { id: true },
        });

        await tx.idempotencyKey.update({
          where: { tenantId_scope_key: { tenantId: tenant.tenantId, scope: "public-contact", key: idempotency.key } },
          data: {
            status: "completed",
            result: toJsonValue({
              clientPersisted: true,
              messageThreadPersisted: true,
              messagePersisted: true,
              notificationPersisted: true,
              deliveryPersisted: true,
              providerHandoffPersisted: true,
              auditPersisted: Boolean(audit.id),
              internalPersistenceIdsStored: false,
              providerDispatchDeferred: true,
              rawPayloadStored: false,
            }),
          },
          select: { id: true },
        });

        return { status: "persisted" as const, client, thread, inboundMessage, notification, delivery, handoff, audit, idempotency };
      });

      return NextResponse.json(
        {
          ok: true,
          data: {
            tenantSlug: normalizedTenantSlug,
            tenantScope: { tenantResolved: true, tenantIdEchoed: false },
            persistence: "database",
            ...buildSafeContactDatabaseResponse(result),
            gapIds: ["GAP-010", "GAP-029", "GAP-031", "GAP-064"],
            requiredNextWork: [
              "Execute external provider notification workers after credentials are configured.",
              "Add seeded tenant-isolated DB/contact route tests.",
              "Capture browser E2E and CI evidence before closing launch gaps.",
            ],
          },
        },
        { status: 201, headers: noStoreHeaders },
      );
    } catch (error) {
      if (process.env.NODE_ENV === "production" || !isDatabaseUnavailable(error)) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "PROVIDER_CONTACT_PERSISTENCE_NOT_CONFIGURED",
              message: "Contact submission could not be persisted to tenant-scoped database rows after validation.",
              gapIds: ["GAP-010", "GAP-029", "GAP-031", "GAP-064"],
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
          code: "PROVIDER_CONTACT_PERSISTENCE_NOT_CONFIGURED",
          message: "Production contact submissions require tenant-scoped database persistence and provider notification handoff; local runtime persistence is disabled.",
          gapIds: ["GAP-010", "GAP-029", "GAP-031", "GAP-064"],
        },
        productionBoundary: {
          localContactPersistenceDisabled: true,
          requiredBeforeEnablement: [
            "tenant-scoped contact submission database transaction",
            "redacted audit log persistence",
            "provider notification queue handoff",
            "booking/contact API and browser E2E evidence",
          ],
        },
      },
      { status: 503, headers: noStoreHeaders },
    );
  }

  const persisted = persistContactSubmission(normalizedTenantSlug, {
    name,
    email,
    ...(subject ? { subject } : {}),
    message,
    source: "public_contact_form",
    clientIp,
  });

  return NextResponse.json(
    {
      ok: true,
      data: {
        persistence: "local-runtime",
        ...buildSafeContactLocalResponse(persisted),
        gapIds: ["GAP-010", "GAP-029", "GAP-031", "GAP-064"],
      },
    },
    { status: 201, headers: noStoreHeaders },
  );
}
