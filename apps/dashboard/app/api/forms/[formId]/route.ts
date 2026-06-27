import { prisma } from "@inkroute/db";
import { NextRequest, NextResponse } from "next/server";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../../dashboardAuth";

export const runtime = "nodejs";

function redactQuestionOptions(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, payload]) => [
      key,
      /email|phone|medical|health|condition|signature|file|upload/i.test(key) ? "[redacted-dashboard-field]" : payload,
    ]),
  );
}

function normalizeFormAction(value: unknown): "archive_form_version" | null {
  if (!value || typeof value !== "object") return null;
  const action = (value as { action?: unknown }).action;
  return action === "archive_form_version" ? action : null;
}

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

interface DashboardFormRouteContext {
  params: Promise<{ formId: string }>;
}

export async function GET(request: NextRequest, context: DashboardFormRouteContext) {
  const params = await context.params;
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "form:read");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to read forms." } }, { status: 403, headers: noStoreHeaders });
  }

  const searchParams = new URL(request.url).searchParams;
  const tenantId = searchParams.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot query forms for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          error: {
            code: "PROVIDER_DASHBOARD_READS_NOT_CONFIGURED",
            message: "Production dashboard form reads require DB-backed actor resolution and tenant-scoped repository data; local fallback demo payloads are disabled.",
            gapIds: ["GAP-007", "GAP-013", "GAP-037", "GAP-040"],
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
        form: {
          id: params.formId,
          type: "intake-or-consent",
          title: "Demo form metadata",
          sensitiveBoundary: "Local fallback never returns raw answers, signature files, signer contacts, IP hashes, user agents, or medical payloads.",
        },
        gapIds: ["GAP-007", "GAP-013", "GAP-037", "GAP-040"],
        boundary: "Local fallback returns redacted demo form metadata only; database mode is required for live form detail reads.",
      },
      { headers: noStoreHeaders },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const intakeForm = await tx.intakeForm.findFirst({
        where: { id: params.formId, tenantId },
        select: {
          id: true,
          key: true,
          title: true,
          description: true,
          status: true,
          version: true,
          updatedAt: true,
          questions: {
            orderBy: { sortOrder: "asc" },
            select: { id: true, key: true, label: true, helpText: true, type: true, isRequired: true, sortOrder: true, options: true },
          },
          _count: { select: { responses: true } },
        },
      });

      const consentForm = intakeForm
        ? null
        : await tx.consentForm.findFirst({
            where: { id: params.formId, tenantId },
            select: {
              id: true,
              key: true,
              title: true,
              status: true,
              version: true,
              requiresMedicalAcknowledgment: true,
              updatedAt: true,
              _count: { select: { signatures: true } },
            },
          });

      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "form:read:detail",
          entityType: intakeForm ? "IntakeForm" : "ConsentForm",
          entityId: params.formId,
          metadata: {
            source: "dashboard-api",
            found: Boolean(intakeForm || consentForm),
            redactedFields: ["answers", "body", "signerEmail", "signatureFileAssetId", "ipAddressHash", "userAgent", "acknowledgments"],
          },
        },
        select: { id: true },
      });

      return { intakeForm, consentForm, audit };
    });

    if (!result.intakeForm && !result.consentForm) {
      return NextResponse.json({ ok: false, error: { code: "FORM_NOT_FOUND", message: "Form was not found for this tenant." } }, { status: 404, headers: noStoreHeaders });
    }

    const form = result.intakeForm
      ? {
          id: result.intakeForm.id,
          key: result.intakeForm.key,
          type: "intake",
          title: result.intakeForm.title,
          description: result.intakeForm.description,
          status: result.intakeForm.status,
          version: result.intakeForm.version,
          updatedAt: result.intakeForm.updatedAt.toISOString(),
          responseCount: result.intakeForm._count.responses,
          questions: result.intakeForm.questions.map((question: {
            id: string;
            key: string;
            label: string | null;
            helpText: string | null;
            type: string;
            isRequired: boolean;
            sortOrder: number;
            options: unknown;
          }) => ({
            id: question.id,
            key: question.key,
            label: question.label,
            helpText: question.helpText,
            type: question.type,
            isRequired: question.isRequired,
            sortOrder: question.sortOrder,
            options: redactQuestionOptions(question.options),
          })),
        }
      : {
          id: result.consentForm!.id,
          key: result.consentForm!.key,
          type: "consent",
          title: result.consentForm!.title,
          body: "[redacted-dashboard-field]",
          status: result.consentForm!.status,
          version: result.consentForm!.version,
          requiresMedicalAcknowledgment: result.consentForm!.requiresMedicalAcknowledgment,
          signatureCount: result.consentForm!._count.signatures,
          updatedAt: result.consentForm!.updatedAt.toISOString(),
        };

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "database",
        form,
        auditId: result.audit.id,
        gapIds: ["GAP-007", "GAP-013", "GAP-037", "GAP-040"],
        boundary: "Dashboard form detail reads are tenant-scoped, no-store, audited, and redact raw answers, consent body text, signatures, signer contact data, IP hashes, user agents, file asset ids, and medical acknowledgment payloads.",
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
          error: { code: "DATABASE_UNAVAILABLE", message: "Form detail reads require the dashboard database connection." },
          gapIds: ["GAP-007", "GAP-013", "GAP-037", "GAP-040"],
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "FORM_DETAIL_READ_FAILED", message: "Form could not be loaded." } }, { status: 500, headers: noStoreHeaders });
  }
}

