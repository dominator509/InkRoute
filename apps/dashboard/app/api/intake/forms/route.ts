import { createHash } from "node:crypto";
import { prisma } from "@inkroute/db";
import { intakeFormInputSchema } from "@inkroute/validators";
import { NextRequest, NextResponse } from "next/server";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../../dashboardAuth";

export const runtime = "nodejs";

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

function buildIntakeFormResponseProjection() {
  return {
    intakeFormResponseAllowlisted: true,
    formIdEchoed: false,
    tenantIdEchoed: false,
    auditIdEchoed: false,
    idempotencyKeyIdEchoed: false,
    rawIdempotencyKeyEchoed: false,
    internalPersistenceIdsEchoed: false,
  };
}

function buildIntakeFormDuplicateResponseProjection() {
  return {
    intakeFormDuplicateResponseAllowlisted: true,
    formIdEchoed: false,
    tenantIdEchoed: false,
    auditIdEchoed: false,
    idempotencyKeyIdEchoed: false,
    existingFormIdEchoed: false,
    rawIdempotencyKeyEchoed: false,
    internalPersistenceIdsEchoed: false,
  };
}

function buildSafeIntakeFormResponse(result: {
  status: "created" | "replayed";
  form: {
    key: string;
    title: string;
    description: string | null;
    status: string;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  };
}) {
  return {
    responseProjection: buildIntakeFormResponseProjection(),
    intakeForm: {
      key: result.form.key,
      title: result.form.title,
      description: result.form.description,
      status: result.form.status,
      version: result.form.version,
      createdAt: result.form.createdAt.toISOString(),
      updatedAt: result.form.updatedAt.toISOString(),
    },
    persistenceReceipt: {
      intakeFormPersisted: true,
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
      { ok: false, error: { code, message: "Actor is not allowed to create intake forms." } },
      { status, headers: noStoreHeaders },
    );
  }

  const tenantId = new URL(request.url).searchParams.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot create intake forms for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_JSON", message: "Intake form body must be valid JSON." } },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const parsed = intakeFormInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Intake form payload failed validation.",
          issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
        },
      },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const input = parsed.data;
  const idempotencyKey =
    request.headers.get("idempotency-key") ??
    `intake-form-create:${tenantId}:${hashIdempotencySubject(`${input.key}:${input.version}`)}`;

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantScope: { actorTenantMatched: true },
          error: {
            code: "PROVIDER_INTAKE_FORM_PERSISTENCE_NOT_CONFIGURED",
            message: "Production intake form creation requires DB-backed dashboard auth, tenant-scoped IntakeForm persistence, and AuditLog rows; local fallback mutations are disabled.",
            gapIds: ["GAP-007", "GAP-037", "GAP-038", "GAP-040"],
          },
          productionBoundary: { localIntakeFormMutationFallbackDisabled: true },
          responseProjection: buildIntakeFormResponseProjection(),
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
          message: "Intake form creation requires database-backed dashboard auth so IntakeForm and AuditLog rows can be persisted.",
        },
        responseProjection: buildIntakeFormResponseProjection(),
        gapIds: ["GAP-007", "GAP-037", "GAP-038", "GAP-040"],
      },
      { status: 409, headers: noStoreHeaders },
    );
  }

  try {
    const description = normalizeOptionalText(input.description);
    const result = await prisma.$transaction(async (tx) => {
      const idempotency = await tx.idempotencyKey.upsert({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-intake-form-create", key: idempotencyKey } },
        create: {
          tenantId,
          scope: "dashboard-intake-form-create",
          key: idempotencyKey,
          status: "claimed",
          metadata: toJsonValue({
            route: "/api/intake/forms",
            action: "create_intake_form",
            formHash: hashIdempotencySubject(`${input.key}:${input.version}`),
            rawQuestionsStoredInResult: false,
            rawResponsesStoredInResult: false,
            privacyReviewCompleted: false,
          }),
        },
        update: {
          metadata: toJsonValue({
            route: "/api/intake/forms",
            action: "create_intake_form",
            replayObserved: true,
            formHash: hashIdempotencySubject(`${input.key}:${input.version}`),
            rawQuestionsStoredInResult: false,
            rawResponsesStoredInResult: false,
            privacyReviewCompleted: false,
          }),
        },
        select: { id: true, status: true, result: true },
      });
      if (idempotency.status === "completed") {
        const form = await tx.intakeForm.findFirst({
          where: { tenantId, key: input.key, version: input.version },
          select: {
            id: true,
            tenantId: true,
            key: true,
            title: true,
            description: true,
            status: true,
            version: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        if (form) {
          return { status: "replayed" as const, form, idempotency };
        }
      }

      const existing = await tx.intakeForm.findUnique({
        where: { tenantId_key_version: { tenantId, key: input.key, version: input.version } },
        select: { id: true },
      });
      if (existing) {
        return { status: "exists" as const, formId: existing.id };
      }

      const form = await tx.intakeForm.create({
        data: {
          tenantId,
          key: input.key,
          title: input.title.trim(),
          ...(description !== undefined ? { description } : {}),
          status: input.status,
          version: input.version,
        },
        select: {
          id: true,
          tenantId: true,
          key: true,
          title: true,
          description: true,
          status: true,
          version: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "intake.form.create",
          entityType: "IntakeForm",
          entityId: form.id,
          metadata: {
            source: "dashboard-api",
            formKeyHash: hashIdempotencySubject(form.key),
            rawFormKeyStored: false,
            version: form.version,
            status: form.status,
            idempotencyPersisted: true,
            rawIdempotencyKeyStored: false,
            internalPersistenceIdsStored: false,
            boundary: "Question authoring and response persistence are separate form workflow surfaces.",
          },
        },
        select: { id: true, createdAt: true },
      });

      await tx.idempotencyKey.update({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-intake-form-create", key: idempotencyKey } },
        data: {
          status: "completed",
          result: toJsonValue({
            intakeFormPersisted: true,
            auditLogged: true,
            created: true,
            rawQuestionsStoredInResult: false,
            rawResponsesStoredInResult: false,
            privacyReviewCompleted: false,
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
          error: { code: "INTAKE_FORM_EXISTS", message: "An intake form with this key and version already exists for this tenant." },
          responseProjection: buildIntakeFormDuplicateResponseProjection(),
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
        ...buildSafeIntakeFormResponse(result),
        gapIds: ["GAP-007", "GAP-037", "GAP-038", "GAP-040"],
        boundary: "Dashboard intake form creation is tenant-scoped, no-store, idempotency-backed, and audited; question authoring, response persistence, privacy review, and integration tests remain evidence-gated.",
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
          error: { code: "DATABASE_UNAVAILABLE", message: "Intake form creation requires the dashboard database connection." },
          responseProjection: buildIntakeFormResponseProjection(),
          gapIds: ["GAP-007", "GAP-037", "GAP-038", "GAP-040"],
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    if (error instanceof Error && /Unique constraint/i.test(error.message)) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "INTAKE_FORM_EXISTS", message: "An intake form with this key and version already exists for this tenant." },
          responseProjection: buildIntakeFormDuplicateResponseProjection(),
        },
        { status: 409, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "INTAKE_FORM_CREATE_FAILED", message: "Intake form could not be persisted." } }, { status: 500, headers: noStoreHeaders });
  }
}
