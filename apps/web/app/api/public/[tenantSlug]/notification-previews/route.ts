import { buildDeliveryPlan, renderTemplate, type ClientConsentSnapshot, type NotificationTemplateKey } from "@inkroute/notifications";
import { NextResponse, type NextRequest } from "next/server";

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
  email: "client@example.test",
  phone: "+15550101010",
  pushToken: "ExponentPushToken[preview]",
  inAppUserId: "client_preview",
  emailOptIn: true,
  smsOptIn: true,
  pushOptIn: true,
  marketingOptIn: true,
  transactionalAllowed: true,
};

export async function GET(_request: NextRequest, context: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await context.params;
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
      tenantSlug,
      mode: "static_phase9_preview",
      templates: previewKeys.map((key) => renderTemplate(key, contextPreview)),
      deliveryPlans: previewKeys.map((key) => buildDeliveryPlan({ key, context: contextPreview, consent: demoConsent })),
      productionBoundary: {
        status: "provider-gated",
        gapIds: ["GAP-061", "GAP-062", "GAP-063", "GAP-064", "GAP-065"],
        note: "This route returns static render/consent previews only. It does not queue or send notifications.",
      },
    },
  });
}
