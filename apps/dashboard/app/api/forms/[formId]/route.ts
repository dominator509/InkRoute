import { prisma } from "@inkroute/db";
import { NextRequest, NextResponse } from "next/server";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../../dashboardAuth";

function redactQuestionOptions(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, payload]) => [
      key,
      /email|phone|medical|health|condition|signature|file|upload/i.test(key) ? "[redacted-dashboard-field]" : payload,
    ]),
  );
}

export async function GET(request: NextRequest, { params }: { params: { formId: string } }) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "form:read");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to read forms." } }, { status: 403 });
  }

  const searchParams = new URL(request.url).searchParams;
  const tenantId = searchParams.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot query forms for another tenant." } }, { status: 403 });
  }

  if (actor.source === "local-fallback") {
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
      { headers: { "Cache-Control": "no-store" } },
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
      return NextResponse.json({ ok: false, error: { code: "FORM_NOT_FOUND", message: "Form was not found for this tenant." } }, { status: 404, headers: { "Cache-Control": "no-store" } });
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
          questions: result.intakeForm.questions.map((question) => ({
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
      { headers: { "Cache-Control": "no-store" } },
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
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "FORM_DETAIL_READ_FAILED", message: "Form could not be loaded." } }, { status: 500 });
  }
}
