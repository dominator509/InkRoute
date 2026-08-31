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
    expect(response.headers.get("Cache-Control")).toBe("no-store");
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
      responseProjection: { tenantIdEchoed: boolean; releaseRecordIdEchoed: boolean; commitShaEchoed: boolean; runtimeContextTenantIdEchoed: boolean; internalPersistenceIdsEchoed: boolean };
      release: { productionBlocked: boolean; responseProjection: { releaseCandidateIdEchoed: boolean; commitShaEchoed: boolean } };
      healthChecks: Array<{ id: string; status: string }>;
      publicFeatureSnapshot: Array<{ key: string; reason: string }>;
      boundary: string;
    };

    expect(response.status).toBe(200);
    expect(payload.tenantSlug).toBe("inkroute-demo");
    expect(payload.source).toBe("local-fallback");
    expect(payload.status).toBe("local-preview");
    expect(payload.responseProjection).toMatchObject({
      tenantIdEchoed: false,
      releaseRecordIdEchoed: false,
      commitShaEchoed: false,
      runtimeContextTenantIdEchoed: false,
      internalPersistenceIdsEchoed: false,
    });
    expect(payload.release).not.toHaveProperty("id");
    expect(payload.release).not.toHaveProperty("commitSha");
    expect(payload.release.responseProjection).toMatchObject({
      releaseCandidateIdEchoed: false,
      commitShaEchoed: false,
    });
    expect(payload.healthChecks.map((check) => check.id)).toEqual(["dependencies-installed", "production-gates", "rollback-plan"]);
    expect(payload.publicFeatureSnapshot.length).toBeGreaterThan(0);
    expect(payload.publicFeatureSnapshot.every((flag) => flag.reason === "local-fallback")).toBe(true);
    expect(payload.boundary).toContain("scoped fallback");
  });

  it("fail-closes production release health instead of returning local fallback release data", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    try {
      const response = await getReleaseHealth(new Request("https://local.test/api/public/inkroute-demo/release-health"), {
        params: Promise.resolve({ tenantSlug: "inkroute-demo" }),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        error: { code: string; gapIds: string[] };
        productionBoundary: { localReleaseHealthDisabled: boolean };
      };

      expect(response.status).toBe(503);
      expect(payload.ok).toBe(false);
      expect(payload.error.code).toBe("PROVIDER_RELEASE_HEALTH_NOT_CONFIGURED");
      expect(payload.error.gapIds).toContain("GAP-015");
      expect(payload.error.gapIds).toContain("GAP-090");
      expect(payload.productionBoundary.localReleaseHealthDisabled).toBe(true);
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it("fail-closes production release health when persisted release reads are unavailable", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    dbMocks.tenantFindUnique.mockResolvedValue({ id: "tenant_release_test" });

    try {
      const response = await getReleaseHealth(new Request("https://local.test/api/public/inkroute-demo/release-health"), {
        params: Promise.resolve({ tenantSlug: "inkroute-demo" }),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        error: { code: string; gapIds: string[] };
        productionBoundary: { localReleaseHealthFallbackDisabled: boolean };
      };

      expect(response.status).toBe(503);
      expect(payload.ok).toBe(false);
      expect(payload.error.code).toBe("PROVIDER_RELEASE_HEALTH_NOT_CONFIGURED");
      expect(JSON.stringify(payload)).toContain("local release-health fallback is disabled");
      expect(payload.error.gapIds).toContain("GAP-087");
      expect(payload.productionBoundary.localReleaseHealthFallbackDisabled).toBe(true);
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
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
      source: string;
      status: string;
      responseProjection: { tenantIdEchoed: boolean; releaseRecordIdEchoed: boolean; commitShaEchoed: boolean; runtimeContextTenantIdEchoed: boolean; internalPersistenceIdsEchoed: boolean };
      release: { version: string; channel: string; gates: Array<{ id: string; status: string }>; responseProjection: { releaseCandidateIdEchoed: boolean; commitShaEchoed: boolean } };
      releaseRecords: Array<{ version: string; channel: string; createdAt: string; responseProjection: { releaseRecordIdEchoed: boolean; commitShaEchoed: boolean } }>;
      publicFeatureSnapshot: Array<{ key: string; enabled: boolean; reason: string }>;
      decisions: Array<{ key: string; enabled: boolean; reason: string }>;
      boundary: string;
    };

    expect(response.status).toBe(200);
    expect(payload).not.toHaveProperty("tenantId");
    expect(payload.responseProjection).toMatchObject({
      tenantIdEchoed: false,
      releaseRecordIdEchoed: false,
      commitShaEchoed: false,
      runtimeContextTenantIdEchoed: false,
      internalPersistenceIdsEchoed: false,
    });
    expect(payload.source).toBe("database");
    expect(payload.status).toBe("authenticated-readiness-boundary");
    expect(payload.release).toMatchObject({
      version: "0.12.0-phase12",
      channel: "preview",
      responseProjection: {
        releaseCandidateIdEchoed: false,
        commitShaEchoed: false,
      },
    });
    expect(payload.release).not.toHaveProperty("id");
    expect(payload.release).not.toHaveProperty("commitSha");
    expect(payload.release.gates).toEqual(expect.arrayContaining([expect.objectContaining({ id: "database-persistence", status: "pass" })]));
    expect(payload.releaseRecords).toEqual([
      expect.objectContaining({
        version: "0.12.0-phase12",
        channel: "preview",
        createdAt: "2026-06-08T19:15:00.000Z",
        responseProjection: {
          releaseRecordIdEchoed: false,
          commitShaEchoed: false,
        },
      }),
    ]);
    expect(payload.releaseRecords[0]).not.toHaveProperty("id");
    expect(payload.releaseRecords[0]).not.toHaveProperty("commitSha");
    expect(payload.publicFeatureSnapshot).toEqual(expect.arrayContaining([expect.objectContaining({ key: "nomad_mode.enabled", enabled: true })]));
    expect(payload.decisions.length).toBeGreaterThan(0);
    expect(payload.boundary).toContain("tenant-scoped ReleaseRecord and FeatureFlag rows");
  });
});
