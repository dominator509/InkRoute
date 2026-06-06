import { Text, View } from "react-native";
import { BoundaryCard } from "../components/BoundaryCard";
import { MobileCard } from "../components/MobileCard";
import { MobilePill } from "../components/MobilePill";
import { MobileScreen } from "../components/MobileScreen";
import {
  mobileBoundaries,
  mobileCrashAlertRoute,
  mobileCrashReportDraft,
  mobileHealthChecks,
  mobileFeatureFlagDecisions,
  mobileObservabilityBoundaries,
  mobileOtaUpdatePlan,
  mobileReleaseCandidate,
  mobileReleaseHealthChecks,
  mobileSentryChecklist,
  mobileSecuritySummary,
  mobileTenantIsolationFixtures,
  mobilePrivacyDraft,
  mobileUploadValidationPreview,
} from "../lib/mobileDemo";

export function SystemStatusScreen() {
  return (
    <MobileScreen
      eyebrow="Crash, release, and updates"
      title="Mobile runtime boundaries"
      summary="This screen makes mobile operational gaps visible inside the app scaffold so Expo, Sentry, EAS, and fallback crash-report work can be handed off safely."
    >

      <MobileCard title="Release candidate" eyebrow="Phase 12 scaffold">
        <Text style={{ color: "#fafaf9", fontWeight: "900" }}>{mobileReleaseCandidate.version}</Text>
        <Text style={{ color: "#d6d3d1" }}>{mobileReleaseCandidate.summary}</Text>
        <Text style={{ color: "#a8a29e", marginTop: 6 }}>Commit: {mobileReleaseCandidate.commitSha}</Text>
        <MobilePill label={`${mobileReleaseCandidate.channel} · ${mobileReleaseCandidate.status}`} tone={mobileReleaseCandidate.productionBlocked ? "warn" : "good"} />
      </MobileCard>

      <MobileCard title="OTA update plan" eyebrow="EAS-gated">
        <Text style={{ color: "#fafaf9", fontWeight: "900" }}>{mobileOtaUpdatePlan.compatibility}</Text>
        <Text style={{ color: "#d6d3d1" }}>{mobileOtaUpdatePlan.commandPreview}</Text>
        <Text style={{ color: "#a8a29e", marginTop: 6 }}>{mobileOtaUpdatePlan.rollbackPlan}</Text>
        <MobilePill label={`${mobileOtaUpdatePlan.channel} channel`} tone={mobileOtaUpdatePlan.compatibility === "safe" ? "good" : "warn"} />
      </MobileCard>

      <MobileCard title="Release health checks" eyebrow="Runtime-gated">
        {mobileReleaseHealthChecks.map((check) => (
          <View key={check.id} style={{ borderTopWidth: 1, borderColor: "#44403c", paddingTop: 10, marginTop: 10, gap: 6 }}>
            <Text style={{ color: "#fafaf9", fontWeight: "900" }}>{check.label}</Text>
            <Text style={{ color: "#d6d3d1" }}>{check.detail}</Text>
            <MobilePill label={check.status} tone={check.status === "pass" ? "good" : "warn"} />
          </View>
        ))}
      </MobileCard>

      <MobileCard title="Feature flag snapshot" eyebrow="Read-only preview">
        {mobileFeatureFlagDecisions.slice(0, 4).map((flag) => (
          <View key={flag.key} style={{ borderTopWidth: 1, borderColor: "#44403c", paddingTop: 10, marginTop: 10, gap: 6 }}>
            <Text style={{ color: "#fafaf9", fontWeight: "900" }}>{flag.key}</Text>
            <Text style={{ color: "#d6d3d1" }}>{flag.reason}</Text>
            <MobilePill label={flag.enabled ? "enabled" : "disabled"} tone={flag.enabled ? "good" : "neutral"} />
          </View>
        ))}
      </MobileCard>


      <MobileCard title="Security posture" eyebrow="Phase 13 scaffold">
        <Text style={{ color: "#fafaf9", fontSize: 34, fontWeight: "900" }}>{mobileSecuritySummary.blockers} blockers</Text>
        <Text style={{ color: "#d6d3d1" }}>{mobileSecuritySummary.total} controls tracked · {mobileSecuritySummary.scaffolded} scaffolded · {mobileSecuritySummary.legal} legal-review required</Text>
        <MobilePill label={mobileSecuritySummary.productionReady ? "production ready" : "not production ready"} tone={mobileSecuritySummary.productionReady ? "good" : "danger"} />
      </MobileCard>

      <MobileCard title="Privacy and upload preview" eyebrow="Not persisted">
        <Text style={{ color: "#fafaf9", fontWeight: "900" }}>{mobilePrivacyDraft.type} request · {mobilePrivacyDraft.status}</Text>
        <Text style={{ color: "#d6d3d1" }}>{mobilePrivacyDraft.deadlinePolicy}</Text>
        <Text style={{ color: "#d6d3d1", marginTop: 8 }}>Upload accepted preview: {mobileUploadValidationPreview.accepted ? "yes" : "no"} · {mobileUploadValidationPreview.storageVisibility}</Text>
      </MobileCard>

      <MobileCard title="Tenant isolation tests" eyebrow="Fixture preview">
        {mobileTenantIsolationFixtures.slice(0, 3).map((fixture) => (
          <View key={fixture.id} style={{ borderTopWidth: 1, borderColor: "#44403c", paddingTop: 10, marginTop: 10, gap: 6 }}>
            <Text style={{ color: "#fafaf9", fontWeight: "900" }}>{fixture.description}</Text>
            <Text style={{ color: "#d6d3d1" }}>{fixture.reason}</Text>
            <MobilePill label={fixture.expectedDecision} tone={fixture.expectedDecision === "allow" ? "good" : "danger"} />
          </View>
        ))}
      </MobileCard>

      <MobileCard title="Health checks" eyebrow="Runtime-gated">
        {mobileHealthChecks.map((check) => (
          <View key={check.id} style={{ borderTopWidth: 1, borderColor: "#44403c", paddingTop: 10, marginTop: 10, gap: 6 }}>
            <Text style={{ color: "#fafaf9", fontWeight: "900" }}>{check.label}</Text>
            <Text style={{ color: "#d6d3d1" }}>{check.detail}</Text>
            <MobilePill label={check.state} tone={check.state === "healthy-demo" ? "good" : "warn"} />
          </View>
        ))}
      </MobileCard>

      <MobileCard title="Crash report draft" eyebrow="Phase 11 scaffold">
        <Text style={{ color: "#fafaf9", fontWeight: "900" }}>{mobileCrashReportDraft.redactedMessage}</Text>
        <Text style={{ color: "#d6d3d1" }}>Fingerprint: {mobileCrashReportDraft.fingerprint}</Text>
        <Text style={{ color: "#d6d3d1" }}>Redaction: {mobileCrashReportDraft.redactionLevel}</Text>
        <MobilePill label={`${mobileCrashReportDraft.severity} · ${mobileCrashAlertRoute.channel}`} tone={mobileCrashReportDraft.alertRecommended ? "warn" : "neutral"} />
      </MobileCard>

      <MobileCard title="Sentry / Expo checklist" eyebrow="Credential-gated">
        {mobileSentryChecklist.slice(0, 4).map((item) => (
          <Text key={item} style={{ color: "#d6d3d1", marginTop: 8 }}>• {item}</Text>
        ))}
      </MobileCard>

      {mobileObservabilityBoundaries.map((boundary) => (
        <MobileCard key={boundary.id} title={boundary.id} eyebrow={boundary.status}>
          <Text style={{ color: "#d6d3d1" }}>{boundary.riskNote}</Text>
          <Text style={{ color: "#a8a29e", marginTop: 8 }}>Required env: {boundary.requiredEnv.join(", ") || "none"}</Text>
          <MobilePill label={boundary.blocksProduction ? "blocks production" : "optional"} tone={boundary.blocksProduction ? "warn" : "neutral"} />
        </MobileCard>
      ))}

      {mobileBoundaries.map((boundary) => <BoundaryCard key={boundary.id} boundary={boundary} />)}
    </MobileScreen>
  );
}
