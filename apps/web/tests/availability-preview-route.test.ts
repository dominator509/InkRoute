import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { GET as getAvailabilityPreview } from "../app/api/public/[tenantSlug]/availability-preview/route";

describe("availability preview route", () => {
  it("pins DB-first public availability read support without claiming hold persistence", () => {
    const routeSource = readFileSync(join(process.cwd(), "apps/web/app/api/public/[tenantSlug]/availability-preview/route.ts"), "utf8");

    expect(routeSource).toContain("prismaRuntime.tenant.findUnique");
    expect(routeSource).toContain("availabilityWindows");
    expect(routeSource).toContain('status: "database_preview_read_only"');
    expect(routeSource).toContain("holdsPersisted: false");
    expect(routeSource).toContain("conflictWritesPersisted: false");
    expect(routeSource).toContain("providerSyncExecuted: false");
    expect(routeSource).toContain("staticPreviewDisabled: true");
  });

  it("returns 404 for unknown tenant availability previews", async () => {
    const response = await getAvailabilityPreview(new Request("https://local.test/api/public/unknown/availability-preview"), {
      params: Promise.resolve({ tenantSlug: "unknown" }),
    });

    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "NOT_FOUND" },
    });
  });

  it("returns static demo slots and conflict evidence with production gap markers", async () => {
    const response = await getAvailabilityPreview(new Request("https://local.test/api/public/inkroute-demo/availability-preview"), {
      params: Promise.resolve({ tenantSlug: "inkroute-demo" }),
    });
    const payload = (await response.json()) as {
      ok: boolean;
      status: string;
      gapIds: string[];
      data: {
        window: { id: string; timezone: string; status: string };
        slots: Array<{ id: string; status: string; conflictIds: string[] }>;
        conflicts: Array<{ severity: string; conflictingBlockId: string; reason: string }>;
      };
    };

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(payload.ok).toBe(true);
    expect(payload.status).toBe("static_preview_not_persistent");
    expect(payload.gapIds).toEqual(["GAP-009", "GAP-056", "GAP-057"]);
    expect(payload.data.window).toMatchObject({
      id: "public_preview_seattle_flash",
      timezone: "America/Los_Angeles",
      status: "open",
    });
    expect(payload.data.slots.length).toBeGreaterThan(0);
    expect(payload.data.slots.some((slot) => slot.status === "conflicted")).toBe(true);
    expect(payload.data.slots.some((slot) => slot.conflictIds.includes("appt_flash_noa"))).toBe(true);
    expect(payload.data.conflicts).toEqual([
      expect.objectContaining({
        severity: "blocking",
        conflictingBlockId: "appt_flash_noa",
        reason: "Appointment times overlap.",
      }),
    ]);
  });

  it("fail-closes production availability previews instead of returning static demo slots", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    try {
      const response = await getAvailabilityPreview(new Request("https://local.test/api/public/inkroute-demo/availability-preview"), {
        params: Promise.resolve({ tenantSlug: "inkroute-demo" }),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        error: { code: string };
        productionBoundary: { staticPreviewDisabled: boolean; gapIds: string[] };
      };

      expect(response.status).toBe(503);
      expect(response.headers.get("Cache-Control")).toBe("private, no-store");
      expect(payload.ok).toBe(false);
      expect(payload.error.code).toBe("PROVIDER_AVAILABILITY_NOT_CONFIGURED");
      expect(payload.productionBoundary.staticPreviewDisabled).toBe(true);
      expect(payload.productionBoundary.gapIds).toContain("GAP-009");
      expect(payload.productionBoundary.gapIds).toContain("GAP-056");
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });
});
