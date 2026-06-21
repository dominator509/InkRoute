import { Text, View } from "react-native";
import { MobileCard } from "../components/MobileCard";
import { MobilePill } from "../components/MobilePill";
import { MobileScreen } from "../components/MobileScreen";
import { mobileApiSyncPreview } from "../lib/mobileApiClient";
import { mobileBookingLifecycleActionContract, mobileBookingQueue } from "../lib/mobileDemo";

export function BookingRequestsScreen() {
  return (
    <MobileScreen
      eyebrow="Booking requests"
      title="Review queue"
      summary="Mobile request cards for accept/decline/reschedule triage with a local lifecycle action contract and provider execution gates."
    >
      <MobileCard
        title="Typed client ready"
        eyebrow="Authenticated sync boundary"
        detail="Booking request screens are mapped to the shared mobile API-client contract; provider auth and seeded API smoke still gate live data replacement."
      >
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <MobilePill label={mobileApiSyncPreview.domains.includes("bookings") ? "bookings domain mapped" : "bookings domain missing"} tone="good" />
          <MobilePill label={mobileApiSyncPreview.offlineQueueDomains.includes("bookings") ? "offline queue required" : "online only"} tone="warn" />
          <MobilePill label={mobileBookingLifecycleActionContract.localContractReady ? "lifecycle contract ready" : "lifecycle contract blocked"} tone={mobileBookingLifecycleActionContract.localContractReady ? "good" : "danger"} />
          <MobilePill label={mobileBookingLifecycleActionContract.providerExecutionGated ? "provider execution gated" : "provider ready"} tone="warn" />
        </View>
      </MobileCard>
      {mobileBookingQueue.map((request) => (
        <MobileCard key={request.id} title={`${request.client} · ${request.city}`} detail={request.summary}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <MobilePill label={request.status} tone={request.status === "Submitted" ? "good" : "warn"} />
            <MobilePill label={`${request.score}% ready`} tone={request.score >= 72 ? "good" : "warn"} />
            <MobilePill label={request.style} />
            <MobilePill label={request.placement} />
          </View>
          <Text style={{ color: "#a8a29e", marginTop: 8 }}>Lifecycle action contract uses {mobileBookingLifecycleActionContract.method} with state events, calendar checks, notification handoff, audit logs, request-id, and idempotency headers; live provider execution remains gated.</Text>
        </MobileCard>
      ))}
    </MobileScreen>
  );
}
