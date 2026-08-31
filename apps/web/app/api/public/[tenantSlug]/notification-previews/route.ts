import { buildDeliveryPlan, renderTemplate, type ClientConsentSnapshot, type NotificationTemplateKey } from "@inkroute/notifications";
import { NextResponse, type NextRequest } from "next/server";

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

const previewKeys: NotificationTemplateKey[] = [
  "booking_request_received",
  "booking_request_accepted",
  "deposit_request",
  "appointment_prep_24h",
  "aftercare_day_0",
  "healed_photo_request_30d",
  "city_waitlist_opening",
];

const demoConsent: ClientConsentSnapshot = {
  clientId: "client_preview",
  pushToken: "preview_push_destination",
  inAppUserId: "client_preview",
  emailOptIn: true,
  smsOptIn: true,
  pushOptIn: true,
  marketingOptIn: true,
  transactionalAllowed: true,
};

function buildSafeDeliveryPlanResponse(plan: ReturnType<typeof buildDeliveryPlan>) {
  const safeCandidate = (candidate: (typeof plan.candidates)[number]) => ({
    channel: candidate.channel,
    provider: candidate.provider,
    status: candidate.status,
    reason: candidate.reason,
    destinationMaskedEchoed: false,
  });

  return {
    template: { key: plan.template.key, purpose: plan.template.purpose },
    audience: plan.audience,
    purpose: plan.purpose,
    candidates: plan.candidates.map(safeCandidate),
    chosenChannels: plan.chosenChannels,
    blockedChannels: plan.blockedChannels.map(safeCandidate),
    requiresProviderCredential: plan.requiresProviderCredential,
    requiresAuditLog: plan.requiresAuditLog,
    complianceNotes: plan.complianceNotes,
    responseProjection: {
      rawContactFieldsEchoed: false,
      rawDestinationEchoed: false,
      destinationMaskedEchoed: false,
      rawConsentSnapshotEchoed: false,
      tenantIdEchoed: false,
      internalPersistenceIdsEchoed: false,
    },
  };
}

export async function GET(_request: NextRequest, context: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await context.params;
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "PROVIDER_NOTIFICATION_PREVIEWS_NOT_CONFIGURED",
          message: "Production notification previews require provider-backed templates, consent persistence, and delivery queue evidence; static preview payloads are disabled.",
          gapIds: ["GAP-010", "GAP-061", "GAP-062", "GAP-063", "GAP-064", "GAP-065"],
        },
        productionBoundary: {
          staticNotificationPreviewDisabled: true,
          requiredBeforeEnablement: [
            "tenant-scoped template persistence",
            "consent and suppression persistence",
            "provider delivery queue handoff",
            "sandbox/device send evidence",
          ],
        },
        responseProjection: {
          rawContactFieldsEchoed: false,
          rawDestinationEchoed: false,
          destinationMaskedEchoed: false,
          rawConsentSnapshotEchoed: false,
          tenantIdEchoed: false,
          internalPersistenceIdsEchoed: false,
        },
      },
      { status: 503, headers: noStoreHeaders },
    );
  }

  const contextPreview = {
    artistName: "Mara Vale",
    clientName: "Preview client",
    city: "Seattle",
    appointmentDate: "July 11, 2026",
    depositUrl: "https://example.test/deposit/demo",
    aftercareUrl: "https://example.test/aftercare",
    bookingUrl: "https://example.test/booking",
    healedPhotoUploadUrl: "https://example.test/uploads/healed-photo",
    unsubscribeUrl: "https://example.test/preferences",
  };

  return NextResponse.json({
    ok: true,
    data: {
      tenantScope: { routeTenantSlugReceived: true, tenantSlugEchoed: false },
      mode: "static_phase9_preview",
      templates: previewKeys.map((key) => renderTemplate(key, contextPreview)),
      deliveryPlans: previewKeys.map((key) =>
        buildSafeDeliveryPlanResponse(buildDeliveryPlan({ key, context: contextPreview, consent: demoConsent, channels: ["email", "sms", "push", "in_app"] })),
      ),
      responseProjection: {
        rawContactFieldsEchoed: false,
        rawDestinationEchoed: false,
        destinationMaskedEchoed: false,
        rawConsentSnapshotEchoed: false,
        tenantIdEchoed: false,
        internalPersistenceIdsEchoed: false,
      },
      productionBoundary: {
        status: "provider-gated",
        gapIds: ["GAP-061", "GAP-062", "GAP-063", "GAP-064", "GAP-065"],
        note: "This route renders template and consent delivery-plan previews while provider dispatch, durable queue writes, and live sends remain evidence-gated.",
      },
    },
  }, { headers: noStoreHeaders });
}
