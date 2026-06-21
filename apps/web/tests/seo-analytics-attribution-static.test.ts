import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  attributionCookiesForUrl,
  buildPublicSeoAnalyticsEvent,
  buildSeoAnalyticsAttributionArtifactReview,
  buildSeoAnalyticsAttributionExecutionPlan,
  buildSeoAnalyticsEvidenceDecision,
  buildSeoAnalyticsEventPersistenceData,
  buildRedactedSeoAnalyticsArtifact,
  createInMemorySeoAnalyticsAttributionRepository,
  loadTenantSeoAnalyticsDashboardReport,
  persistSeoAnalyticsAttribution,
  redactAnalyticsPayload,
  seoAnalyticsAttributionExecutionPolicy,
  seoAnalyticsArtifactPaths,
  seoAnalyticsAttributionContract,
  seoAnalyticsAttributionExternalCommands,
  seoAnalyticsAttributionLocalCommands,
  seoAnalyticsAttributionProofFiles,
  seoAnalyticsAttributionRequiredExternalEvidence,
  seoAnalyticsAttributionRuntimeMatrix,
  seoAnalyticsDecisionRequiredEvidence,
  seoAnalyticsRuntimeCommands,
  seoAttributionCookieNames,
} from "../lib/seoAnalyticsAttribution";

const middlewareSource = readFileSync(join(process.cwd(), "apps/web/middleware.ts"), "utf8");
const analyticsRouteSource = readFileSync(join(process.cwd(), "apps/web/app/api/public/[tenantSlug]/analytics/route.ts"), "utf8");
const bookingRouteSource = readFileSync(join(process.cwd(), "apps/web/app/api/public/[tenantSlug]/booking-requests/route.ts"), "utf8");
const ciWorkflow = readFileSync(join(process.cwd(), ".github/workflows/ci.yml"), "utf8");
const unitManifest = readFileSync(join(process.cwd(), "testing/manifests/unit-test-manifest.json"), "utf8");
const gapTracker = readFileSync(join(process.cwd(), "GAP_TRACKER.md"), "utf8");
const rootPackageJson = readFileSync(join(process.cwd(), "package.json"), "utf8");
const evidenceWriterSource = readFileSync(join(process.cwd(), "scripts/seo/write-seo-analytics-attribution-evidence.mjs"), "utf8");

