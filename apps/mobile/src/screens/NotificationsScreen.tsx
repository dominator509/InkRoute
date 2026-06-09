import { Text, View } from "react-native";
import { MobileCard } from "../components/MobileCard";
import { MobilePill } from "../components/MobilePill";
import { MobileScreen } from "../components/MobileScreen";
import { mobilePushContractPreview } from "../lib/mobilePush";
import { mobileAutomationSequence, mobileNotificationPlans, notificationPreviews } from "../lib/mobileDemo";

function planTone(status: string) {
  if (status === "allowed") return "good" as const;
  if (status === "requires_provider") return "warn" as const;
  return "danger" as const;
}

export function NotificationsScreen() {
  return (
    <MobileScreen
      eyebrow="Push architecture"
      title="Client and artist alerts"
      summary="Template previews, consent routing, and automation sequences are imported from @inkroute/notifications. Expo push now exposes app-side registration, provider runtime gates, receipt replay, invalid-token suppression, and safe tap-routing contracts."
    >
      <MobileCard title="Push runtime contract" eyebrow="GAP-063" detail={mobilePushContractPreview.boundary}>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          <MobilePill label={mobilePushContractPreview.registration.shouldPersistToken ? "token registration planned" : "token blocked"} tone="good" />
          <MobilePill label={mobilePushContractPreview.delivery.status === "ready" ? "delivery log planned" : "delivery blocked"} tone="good" />
          <MobilePill label={mobilePushContractPreview.receipt.shouldMarkPushTokenInactive ? "invalid token suppression" : "receipt tracked"} tone="warn" />
          <MobilePill label={`provider ${mobilePushContractPreview.provider.runtimeReadiness.status}`} tone={mobilePushContractPreview.provider.runtimeReadiness.status === "ready" ? "good" : "danger"} />
          <MobilePill label={`tap route ${mobilePushContractPreview.tap.routePath ?? "blocked"}`} tone={mobilePushContractPreview.tap.status === "ready" ? "good" : "danger"} />
        </View>
        <Text style={{ color: "#a8a29e", marginTop: 8 }}>
          Token preview: {mobilePushContractPreview.registration.tokenMasked ?? "not registered"} | receipt: {mobilePushContractPreview.receipt.normalizedStatus} | Expo gates: {mobilePushContractPreview.provider.runtimeReadiness.blockers.length}
        </Text>
      </MobileCard>

      {notificationPreviews.map((notification) => (
        <MobileCard key={notification.key} title={notification.key.replace(/_/g, " ")} detail={notification.body}>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <MobilePill label={notification.channel} tone="warn" />
            <MobilePill label="provider-gated" tone="danger" />
          </View>
        </MobileCard>
      ))}

      {mobileNotificationPlans.map((plan) => (
        <MobileCard key={plan.template.key} eyebrow="Consent plan" title={plan.template.key.replace(/_/g, " ")} detail={plan.template.pushBody}>
          <View style={{ gap: 8 }}>
            {plan.candidates.map((candidate) => (
              <View key={`${plan.template.key}-${candidate.channel}`} style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                <MobilePill label={candidate.channel} tone={planTone(candidate.status)} />
                <Text style={{ color: "#d6d3d1", flexShrink: 1 }}>{candidate.reason}</Text>
              </View>
            ))}
          </View>
        </MobileCard>
      ))}

      <MobileCard title="Automation sequence preview" detail="The first five Phase 9 automation steps are visible on mobile so artists understand what will later be queued after bookings, deposits, appointment confirmation, and aftercare events.">
        <View style={{ gap: 10 }}>
          {mobileAutomationSequence.slice(0, 5).map((step) => (
            <View key={step.id} style={{ gap: 4 }}>
              <Text style={{ color: "#fafaf9", fontWeight: "900" }}>{step.templateKey.replace(/_/g, " ")}</Text>
              <Text style={{ color: "#d6d3d1" }}>{step.trigger} | offset {step.scheduledOffsetMinutes} minutes | {step.status}</Text>
            </View>
          ))}
        </View>
      </MobileCard>
    </MobileScreen>
  );
}
