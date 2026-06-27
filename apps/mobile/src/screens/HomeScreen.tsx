import { Text, View } from "react-native";
import { dashboardMetrics, inkrouteDemoArtist } from "@inkroute/config";
import { MobileCard } from "../components/MobileCard";
import { MobilePill } from "../components/MobilePill";
import { MobileScreen } from "../components/MobileScreen";
import { mobileApiSyncPreview } from "../lib/mobileApiClient";
import { mobileReadinessPreview, mobileTravelStops } from "../lib/mobileDemo";

export function HomeScreen() {
  return (
    <MobileScreen
      eyebrow="Artist command center"
      title={`Today for ${inkrouteDemoArtist.displayName}`}
      summary="Mobile dashboard for a traveling artist: requests, deposits, next city, readiness, and what must be handled before the next guest spot."
    >
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {dashboardMetrics.map((metric) => (
          <View key={metric.label} style={{ flexBasis: "47%", flexGrow: 1 }}>
            <MobileCard eyebrow={metric.label}>
              <Text style={{ color: "#fafaf9", fontSize: 28, fontWeight: "900" }}>{metric.value}</Text>
              <Text style={{ color: "#d6d3d1" }}>{metric.detail}</Text>
            </MobileCard>
          </View>
        ))}
      </View>
      <MobileCard title="Tattoo Readiness Score" eyebrow="Style Match Intake" detail="Shared booking package scoring is available on mobile for quick triage, but production data must come from tenant-scoped APIs.">
        <Text style={{ color: "#fafaf9", fontSize: 42, fontWeight: "900" }}>{mobileReadinessPreview.percentage}%</Text>
        <MobilePill label={mobileReadinessPreview.label} tone="good" />
      </MobileCard>
      <MobileCard
        title="API sync contract"
        eyebrow="GAP-043"
        detail={mobileApiSyncPreview.boundary}
      >
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <MobilePill label={`${mobileApiSyncPreview.domains.length} domains mapped`} tone="good" />
          <MobilePill label={`${mobileApiSyncPreview.requiredEndpointCount} endpoints`} />
          <MobilePill label={mobileApiSyncPreview.authRequired ? "auth headers required" : "auth missing"} tone="warn" />
          <MobilePill label={mobileApiSyncPreview.tenantScopeRequired ? "tenant scope required" : "tenant scope missing"} tone="warn" />
        </View>
      </MobileCard>
      <MobileCard title="Next travel stops" eyebrow="Nomad Mode">
        {mobileTravelStops.slice(0, 2).map((stop) => (
          <View key={stop.id} style={{ borderTopWidth: 1, borderColor: "#44403c", paddingTop: 10, marginTop: 10, gap: 4 }}>
            <Text style={{ color: "#fafaf9", fontWeight: "900" }}>{stop.city}, {stop.region}</Text>
            <Text style={{ color: "#d6d3d1" }}>{stop.studioName}</Text>
            <MobilePill label={stop.bookingStatus} tone={stop.bookingStatus === "open" ? "good" : "warn"} />
          </View>
        ))}
      </MobileCard>
    </MobileScreen>
  );
}
