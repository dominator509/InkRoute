import { Text, View } from "react-native";
import { MobileCard } from "../components/MobileCard";
import { MobilePill } from "../components/MobilePill";
import { MobileScreen } from "../components/MobileScreen";
import { mobileApiFetch, type MobileApiResponseEnvelope, type MobileApiSession } from "../lib/mobileApiClient";
import { mobileTravelPublishContract, mobileTravelStops } from "../lib/mobileDemo";

export interface MobileTravelStopSummary {
  id: string;
  city: string;
  region: string;
  bookingStatus: string;
}

export function loadMobileTravelStops(
  session: MobileApiSession,
  requestId = `mobile-travel:${session.tenantId}`,
): Promise<MobileApiResponseEnvelope<MobileTravelStopSummary[]>> {
  return mobileApiFetch<MobileTravelStopSummary[]>(session, {
    domain: "travel",
    method: "GET",
    path: "/api/mobile/travel-stops",
    requestId,
  });
}

export function publishMobileTravelStop(
  session: MobileApiSession,
  input: { travelStopId: string; idempotencyKey: string; requestId?: string },
): Promise<MobileApiResponseEnvelope<{ travelStopId: string; status: string }>> {
  return mobileApiFetch<{ travelStopId: string; status: string }>(session, {
    domain: "travel",
    method: "PATCH",
    path: `/api/mobile/travel-stops/${encodeURIComponent(input.travelStopId)}/publish`,
    requestId: input.requestId ?? `mobile-travel-publish:${input.travelStopId}`,
    idempotencyKey: input.idempotencyKey,
    body: { action: "publish" },
  });
}

export function TravelUpdateScreen() {
  return (
    <MobileScreen
      eyebrow="Nomad Mode"
      title="Push city availability"
      summary="Artist-facing travel cards preview city status changes with a local publish contract for website, waitlists, notifications, and SEO revalidation."
    >
      <MobileCard
        title="Travel publish contract"
        eyebrow={mobileTravelPublishContract.localContractReady ? "Local contract ready" : "Local contract blocked"}
        detail="Authenticated travel API, audit log, public cache revalidation, notification fanout, and SEO revalidation are modeled locally; provider-backed execution proof remains gated."
      >
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <MobilePill label={mobileTravelPublishContract.localContractReady ? "local contract ready" : "local contract blocked"} tone={mobileTravelPublishContract.localContractReady ? "good" : "danger"} />
          <MobilePill label={mobileTravelPublishContract.providerExecutionGated ? "provider execution gated" : "provider ready"} tone="warn" />
          <MobilePill label={mobileTravelPublishContract.endpoint} />
        </View>
      </MobileCard>
      {mobileTravelStops.map((stop) => (
        <MobileCard key={stop.id} title={`${stop.city}, ${stop.region}`} eyebrow={stop.studioName ?? "Guest spot"} detail={stop.publicNotes ?? "Public notes pending"}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <MobilePill label={stop.bookingStatus} tone={stop.bookingStatus === "open" ? "good" : stop.bookingStatus === "waitlist" ? "warn" : "neutral"} />
            <MobilePill label={stop.timezone} />
          </View>
          <Text style={{ color: "#a8a29e", marginTop: 8 }}>Publish boundary uses {mobileTravelPublishContract.method} with request-id and idempotency headers; live provider execution remains gated.</Text>
        </MobileCard>
      ))}
    </MobileScreen>
  );
}
