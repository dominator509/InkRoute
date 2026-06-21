import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildRedactedReleaseIncidentLinkageArtifact,
  buildReleaseIncidentDashboardFilters,
  buildReleaseIncidentLinkageArtifactReview,
  buildReleaseIncidentLinkageEvidenceDecision,
  buildReleaseIncidentLinkageExecutionPlan,
  buildReleaseIncidentPersistenceMetadata,
  buildReleaseIncidentRuntimeContract,
  buildTenantIncidentCommunicationOwner,
  releaseIncidentLinkageArtifactPaths,
  releaseIncidentLinkageCommands,
  releaseIncidentLinkageDecisionRequiredEvidence,
  releaseIncidentLinkageExecutionPolicy,
  releaseIncidentLinkageProofFiles,
  releaseIncidentLinkageRequiredExternalEvidence,
} from "../lib/releaseIncidentLinkage";

const root = join(__dirname, "..", "..");
const route = readFileSync(join(root, "apps/dashboard/app/api/observability/release-incidents/route.ts"), "utf8");
const page = readFileSync(join(root, "apps/dashboard/app/errors/page.tsx"), "utf8");
const workflow = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");
const tracker = readFileSync(join(root, "GAP_TRACKER.md"), "utf8");
const prismaSchema = readFileSync(join(root, "packages/db/prisma/schema.prisma"), "utf8");
const releaseIncidentLinkMigration = readFileSync(
  join(root, "packages/db/prisma/migrations/20260613000600_add_release_incident_links/migration.sql"),
  "utf8",
);

