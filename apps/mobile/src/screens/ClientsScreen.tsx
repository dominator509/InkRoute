import { Text, View } from "react-native";
import { MobileCard } from "../components/MobileCard";
import { MobilePill } from "../components/MobilePill";
import { MobileScreen } from "../components/MobileScreen";
import { mobileClients } from "../lib/mobileDemo";

export function ClientsScreen() {
  return (
    <MobileScreen
      eyebrow="Client CRM"
      title="Private client timeline preview"
      summary="Mobile client cards are demo-safe and intentionally omit sensitive medical notes, signatures, IDs, payments, and private files."
    >
      {mobileClients.map((client) => (
        <MobileCard key={client.id} title={client.name} eyebrow={client.city} detail={client.privateBoundary}>
          <Text style={{ color: "#fafaf9", fontWeight: "900" }}>{client.lastTouch}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {client.tags.map((tag) => <MobilePill key={tag} label={tag} />)}
          </View>
        </MobileCard>
      ))}
    </MobileScreen>
  );
}
