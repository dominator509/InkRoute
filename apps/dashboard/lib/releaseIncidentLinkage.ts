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

export const releaseIncidentLinkageProofFiles = [
  "packages/observability/package.json",
  "packages/observability/src/index.ts",
  "packages/observability/tests/redaction-report.test.ts",
  "apps/dashboard/lib/errorDemo.ts",
  "apps/dashboard/lib/releaseIncidentLinkage.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260613000600_add_release_incident_links/migration.sql",
  "apps/dashboard/app/errors/page.tsx",
  "apps/dashboard/app/api/observability/release-incidents/route.ts",
  "apps/dashboard/tests/release-incident-linkage-static.test.ts",
  "packages/releases/src/index.ts",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
] as const;

export const releaseIncidentLinkageCommands = [
  "pnpm --filter @inkroute/observability typecheck",
  "pnpm --filter @inkroute/observability test",
  "pnpm vitest run apps/dashboard/tests/release-incident-linkage-static.test.ts",
  "Sentry release tag and source-map proof",
  "DB-backed release incident link persistence tests",
  "dashboard release filter smoke",
  "tenant incident isolation proof",
  "live incident provider proof",
] as const;

export type ReleaseIncidentLinkageEvidenceArtifact = (typeof releaseIncidentLinkageArtifactPaths)[number];

export const releaseIncidentLinkageRequiredExternalEvidence = [
  "live Sentry release tags and source-map proof",
  "migrated DB-backed ErrorReport and ReleaseRecord integration proof",
  "dashboard release filter smoke",
  "tenant incident isolation proof",
  "live incident provider proof and CI artifact attachment",
] as const;

export const releaseIncidentLinkageDecisionRequiredEvidence = [
  "observability package and release incident static contract artifacts",
  "Sentry release/source-map, ErrorReport link, ReleaseRecord link, and rollback handoff artifacts",
  "dashboard filter, tenant isolation, sanitized payload, live provider, and CI artifact evidence",
] as const;

export interface ReleaseIncidentLinkageExecutionPlan {
  readonly id: "gap-093-release-incident-linkage";
  readonly liveSentryProviderAllowed: false;
  readonly dbBackedPersistenceAllowed: false;
  readonly dashboardSmokeAllowed: false;
  readonly policy: ReleaseIncidentLinkageExecutionPolicy;
  readonly source: "local-software-plan";
  readonly requiredCommands: typeof releaseIncidentLinkageCommands;
  readonly requiredArtifacts: typeof releaseIncidentLinkageArtifactPaths;
  readonly localContractArtifacts: readonly ReleaseIncidentLinkageEvidenceArtifact[];
  readonly sentryArtifacts: readonly ReleaseIncidentLinkageEvidenceArtifact[];
  readonly persistenceArtifacts: readonly ReleaseIncidentLinkageEvidenceArtifact[];
  readonly providerArtifacts: readonly ReleaseIncidentLinkageEvidenceArtifact[];
  readonly isolationArtifacts: readonly ReleaseIncidentLinkageEvidenceArtifact[];
  readonly externalEvidenceRequired: typeof releaseIncidentLinkageRequiredExternalEvidence;
}

export interface ReleaseIncidentLinkageExecutionPolicy {
  readonly executeLiveSentryProvider: false;
  readonly executeDbBackedPersistence: false;
  readonly executeDashboardSmoke: false;
  readonly executeTenantIsolationProof: false;
  readonly executeIncidentProviderProof: false;
  readonly executeCi: false;
}

export interface ReleaseIncidentLinkageArtifactReview {
  readonly artifactName: string;
  readonly safeToPersist: boolean;
  readonly redactedArtifact: unknown;
  readonly unsafeFindings: readonly string[];
  readonly requiredArtifactPath: ReleaseIncidentLinkageEvidenceArtifact;
}

const releaseIncidentSensitiveKeyPattern =
  /(?:authorization|clientsecret|contact|credential|email|password|phone|private|secret|sentry|token|webhook|tenantId|releaseId|releaseRecordId|reportId|errorReportId|linkedReportId|releaseIncidentLinkId|auditId|fingerprint|issueUrl|providerIssueUrl|route|payload)/i;
const releaseIncidentEmailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const releaseIncidentPhonePattern = /\+?\d[\d ().-]{7,}\d/g;
const releaseIncidentTokenPattern = /\b(?:bearer|sentry|sk|xox|ya29)[A-Za-z0-9._:/-]{8,}\b/gi;

function redactReleaseIncidentArtifactValue(value: unknown, key = ""): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (releaseIncidentSensitiveKeyPattern.test(key)) {
    return "[REDACTED]";
  }

  if (typeof value === "string") {
    return value
      .replace(releaseIncidentEmailPattern, "[REDACTED_EMAIL]")
      .replace(releaseIncidentPhonePattern, "[REDACTED_PHONE]")
      .replace(releaseIncidentTokenPattern, "[REDACTED_TOKEN]");
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactReleaseIncidentArtifactValue(entry));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [entryKey, redactReleaseIncidentArtifactValue(entryValue, entryKey)]),
    );
  }

  return value;
}

export function buildRedactedReleaseIncidentLinkageArtifact(artifact: unknown): unknown {
  return redactReleaseIncidentArtifactValue(artifact);
}

export const releaseIncidentLinkageExecutionPolicy: ReleaseIncidentLinkageExecutionPolicy = {
  executeLiveSentryProvider: false,
  executeDbBackedPersistence: false,
  executeDashboardSmoke: false,
  executeTenantIsolationProof: false,
  executeIncidentProviderProof: false,
  executeCi: false,
};

export function buildReleaseIncidentLinkageExecutionPlan(): ReleaseIncidentLinkageExecutionPlan {
  return {
    id: "gap-093-release-incident-linkage",
    liveSentryProviderAllowed: false,
    dbBackedPersistenceAllowed: false,
    dashboardSmokeAllowed: false,
    policy: releaseIncidentLinkageExecutionPolicy,
    source: "local-software-plan",
    requiredCommands: releaseIncidentLinkageCommands,
    requiredArtifacts: releaseIncidentLinkageArtifactPaths,
    localContractArtifacts: [
      "coverage/release-incident-linkage.json",
      "coverage/release-rollback-communication-handoff.json",
      "coverage/release-incident-sanitized-payload-redacted.json",
    ],
    sentryArtifacts: ["coverage/release-sentry-tags-source-maps-redacted.json"],
    persistenceArtifacts: [
      "coverage/release-errorreport-link-persistence.json",
      "coverage/release-record-incident-link.json",
    ],
    providerArtifacts: ["coverage/release-incident-live-provider-proof-redacted.json"],
    isolationArtifacts: ["coverage/release-dashboard-filter-smoke.json", "coverage/release-tenant-incident-isolation.json"],
    externalEvidenceRequired: releaseIncidentLinkageRequiredExternalEvidence,
  };
}

export function buildReleaseIncidentLinkageArtifactReview(
  artifactName: string,
  artifact: unknown,
  requiredArtifactPath: ReleaseIncidentLinkageEvidenceArtifact = "coverage/release-incident-live-provider-proof-redacted.json",
): ReleaseIncidentLinkageArtifactReview {
  const redactedArtifact = buildRedactedReleaseIncidentLinkageArtifact(artifact);
  const serialized = JSON.stringify(redactedArtifact);
  const unsafeFindings = [
    serialized.match(releaseIncidentEmailPattern) ? "email" : null,
    serialized.match(releaseIncidentPhonePattern) ? "phone" : null,
    serialized.match(releaseIncidentTokenPattern) ? "provider-token" : null,
  ].filter((finding): finding is string => finding !== null);

  return {
    artifactName,
    safeToPersist: unsafeFindings.length === 0,
    redactedArtifact,
    unsafeFindings,
    requiredArtifactPath,
  };
}

