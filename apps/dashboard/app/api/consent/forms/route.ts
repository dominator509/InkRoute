import { createHash } from "node:crypto";
import { prisma } from "@inkroute/db";
import { consentFormInputSchema } from "@inkroute/validators";
import { NextRequest, NextResponse } from "next/server";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../../dashboardAuth";

export const runtime = "nodejs";

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

function hashIdempotencySubject(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function buildConsentFormResponseProjection() {
  return {
    consentFormResponseAllowlisted: true,
    formIdEchoed: false,
    tenantIdEchoed: false,
    auditIdEchoed: false,
    idempotencyKeyIdEchoed: false,
    rawIdempotencyKeyEchoed: false,
    rawBodyEchoed: false,
    internalPersistenceIdsEchoed: false,
  };
}

function buildConsentFormDuplicateResponseProjection() {
  return {
    consentFormDuplicateResponseAllowlisted: true,
    formIdEchoed: false,
    tenantIdEchoed: false,
    auditIdEchoed: false,
    idempotencyKeyIdEchoed: false,
    existingFormIdEchoed: false,
    rawIdempotencyKeyEchoed: false,
    rawBodyEchoed: false,
    internalPersistenceIdsEchoed: false,
  };
}

function buildSafeConsentFormResponse(result: {
  status: "created" | "replayed";
  form: {
    key: string;
    title: string;
    status: string;
    version: number;
    requiresMedicalAcknowledgment: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}) {
  return {
    responseProjection: buildConsentFormResponseProjection(),
    consentForm: {
      key: result.form.key,
      title: result.form.title,
      status: result.form.status,
      version: result.form.version,
      requiresMedicalAcknowledgment: result.form.requiresMedicalAcknowledgment,
      createdAt: result.form.createdAt.toISOString(),
      updatedAt: result.form.updatedAt.toISOString(),
    },
    persistenceReceipt: {
      consentFormPersisted: true,
      auditPersisted: result.status === "created",
      idempotencyPersisted: true,
      idempotencyReplay: result.status === "replayed",
    },
  };
}

export async function POST(request: NextRequest) {
  let actor;
  try {
    actor = resolveDashboardActor(request);
    assertPermission(actor, "settings:write");
  } catch (error) {
    const status = error instanceof Error && error.message === "AUTH_REQUIRED" ? 401 : 403;
    const code = status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN";
    return NextResponse.json(
      { ok: false, error: { code, message: "Actor is not allowed to create consent forms." } },
      { status, headers: noStoreHeaders },
    );
  }

  const tenantId = new URL(request.url).searchParams.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot create consent forms for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_JSON", message: "Consent form body must be valid JSON." } },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const parsed = consentFormInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Consent form payload failed validation.",
          issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
        },
      },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const input = parsed.data;
  const idempotencyKey =
    request.headers.get("idempotency-key") ??
    `consent-form-create:${tenantId}:${hashIdempotencySubject(`${input.key}:${input.version}`)}`;

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantScope: { actorTenantMatched: true },
          error: {
            code: "PROVIDER_CONSENT_FORM_PERSISTENCE_NOT_CONFIGURED",
            message: "Production consent form creation requires DB-backed dashboard auth, tenant-scoped ConsentForm persistence, and AuditLog rows; local fallback mutations are disabled.",
            gapIds: ["GAP-007", "GAP-037", "GAP-038", "GAP-040"],
          },
          productionBoundary: { localConsentFormMutationFallbackDisabled: true },
          responseProjection: buildConsentFormResponseProjection(),
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        source: actor.source,
        tenantScope: { actorTenantMatched: true },
        error: {
          code: "DATABASE_REQUIRED",
          message: "Consent form creation requires database-backed dashboard auth so ConsentForm and AuditLog rows can be persisted.",
        },
        responseProjection: buildConsentFormResponseProjection(),
        gapIds: ["GAP-007", "GAP-037", "GAP-038", "GAP-040"],
      },
      { status: 409, headers: noStoreHeaders },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const idempotency = await tx.idempotencyKey.upsert({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-consent-form-create", key: idempotencyKey } },
        create: {
          tenantId,
          scope: "dashboard-consent-form-create",
          key: idempotencyKey,
          status: "claimed",
          metadata: toJsonValue({
            route: "/api/consent/forms",
            action: "create_consent_form",
            formHash: hashIdempotencySubject(`${input.key}:${input.version}`),
            rawBodyStoredInResult: false,
            legalApprovalCompleted: false,
            signatureRequestSent: false,
            medicalAcknowledgmentExecuted: false,
          }),
        },
        update: {
          metadata: toJsonValue({
            route: "/api/consent/forms",
            action: "create_consent_form",
            replayObserved: true,
            formHash: hashIdempotencySubject(`${input.key}:${input.version}`),
            rawBodyStoredInResult: false,
            legalApprovalCompleted: false,
            signatureRequestSent: false,
            medicalAcknowledgmentExecuted: false,
          }),
        },
        select: { id: true, status: true, result: true },
      });
      if (idempotency.status === "completed") {
        const form = await tx.consentForm.findFirst({
          where: { tenantId, key: input.key, version: input.version },
          select: {
            id: true,
            tenantId: true,
            key: true,
            title: true,
            status: true,
            version: true,
            requiresMedicalAcknowledgment: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        if (form) {
          return { status: "replayed" as const, form, idempotency };
        }
      }

      const existing = await tx.consentForm.findUnique({
        where: { tenantId_key_version: { tenantId, key: input.key, version: input.version } },
        select: { id: true },
      });
      if (existing) {
        return { status: "exists" as const, formId: existing.id };
      }

      const form = await tx.consentForm.create({
        data: {
          tenantId,
          key: input.key,
          title: input.title.trim(),
          body: input.body.trim(),
          status: input.status,
          version: input.version,
          requiresMedicalAcknowledgment: input.requiresMedicalAcknowledgment,
        },
        select: {
          id: true,
          tenantId: true,
          key: true,
          title: true,
          status: true,
          version: true,
          requiresMedicalAcknowledgment: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "consent.form.create",
          entityType: "ConsentForm",
          entityId: form.id,
          metadata: {
            source: "dashboard-api",
            formKeyHash: hashIdempotencySubject(form.key),
            rawFormKeyStored: false,
            version: form.version,
            status: form.status,
            requiresMedicalAcknowledgment: form.requiresMedicalAcknowledgment,
            bodyStored: true,
            idempotencyPersisted: true,
            rawIdempotencyKeyStored: false,
            internalPersistenceIdsStored: false,
            boundary: "Legal/product approval, signature capture, file assets, and medical acknowledgment flows remain separate evidence gates.",
          },
        },
        select: { id: true, createdAt: true },
      });

      await tx.idempotencyKey.update({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-consent-form-create", key: idempotencyKey } },
        data: {
          status: "completed",
          result: toJsonValue({
            consentFormPersisted: true,
            auditLogged: true,
            created: true,
            rawBodyStoredInResult: false,
            legalApprovalCompleted: false,
            signatureRequestSent: false,
            medicalAcknowledgmentExecuted: false,
            internalPersistenceIdsStored: false,
          }),
        },
      });

      return { status: "created" as const, form, audit, idempotency };
    });

    if (result.status === "exists") {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "CONSENT_FORM_EXISTS", message: "A consent form with this key and version already exists for this tenant." },
          responseProjection: buildConsentFormDuplicateResponseProjection(),
          persistenceReceipt: {
            duplicateDetected: true,
            idempotencyPersisted: true,
          },
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
        ...buildSafeConsentFormResponse(result),
        gapIds: ["GAP-007", "GAP-037", "GAP-038", "GAP-040"],
        boundary: "Dashboard consent form creation is tenant-scoped, no-store, idempotency-backed, and audited; legal approval, signature/file workflows, medical acknowledgments, and integration tests remain evidence-gated.",
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
          error: { code: "DATABASE_UNAVAILABLE", message: "Consent form creation requires the dashboard database connection." },
          responseProjection: buildConsentFormResponseProjection(),
          gapIds: ["GAP-007", "GAP-037", "GAP-038", "GAP-040"],
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    if (error instanceof Error && /Unique constraint/i.test(error.message)) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "CONSENT_FORM_EXISTS", message: "A consent form with this key and version already exists for this tenant." },
          responseProjection: buildConsentFormDuplicateResponseProjection(),
        },
        { status: 409, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "CONSENT_FORM_CREATE_FAILED", message: "Consent form could not be persisted." } }, { status: 500, headers: noStoreHeaders });
  }
}
