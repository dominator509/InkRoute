import { Text, View } from "react-native";
import { MobileCard } from "../components/MobileCard";
import { MobilePill } from "../components/MobilePill";
import { MobileScreen } from "../components/MobileScreen";
import { offlineSyncPreview } from "../lib/offlineSync";
import { offlineQueueItems, offlineQueueSummary } from "../lib/mobileDemo";

export function OfflineNotesScreen() {
  return (
    <MobileScreen
      eyebrow="Offline-first strategy"
      title="Weak-signal travel queue"
      summary="Static queue model for notes, travel updates, and portfolio metadata created while traveling. Durable encrypted local storage and sync are not implemented yet."
    >
      <MobileCard title="Queue summary" detail={offlineQueueSummary.warning}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <MobilePill label={`${offlineQueueSummary.total} total`} />
          <MobilePill label={`${offlineQueueSummary.queued} queued`} tone="warn" />
          <MobilePill label={`${offlineQueueSummary.failed} failed`} tone={offlineQueueSummary.failed > 0 ? "danger" : "good"} />
          <MobilePill label={`${offlineQueueSummary.sensitive} sensitive`} tone="danger" />
        </View>
      </MobileCard>
      <MobileCard title="Sync worker contract" eyebrow="GAP-045" detail={offlineSyncPreview.boundary}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <MobilePill label={offlineSyncPreview.adapter} tone="warn" />
          <MobilePill label="idempotent replay wired" tone="good" />
          <MobilePill label="encrypted device storage gated" tone="danger" />
          <MobilePill label="reconnect smoke pending" tone="warn" />
        </View>
        <Text style={{ color: "#a8a29e", marginTop: 8 }}>Example key: {offlineSyncPreview.idempotencyExample}</Text>
      </MobileCard>
      {offlineQueueItems.map((item) => (
        <MobileCard key={item.id} title={item.label} eyebrow={item.kind}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <MobilePill label={item.status} tone={item.status === "failed" ? "danger" : "warn"} />
            <MobilePill label={`${item.retryCount} retries`} />
            {item.sensitive ? <MobilePill label="sensitive" tone="danger" /> : null}
          </View>
        </MobileCard>
      ))}
    </MobileScreen>
  );
}
