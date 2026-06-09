import { prisma } from "@inkroute/db";
import { NextRequest, NextResponse } from "next/server";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../dashboardAuth";

const localForms = [
  {
    id: "local-intake-form",
    key: "custom-tattoo-request-intake",
    type: "intake",
    title: "Custom tattoo request intake",
    status: "published",
    version: 1,
    questionCount: 12,
    responseCount: 0,
    sensitiveBoundary: "Raw answers and medical notes are not exposed by dashboard read APIs.",
  },
  {
    id: "local-consent-form",
    key: "travel-guest-spot-consent",
    type: "consent",
    title: "Travel guest spot consent",
    status: "draft",
    version: 1,
    signatureCount: 0,
    requiresMedicalAcknowledgment: true,
    sensitiveBoundary: "Signature files, signer contact details, IP hashes, and user agents stay private.",
  },
];

function redactQuestionOptions(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, payload]) => [
      key,
      /email|phone|medical|health|condition|signature|file|upload/i.test(key) ? "[redacted-dashboard-field]" : payload,
    ]),
  );
}

export async function GET(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "form:read");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to read forms." } }, { status: 403 });
  }

  const params = new URL(request.url).searchParams;
  const tenantId = params.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot query forms for another tenant." } }, { status: 403 });
  }

  const limit = Math.min(Math.max(Number(params.get("limit") ?? 50), 1), 100);

  if (actor.source === "local-fallback") {
    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "local-fallback",
        forms: localForms.slice(0, limit),
        gapIds: ["GAP-007", "GAP-013", "GAP-037", "GAP-040"],
        boundary: "Local fallback returns redacted demo form metadata only; database mode is required for live intake and consent reads.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const [intakeForms, consentForms, medicalAcknowledgments] = await Promise.all([
        tx.intakeForm.findMany({
          where: { tenantId },
          orderBy: { updatedAt: "desc" },
          take: limit,
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
        }),
        tx.consentForm.findMany({
          where: { tenantId },
          orderBy: { updatedAt: "desc" },
          take: limit,
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
        }),
        tx.medicalSafetyAcknowledgment.findMany({
          where: { tenantId },
          orderBy: { updatedAt: "desc" },
          take: limit,
          select: { id: true, status: true, flaggedReasons: true, reviewedAt: true, updatedAt: true },
        }),
      ]);

      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "form:read:list",
          entityType: "Form",
          metadata: {
            source: "dashboard-api",
            intakeFormCount: intakeForms.length,
            consentFormCount: consentForms.length,
            medicalAcknowledgmentCount: medicalAcknowledgments.length,
            redactedFields: ["answers", "signerEmail", "signatureFileAssetId", "ipAddressHash", "userAgent", "acknowledgments"],
          },
        },
        select: { id: true },
      });

      return { intakeForms, consentForms, medicalAcknowledgments, audit };
    });

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "database",
        intakeForms: result.intakeForms.map((form) => ({
          id: form.id,
          key: form.key,
          type: "intake",
          title: form.title,
          description: form.description,
          status: form.status,
          version: form.version,
          updatedAt: form.updatedAt.toISOString(),
          questionCount: form.questions.length,
          responseCount: form._count.responses,
          questions: form.questions.map((question) => ({
            id: question.id,
            key: question.key,
            label: question.label,
            helpText: question.helpText,
            type: question.type,
            isRequired: question.isRequired,
            sortOrder: question.sortOrder,
            options: redactQuestionOptions(question.options),
          })),
        })),
        consentForms: result.consentForms.map((form) => ({
          id: form.id,
          key: form.key,
          type: "consent",
          title: form.title,
          status: form.status,
          version: form.version,
          requiresMedicalAcknowledgment: form.requiresMedicalAcknowledgment,
          signatureCount: form._count.signatures,
          updatedAt: form.updatedAt.toISOString(),
        })),
        medicalAcknowledgments: result.medicalAcknowledgments.map((acknowledgment) => ({
          id: acknowledgment.id,
          status: acknowledgment.status,
          flaggedReasons: acknowledgment.flaggedReasons,
          reviewedAt: acknowledgment.reviewedAt?.toISOString() ?? null,
          updatedAt: acknowledgment.updatedAt.toISOString(),
          acknowledgments: "[redacted-dashboard-field]",
        })),
        auditId: result.audit.id,
        gapIds: ["GAP-007", "GAP-013", "GAP-037", "GAP-040"],
        boundary: "Dashboard form reads expose metadata, question structure, counts, and review status only; raw answers, signatures, signer contact data, IP hashes, user agents, file asset ids, and medical acknowledgment payloads remain redacted.",
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
          error: { code: "DATABASE_UNAVAILABLE", message: "Form reads require the dashboard database connection." },
          gapIds: ["GAP-007", "GAP-013", "GAP-037", "GAP-040"],
        },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "FORM_READ_FAILED", message: "Forms could not be loaded." } }, { status: 500 });
  }
}
