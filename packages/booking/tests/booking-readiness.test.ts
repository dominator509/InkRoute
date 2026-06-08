import { describe, expect, it } from "vitest";
import {
  calculateTattooReadinessScore,
  createBookingTransitionPlan,
  emptyBookingDraft,
  getAvailableBookingActions,
  getTravelBookingCta,
  transitionBookingStatus,
} from "../src/index";

describe("booking readiness", () => {
  it("flags an empty booking draft as not artist-ready", () => {
    const result = calculateTattooReadinessScore(emptyBookingDraft);

    expect(result.label).toBe("Needs essentials");
    expect(result.percentage).toBeLessThan(50);
    expect(result.checks.some((check) => check.id === "client" && !check.passed)).toBe(true);
  });

  it("scores a complete tattoo request as artist-ready", () => {
    const result = calculateTattooReadinessScore({
      ...emptyBookingDraft,
      preferredCitySlug: "seattle-wa",
      preferredDateWindow: "June 10-14",
      locationPreference: "Guest spot",
      style: "blackwork",
      placement: "forearm",
      sizeEstimate: "Palm-sized",
      budgetRange: "$500-$900",
      ideaSummary: "Blackwork botanical forearm piece with reference direction, negative space, and healed portfolio examples to avoid overly dense shading.",
      referenceImages: [{ localId: "ref-1", filename: "reference.jpg", mimeType: "image/jpeg", sizeBytes: 320000, uploadStatus: "local_only" }],
      clientName: "Avery Client",
      clientEmail: "avery@example.com",
      policyAccepted: true,
      ageAcknowledged: true,
      privacyAcknowledged: true,
      depositBoundaryAcknowledged: true,
    });

    expect(result.label).toBe("Artist-ready");
    expect(result.percentage).toBeGreaterThanOrEqual(90);
  });

  it("applies supported lifecycle transitions and blocks invalid transitions", () => {
    expect(transitionBookingStatus("draft", "submit")).toBe("submitted");
    expect(transitionBookingStatus("submitted", "accept")).toBe("accepted");
    expect(transitionBookingStatus("draft", "complete")).toBe("draft");
  });

  it("lists available lifecycle actions by status", () => {
    expect(getAvailableBookingActions("submitted").map((transition) => transition.action)).toEqual([
      "request_more_info",
      "accept",
      "decline",
    ]);
    expect(getAvailableBookingActions("archived")).toEqual([]);
  });

  it("keeps lifecycle audit metadata attached to transitions", () => {
    const depositTransition = getAvailableBookingActions("deposit_pending").find(
      (transition) => transition.action === "record_deposit_paid",
    );

    expect(depositTransition).toMatchObject({
      to: "deposit_paid",
      eventType: "deposit_paid",
      actor: "system",
      requiresAudit: true,
    });
  });

  it("plans booking status, state event, and audit writes as one atomic transition", () => {
    const plan = createBookingTransitionPlan({
      tenantId: "tenant_001",
      bookingRequestId: "booking_001",
      from: "submitted",
      action: "accept",
      actorId: "artist_001",
      actorType: "artist",
      occurredAt: "2026-06-08T12:00:00.000Z",
      reason: "Accepted after reviewing references.",
      idempotencyKey: "transition_001",
    });

    expect(plan).toMatchObject({
      status: "ready",
      canCommit: true,
      requiresAtomicTransaction: true,
      transition: {
        from: "submitted",
        to: "accepted",
        eventType: "accepted",
      },
    });
    expect(plan.writes.map((write) => write.model)).toEqual(["BookingRequest", "BookingStateEvent", "AuditLog"]);
    expect(plan.writes.every((write) => write.tenantId === "tenant_001")).toBe(true);
    expect(plan.writes.find((write) => write.model === "AuditLog")?.payload).toMatchObject({
      action: "booking.accept",
      entityType: "BookingRequest",
      entityId: "booking_001",
      idempotencyKey: "transition_001",
    });
  });

  it("refuses invalid or unauditable booking transition plans", () => {
    expect(
      createBookingTransitionPlan({
        tenantId: "tenant_001",
        bookingRequestId: "booking_001",
        from: "draft",
        action: "complete",
        actorId: "artist_001",
        occurredAt: "2026-06-08T12:00:00.000Z",
      }),
    ).toMatchObject({
      status: "invalid_transition",
      canCommit: false,
      writes: [],
    });

    expect(
      createBookingTransitionPlan({
        tenantId: "tenant_001",
        bookingRequestId: "booking_001",
        from: "submitted",
        action: "accept",
        occurredAt: "2026-06-08T12:00:00.000Z",
      }),
    ).toMatchObject({
      status: "missing_actor",
      canCommit: false,
      writes: [],
    });
  });

  it("returns travel booking calls to action for open, waitlist, and closed statuses", () => {
    expect(getTravelBookingCta("open")).toBe("Request this city");
    expect(getTravelBookingCta("waitlist")).toBe("Join the waitlist");
    expect(getTravelBookingCta("closed")).toBe("View travel notes");
  });
});