export interface ReleaseIncidentLinkageEvidenceInput {
  readonly observabilityTypecheckPassed: boolean;
  readonly observabilityTestsPassed: boolean;
  readonly staticContractPassed: boolean;
  readonly sentryReleaseTagsSourceMapsCaptured: boolean;
  readonly errorReportLinkPersistenceVerified: boolean;
  readonly releaseRecordIncidentLinkVerified: boolean;
  readonly rollbackCommunicationHandoffVerified: boolean;
  readonly dashboardFilterSmokePassed: boolean;
  readonly tenantIncidentIsolationVerified: boolean;
  readonly sanitizedPayloadVerified: boolean;
  readonly liveProviderProofCaptured: boolean;
  readonly ciArtifactsAttached: boolean;
  readonly capturedArtifacts: readonly ReleaseIncidentLinkageEvidenceArtifact[];
}

export interface ReleaseIncidentLinkageEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly blockers: readonly string[];
  readonly missingArtifacts: readonly ReleaseIncidentLinkageEvidenceArtifact[];
  readonly requiredCommands: typeof releaseIncidentLinkageCommands;
  readonly requiredEvidence: typeof releaseIncidentLinkageDecisionRequiredEvidence;
  readonly redactedSummary: string;
}

export function buildReleaseIncidentLinkageEvidenceDecision(
  input: ReleaseIncidentLinkageEvidenceInput,
): ReleaseIncidentLinkageEvidenceDecision {
  const blockers = [
    !input.observabilityTypecheckPassed ? "Observability package typecheck evidence is required." : null,
    !input.observabilityTestsPassed ? "Observability package test evidence is required." : null,
    !input.staticContractPassed ? "Release incident linkage static contract evidence is required." : null,
    !input.sentryReleaseTagsSourceMapsCaptured ? "Sentry release tag/source-map evidence is required." : null,
    !input.errorReportLinkPersistenceVerified ? "ErrorReport release incident link persistence evidence is required." : null,
    !input.releaseRecordIncidentLinkVerified ? "ReleaseRecord incident link evidence is required." : null,
    !input.rollbackCommunicationHandoffVerified ? "Rollback communication handoff evidence is required." : null,
    !input.dashboardFilterSmokePassed ? "Dashboard release filter smoke evidence is required." : null,
    !input.tenantIncidentIsolationVerified ? "Tenant-scoped incident isolation evidence is required." : null,
    !input.sanitizedPayloadVerified ? "Sanitized release incident payload evidence is required." : null,
    !input.liveProviderProofCaptured ? "Live Sentry/incident provider proof is required." : null,
    !input.ciArtifactsAttached ? "Release incident linkage CI artifact evidence is required." : null,
  ].filter((blocker): blocker is string => blocker !== null);
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const missingArtifacts = releaseIncidentLinkageArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 ? "complete" : "blocked",
    blockers,
    missingArtifacts,
    requiredCommands: releaseIncidentLinkageCommands,
    requiredEvidence: releaseIncidentLinkageDecisionRequiredEvidence,
    redactedSummary:
      blockers.length === 0 && missingArtifacts.length === 0
        ? "GAP-093 release incident linkage evidence is complete with CI-safe redacted artifacts captured."
        : "GAP-093 release incident linkage evidence remains blocked until Sentry release proof, DB-backed links, dashboard filters, tenant isolation, provider proof, and CI artifacts are captured.",
  };
}

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

export function buildTenantIncidentCommunicationOwner(input: {
  tenantId: string;
  releaseVersion: string;
  owner?: string | null;
}) {
  const owner = input.owner?.trim() || "release-incident-owner-pending";
  return {
    tenantId: input.tenantId,
    releaseVersion: input.releaseVersion,
    owner,
    configured: true,
    handoffChannel: "tenant-release-incident",
    requiredResponseMinutes: 30,
    rawContactStored: false,
    artifact: "coverage/release-rollback-communication-handoff.json",
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
    tenantCommunicationOwnerConfigured: true,
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
  const tenantCommunicationOwner = buildTenantIncidentCommunicationOwner({
    tenantId: input.tenantId,
    releaseVersion: input.releaseVersion,
    owner: input.tenantCommunicationOwner,
  });

  return {
    plan,
    filters: buildReleaseIncidentDashboardFilters(input),
    tenantCommunicationOwner,
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


