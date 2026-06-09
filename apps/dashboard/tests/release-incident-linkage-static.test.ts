import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildReleaseIncidentDashboardFilters,
  buildReleaseIncidentPersistenceMetadata,
  buildReleaseIncidentRuntimeContract,
  releaseIncidentLinkageArtifactPaths,
} from "../lib/releaseIncidentLinkage";

const root = join(__dirname, "..", "..");
const route = readFileSync(join(root, "apps/dashboard/app/api/observability/release-incidents/route.ts"), "utf8");
const page = readFileSync(join(root, "apps/dashboard/app/errors/page.tsx"), "utf8");
const workflow = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");
const tracker = readFileSync(join(root, "GAP_TRACKER.md"), "utf8");

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
  });

  it("wires dashboard API persistence for ErrorReport and ReleaseRecord incident links", () => {
    expect(route).toContain("release_incident:link");
    expect(route).toContain('entityType: "ReleaseIncidentLinkage"');
    expect(route).toContain("tx.errorReport.update");
    expect(route).toContain("releaseIncidentLinkage");
    expect(route).toContain("rollbackCommunicationHandoffPersisted: true");
    expect(route).toContain("tenantScopedIncidentIsolationVerified: true");
    expect(route).toContain("sanitizedPayloadsVerified: true");
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
    expect(releaseIncidentLinkageArtifactPaths).toContain("coverage/release-incident-live-provider-proof-redacted.json");
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
    expect(tracker).toContain("live Sentry/provider proof remains open");
  });
});
