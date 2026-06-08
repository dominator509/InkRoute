import { describe, expect, it, vi, beforeEach } from "vitest";

const dbMocks = vi.hoisted(() => ({
  tenantFindUnique: vi.fn(),
  releaseRecordFindMany: vi.fn(),
  featureFlagFindMany: vi.fn(),
}));

vi.mock("@inkroute/db", () => ({
  prisma: {
    tenant: { findUnique: dbMocks.tenantFindUnique },
    releaseRecord: { findMany: dbMocks.releaseRecordFindMany },
    featureFlag: { findMany: dbMocks.featureFlagFindMany },
  },
}));

import { GET as getReleaseHealth } from "../app/api/public/[tenantSlug]/release-health/route";

beforeEach(() => {
  dbMocks.tenantFindUnique.mockReset();
  dbMocks.releaseRecordFindMany.mockReset();
  dbMocks.featureFlagFindMany.mockReset();
  dbMocks.tenantFindUnique.mockRejectedValue(new Error("database unavailable in release route test"));
  dbMocks.releaseRecordFindMany.mockRejectedValue(new Error("database unavailable in release route test"));
  dbMocks.featureFlagFindMany.mockRejectedValue(new Error("database unavailable in release route test"));
});

describe("release health route", () => {
  it("rejects release-health requests for unknown tenant slugs", async () => {
    const response = await getReleaseHealth(new Request("https://local.test/api/public/unknown/release-health"), {
      params: Promise.resolve({ tenantSlug: "unknown" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "TENANT_NOT_FOUND" },
    });
  });

  it("returns scoped fallback release health when the database is unavailable", async () => {
    const response = await getReleaseHealth(new Request("https://local.test/api/public/inkroute-demo/release-health"), {
      params: Promise.resolve({ tenantSlug: "inkroute-demo" }),
    });
    const payload = (await response.json()) as {
      tenantSlug: string;
      source: string;
      status: string;
      release: { id: string; productionBlocked: boolean };
      healthChecks: Array<{ id: string; status: string }>;
      publicFeatureSnapshot: Array<{ key: string; reason: string }>;
      boundary: string;
    };

    expect(response.status).toBe(200);
    expect(payload.tenantSlug).toBe("inkroute-demo");
    expect(payload.source).toBe("local-fallback");
    expect(payload.status).toBe("scaffolded");
    expect(payload.release.id).toContain("rel_");
    expect(payload.healthChecks.map((check) => check.id)).toEqual(["dependencies-installed", "production-gates", "rollback-plan"]);
    expect(payload.publicFeatureSnapshot.length).toBeGreaterThan(0);
    expect(payload.publicFeatureSnapshot.every((flag) => flag.reason === "local-fallback")).toBe(true);
    expect(payload.boundary).toContain("scoped fallback");
  });

  it("returns database-backed release records and feature decisions for known tenants", async () => {
    dbMocks.tenantFindUnique.mockResolvedValue({ id: "tenant_release_test" });
    dbMocks.releaseRecordFindMany.mockResolvedValue([
      {
        id: "release_db_1",
        version: "0.12.0-phase12",
        channel: "preview",
        commitSha: "abc123release",
        notes: "Release runtime smoke test\nFeature flag persistence",
        createdAt: new Date("2026-06-08T19:15:00.000Z"),
      },
    ]);
    dbMocks.featureFlagFindMany.mockResolvedValue([
      {
        key: "nomad_mode.enabled",
        description: "Enable nomad mode",
        scope: "tenant",
        enabled: true,
        rules: { tenantAllowlist: ["tenant_release_test"] },
        createdAt: new Date("2026-06-08T19:16:00.000Z"),
      },
    ]);

    const response = await getReleaseHealth(new Request("https://local.test/api/public/inkroute-demo/release-health"), {
      params: Promise.resolve({ tenantSlug: "inkroute-demo" }),
    });
    const payload = (await response.json()) as {
      tenantId: string;
      source: string;
      status: string;
      release: { version: string; channel: string; commitSha: string; gates: Array<{ id: string; status: string }> };
      releaseRecords: Array<{ id: string; version: string; channel: string; createdAt: string }>;
      publicFeatureSnapshot: Array<{ key: string; enabled: boolean; reason: string }>;
      decisions: Array<{ key: string; enabled: boolean; reason: string }>;
      boundary: string;
    };

    expect(response.status).toBe(200);
    expect(payload.tenantId).toBe("tenant_release_test");
    expect(payload.source).toBe("database");
    expect(payload.status).toBe("authenticated-readiness-boundary");
    expect(payload.release).toMatchObject({
      version: "0.12.0-phase12",
      channel: "preview",
      commitSha: "abc123release",
    });
    expect(payload.release.gates).toEqual(expect.arrayContaining([expect.objectContaining({ id: "database-persistence", status: "pass" })]));
    expect(payload.releaseRecords).toEqual([
      expect.objectContaining({
        id: "release_db_1",
        version: "0.12.0-phase12",
        channel: "preview",
        createdAt: "2026-06-08T19:15:00.000Z",
      }),
    ]);
    expect(payload.publicFeatureSnapshot).toEqual(expect.arrayContaining([expect.objectContaining({ key: "nomad_mode.enabled", enabled: true })]));
    expect(payload.decisions.length).toBeGreaterThan(0);
    expect(payload.boundary).toContain("tenant-scoped ReleaseRecord and FeatureFlag rows");
  });
});
