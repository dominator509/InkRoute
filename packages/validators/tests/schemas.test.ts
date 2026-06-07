import { describe, expect, it } from "vitest";
import {
  bookingRequestInputSchema,
  travelCityInputSchema,
  travelScheduleInputSchema,
  travelStopInputSchema,
  tattooStyleInputSchema,
  portfolioItemInputSchema,
  depositInputSchema,
  paymentRecordInputSchema,
  clientInputSchema,
  clientProfileInputSchema,
  seoCityPageInputSchema,
  seoStylePageInputSchema,
} from "../src/index";

describe("validator happy/error paths", () => {
  it("accepts a valid booking request", () => {
    const result = bookingRequestInputSchema.safeParse({
      artistId: "cuid_1",
      clientName: "Ari Test",
      clientEmail: "ari@example.com",
      preferredCity: "Seattle",
      preferredDate: "2026-09-10T00:00:00.000Z",
      style: "blackwork",
      placement: "forearm",
      sizeEstimate: "Palm-sized",
      ideaSummary: "A confident, full forearm blackwork piece with geometric balance and clean lines.",
      policyAccepted: true,
    });

    expect(result.success).toBe(true);
  });

  it("rejects booking request payloads with bad budget ordering", () => {
    const result = bookingRequestInputSchema.safeParse({
      artistId: "cuid_1",
      clientName: "Ari Test",
      clientEmail: "ari@example.com",
      preferredCity: "Seattle",
      style: "blackwork",
      placement: "forearm",
      sizeEstimate: "Palm-sized",
      budgetMin: 40000,
      budgetMax: 10000,
      ideaSummary: "A quick minimal concept requiring clean linework and negative space.",
      policyAccepted: true,
    });

    expect(result.success).toBe(false);
  });

  it("accepts and transforms travel payloads", () => {
    const city = travelCityInputSchema.safeParse({
      slug: "seattle-wa",
      city: "Seattle",
      region: "WA",
      country: "US",
      timezone: "America/Los_Angeles",
    });
    const schedule = travelScheduleInputSchema.safeParse({
      artistId: "cuid_1",
      travelCityId: "travel_city_1",
      studioId: "studio_1",
      title: "Summer guest spot",
      startsAt: "2026-09-10T10:00:00.000Z",
      endsAt: "2026-09-12T18:00:00.000Z",
      timezone: "America/Los_Angeles",
    });
    const stop = travelStopInputSchema.safeParse({
      artistId: "cuid_1",
      travelCityId: "travel_city_1",
      title: "Seattle weekend",
      startsAt: "2026-09-10T10:00:00.000Z",
      endsAt: "2026-09-12T18:00:00.000Z",
      timezone: "America/Los_Angeles",
    });

    expect(city.success).toBe(true);
    expect(schedule.success).toBe(true);
    expect(stop.success).toBe(true);
  });

  it("validates travel schedule invalid windows", () => {
    const result = travelScheduleInputSchema.safeParse({
      artistId: "cuid_1",
      travelCityId: "travel_city_1",
      title: "Backwards window",
      startsAt: "2026-09-12T18:00:00.000Z",
      endsAt: "2026-09-10T10:00:00.000Z",
      timezone: "America/Los_Angeles",
    });

    expect(result.success).toBe(false);
  });

  it("validates portfolio and tattoo style schemas", () => {
    expect(tattooStyleInputSchema.safeParse({ slug: "blackwork", label: "Blackwork", description: "Contrast-forward geometric forms." }).success).toBe(true);
    expect(
      portfolioItemInputSchema.safeParse({
        artistId: "cuid_1",
        title: "Blackwork sleeve",
        slug: "blackwork-sleeve",
        caption: "Contrast-forward blackwork sleeve with negative space.",
        styles: ["blackwork"],
        placement: "forearm",
        freshness: "fresh",
        altText: "Blackwork forearm piece with botanical details.",
        imageUrl: "https://example.test/image.jpg",
      }).success,
    ).toBe(true);
  });

  it("rejects invalid portfolio media links", () => {
    const invalid = portfolioItemInputSchema.safeParse({
      artistId: "cuid_1",
      title: "Test",
      slug: "test",
      caption: "Test caption with enough length to satisfy schema requirements.",
      styles: ["blackwork"],
      placement: "forearm",
      freshness: "fresh",
      altText: "desc",
      imageUrl: "",
    });

    expect(invalid.success).toBe(false);
  });

  it("validates payment and deposit inputs", () => {
    expect(
      depositInputSchema.safeParse({
        bookingRequestId: "booking_1",
        amountCents: 12000,
        currency: "usd",
        status: "pending",
      }).success,
    ).toBe(true);

    expect(paymentRecordInputSchema.safeParse({ bookingRequestId: "booking_1", amountCents: 6000, status: "failed", currency: "usd" }).success).toBe(true);
  });

  it("rejects invalid payment totals", () => {
    expect(depositInputSchema.safeParse({ bookingRequestId: "booking_1", amountCents: -10, currency: "usd" }).success).toBe(false);
  });

  it("validates people payloads and rejects empty client data", () => {
    expect(clientInputSchema.safeParse({ email: "client@example.com", preferredName: "Ari" }).success).toBe(true);
    expect(clientProfileInputSchema.safeParse({ clientId: "client_1", preferredContactMethod: "email" }).success).toBe(true);
    expect(clientInputSchema.safeParse({ email: "not-an-email", preferredName: "" }).success).toBe(false);
  });

  it("validates SEO pages and fails malformed paths", () => {
    const city = seoCityPageInputSchema.safeParse({
      slug: "seattle-wa",
      city: "Seattle",
      region: "WA",
      country: "US",
      title: "Seattle guest week",
      metaDescription: "Booking Seattle guest spot for tattoo sessions.",
      canonicalPath: "/cities/seattle-wa",
    });

    const malformed = seoStylePageInputSchema.safeParse({
      slug: "blackwork",
      styleName: "blackwork",
      title: "Blackwork",
      metaDescription: "Tattoo style details",
      canonicalPath: "styles/blackwork",
      status: "draft" as any,
    });

    expect(city.success).toBe(true);
    expect(malformed.success).toBe(false);
  });
});
