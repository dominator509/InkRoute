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
  consentFormInputSchema,
  consentSignatureInputSchema,
  medicalSafetyAcknowledgmentInputSchema,
  seoCityPageInputSchema,
  seoStylePageInputSchema,
  releaseCreateInputSchema,
  featureFlagPatchInputSchema,
  deploymentReadinessMutationSchema,
  buildValidatorLaunchAdoptionEvidencePlan,
  buildValidatorRuntimeReadinessPlan,
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

  it("validates consent-related form payloads", () => {
    expect(
      consentFormInputSchema.safeParse({
        key: "tattoo-consent",
        title: "Tattoo Consent",
        body: "I understand the risks and care instructions associated with this tattoo.",
      }).success,
    ).toBe(true);
    expect(
      consentSignatureInputSchema.safeParse({
        consentFormId: "cform_1",
        clientId: "client_1",
        signerName: "Ari Test",
        signerEmail: "ari@example.com",
      }).success,
    ).toBe(true);
    expect(
      medicalSafetyAcknowledgmentInputSchema.safeParse({
        clientId: "client_1",
        acknowledgments: { hasSkinCondition: false },
        flaggedReasons: ["no known conditions"],
      }).success,
    ).toBe(true);
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

  it("validates release and rollout payloads", () => {
    expect(
      releaseCreateInputSchema.safeParse({
        version: "v1.2.3",
        channel: "mobile_preview",
        commitSha: "abc1234",
        notes: "Release for dashboard update.",
      }).success,
    ).toBe(true);

    expect(
      featureFlagPatchInputSchema.safeParse({
        key: "beta-feature",
        enabled: true,
      }).success,
    ).toBe(true);

    expect(
      deploymentReadinessMutationSchema.safeParse({
        operation: "request-production-approval",
        targetEnvironment: "production",
        reason: "Release readiness checks passed.",
      }).success,
    ).toBe(true);
  });

  it("summarizes validator runtime readiness across package execution, schema domains, route usage, and sensitive fields", () => {
    const plan = buildValidatorRuntimeReadinessPlan({
      packageScripts: ["test"],
      packageTypecheckPassed: false,
      packageTestsPassed: true,
      bookingSchemasCovered: true,
      travelSchemasCovered: true,
      portfolioSchemasCovered: true,
      paymentSchemasCovered: true,
      peopleSchemasCovered: true,
      seoSchemasCovered: true,
      consentSchemasCovered: true,
      releaseSchemasCovered: true,
      messagingSchemasCovered: false,
      observabilitySchemasCovered: false,
      tenantAuthEdgeCasesCovered: false,
      formEdgeCasesCovered: false,
      apiRoutesUseSharedValidators: false,
      sensitiveFieldPoliciesAligned: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toContain("pnpm --filter @inkroute/validators typecheck");
    expect(plan.requiredEvidence).toContain("Route contract tests showing API handlers import and use shared schemas instead of ad-hoc parsing.");
    expect(plan.blockers).toContain("Message, notification, consent, preview, and provider webhook schemas need happy/error coverage.");
    expect(plan.blockers).toContain("Public, dashboard, webhook, release, privacy, upload, payment, notification, and observability routes must use shared validator schemas.");
  });

  it("summarizes validator launch adoption evidence across schema domains, route adoption, tenant scope, sensitive fields, CI, and safe artifacts", () => {
    const plan = buildValidatorLaunchAdoptionEvidencePlan({
      packageScripts: ["typecheck", "test"],
      validatorsTypecheckPassed: true,
      validatorsTestsPassed: true,
      bookingTravelPortfolioPaymentCovered: true,
      peopleConsentFormsSeoCovered: true,
      messagingObservabilityReleaseCovered: true,
      tenancyAuthEdgeCasesCovered: true,
      dynamicFormEdgeCasesCovered: true,
      publicRoutesUseSharedSchemas: true,
      dashboardRoutesUseSharedSchemas: true,
      webhookRoutesUseSharedSchemas: true,
      providerPayloadRoutesUseSharedSchemas: true,
      malformedPayloadRouteTestsPassed: true,
      tenantScopeRouteTestsPassed: true,
      sensitiveFieldsSecurityAligned: true,
      redactionEncryptionPolicyTestsPassed: true,
      ciEvidenceCaptured: true,
      secretSafeArtifactsCaptured: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
    expect(plan.requiredCommands).toContain("validator route adoption static scan");
    expect(plan.requiredControls).toContain("Reject malformed public, dashboard, webhook, provider, and mobile payloads before side effects.");
  });

  it("blocks validator launch adoption evidence until route-wide schema use, edge coverage, sensitive-field policy, CI, and artifact proof exist", () => {
    const plan = buildValidatorLaunchAdoptionEvidencePlan({
      packageScripts: ["test"],
      validatorsTypecheckPassed: false,
      validatorsTestsPassed: true,
      bookingTravelPortfolioPaymentCovered: true,
      peopleConsentFormsSeoCovered: false,
      messagingObservabilityReleaseCovered: false,
      tenancyAuthEdgeCasesCovered: false,
      dynamicFormEdgeCasesCovered: false,
      publicRoutesUseSharedSchemas: false,
      dashboardRoutesUseSharedSchemas: false,
      webhookRoutesUseSharedSchemas: false,
      providerPayloadRoutesUseSharedSchemas: false,
      malformedPayloadRouteTestsPassed: false,
      tenantScopeRouteTestsPassed: false,
      sensitiveFieldsSecurityAligned: false,
      redactionEncryptionPolicyTestsPassed: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactsCaptured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredEvidence).toEqual([
      "validator package typecheck and test command evidence",
      "schema-domain happy/error and tenant/auth/form edge-case coverage evidence",
      "public, dashboard, webhook, and provider route shared-schema adoption evidence",
      "malformed-payload and tenant-scope route contract evidence",
      "sensitive-field redaction and encryption-gate security evidence",
      "CI validator launch evidence and secret-safe artifact proof",
    ]);
    expect(plan.blockers).toContain("Public API routes must use shared validator schemas.");
    expect(plan.blockers).toContain("Webhook routes must use shared validator schemas before side effects.");
    expect(plan.blockers).toContain("Security contract tests must prove accepted sensitive fields are redacted or encryption-gated before persistence.");
  });
});
