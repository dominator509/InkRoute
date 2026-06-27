import { buildDeliveryPlan } from "@inkroute/notifications";
import { notificationPreviewInputSchema } from "@inkroute/validators";
import { NextRequest, NextResponse } from "next/server";
import { assertPermission, resolveDashboardActor } from "../../dashboardAuth";

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

export async function POST(request: NextRequest) {
  let actor;
  try {
    actor = resolveDashboardActor(request);
    assertPermission(actor, "settings:write");
  } catch (error) {
    const status = error instanceof Error && error.message === "AUTH_REQUIRED" ? 401 : 403;
    const code = status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN";
    return NextResponse.json(
      { ok: false, error: { code, message: "Actor is not allowed to preview notifications." } },
      { status, headers: noStoreHeaders },
    );
  }

  const tenantId = new URL(request.url).searchParams.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot preview notifications for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_JSON", message: "Notification preview body must be valid JSON." } },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const parsed = notificationPreviewInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Notification preview payload failed validation.",
          issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
        },
      },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const input = parsed.data;
  const plan = buildDeliveryPlan({
    key: input.templateKey,
    context: {
      artistName: input.artistName,
      clientName: input.clientName,
      ...(input.city !== undefined ? { city: input.city } : {}),
      ...(input.appointmentDate !== undefined ? { appointmentDate: input.appointmentDate } : {}),
      ...(input.depositUrl !== undefined ? { depositUrl: input.depositUrl } : {}),
      ...(input.aftercareUrl !== undefined ? { aftercareUrl: input.aftercareUrl } : {}),
      ...(input.bookingUrl !== undefined ? { bookingUrl: input.bookingUrl } : {}),
      ...(input.healedPhotoUploadUrl !== undefined ? { healedPhotoUploadUrl: input.healedPhotoUploadUrl } : {}),
      ...(input.unsubscribeUrl !== undefined ? { unsubscribeUrl: input.unsubscribeUrl } : {}),
    },
    consent: input.consent,
    ...(input.channels !== undefined ? { channels: input.channels } : {}),
  });

  return NextResponse.json(
    {
      ok: true,
      source: actor.source,
      tenantId,
      persistence: "none",
      plan,
      gapIds: ["GAP-010", "GAP-038", "GAP-065", "GAP-069"],
      boundary: "Notification preview computes template and consent-aware delivery candidates only; provider dispatch, durable queue processing, and sandbox/device proof remain evidence-gated.",
    },
    { headers: noStoreHeaders },
  );
}
