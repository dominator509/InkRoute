import { Text, View } from "react-native";
import { MobileCard } from "../components/MobileCard";
import { MobilePill } from "../components/MobilePill";
import { MobileScreen } from "../components/MobileScreen";
import { mobileApiSyncPreview } from "../lib/mobileApiClient";
import { mobileBookingQueue } from "../lib/mobileDemo";

export function BookingRequestsScreen() {
  return (
    <MobileScreen
      eyebrow="Booking requests"
      title="Review queue"
      summary="Static mobile request cards for accept/decline/reschedule triage. Lifecycle actions remain disabled until authenticated APIs and audit logs exist."
    >
      <MobileCard
        title="Typed client ready"
        eyebrow="Authenticated sync boundary"
        detail="Booking request screens are mapped to the shared mobile API-client contract; provider auth and seeded API smoke still gate live data replacement."
      >
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <MobilePill label={mobileApiSyncPreview.domains.includes("bookings") ? "bookings domain mapped" : "bookings domain missing"} tone="good" />
          <MobilePill label={mobileApiSyncPreview.offlineQueueDomains.includes("bookings") ? "offline queue required" : "online only"} tone="warn" />
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
          <Text style={{ color: "#a8a29e", marginTop: 8 }}>Actions disabled: needs authenticated booking lifecycle API, state events, calendar checks, and notification handoff.</Text>
        </MobileCard>
      ))}
    </MobileScreen>
  );
}
