import { Text, View } from "react-native";
import { BoundaryCard } from "../components/BoundaryCard";
import { MobileCard } from "../components/MobileCard";
import { MobilePill } from "../components/MobilePill";
import { MobileScreen } from "../components/MobileScreen";
import { mobileCrashCapturePreview } from "../lib/mobileCrash";
import { mobileApiFetch, type MobileApiResponseEnvelope, type MobileApiSession } from "../lib/mobileApiClient";
import { mobileUpdateRuntimePreview } from "../lib/mobileUpdates";
import {
  mobileBoundaries,
  mobileCrashAlertRoute,
  mobileCrashReportDraft,
  mobileHealthChecks,
  mobileEasOtaReadinessPlan,
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

export interface MobileReleaseHealthSummary {
  version: string;
  status: string;
  productionBlocked: boolean;
}

export function loadMobileReleaseHealth(
  session: MobileApiSession,
  requestId = `mobile-release-health:${session.tenantId}`,
): Promise<MobileApiResponseEnvelope<MobileReleaseHealthSummary>> {
  return mobileApiFetch<MobileReleaseHealthSummary>(session, {
    domain: "releases",
    method: "GET",
    path: "/api/mobile/release-health",
    requestId,
  });
}

export function SystemStatusScreen() {
  return (
    <MobileScreen
      eyebrow="Crash, release, and updates"
      title="Mobile runtime boundaries"
      summary="This screen makes mobile operational gaps visible inside the app so Expo, Sentry, EAS, and fallback crash-report work can be handed off safely."
    >

      <MobileCard title="Release candidate" eyebrow="Phase 12 contract">
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

      <MobileCard title="EAS OTA readiness" eyebrow={mobileEasOtaReadinessPlan.status}>
        <Text style={{ color: "#fafaf9", fontWeight: "900" }}>{mobileEasOtaReadinessPlan.productionReady ? "Production ready" : "Production blocked"}</Text>
        <Text style={{ color: "#d6d3d1" }}>{mobileEasOtaReadinessPlan.rollbackRequirement}</Text>
        {mobileEasOtaReadinessPlan.gates.slice(0, 4).map((gate) => (
          <View key={gate.id} style={{ borderTopWidth: 1, borderColor: "#44403c", paddingTop: 10, marginTop: 10, gap: 6 }}>
            <Text style={{ color: "#fafaf9", fontWeight: "900" }}>{gate.label}</Text>
            <Text style={{ color: "#d6d3d1" }}>{gate.evidence}</Text>
            <MobilePill label={gate.status} tone={gate.status === "pass" ? "good" : "warn"} />
          </View>
        ))}
      </MobileCard>

      <MobileCard title="OTA runtime contract" eyebrow="GAP-047" detail={mobileUpdateRuntimePreview.boundary}>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          <MobilePill label={mobileUpdateRuntimePreview.updatePlan.compatibility} tone={mobileUpdateRuntimePreview.updatePlan.compatibility === "safe" ? "good" : "warn"} />
          <MobilePill label={mobileUpdateRuntimePreview.readiness.status} tone="warn" />
          <MobilePill label={mobileUpdateRuntimePreview.rollbackContract.status} tone="warn" />
          <MobilePill label="device receipt pending" tone="danger" />
          <MobilePill label="rollback republish pending" tone="danger" />
        </View>
        <Text style={{ color: "#d6d3d1", marginTop: 8 }}>{mobileUpdateRuntimePreview.updatePlan.commandPreview}</Text>
        <Text style={{ color: "#a8a29e", marginTop: 6 }}>
          Adoption: {mobileUpdateRuntimePreview.adoptionEvent.updateId} · audit action: {mobileUpdateRuntimePreview.rollbackAudit.action}
        </Text>
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


      <MobileCard title="Security posture" eyebrow="Phase 13 controls">
        <Text style={{ color: "#fafaf9", fontSize: 34, fontWeight: "900" }}>{mobileSecuritySummary.blockers} blockers</Text>
        <Text style={{ color: "#d6d3d1" }}>{mobileSecuritySummary.total} controls tracked · {mobileSecuritySummary.localContracts} local runtime contracts · {mobileSecuritySummary.legal} legal-review required</Text>
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

      <MobileCard title="Crash report draft" eyebrow="Phase 11 contract">
        <Text style={{ color: "#fafaf9", fontWeight: "900" }}>{mobileCrashReportDraft.redactedMessage}</Text>
        <Text style={{ color: "#d6d3d1" }}>Fingerprint: {mobileCrashReportDraft.fingerprint}</Text>
        <Text style={{ color: "#d6d3d1" }}>Redaction: {mobileCrashReportDraft.redactionLevel}</Text>
        <MobilePill label={`${mobileCrashReportDraft.severity} · ${mobileCrashAlertRoute.channel}`} tone={mobileCrashReportDraft.alertRecommended ? "warn" : "neutral"} />
      </MobileCard>

      <MobileCard title="Crash capture contract" eyebrow="GAP-046" detail={mobileCrashCapturePreview.boundary}>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          <MobilePill label={mobileCrashCapturePreview.readiness.status} tone="warn" />
          <MobilePill label={mobileCrashCapturePreview.contract.localFallbackReady ? "fallback ready" : "fallback blocked"} tone={mobileCrashCapturePreview.contract.localFallbackReady ? "good" : "danger"} />
          <MobilePill label={`${mobileCrashCapturePreview.sentryPlan.requiredPackages.join(", ")} gated`} tone="warn" />
          <MobilePill label="forced crash proof pending" tone="danger" />
        </View>
        <Text style={{ color: "#d6d3d1", marginTop: 8 }}>{mobileCrashCapturePreview.report.redactedMessage}</Text>
        <Text style={{ color: "#a8a29e", marginTop: 6 }}>Redaction: {mobileCrashCapturePreview.report.redactionLevel} · fingerprint: {mobileCrashCapturePreview.report.fingerprint}</Text>
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
