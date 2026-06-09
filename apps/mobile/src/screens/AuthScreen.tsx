import { Text, View } from "react-native";
import { MobileCard } from "../components/MobileCard";
import { MobilePill } from "../components/MobilePill";
import { MobileScreen } from "../components/MobileScreen";
import { mobileAuthSessionPreview } from "../lib/mobileAuth";
import { mobileSessionPreview, mobileAccessPreview } from "../lib/mobileDemo";

export function AuthScreen() {
  return (
    <MobileScreen
      eyebrow="Phase 6 · Auth boundary"
      title="Secure mobile login posture"
      summary="This screen documents how the artist app should feel before wiring auth, biometric unlock, tenant membership, and refresh-token handling."
    >
      <MobileCard title="Mock owner session" eyebrow="Scaffolded" detail={mobileSessionPreview.sessionBoundary}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <MobilePill label={mobileSessionPreview.status} tone="warn" />
          <MobilePill label={mobileSessionPreview.tenantSlug ?? "tenant pending"} />
          <MobilePill label={mobileSessionPreview.biometricAvailable ? "biometric planned" : "no biometric"} tone="warn" />
        </View>
      </MobileCard>
      <MobileCard title="RBAC preview" detail="Role permissions are imported from the shared auth package, but no live session guard exists in Expo yet.">
        <Text style={{ color: "#fafaf9", fontSize: 28, fontWeight: "900" }}>{mobileAccessPreview.ownerPermissionCount}</Text>
        <Text style={{ color: "#d6d3d1" }}>Owner permissions available in shared matrix</Text>
        <Text style={{ color: "#a8a29e", marginTop: 8 }}>Tenant access preview: {mobileAccessPreview.canReadTenant ? "same tenant allowed" : "blocked"}</Text>
      </MobileCard>
      <MobileCard title="Session gate contract" eyebrow="GAP-042" detail={mobileAuthSessionPreview.boundary}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <MobilePill label={mobileAuthSessionPreview.decision.action} tone={mobileAuthSessionPreview.decision.allowed ? "good" : "warn"} />
          <MobilePill label={mobileAuthSessionPreview.decision.status} tone="warn" />
          <MobilePill label="secure session" tone="good" />
          <MobilePill label="provider login gated" tone="danger" />
        </View>
        <Text style={{ color: "#d6d3d1", marginTop: 8 }}>{mobileAuthSessionPreview.decision.reason}</Text>
        <Text style={{ color: "#a8a29e", marginTop: 8 }}>
          Audit: {mobileAuthSessionPreview.auditEvent.action} · readiness: {mobileAuthSessionPreview.readiness.status}
        </Text>
      </MobileCard>
    </MobileScreen>
  );
}
