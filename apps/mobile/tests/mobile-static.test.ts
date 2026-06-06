import { describe, expect, it } from "vitest";
import { mobileScreenRegistry, phase6MobileBoundaries } from "@inkroute/mobile-support";

describe("mobile app scaffold registry", () => {
  it("registers core artist workflow screens", () => {
    const ids = mobileScreenRegistry.map((screen) => screen.id);

    expect(ids).toEqual(expect.arrayContaining(["auth", "home", "bookings", "appointments", "clients", "travel", "portfolio", "notifications", "offline", "system"]));
  });

  it("keeps mobile integrations explicitly gated", () => {
    expect(phase6MobileBoundaries.some((boundary) => boundary.status === "credential-gated" || boundary.status === "deployment-gated" || boundary.status === "externally-dependent")).toBe(true);
  });
});
