import { Text, View } from "react-native";
import { MobileCard } from "../components/MobileCard";
import { MobilePill } from "../components/MobilePill";
import { MobileScreen } from "../components/MobileScreen";
import { mobileTravelStops } from "../lib/mobileDemo";

export function TravelUpdateScreen() {
  return (
    <MobileScreen
      eyebrow="Nomad Mode"
      title="Push city availability"
      summary="Artist-facing travel cards preview city status changes that should eventually publish to website, waitlists, notifications, and SEO pages in one safe workflow."
    >
      {mobileTravelStops.map((stop) => (
        <MobileCard key={stop.id} title={`${stop.city}, ${stop.region}`} eyebrow={stop.studioName ?? "Guest spot"} detail={stop.publicNotes ?? "Public notes pending"}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <MobilePill label={stop.bookingStatus} tone={stop.bookingStatus === "open" ? "good" : stop.bookingStatus === "waitlist" ? "warn" : "neutral"} />
            <MobilePill label={stop.timezone} />
          </View>
          <Text style={{ color: "#a8a29e", marginTop: 8 }}>Publishing disabled: requires authenticated travel API, audit log, public cache revalidation, and notification fanout.</Text>
        </MobileCard>
      ))}
    </MobileScreen>
  );
}
