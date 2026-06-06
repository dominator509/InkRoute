import { Text, View } from "react-native";
import type { MobileIntegrationBoundary } from "@inkroute/mobile-support";
import { MobilePill } from "./MobilePill";

export function BoundaryCard({ boundary }: { key?: string; boundary: MobileIntegrationBoundary }) {
  return (
    <View style={{ borderWidth: 1, borderColor: "#7c2d12", backgroundColor: "#1c1917", borderRadius: 20, padding: 14, gap: 8 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
        <Text style={{ color: "#fafaf9", fontWeight: "900", flex: 1 }}>{boundary.label}</Text>
        <MobilePill label={boundary.status} tone={boundary.blocksProduction ? "danger" : "warn"} />
      </View>
      <Text style={{ color: "#d6d3d1", lineHeight: 20 }}>{boundary.detail}</Text>
    </View>
  );
}
