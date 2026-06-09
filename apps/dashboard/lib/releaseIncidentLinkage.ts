import {
  buildObservabilityReportDraft,
  buildReleaseIncidentLinkagePlan,
  buildReleaseIncidentRuntimeReadinessPlan,
  type ObservabilityReportDraft,
} from "@inkroute/observability";

export const releaseIncidentLinkageArtifactPaths = [
  "coverage/release-incident-linkage.json",
  "coverage/release-sentry-tags-source-maps-redacted.json",
  "coverage/release-errorreport-link-persistence.json",
  "coverage/release-record-incident-link.json",
  "coverage/release-rollback-communication-handoff.json",
  "coverage/release-dashboard-filter-smoke.json",
  "coverage/release-tenant-incident-isolation.json",
  "coverage/release-incident-sanitized-payload-redacted.json",
  "coverage/release-incident-live-provider-proof-redacted.json",
  "test-results/release-incident-linkage",
] as const;

export function buildReleaseIncidentDashboardFilters(input: { releaseVersion: string; environment: "development" | "preview" | "production" | "test"; tenantId: string }) {
  return {
    release: input.releaseVersion,
    environment: input.environment,
    tenantId: input.tenantId,
    severities: ["critical", "high"] as const,
    cache: "no-store" as const,
  };
}

export function buildReleaseIncidentPersistenceMetadata(input: {
  releaseId: string;
  releaseVersion: string;
  tenantId: string;
  linkedReports: readonly { id: string; fingerprint: string; route: string }[];
  rollbackRequested: boolean;
}) {
  return {
    releaseId: input.releaseId,
    releaseVersion: input.releaseVersion,
    tenantId: input.tenantId,
    linkedReportIds: input.linkedReports.map((report) => report.id),
    linkedFingerprints: input.linkedReports.map((report) => report.fingerprint),
    linkedRoutes: input.linkedReports.map((report) => report.route),
    rollbackRequested: input.rollbackRequested,
    rawPayloadStored: false,
    artifactPaths: releaseIncidentLinkageArtifactPaths,
  };
}

export function buildReleaseIncidentRuntimeContract() {
  return buildReleaseIncidentRuntimeReadinessPlan({
    packageScripts: ["test", "typecheck"],
    observabilityTestsPassed: false,
    observabilityTypecheckPassed: false,
    sentryReleaseTagsConfigured: Boolean(process.env.SENTRY_RELEASE),
    sentrySourceMapsUploaded: false,
    liveSentryReleaseEvidenceCaptured: false,
    errorReportReleaseLinkPersistenceConfigured: true,
    releaseRecordIncidentLinkPersistenceConfigured: true,
    incidentProviderConfigured: false,
    providerIncidentCreationVerified: false,
    rollbackCommunicationHandoffPersisted: true,
    tenantCommunicationOwnerConfigured: Boolean(process.env.RELEASE_INCIDENT_OWNER),
    dashboardReleaseFiltersVerified: true,
    tenantScopedIncidentIsolationVerified: true,
    sanitizedPayloadsVerified: true,
    liveProviderEvidenceCaptured: false,
  });
}

export function buildReleaseIncidentPlanFromReports(input: {
  releaseId: string;
  releaseVersion: string;
  environment: "development" | "preview" | "production" | "test";
  tenantId: string;
  reports: readonly ObservabilityReportDraft[];
  rollbackRequested: boolean;
  tenantCommunicationOwner?: string;
}) {
  const plan = buildReleaseIncidentLinkagePlan({
    releaseId: input.releaseId,
    releaseVersion: input.releaseVersion,
    environment: input.environment,
    tenantId: input.tenantId,
    reports: input.reports,
    rollbackRequested: input.rollbackRequested,
    sentryReleaseConfigured: Boolean(process.env.SENTRY_RELEASE),
    incidentProviderConfigured: Boolean(process.env.INCIDENT_PROVIDER_WEBHOOK_URL),
    tenantCommunicationOwner: input.tenantCommunicationOwner,
  });

  return {
    plan,
    filters: buildReleaseIncidentDashboardFilters(input),
    persistence: buildReleaseIncidentPersistenceMetadata({
      releaseId: input.releaseId,
      releaseVersion: input.releaseVersion,
      tenantId: input.tenantId,
      linkedReports: plan.linkedReports,
      rollbackRequested: input.rollbackRequested,
    }),
    readiness: buildReleaseIncidentRuntimeContract(),
  };
}

export function buildFallbackReleaseIncidentReport(input: { tenantId: string; releaseVersion: string; environment: "development" | "preview" | "production" | "test" }) {
  return buildObservabilityReportDraft({
    tenantId: input.tenantId,
    source: "api",
    runtime: "server",
    environment: input.environment,
    message: `Release ${input.releaseVersion} incident linkage fallback report`,
    route: "/api/observability/release-incidents",
    release: input.releaseVersion,
    statusCode: 500,
    metadata: { release: input.releaseVersion, synthetic: true, rawPayloadStored: false },
    tags: { phase: "12", gap: "GAP-093" },
  });
}

export const releaseIncidentRuntimeContract = buildReleaseIncidentRuntimeContract();