describe("release incident linkage runtime contract", () => {
  it("builds dashboard filters and persistence metadata for tenant-scoped release incidents", () => {
    expect(buildReleaseIncidentDashboardFilters({ releaseVersion: "1.2.3", environment: "production", tenantId: "tenant_1" })).toMatchObject({
      release: "1.2.3",
      environment: "production",
      tenantId: "tenant_1",
      cache: "no-store",
    });
    expect(buildReleaseIncidentPersistenceMetadata({ releaseId: "rel_1", releaseVersion: "1.2.3", tenantId: "tenant_1", linkedReports: [{ id: "err_1", fingerprint: "fp_1", route: "/api" }], rollbackRequested: true })).toMatchObject({
      releaseId: "rel_1",
      linkedReportIds: ["err_1"],
      rawPayloadStored: false,
    });
    expect(buildTenantIncidentCommunicationOwner({ tenantId: "tenant_1", releaseVersion: "1.2.3", owner: "ops-owner" })).toMatchObject({
      owner: "ops-owner",
      configured: true,
      rawContactStored: false,
      artifact: "coverage/release-rollback-communication-handoff.json",
    });
  });

  it("wires dashboard API persistence for ErrorReport and ReleaseRecord incident links", () => {
    expect(route).toContain("release_incident:link");
    expect(route).toContain('entityType: "ReleaseIncidentLinkage"');
    expect(route).toContain("tx.releaseRecord.findFirst");
    expect(route).toContain("tx.releaseIncidentLink.upsert");
    expect(route).toContain("releaseIncidentLinkIds");
    expect(route).toContain("tx.errorReport.update");
    expect(route).toContain("...report.redactedMetadata");
    expect(route).toContain("releaseIncidentLinkage");
    expect(route).toContain("tenantCommunicationOwner");
    expect(route).toContain("rollbackCommunicationHandoffPersisted: true");
    expect(route).toContain("tenantScopedIncidentIsolationVerified: true");
    expect(route).toContain("sanitizedPayloadsVerified: true");
    expect(route).toContain("PROVIDER_RELEASE_INCIDENT_PERSISTENCE_NOT_CONFIGURED");
    expect(route).toContain("localReleaseIncidentFallbackDisabled");
    expect(route).toContain('result.linkage.readiness.status !== "ready"');
    expect(route).toContain("RELEASE_INCIDENT_PROVIDER_EVIDENCE_NOT_CONFIGURED");
    expect(route).toContain("liveReleaseIncidentProviderEvidenceRequired");
    expect(route).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(route).toContain("headers: noStoreHeaders");
    expect(route).not.toContain('headers: { "Cache-Control": "no-store" }');
  });

  it("pins the ReleaseIncidentLink durable schema and migration", () => {
    expect(prismaSchema).toContain("model ReleaseIncidentLink");
    expect(prismaSchema).toContain("releaseRecordId                 String?");
    expect(prismaSchema).toContain("errorReportId                   String");
    expect(prismaSchema).toContain("rollbackCommunicationHandoffPersisted Boolean");
    expect(prismaSchema).toContain("tenantScopedIncidentIsolationVerified Boolean");
    expect(prismaSchema).toContain("liveProviderEvidenceCaptured    Boolean");
    expect(prismaSchema).toContain("releaseIncidentLinks ReleaseIncidentLink[]");
    expect(releaseIncidentLinkMigration).toContain('CREATE TABLE "ReleaseIncidentLink"');
    expect(releaseIncidentLinkMigration).toContain('"ReleaseIncidentLink_tenantId_releaseId_errorReportId_key"');
    expect(releaseIncidentLinkMigration).toContain('FOREIGN KEY ("releaseRecordId") REFERENCES "ReleaseRecord"("id") ON DELETE SET NULL');
    expect(releaseIncidentLinkMigration).toContain('FOREIGN KEY ("errorReportId") REFERENCES "ErrorReport"("id") ON DELETE CASCADE');
  });

  it("keeps provider incidents and live Sentry proof explicitly gated", () => {
    const contract = buildReleaseIncidentRuntimeContract();

    expect(contract.status).toBe("blocked");
    expect(contract.blockers).toEqual(
      expect.arrayContaining([
        "Sentry source maps and debug symbols must be uploaded for release correlation.",
        "Tenant incident workflow provider must be configured.",
        "Provider incident creation must be verified with sanitized release/report payloads.",
        "Live incident/provider evidence must be captured before closing GAP-093.",
      ]),
    );
    expect(contract.blockers).not.toContain("Tenant communication owner must be configured for release incident workflows.");
    expect(releaseIncidentLinkageArtifactPaths).toContain("coverage/release-incident-live-provider-proof-redacted.json");
  });

  it("builds a local execution plan without live Sentry/provider, DB-backed persistence, or dashboard smoke execution", () => {
    const plan = buildReleaseIncidentLinkageExecutionPlan();

    expect(plan.id).toBe("gap-093-release-incident-linkage");
    expect(plan.liveSentryProviderAllowed).toBe(false);
    expect(plan.dbBackedPersistenceAllowed).toBe(false);
    expect(plan.dashboardSmokeAllowed).toBe(false);
    expect(plan.policy).toBe(releaseIncidentLinkageExecutionPolicy);
    expect(plan.policy).toEqual({
      executeLiveSentryProvider: false,
      executeDbBackedPersistence: false,
      executeDashboardSmoke: false,
      executeTenantIsolationProof: false,
      executeIncidentProviderProof: false,
      executeCi: false,
    });
    expect(plan.requiredCommands).toBe(releaseIncidentLinkageCommands);
    expect(plan.requiredArtifacts).toBe(releaseIncidentLinkageArtifactPaths);
    expect(plan.localContractArtifacts).toEqual(
      expect.arrayContaining(["coverage/release-incident-linkage.json", "coverage/release-incident-sanitized-payload-redacted.json"]),
    );
    expect(plan.sentryArtifacts).toEqual(["coverage/release-sentry-tags-source-maps-redacted.json"]);
    expect(plan.persistenceArtifacts).toEqual(
      expect.arrayContaining(["coverage/release-errorreport-link-persistence.json", "coverage/release-record-incident-link.json"]),
    );
    expect(plan.providerArtifacts).toEqual(["coverage/release-incident-live-provider-proof-redacted.json"]);
    expect(plan.isolationArtifacts).toEqual(["coverage/release-dashboard-filter-smoke.json", "coverage/release-tenant-incident-isolation.json"]);
    expect(plan.externalEvidenceRequired).toBe(releaseIncidentLinkageRequiredExternalEvidence);
    expect(plan.externalEvidenceRequired).toEqual([
      "live Sentry release tags and source-map proof",
      "migrated DB-backed ErrorReport and ReleaseRecord integration proof",
      "dashboard release filter smoke",
      "tenant incident isolation proof",
      "live incident provider proof and CI artifact attachment",
    ]);
  });

  it("redacts release incident linkage artifacts before persistence", () => {
    const rawArtifact = {
      sentry: {
        authorization: "Bearer sentry-release-token",
        release: "1.2.3",
      },
      incidentProvider: {
        webhook: "https://incident.example/hooks/secret",
        contactEmail: "ops@example.com",
        contactPhone: "+1 555 010 6666",
      },
      payload: {
        releaseId: "rel_1",
        rollbackRequested: true,
      },
    };

    const redacted = buildRedactedReleaseIncidentLinkageArtifact(rawArtifact);
    const review = buildReleaseIncidentLinkageArtifactReview("release-incident-live-provider-proof", rawArtifact);
    const serialized = JSON.stringify(review.redactedArtifact);

    expect(JSON.stringify(redacted)).not.toContain("sentry-release-token");
    expect(serialized).not.toContain("ops@example.com");
    expect(serialized).not.toContain("+1 555 010 6666");
    expect(serialized).not.toContain("incident.example/hooks/secret");
    expect(serialized).toContain("rollbackRequested");
    expect(review.safeToPersist).toBe(true);
    expect(review.unsafeFindings).toEqual([]);
    expect(review.requiredArtifactPath).toBe("coverage/release-incident-live-provider-proof-redacted.json");
  });

  it("pins current release incident linkage proof files for GAP-093", () => {
    expect(releaseIncidentLinkageProofFiles).toEqual(
      expect.arrayContaining([
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
      ]),
    );
    for (const file of releaseIncidentLinkageProofFiles) {
      expect(readFileSync(join(root, file), "utf8").length).toBeGreaterThan(0);
    }
  });

  it("classifies GAP-093 release incident evidence as blocked until Sentry, DB, provider, and isolation proof is captured", () => {
    const blocked = buildReleaseIncidentLinkageEvidenceDecision({
      observabilityTypecheckPassed: true,
      observabilityTestsPassed: true,
      staticContractPassed: true,
      sentryReleaseTagsSourceMapsCaptured: false,
      errorReportLinkPersistenceVerified: false,
      releaseRecordIncidentLinkVerified: false,
      rollbackCommunicationHandoffVerified: true,
      dashboardFilterSmokePassed: false,
      tenantIncidentIsolationVerified: false,
      sanitizedPayloadVerified: true,
      liveProviderProofCaptured: false,
      ciArtifactsAttached: false,
      capturedArtifacts: ["coverage/release-incident-linkage.json"],
    });

    expect(blocked.status).toBe("blocked");
    expect(blocked.blockers).toEqual(
      expect.arrayContaining([
        "Sentry release tag/source-map evidence is required.",
        "ErrorReport release incident link persistence evidence is required.",
        "ReleaseRecord incident link evidence is required.",
        "Tenant-scoped incident isolation evidence is required.",
        "Live Sentry/incident provider proof is required.",
      ]),
    );
    expect(blocked.missingArtifacts).toContain("coverage/release-sentry-tags-source-maps-redacted.json");
    expect(blocked.requiredCommands).toBe(releaseIncidentLinkageCommands);
    expect(blocked.requiredEvidence).toBe(releaseIncidentLinkageDecisionRequiredEvidence);

    const complete = buildReleaseIncidentLinkageEvidenceDecision({
      observabilityTypecheckPassed: true,
      observabilityTestsPassed: true,
      staticContractPassed: true,
      sentryReleaseTagsSourceMapsCaptured: true,
      errorReportLinkPersistenceVerified: true,
      releaseRecordIncidentLinkVerified: true,
      rollbackCommunicationHandoffVerified: true,
      dashboardFilterSmokePassed: true,
      tenantIncidentIsolationVerified: true,
      sanitizedPayloadVerified: true,
      liveProviderProofCaptured: true,
      ciArtifactsAttached: true,
      capturedArtifacts: releaseIncidentLinkageArtifactPaths,
    });

    expect(complete.status).toBe("complete");
    expect(complete.blockers).toEqual([]);
    expect(complete.missingArtifacts).toEqual([]);
    expect(complete.requiredEvidence).toBe(releaseIncidentLinkageDecisionRequiredEvidence);
    expect(complete.redactedSummary).toContain("CI-safe redacted artifacts captured");
  });

  it("surfaces release incident linkage in dashboard triage without claiming provider execution", () => {
    expect(page).toContain("Release incident linkage");
    expect(page).toContain("Provider actions remain blocked until Sentry release tags and incident workflow credentials are configured");
  });

  it("is wired into CI and GAP-093 tracker evidence", () => {
    expect(workflow).toContain("Run Phase 12 release incident linkage contracts");
    expect(workflow).toContain("apps/dashboard/tests/release-incident-linkage-static.test.ts");
    expect(workflow).toContain("release-incident-linkage-artifacts");
    expect(tracker).toContain("GAP-093");
    expect(tracker).toContain("apps/dashboard/lib/releaseIncidentLinkage.ts");
    expect(tracker).toContain("Release incident linkage evidence classifier wired and live-provider gated");
    expect(tracker).toContain("releaseIncidentLinkageDecisionRequiredEvidence");
    expect(tracker).toContain("live Sentry/provider proof");
  });
});