describe("GAP-074 SEO analytics attribution wiring", () => {
  it("captures UTM and portfolio attribution cookies at public route entry", () => {
    const cookies = attributionCookiesForUrl("https://inkroute.example/portfolio?utm_source=Instagram&utm_medium=Social&utm_campaign=Flash Drop&portfolioItemId=portfolio_1", "portfolio_1");
    expect(cookies[seoAttributionCookieNames.source]).toBe("instagram");
    expect(cookies[seoAttributionCookieNames.medium]).toBe("social");
    expect(cookies[seoAttributionCookieNames.campaign]).toBe("flash-drop");
    expect(cookies[seoAttributionCookieNames.portfolioItemId]).toBe("portfolio_1");
    expect(middlewareSource).toContain("attributionCookiesForUrl");
    expect(middlewareSource).toContain("seoAttributionCookieMaxAgeSeconds");
  });

  it("normalizes and redacts public analytics ingestion events", () => {
    const event = buildPublicSeoAnalyticsEvent({
      tenantId: "tenant_001",
      name: "booking_request_submitted",
      url: "https://inkroute.example/booking?utm_source=Newsletter&utm_medium=Email&utm_campaign=Guest Spot",
      bookingRequestId: "booking_001",
      style: "Fine Line",
      now: "2026-06-09T00:00:00.000Z",
    });
    expect(event.payload).toMatchObject({ source: "newsletter", medium: "email", campaign: "guest-spot", style: "fine_line" });
    expect(redactAnalyticsPayload({ ...event.payload, city: "Seattle" })).not.toHaveProperty("medicalNotes");
  });

  it("executes local SEO analytics persistence, idempotency, campaign capture, and dashboard reporting", async () => {
    const repository = createInMemorySeoAnalyticsAttributionRepository();
    const analyticsPackageSource = readWorkspaceFile("packages/analytics/src/index.ts");
    const event = buildPublicSeoAnalyticsEvent({
      tenantId: "tenant_001",
      name: "booking_request_submitted",
      url: "https://inkroute.example/portfolio?utm_source=Newsletter&utm_medium=Email&utm_campaign=Guest Spot",
      bookingRequestId: "booking_001",
      portfolioItemId: "portfolio_001",
      now: "2026-06-09T00:00:00.000Z",
    });

    await persistSeoAnalyticsAttribution(repository, { event, idempotencyKey: "analytics:booking_001" });
    await persistSeoAnalyticsAttribution(repository, { event, idempotencyKey: "analytics:booking_001" });

    const snapshot = repository.snapshot();
    expect(snapshot.idempotencyKeys).toEqual(["tenant_001:analytics:booking_001"]);
    expect(snapshot.analyticsEvents).toHaveLength(1);
    expect(snapshot.campaigns).toHaveLength(1);
    expect(snapshot.analyticsEvents[0]).toMatchObject({
      tenantId: "tenant_001",
      bookingRequestId: "booking_001",
      portfolioItemId: "portfolio_001",
      source: "newsletter",
      medium: "email",
      campaign: "guest-spot",
    });

    const report = await loadTenantSeoAnalyticsDashboardReport(repository, { tenantId: "tenant_001", limit: 10 });
    expect(report).toMatchObject({
      tenantId: "tenant_001",
      eventCount: 1,
      bookingAttributedEvents: 1,
      portfolioAttributedEvents: 1,
      artifactPath: "coverage/seo-analytics-dashboard-report.json",
    });
    expect(analyticsPackageSource).toContain("Analytics ingestion API evidence must be captured before SEO analytics readiness.");
    expect(analyticsPackageSource).toContain("SEO analytics dashboard reporting evidence must be captured before SEO analytics readiness.");
    expect(analyticsPackageSource).not.toContain("Analytics ingestion API must be implemented.");
    expect(analyticsPackageSource).not.toContain("SEO analytics dashboard reporting must be implemented.");
  });

  it("reviews retained SEO analytics artifacts with recursive Search Console, provider token, and PII redaction", () => {
    const redacted = buildRedactedSeoAnalyticsArtifact({
      searchConsoleCredential: "searchconsole-token",
      clientEmail: "ari@example.test",
      publicSummary: "SEO analytics evidence captured",
      nested: {
        providerPayload: { token: "provider-secret" },
        publicStatus: "fixture",
      },
    });

    expect(redacted).toEqual({
      searchConsoleCredential: "[redacted]",
      clientEmail: "[redacted]",
      publicSummary: "SEO analytics evidence captured",
      nested: {
        providerPayload: "[redacted]",
        publicStatus: "fixture",
      },
    });

    const review = buildSeoAnalyticsAttributionArtifactReview({
      expectedArtifactPaths: ["coverage/search-console-import-credentials-redacted.json"],
      artifacts: [
        {
          path: "coverage/search-console-import-credentials-redacted.json",
          searchConsolePayload: { authorization: "Bearer searchconsole-token", email: "ari@example.test" },
          privateClientPayload: { phone: "+1 206 555 0142", paymentNotes: "card details" },
          nested: [{ providerPayload: { token: "provider-secret" } }],
        },
      ],
    });

    expect(review.status).toBe("passed");
    expect(JSON.stringify(review.redactedArtifacts)).not.toContain("searchconsole-token");
    expect(JSON.stringify(review.redactedArtifacts)).not.toContain("ari@example.test");
    expect(JSON.stringify(review.redactedArtifacts)).not.toContain("206 555 0142");
    expect(JSON.stringify(review.redactedArtifacts)).not.toContain("provider-secret");
    expect(review.blockers).toEqual([]);
  });

  it("pins the non-executing GAP-074 SEO analytics attribution execution policy", () => {
    const plan = buildSeoAnalyticsAttributionExecutionPlan();

    expect(seoAnalyticsAttributionExecutionPolicy).toEqual({
      codexMayClassifyStaticSeoAnalyticsReadiness: true,
      localCommandEvidenceRequiredForClosure: true,
      providerBackedPersistenceRequiredForClosure: true,
      dashboardReportExecutionRequiredForClosure: true,
      searchConsoleImportRequiredForClosure: true,
      playwrightAttributionRequiredForClosure: true,
      bookingAttributionIntegrationRequiredForClosure: true,
      ciEvidenceRequiredForClosure: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(plan.policy).toBe(seoAnalyticsAttributionExecutionPolicy);
    expect(plan.commandExecutionAllowed).toBe(false);
    expect(plan.providerPersistenceExecutionAllowed).toBe(false);
    expect(plan.dashboardReportExecutionAllowed).toBe(false);
    expect(plan.searchConsoleExecutionAllowed).toBe(false);
    expect(plan.playwrightExecutionAllowed).toBe(false);
    expect(plan.bookingIntegrationExecutionAllowed).toBe(false);
    expect(plan.ciExecutionAllowed).toBe(false);
    expect(plan.artifactReviewExecutionAllowed).toBe(false);
    expect(plan.localCommands).toBe(seoAnalyticsAttributionLocalCommands);
    expect(plan.externalCommands).toBe(seoAnalyticsAttributionExternalCommands);
    expect(plan.requiredExternalEvidence).toBe(seoAnalyticsAttributionRequiredExternalEvidence);
    expect(seoAnalyticsAttributionRequiredExternalEvidence).toEqual([
      "actual SEO analytics attribution command output",
      "provider-backed persistSeoAnalyticsAttribution execution proof",
      "seeded AnalyticsEvent/Campaign persistence tests",
      "provider-backed loadTenantSeoAnalyticsDashboardReport execution tests",
      "Search Console import fixture and credential-bound job tests",
      "Search Console credential redaction evidence",
      "Playwright public portfolio-to-booking attribution tests",
      "seeded BookingRequest attribution integration tests",
      "CI SEO analytics attribution artifacts",
      "secret-safe SEO analytics attribution artifact review",
    ]);
  });

  it("exposes a tenant-scoped public ingestion route with idempotency and no-store boundaries", () => {
    expect(analyticsRouteSource).toContain("allowedEvents");
    expect(analyticsRouteSource).toContain("idempotency-key");
    expect(analyticsRouteSource).toContain("redactAnalyticsPayload");
    expect(analyticsRouteSource).toContain('"Cache-Control": "no-store"');
    expect(analyticsRouteSource).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(analyticsRouteSource).not.toContain('}, { status: 400 });');
    expect(analyticsRouteSource).not.toContain('}, { status: 404 });');
    expect(analyticsRouteSource).toContain("accepted_without_provider_persistence");
    expect(analyticsRouteSource).toContain("PROVIDER_SEO_ANALYTICS_NOT_CONFIGURED");
    expect(analyticsRouteSource).toContain("previewAnalyticsAcceptanceDisabled");
  });

  it("keeps BookingRequest attribution persistence wired through existing fields", () => {
    expect(bookingRouteSource).toContain("portfolioAttributionId");
    expect(bookingRouteSource).toContain("utmSource");
    expect(bookingRouteSource).toContain("utmMedium");
    expect(bookingRouteSource).toContain("utmCampaign");
  });

  it("tracks remaining production analytics blockers and artifacts", () => {
    expect(seoAnalyticsAttributionContract.status).toBe("blocked");
    expect(seoAnalyticsAttributionContract.blockers).not.toContain("Analytics event persistence must be available.");
    expect(seoAnalyticsAttributionContract.blockers).not.toContain("Campaign tracking persistence must be available.");
    expect(seoAnalyticsAttributionContract.blockers).not.toContain("Analytics ingestion idempotency store must be available.");
    expect(seoAnalyticsAttributionContract.blockers).toContain("Search Console import job must be configured.");
    expect(seoAnalyticsArtifactPaths).toContain("coverage/playwright-seo-attribution-results.json");
    expect(seoAnalyticsArtifactPaths).toContain("test-results/seo-analytics");
  });

  it("pins the SEO analytics runtime matrix and durable evidence boundaries", () => {
    expect(seoAnalyticsRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/analytics typecheck",
      "pnpm --filter @inkroute/analytics test",
      "pnpm seo:analytics-attribution-evidence",
      "pnpm vitest run apps/web/tests/seo-analytics-attribution-static.test.ts",
      "seeded AnalyticsEvent/Campaign persistence tests",
      "tenant-scoped dashboard SEO analytics report tests",
      "Search Console import fixture and credential-bound job tests",
      "Playwright public portfolio-to-booking attribution tests",
      "seeded BookingRequest attribution integration tests",
    ]);
    expect(seoAnalyticsAttributionRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "analytics-typecheck",
      "analytics-tests",
      "local-evidence-writer",
      "public-cookie-capture",
      "ingestion-redaction",
      "idempotency-store",
      "event-persistence",
      "campaign-persistence",
      "dashboard-reporting",
      "search-console-import",
      "playwright-click-through",
      "booking-attribution-integration",
      "ci-seo-analytics-job",
      "secret-safe-artifacts",
    ]);
    expect(seoAnalyticsAttributionContract.requiredEvidence).toEqual(
      expect.arrayContaining([
        "public UTM capture, ingestion API, event persistence, and campaign tracking evidence",
        "portfolio click-through and persisted BookingRequest attribution evidence",
        "Search Console credential, import job, and import test evidence",
        "tenant-scoped dashboard SEO analytics reporting evidence",
        "privacy redaction, idempotency, and attribution-window configuration evidence",
      ]),
    );
  });

  it("classifies GAP-074 SEO analytics attribution evidence as blocked until every durable proof artifact is captured", () => {
    const blocked = buildSeoAnalyticsEvidenceDecision({
      analyticsTypecheckPassed: true,
      analyticsTestsPassed: true,
      staticContractPassed: true,
      publicCookieCaptureVerified: true,
      ingestionRedactionVerified: true,
      idempotencyStoreVerified: true,
      analyticsEventPersistenceVerified: true,
      campaignPersistenceVerified: true,
      dashboardReportingVerified: false,
      searchConsoleImportVerified: false,
      searchConsoleCredentialsRedacted: false,
      playwrightClickThroughPassed: false,
      bookingAttributionIntegrationPassed: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactReviewPassed: true,
      capturedArtifacts: ["coverage/seo-analytics-attribution.json"],
    });

    expect(blocked.status).toBe("blocked");
    expect(blocked.blockers).toEqual(
      expect.arrayContaining([
        "Tenant-scoped dashboard SEO analytics reporting evidence is required.",
        "Search Console import fixture and job evidence is required.",
        "Playwright public portfolio-to-booking attribution evidence is required.",
      ]),
    );
    expect(blocked.blockers).not.toContain("Analytics ingestion idempotency storage evidence is required.");
    expect(blocked.blockers).not.toContain("AnalyticsEvent persistence evidence is required.");
    expect(blocked.blockers).not.toContain("Campaign persistence evidence is required.");
    expect(blocked.blockers).not.toContain("Secret-safe artifact review evidence is required.");
    expect(blocked.missingArtifacts).toContain("coverage/seo-analytics-dashboard-report.json");
    expect(blocked.requiredCommands).toBe(seoAnalyticsRuntimeCommands);
    expect(blocked.requiredEvidence).toBe(seoAnalyticsDecisionRequiredEvidence);

    const complete = buildSeoAnalyticsEvidenceDecision({
      analyticsTypecheckPassed: true,
      analyticsTestsPassed: true,
      staticContractPassed: true,
      publicCookieCaptureVerified: true,
      ingestionRedactionVerified: true,
      idempotencyStoreVerified: true,
      analyticsEventPersistenceVerified: true,
      campaignPersistenceVerified: true,
      dashboardReportingVerified: true,
      searchConsoleImportVerified: true,
      searchConsoleCredentialsRedacted: true,
      playwrightClickThroughPassed: true,
      bookingAttributionIntegrationPassed: true,
      ciEvidenceCaptured: true,
      secretSafeArtifactReviewPassed: true,
      capturedArtifacts: seoAnalyticsArtifactPaths,
    });

    expect(complete.status).toBe("complete");
    expect(complete.blockers).toEqual([]);
    expect(complete.missingArtifacts).toEqual([]);
    expect(complete.redactedSummary).toContain("CI-safe artifacts captured");
  });

  it("keeps CI, manifest, and tracker evidence tied to GAP-074", () => {
    expect(ciWorkflow).toContain("Run Phase 10 SEO analytics attribution runtime contracts");
    expect(ciWorkflow).toContain("seo-analytics-attribution-static.test.ts");
    expect(ciWorkflow).toContain("seo-analytics-attribution-artifacts");
    expect(unitManifest).toContain("unit-web-seo-analytics-attribution-static");
    expect(unitManifest).toContain("seoAnalyticsAttributionRuntimeMatrix");
    expect(gapTracker).toContain("local in-memory SEO analytics attribution repository contract");
    expect(gapTracker).toContain("seoAnalyticsDecisionRequiredEvidence");
    expect(gapTracker).toContain("buildSeoAnalyticsAttributionExecutionPlan");
    expect(gapTracker).toContain("seoAnalyticsAttributionExecutionPolicy");
    expect(gapTracker).toContain("seoAnalyticsAttributionRequiredExternalEvidence");
    expect(gapTracker).toContain("buildRedactedSeoAnalyticsArtifact");
    expect(gapTracker).toContain("buildSeoAnalyticsAttributionArtifactReview");
    expect(gapTracker).toContain("non-executing SEO analytics attribution execution policy");
    expect(gapTracker).toContain("SEO analytics attribution evidence classifier wired and runtime-matrix gated");
    expect(rootPackageJson).toContain("seo:analytics-attribution-evidence");
    expect(evidenceWriterSource).toContain("providerSearchConsoleImported: false");
    expect(evidenceWriterSource).toContain("dashboardReportFixtureOnly: true");
    expect(evidenceWriterSource).toContain("seo-analytics-idempotency-store.json");
    expect(evidenceWriterSource).toContain("seo-analytics-event-persistence.json");
    expect(evidenceWriterSource).toContain("seo-analytics-campaign-persistence.json");
    expect(evidenceWriterSource).toContain("playwright-seo-attribution-results.json");
    expect(evidenceWriterSource).toContain("seo-analytics-booking-attribution-integration.json");
    expect(evidenceWriterSource).toContain("seo-analytics-ci-evidence.json");
    expect(evidenceWriterSource).toContain("durable AnalyticsEvent persistence");
  });

  it("pins durable AnalyticsEvent and Campaign attribution persistence seams", () => {
    const schema = readFileSync(join(process.cwd(), "packages/db/prisma/schema.prisma"), "utf8");
    const migration = readFileSync(join(process.cwd(), "packages/db/prisma/migrations/20260613000100_add_analytics_attribution/migration.sql"), "utf8");
    const event = buildPublicSeoAnalyticsEvent({
      tenantId: "tenant_001",
      name: "booking_request_submitted",
      url: "https://inkroute.example/booking?utm_source=Newsletter&utm_medium=Email&utm_campaign=Guest Spot",
      bookingRequestId: "booking_001",
      now: "2026-06-09T00:00:00.000Z",
    });
    const data = buildSeoAnalyticsEventPersistenceData({ event, idempotencyKey: "idem_001" });

    expect(schema).toContain("model AnalyticsEvent");
    expect(schema).toContain("model Campaign");
    expect(schema).toContain("analyticsEvents  AnalyticsEvent[]");
    expect(schema).toContain("campaigns        Campaign[]");
    expect(migration).toContain('CREATE TABLE "AnalyticsEvent"');
    expect(migration).toContain('CREATE TABLE "Campaign"');
    expect(data).toMatchObject({
      tenantId: "tenant_001",
      name: "booking_request_submitted",
      bookingRequestId: "booking_001",
      source: "newsletter",
      medium: "email",
      campaign: "guest-spot",
      idempotencyKey: "idem_001",
    });
    expect(persistSeoAnalyticsAttribution).toBeTypeOf("function");
    expect(readFileSync(join(process.cwd(), "apps/web/lib/seoAnalyticsAttribution.ts"), "utf8")).toContain("repository.analyticsEvent.create");
    expect(readFileSync(join(process.cwd(), "apps/web/lib/seoAnalyticsAttribution.ts"), "utf8")).toContain("repository.campaign.upsert");
  });

  it("source-wires tenant-scoped dashboard analytics reports from persisted events and campaigns", async () => {
    const calls: Record<string, unknown> = {};
    const report = await loadTenantSeoAnalyticsDashboardReport(
      {
        analyticsEvent: {
          findMany: async (input) => {
            calls.analyticsEvent = input;
            return [
              {
                name: "booking_request_submitted",
                source: "newsletter",
                medium: "email",
                campaign: "guest-spot",
                bookingRequestId: "booking_001",
                portfolioItemId: "portfolio_001",
                occurredAt: new Date("2026-06-09T00:00:00.000Z"),
              },
            ];
          },
        },
        campaign: {
          findMany: async (input) => {
            calls.campaign = input;
            return [
              {
                source: "newsletter",
                medium: "email",
                campaign: "guest-spot",
                eventCount: 4,
                bookingRequestCount: 1,
                firstSeenAt: new Date("2026-06-01T00:00:00.000Z"),
                lastSeenAt: new Date("2026-06-09T00:00:00.000Z"),
              },
            ];
          },
        },
      },
      { tenantId: "tenant_001", limit: 10 },
    );

    expect(calls.analyticsEvent).toMatchObject({
      where: { tenantId: "tenant_001" },
      select: {
        name: true,
        source: true,
        medium: true,
        campaign: true,
        bookingRequestId: true,
        portfolioItemId: true,
        occurredAt: true,
      },
      take: 10,
    });
    expect(calls.campaign).toMatchObject({
      where: { tenantId: "tenant_001" },
      take: 10,
    });
    expect(report).toMatchObject({
      tenantId: "tenant_001",
      eventCount: 1,
      bookingAttributedEvents: 1,
      portfolioAttributedEvents: 1,
      rawPayloadIncluded: false,
      tenantScoped: true,
      artifactPath: "coverage/seo-analytics-dashboard-report.json",
    });
    expect(report.recentEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          hasBookingRequestAttribution: true,
          hasPortfolioAttribution: true,
        }),
      ]),
    );
    expect(readFileSync(join(process.cwd(), "apps/web/lib/seoAnalyticsAttribution.ts"), "utf8")).toContain("loadTenantSeoAnalyticsDashboardReport");
    expect(readFileSync(join(process.cwd(), "apps/web/lib/seoAnalyticsAttribution.ts"), "utf8")).toContain("repository.analyticsEvent.findMany");
    expect(readFileSync(join(process.cwd(), "apps/web/lib/seoAnalyticsAttribution.ts"), "utf8")).toContain("repository.campaign.findMany");
  });

  it("pins current SEO analytics attribution proof files for GAP-074", () => {
    expect(seoAnalyticsAttributionProofFiles).toEqual(expect.arrayContaining([
      "packages/analytics/package.json",
      "packages/analytics/src/index.ts",
      "packages/analytics/tests/attribution.test.ts",
      "packages/seo/src/index.ts",
      "scripts/seo/write-seo-analytics-attribution-evidence.mjs",
      "apps/web/lib/seoAnalyticsAttribution.ts",
      "apps/web/middleware.ts",
      "apps/web/app/api/public/[tenantSlug]/analytics/route.ts",
      "apps/web/app/api/public/[tenantSlug]/booking-requests/route.ts",
      "apps/web/tests/seo-analytics-attribution-static.test.ts",
      "apps/dashboard/app/seo/page.tsx",
      "packages/db/prisma/schema.prisma",
      "packages/db/prisma/migrations/20260613000100_add_analytics_attribution/migration.sql",
      ".github/workflows/ci.yml",
      "testing/manifests/unit-test-manifest.json",
    ]));
    for (const file of seoAnalyticsAttributionProofFiles) {
      expect(readFileSync(join(process.cwd(), file), "utf8").length).toBeGreaterThan(0);
    }
  });
});
