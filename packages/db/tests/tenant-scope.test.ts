import { describe, expect, it } from "vitest";
import {
  assertTenantScopedData,
  assertTenantScopedWhere,
  tenantOwnedModelNames,
  withTenantData,
  withTenantWhere,
} from "../src/index";

describe("tenant scope helpers", () => {
  it("adds tenantId to query where clauses and rejects empty scopes", () => {
    const scoped = withTenantWhere({ tenantId: "tenant_a" }, { status: "active" });

    expect(scoped.where).toEqual({ status: "active", tenantId: "tenant_a" });
    expect(() => withTenantWhere({ tenantId: " " }, {})).toThrow("tenantId");
  });

  it("adds tenantId to mutation data and asserts expected tenant scope", () => {
    const scoped = withTenantData({ tenantId: "tenant_a", actorUserId: "user_1" }, { status: "open" });

    expect(scoped.data).toEqual({ status: "open", tenantId: "tenant_a" });
    expect(() => assertTenantScopedWhere(scoped, "tenant_b")).toThrow("tenantId scope");
    expect(() => assertTenantScopedData(scoped, "tenant_b")).toThrow("tenantId scope");
    expect(() => assertTenantScopedWhere(scoped, "tenant_a")).not.toThrow();
    expect(() => assertTenantScopedData(scoped, "tenant_a")).not.toThrow();
  });

  it("pins tenant-owned model names for future integration coverage", () => {
    expect(tenantOwnedModelNames).toEqual(
      expect.arrayContaining([
        "BookingRequest",
        "Payment",
        "FileAsset",
        "MessageThread",
        "Notification",
        "SeoCityPage",
        "ReleaseRecord",
        "AuditLog",
      ]),
    );
  });
});