export async function PATCH(request: NextRequest, context: DashboardFormRouteContext) {
  const params = await context.params;
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "form:write");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to update forms." } }, { status: 403, headers: noStoreHeaders });
  }

  const searchParams = new URL(request.url).searchParams;
  const tenantId = searchParams.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot update forms for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  const body = (await request.json().catch(() => null)) as unknown;
  const action = normalizeFormAction(body);
  if (!action) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_ACTION", message: "Form action is missing or unsupported." } },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const idempotencyKey = request.headers.get("idempotency-key") ?? `form-archive:${tenantId}:${params.formId}:${action}`;

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          formId: params.formId,
          action,
          error: {
            code: "PROVIDER_FORM_WRITE_PERSISTENCE_NOT_CONFIGURED",
            message: "Production form writes require DB-backed actor resolution, tenant-scoped persistence, audit logs, and reviewed legal-copy workflows; local fallback writes are disabled.",
            gapIds: ["GAP-007", "GAP-013", "GAP-038", "GAP-040"],
          },
          productionBoundary: { localFormWriteFallbackDisabled: true },
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        formId: params.formId,
        action,
        persistence: "local-contract",
        gapIds: ["GAP-007", "GAP-013", "GAP-038", "GAP-040"],
        boundary: "Local fallback validates the archive-form metadata contract; database mode is required for durable form writes.",
      },
      { status: 202, headers: noStoreHeaders },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const intakeForm = await tx.intakeForm.findFirst({
        where: { id: params.formId, tenantId },
        select: { id: true, status: true },
      });
      const consentForm = intakeForm
        ? null
        : await tx.consentForm.findFirst({
            where: { id: params.formId, tenantId },
            select: { id: true, status: true },
          });

      if (!intakeForm && !consentForm) return { status: "not_found" as const };

      const idempotency = await tx.idempotencyKey.upsert({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-form-archive", key: idempotencyKey } },
        create: {
          tenantId,
          scope: "dashboard-form-archive",
          key: idempotencyKey,
          status: "claimed",
          metadata: toJsonValue({
            route: "/api/forms/[formId]",
            action,
            formId: params.formId,
            entityType: intakeForm ? "IntakeForm" : "ConsentForm",
            rawAnswersTouched: false,
            legalCopyChanged: false,
            signatureRequestSent: false,
          }),
        },
        update: {
          metadata: toJsonValue({
            route: "/api/forms/[formId]",
            action,
            formId: params.formId,
            entityType: intakeForm ? "IntakeForm" : "ConsentForm",
            replayObserved: true,
            rawAnswersTouched: false,
            legalCopyChanged: false,
            signatureRequestSent: false,
          }),
        },
        select: { id: true, key: true },
      });

      if (intakeForm) {
        await tx.intakeForm.update({
          where: { id: intakeForm.id },
          data: { status: "archived" },
        });
      } else {
        await tx.consentForm.update({
          where: { id: consentForm!.id },
          data: { status: "archived" },
        });
      }

      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "form:write:archive",
          entityType: intakeForm ? "IntakeForm" : "ConsentForm",
          entityId: params.formId,
          metadata: {
            source: "dashboard-api",
            dashboardMutationAction: "archive_form_version",
            idempotencyKey,
            idempotencyKeyId: idempotency.id,
            fromStatus: intakeForm?.status ?? consentForm!.status,
            toStatus: "archived",
            legalCopyChanged: false,
            signatureRequestSent: false,
            rawAnswersTouched: false,
          },
        },
        select: { id: true },
      });

      await tx.idempotencyKey.update({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-form-archive", key: idempotencyKey } },
        data: {
          status: "completed",
          result: toJsonValue({
            formId: params.formId,
            action,
            auditId: audit.id,
            entityType: intakeForm ? "IntakeForm" : "ConsentForm",
            toStatus: "archived",
            rawAnswersTouched: false,
            legalCopyChanged: false,
            signatureRequestSent: false,
          }),
        },
        select: { id: true },
      });

      return { status: "updated" as const, audit, idempotency };
    });

    if (result.status === "not_found") {
      return NextResponse.json({ ok: false, error: { code: "FORM_NOT_FOUND", message: "Form was not found for this tenant." } }, { status: 404, headers: noStoreHeaders });
    }

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        formId: params.formId,
        action,
        persistence: "database",
        auditId: result.audit.id,
        idempotencyKeyId: result.idempotency.id,
        gapIds: ["GAP-007", "GAP-013", "GAP-038", "GAP-040"],
        boundary: "Form archive writes are tenant-scoped, RBAC-gated, idempotency-backed, audited, no-store, and do not modify legal copy, signatures, raw answers, or medical payloads.",
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
          formId: params.formId,
          error: { code: "DATABASE_UNAVAILABLE", message: "Form writes require the dashboard database connection." },
          gapIds: ["GAP-007", "GAP-013", "GAP-038", "GAP-040"],
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "FORM_DETAIL_WRITE_FAILED", message: "Form could not be updated." } }, { status: 500, headers: noStoreHeaders });
  }
}
