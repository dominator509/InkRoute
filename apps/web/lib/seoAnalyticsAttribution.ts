import {
  buildSeoAnalyticsRuntimeReadinessPlan,
  createAnalyticsEvent,
  normalizeAnalyticsEvent,
  parseUtmAttribution,
  type AnalyticsEventName,
  type AnalyticsEventPayload,
  type SeoAnalyticsRuntimeReadinessPlan,
} from "@inkroute/analytics";

export const seoAttributionCookieNames = {
  source: "inkroute_utm_source",
  medium: "inkroute_utm_medium",
  campaign: "inkroute_utm_campaign",
  portfolioItemId: "inkroute_portfolio_attribution_id",
  landingPath: "inkroute_landing_path",
} as const;

export const seoAttributionCookieMaxAgeSeconds = 60 * 60 * 24 * 30;

export type SeoAnalyticsAttributionRuntimeStatus =
  | "wired"
  | "persistence-gated"
  | "provider-gated"
  | "dashboard-gated"
  | "integration-gated"
  | "ci-gated";

export interface SeoAnalyticsAttributionRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: SeoAnalyticsAttributionRuntimeStatus;
}

export const seoAnalyticsRuntimeCommands = [
  "pnpm --filter @inkroute/analytics typecheck",
  "pnpm --filter @inkroute/analytics test",
  "pnpm seo:analytics-attribution-evidence",
  "pnpm vitest run apps/web/tests/seo-analytics-attribution-static.test.ts",
  "seeded AnalyticsEvent/Campaign persistence tests",
  "tenant-scoped dashboard SEO analytics report tests",
  "Search Console import fixture and credential-bound job tests",
  "Playwright public portfolio-to-booking attribution tests",
  "seeded BookingRequest attribution integration tests",
] as const;

export const seoAnalyticsAttributionLocalCommands = [
  "pnpm --filter @inkroute/analytics typecheck",
  "pnpm --filter @inkroute/analytics test",
  "pnpm seo:analytics-attribution-evidence",
  "pnpm vitest run apps/web/tests/seo-analytics-attribution-static.test.ts",
] as const;

export const seoAnalyticsAttributionExternalCommands = [
  "seeded AnalyticsEvent/Campaign persistence tests",
  "tenant-scoped dashboard SEO analytics report tests",
  "Search Console import fixture and credential-bound job tests",
  "Playwright public portfolio-to-booking attribution tests",
  "seeded BookingRequest attribution integration tests",
  "GitHub Actions SEO analytics attribution job",
  "secret-safe SEO analytics attribution artifact review",
] as const;

export const seoAnalyticsArtifactPaths = [
  "coverage/seo-analytics-attribution.json",
  "coverage/seo-analytics-analytics-typecheck.txt",
  "coverage/seo-analytics-analytics-test.txt",
  "coverage/seo-analytics-public-cookie-capture.json",
  "coverage/seo-analytics-ingestion-redaction.json",
  "coverage/seo-analytics-idempotency-store.json",
  "coverage/seo-analytics-event-persistence.json",
  "coverage/seo-analytics-campaign-persistence.json",
  "coverage/seo-analytics-dashboard-report.json",
  "coverage/search-console-import-fixture.json",
  "coverage/search-console-import-credentials-redacted.json",
  "coverage/playwright-seo-attribution-results.json",
  "coverage/seo-analytics-booking-attribution-integration.json",
  "coverage/seo-analytics-ci-evidence.json",
  "coverage/seo-analytics-secret-safe-artifacts.json",
  "test-results/seo-analytics",
] as const;

export const seoAnalyticsAttributionProofFiles = [
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
] as const;

export type SeoAnalyticsEvidenceArtifact = (typeof seoAnalyticsArtifactPaths)[number];

export interface SeoAnalyticsEvidenceInput {
  readonly analyticsTypecheckPassed: boolean;
  readonly analyticsTestsPassed: boolean;
  readonly staticContractPassed: boolean;
  readonly publicCookieCaptureVerified: boolean;
  readonly ingestionRedactionVerified: boolean;
  readonly idempotencyStoreVerified: boolean;
  readonly analyticsEventPersistenceVerified: boolean;
  readonly campaignPersistenceVerified: boolean;
  readonly dashboardReportingVerified: boolean;
  readonly searchConsoleImportVerified: boolean;
  readonly searchConsoleCredentialsRedacted: boolean;
  readonly playwrightClickThroughPassed: boolean;
  readonly bookingAttributionIntegrationPassed: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactReviewPassed: boolean;
  readonly capturedArtifacts: readonly SeoAnalyticsEvidenceArtifact[];
}

export interface SeoAnalyticsEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly blockers: readonly string[];
  readonly missingArtifacts: readonly SeoAnalyticsEvidenceArtifact[];
  readonly requiredCommands: typeof seoAnalyticsRuntimeCommands;
  readonly requiredEvidence: typeof seoAnalyticsDecisionRequiredEvidence;
  readonly redactedSummary: string;
}

export interface SeoAnalyticsAttributionPersistenceRepository {
  readonly analyticsEvent: {
    readonly create: (input: { readonly data: Record<string, unknown> }) => Promise<unknown>;
  };
  readonly campaign: {
    readonly upsert: (input: {
      readonly where: {
        readonly tenantId_source_medium_campaign: {
          readonly tenantId: string;
          readonly source: string | null;
          readonly medium: string | null;
          readonly campaign: string;
        };
      };
      readonly create: Record<string, unknown>;
      readonly update: Record<string, unknown>;
    }) => Promise<unknown>;
  };
}

export interface SeoAnalyticsAttributionPersistenceInput {
  readonly event: ReturnType<typeof buildPublicSeoAnalyticsEvent>;
  readonly idempotencyKey?: string;
}

export interface SeoAnalyticsDashboardReportInput {
  readonly tenantId: string;
  readonly from?: Date;
  readonly to?: Date;
  readonly limit?: number;
}

export interface SeoAnalyticsDashboardEventRow {
  readonly name: string;
  readonly source: string | null;
  readonly medium: string | null;
  readonly campaign: string | null;
  readonly bookingRequestId: string | null;
  readonly portfolioItemId: string | null;
  readonly occurredAt: Date;
}

export interface SeoAnalyticsDashboardCampaignRow {
  readonly source: string | null;
  readonly medium: string | null;
  readonly campaign: string;
  readonly eventCount: number;
  readonly bookingRequestCount: number;
  readonly firstSeenAt: Date;
  readonly lastSeenAt: Date;
}

export interface SeoAnalyticsDashboardReportRepository {
  readonly analyticsEvent: {
    readonly findMany: (input: {
      readonly where: {
        readonly tenantId: string;
        readonly occurredAt?: { readonly gte?: Date; readonly lte?: Date };
      };
      readonly select: {
        readonly name: true;
        readonly source: true;
        readonly medium: true;
        readonly campaign: true;
        readonly bookingRequestId: true;
        readonly portfolioItemId: true;
        readonly occurredAt: true;
      };
      readonly orderBy: { readonly occurredAt: "desc" };
      readonly take: number;
    }) => Promise<readonly SeoAnalyticsDashboardEventRow[]>;
  };
  readonly campaign: {
    readonly findMany: (input: {
      readonly where: { readonly tenantId: string };
      readonly select: {
        readonly source: true;
        readonly medium: true;
        readonly campaign: true;
        readonly eventCount: true;
        readonly bookingRequestCount: true;
        readonly firstSeenAt: true;
        readonly lastSeenAt: true;
      };
      readonly orderBy: readonly [{ readonly bookingRequestCount: "desc" }, { readonly eventCount: "desc" }];
      readonly take: number;
    }) => Promise<readonly SeoAnalyticsDashboardCampaignRow[]>;
  };
}

export interface SeoAnalyticsAttributionArtifactReview {
  readonly status: "passed" | "blocked";
  readonly redactedArtifacts: readonly unknown[];
  readonly blockers: readonly string[];
}

export interface SeoAnalyticsAttributionExecutionPolicy {
  readonly codexMayClassifyStaticSeoAnalyticsReadiness: boolean;
  readonly localCommandEvidenceRequiredForClosure: boolean;
  readonly providerBackedPersistenceRequiredForClosure: boolean;
  readonly dashboardReportExecutionRequiredForClosure: boolean;
  readonly searchConsoleImportRequiredForClosure: boolean;
  readonly playwrightAttributionRequiredForClosure: boolean;
  readonly bookingAttributionIntegrationRequiredForClosure: boolean;
  readonly ciEvidenceRequiredForClosure: boolean;
  readonly secretSafeArtifactsRequiredForClosure: boolean;
}

export interface SeoAnalyticsAttributionExecutionPlan {
  readonly policy: SeoAnalyticsAttributionExecutionPolicy;
  readonly commandExecutionAllowed: false;
  readonly providerPersistenceExecutionAllowed: false;
  readonly dashboardReportExecutionAllowed: false;
  readonly searchConsoleExecutionAllowed: false;
  readonly playwrightExecutionAllowed: false;
  readonly bookingIntegrationExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly artifactReviewExecutionAllowed: false;
  readonly localCommands: typeof seoAnalyticsAttributionLocalCommands;
  readonly externalCommands: typeof seoAnalyticsAttributionExternalCommands;
  readonly requiredExternalEvidence: typeof seoAnalyticsAttributionRequiredExternalEvidence;
}

export const seoAnalyticsAttributionExecutionPolicy = {
  codexMayClassifyStaticSeoAnalyticsReadiness: true,
  localCommandEvidenceRequiredForClosure: true,
  providerBackedPersistenceRequiredForClosure: true,
  dashboardReportExecutionRequiredForClosure: true,
  searchConsoleImportRequiredForClosure: true,
  playwrightAttributionRequiredForClosure: true,
  bookingAttributionIntegrationRequiredForClosure: true,
  ciEvidenceRequiredForClosure: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const satisfies SeoAnalyticsAttributionExecutionPolicy;

export interface InMemorySeoAnalyticsAttributionRepositorySnapshot {
  readonly idempotencyKeys: readonly string[];
  readonly analyticsEvents: readonly Record<string, unknown>[];
  readonly campaigns: readonly Record<string, unknown>[];
}

const sensitiveSeoAnalyticsArtifactKeyPattern =
  /(token|secret|password|authorization|cookie|provider|payload|email|phone|searchconsole|client|medical|payment|private|tenant|booking|portfolio|attribution|campaign|analytics|event|importedRow|operationRun|query|page|utm|referrer|url|path|route|html|dom|dashboard|report|artifactUrl|ci|runId|commitSha|command|log|stack|raw)/i;
const sensitiveSeoAnalyticsArtifactValuePatterns = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  /\+?\d[\d\s().-]{7,}\d/g,
  /\b(?:Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/gi,
  /\b(?:searchconsole|provider|token|secret|private)[\w:./?=&-]*/gi,
  /https?:\/\/[^\s"'<>]+/gi,
  /<[^>]+>/g,
];

export function buildRedactedSeoAnalyticsArtifact(input: unknown): unknown {
  if (Array.isArray(input)) return input.map((value) => buildRedactedSeoAnalyticsArtifact(value));
  if (!input || typeof input !== "object") {
    if (typeof input !== "string") return input;
    return sensitiveSeoAnalyticsArtifactValuePatterns.reduce((value, pattern) => value.replace(pattern, "[redacted]"), input);
  }

  return Object.fromEntries(
    Object.entries(input as Record<string, unknown>).map(([key, value]) => [
      key,
      sensitiveSeoAnalyticsArtifactKeyPattern.test(key) ? "[redacted]" : buildRedactedSeoAnalyticsArtifact(value),
    ]),
  );
}

export function buildSeoAnalyticsAttributionArtifactReview(input: {
  readonly artifacts: readonly unknown[];
  readonly expectedArtifactPaths?: readonly string[];
}): SeoAnalyticsAttributionArtifactReview {
  const redactedArtifacts = input.artifacts.map((artifact) => buildRedactedSeoAnalyticsArtifact(artifact));
  const serialized = JSON.stringify(redactedArtifacts);
  const blockers = [
    ...(input.artifacts.length === 0 ? ["No SEO analytics attribution artifacts were provided for review."] : []),
    ...(/\b(secret|token|authorization|cookie|ari@example|206 555|searchconsole|private-client)\b/i.test(serialized)
      ? ["SEO analytics attribution artifacts still contain secrets, provider payloads, Search Console credentials, or PII."]
      : []),
    ...((input.expectedArtifactPaths ?? []).some((path) => !serialized.includes(path))
      ? ["SEO analytics attribution artifact inventory is incomplete."]
      : []),
  ];

  return {
    status: blockers.length === 0 ? "passed" : "blocked",
    redactedArtifacts,
    blockers,
  };
}

export const seoAnalyticsAttributionRequiredExternalEvidence = [
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
] as const;

export const buildSeoAnalyticsAttributionExecutionPlan = (): SeoAnalyticsAttributionExecutionPlan => ({
  policy: seoAnalyticsAttributionExecutionPolicy,
  commandExecutionAllowed: false,
  providerPersistenceExecutionAllowed: false,
  dashboardReportExecutionAllowed: false,
  searchConsoleExecutionAllowed: false,
  playwrightExecutionAllowed: false,
  bookingIntegrationExecutionAllowed: false,
  ciExecutionAllowed: false,
  artifactReviewExecutionAllowed: false,
  localCommands: seoAnalyticsAttributionLocalCommands,
  externalCommands: seoAnalyticsAttributionExternalCommands,
  requiredExternalEvidence: seoAnalyticsAttributionRequiredExternalEvidence,
});

export const seoAnalyticsDecisionRequiredEvidence = [
  "analytics package typecheck/test and SEO analytics static contract artifacts",
  "public cookie capture, ingestion redaction, and idempotency storage artifacts",
  "AnalyticsEvent, Campaign, dashboard reporting, and Search Console import artifacts",
  "Playwright click-through, BookingRequest attribution integration, CI, and redacted artifact review evidence",
] as const;

export function buildSeoAnalyticsEvidenceDecision(input: SeoAnalyticsEvidenceInput): SeoAnalyticsEvidenceDecision {
  const blockers = [
    !input.analyticsTypecheckPassed ? "Analytics package typecheck evidence is required." : null,
    !input.analyticsTestsPassed ? "Analytics package test evidence is required." : null,
    !input.staticContractPassed ? "SEO analytics attribution static contract evidence is required." : null,
    !input.publicCookieCaptureVerified ? "Public UTM and portfolio cookie capture evidence is required." : null,
    !input.ingestionRedactionVerified ? "Public analytics ingestion redaction evidence is required." : null,
    !input.idempotencyStoreVerified ? "Analytics ingestion idempotency storage evidence is required." : null,
    !input.analyticsEventPersistenceVerified ? "AnalyticsEvent persistence evidence is required." : null,
    !input.campaignPersistenceVerified ? "Campaign persistence evidence is required." : null,
    !input.dashboardReportingVerified ? "Tenant-scoped dashboard SEO analytics reporting evidence is required." : null,
    !input.searchConsoleImportVerified ? "Search Console import fixture and job evidence is required." : null,
    !input.searchConsoleCredentialsRedacted ? "Search Console credential redaction evidence is required." : null,
    !input.playwrightClickThroughPassed ? "Playwright public portfolio-to-booking attribution evidence is required." : null,
    !input.bookingAttributionIntegrationPassed ? "Seeded BookingRequest attribution integration evidence is required." : null,
    !input.ciEvidenceCaptured ? "CI SEO analytics attribution job evidence is required." : null,
    !input.secretSafeArtifactReviewPassed ? "Secret-safe artifact review evidence is required." : null,
  ].filter((blocker): blocker is string => blocker !== null);
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const missingArtifacts = seoAnalyticsArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 ? "complete" : "blocked",
    blockers,
    missingArtifacts,
    requiredCommands: seoAnalyticsRuntimeCommands,
    requiredEvidence: seoAnalyticsDecisionRequiredEvidence,
    redactedSummary:
      blockers.length === 0 && missingArtifacts.length === 0
        ? "GAP-074 SEO analytics attribution evidence is complete with CI-safe artifacts captured."
        : "GAP-074 SEO analytics attribution evidence remains blocked until durable persistence, dashboard, Search Console, click-through, booking attribution, CI, and redaction artifacts are captured.",
  };
}

export const buildSeoAnalyticsEventPersistenceData = (input: SeoAnalyticsAttributionPersistenceInput) => {
  const payload = redactAnalyticsPayload(input.event.payload);

  return {
    tenantId: payload.tenantId,
    name: input.event.name,
    payload,
    bookingRequestId: payload.bookingRequestId,
    portfolioItemId: payload.portfolioItemId,
    source: payload.source,
    medium: payload.medium,
    campaign: payload.campaign,
    idempotencyKey: input.idempotencyKey,
    occurredAt: payload.createdAt ? new Date(payload.createdAt) : new Date(),
  };
};

export function createInMemorySeoAnalyticsAttributionRepository(): SeoAnalyticsAttributionPersistenceRepository &
  SeoAnalyticsDashboardReportRepository & {
    snapshot(): InMemorySeoAnalyticsAttributionRepositorySnapshot;
  } {
  const idempotencyKeys = new Set<string>();
  const analyticsEvents: Record<string, unknown>[] = [];
  const campaigns: Record<string, unknown>[] = [];

  return {
    analyticsEvent: {
      async create(input) {
        const idempotencyKey = typeof input.data.idempotencyKey === "string" ? input.data.idempotencyKey : undefined;
        const tenantId = typeof input.data.tenantId === "string" ? input.data.tenantId : "unknown";
        if (idempotencyKey) {
          const scopedKey = `${tenantId}:${idempotencyKey}`;
          if (idempotencyKeys.has(scopedKey)) return { duplicate: true, ...input.data };
          idempotencyKeys.add(scopedKey);
        }
        analyticsEvents.push({ ...input.data });
        return input.data;
      },
      async findMany(input) {
        return analyticsEvents
          .filter((event) => event.tenantId === input.where.tenantId)
          .slice(0, input.take)
          .map((event) => ({
            name: String(event.name),
            source: typeof event.source === "string" ? event.source : null,
            medium: typeof event.medium === "string" ? event.medium : null,
            campaign: typeof event.campaign === "string" ? event.campaign : null,
            bookingRequestId: typeof event.bookingRequestId === "string" ? event.bookingRequestId : null,
            portfolioItemId: typeof event.portfolioItemId === "string" ? event.portfolioItemId : null,
            occurredAt: event.occurredAt instanceof Date ? event.occurredAt : new Date(String(event.occurredAt ?? event.createdAt)),
          }));
      },
    },
    campaign: {
      async upsert(input) {
        const existing = campaigns.find(
          (campaign) =>
            campaign.tenantId === input.where.tenantId_source_medium_campaign.tenantId &&
            campaign.source === input.where.tenantId_source_medium_campaign.source &&
            campaign.medium === input.where.tenantId_source_medium_campaign.medium &&
            campaign.campaign === input.where.tenantId_source_medium_campaign.campaign,
        );
        if (existing) {
          Object.assign(existing, input.update);
          return existing;
        }
        const created = { ...input.create };
        campaigns.push(created);
        return created;
      },
      async findMany(input) {
        return campaigns
          .filter((campaign) => campaign.tenantId === input.where.tenantId)
          .slice(0, input.take)
          .map((campaign) => ({
            source: typeof campaign.source === "string" ? campaign.source : null,
            medium: typeof campaign.medium === "string" ? campaign.medium : null,
            campaign: String(campaign.campaign),
            eventCount: Number(campaign.eventCount ?? 0),
            bookingRequestCount: Number(campaign.bookingRequestCount ?? 0),
            firstSeenAt: campaign.firstSeenAt instanceof Date ? campaign.firstSeenAt : new Date(String(campaign.firstSeenAt ?? Date.now())),
            lastSeenAt: campaign.lastSeenAt instanceof Date ? campaign.lastSeenAt : new Date(String(campaign.lastSeenAt ?? Date.now())),
          }));
      },
    },
    snapshot() {
      return {
        idempotencyKeys: [...idempotencyKeys],
        analyticsEvents: [...analyticsEvents],
        campaigns: [...campaigns],
      };
    },
  };
}

export const persistSeoAnalyticsAttribution = async (
  repository: SeoAnalyticsAttributionPersistenceRepository,
  input: SeoAnalyticsAttributionPersistenceInput,
) => {
  const data = buildSeoAnalyticsEventPersistenceData(input);
  const analyticsEvent = await repository.analyticsEvent.create({ data });

  if (typeof data.campaign === "string" && data.campaign.length > 0) {
    await repository.campaign.upsert({
      where: {
        tenantId_source_medium_campaign: {
          tenantId: data.tenantId,
          source: data.source ?? null,
          medium: data.medium ?? null,
          campaign: data.campaign,
        },
      },
      create: {
        tenantId: data.tenantId,
        source: data.source,
        medium: data.medium,
        campaign: data.campaign,
        firstSeenAt: data.occurredAt,
        lastSeenAt: data.occurredAt,
        eventCount: 1,
        bookingRequestCount: data.bookingRequestId ? 1 : 0,
      },
      update: {
        lastSeenAt: data.occurredAt,
        eventCount: { increment: 1 },
        ...(data.bookingRequestId ? { bookingRequestCount: { increment: 1 } } : {}),
      },
    });
  }

  return analyticsEvent;
};

export const loadTenantSeoAnalyticsDashboardReport = async (
  repository: SeoAnalyticsDashboardReportRepository,
  input: SeoAnalyticsDashboardReportInput,
) => {
  const take = input.limit ?? 25;
  const occurredAt =
    input.from || input.to
      ? {
          ...(input.from ? { gte: input.from } : {}),
          ...(input.to ? { lte: input.to } : {}),
        }
      : undefined;
  const [events, campaigns] = await Promise.all([
    repository.analyticsEvent.findMany({
      where: {
        tenantId: input.tenantId,
        ...(occurredAt ? { occurredAt } : {}),
      },
      select: {
        name: true,
        source: true,
        medium: true,
        campaign: true,
        bookingRequestId: true,
        portfolioItemId: true,
        occurredAt: true,
      },
      orderBy: { occurredAt: "desc" },
      take,
    }),
    repository.campaign.findMany({
      where: { tenantId: input.tenantId },
      select: {
        source: true,
        medium: true,
        campaign: true,
        eventCount: true,
        bookingRequestCount: true,
        firstSeenAt: true,
        lastSeenAt: true,
      },
      orderBy: [{ bookingRequestCount: "desc" }, { eventCount: "desc" }],
      take,
    }),
  ]);
  const bookingAttributedEvents = events.filter((event) => event.bookingRequestId).length;
  const portfolioAttributedEvents = events.filter((event) => event.portfolioItemId).length;

  return {
    tenantId: input.tenantId,
    eventCount: events.length,
    bookingAttributedEvents,
    portfolioAttributedEvents,
    topCampaigns: campaigns.map((campaign) => ({
      source: campaign.source,
      medium: campaign.medium,
      campaign: campaign.campaign,
      eventCount: campaign.eventCount,
      bookingRequestCount: campaign.bookingRequestCount,
      firstSeenAt: campaign.firstSeenAt.toISOString(),
      lastSeenAt: campaign.lastSeenAt.toISOString(),
    })),
    recentEvents: events.map((event) => ({
      name: event.name,
      source: event.source,
      medium: event.medium,
      campaign: event.campaign,
      hasBookingRequestAttribution: Boolean(event.bookingRequestId),
      hasPortfolioAttribution: Boolean(event.portfolioItemId),
      occurredAt: event.occurredAt.toISOString(),
    })),
    rawPayloadIncluded: false,
    tenantScoped: true,
    artifactPath: "coverage/seo-analytics-dashboard-report.json",
  };
};

export const seoAnalyticsAttributionRuntimeMatrix: readonly SeoAnalyticsAttributionRuntimeMatrixEntry[] = [
  { id: "analytics-typecheck", command: "pnpm --filter @inkroute/analytics typecheck", artifact: "coverage/seo-analytics-analytics-typecheck.txt", status: "wired" },
  { id: "analytics-tests", command: "pnpm --filter @inkroute/analytics test", artifact: "coverage/seo-analytics-analytics-test.txt", status: "wired" },
  { id: "local-evidence-writer", command: "pnpm seo:analytics-attribution-evidence", artifact: "coverage/seo-analytics-attribution.json", status: "wired" },
  { id: "public-cookie-capture", command: "public route UTM/portfolio cookie contract", artifact: "coverage/seo-analytics-public-cookie-capture.json", status: "wired" },
  { id: "ingestion-redaction", command: "public analytics ingestion redaction contract", artifact: "coverage/seo-analytics-ingestion-redaction.json", status: "wired" },
  { id: "idempotency-store", command: "analytics ingestion idempotency storage tests", artifact: "coverage/seo-analytics-idempotency-store.json", status: "persistence-gated" },
  { id: "event-persistence", command: "seeded AnalyticsEvent persistence tests", artifact: "coverage/seo-analytics-event-persistence.json", status: "persistence-gated" },
  { id: "campaign-persistence", command: "seeded Campaign persistence tests", artifact: "coverage/seo-analytics-campaign-persistence.json", status: "persistence-gated" },
  { id: "dashboard-reporting", command: "tenant-scoped dashboard SEO analytics report tests", artifact: "coverage/seo-analytics-dashboard-report.json", status: "dashboard-gated" },
  { id: "search-console-import", command: "Search Console import fixture and credential-bound job tests", artifact: "coverage/search-console-import-fixture.json", status: "provider-gated" },
  { id: "playwright-click-through", command: "Playwright public portfolio-to-booking attribution tests", artifact: "coverage/playwright-seo-attribution-results.json", status: "integration-gated" },
  { id: "booking-attribution-integration", command: "seeded BookingRequest attribution integration tests", artifact: "coverage/seo-analytics-booking-attribution-integration.json", status: "integration-gated" },
  { id: "ci-seo-analytics-job", command: "GitHub Actions SEO analytics attribution job", artifact: "coverage/seo-analytics-ci-evidence.json", status: "ci-gated" },
  { id: "secret-safe-artifacts", command: "redacted SEO analytics artifact audit", artifact: "coverage/seo-analytics-secret-safe-artifacts.json", status: "ci-gated" },
] as const;

export function attributionCookiesForUrl(url: string, portfolioItemId?: string) {
  const utm = parseUtmAttribution(url);
  const parsed = new URL(url, "https://inkroute.local");
  return {
    ...(utm.source ? { [seoAttributionCookieNames.source]: utm.source } : {}),
    ...(utm.medium ? { [seoAttributionCookieNames.medium]: utm.medium } : {}),
    ...(utm.campaign ? { [seoAttributionCookieNames.campaign]: utm.campaign } : {}),
    ...(portfolioItemId ? { [seoAttributionCookieNames.portfolioItemId]: portfolioItemId } : {}),
    [seoAttributionCookieNames.landingPath]: parsed.pathname,
  };
}

export function buildPublicSeoAnalyticsEvent(input: {
  tenantId: string;
  name: AnalyticsEventName;
  url: string;
  portfolioItemId?: string;
  city?: string;
  style?: string;
  bookingRequestId?: string;
  now?: string;
}) {
  const utm = parseUtmAttribution(input.url);
  const payload: AnalyticsEventPayload = {
    tenantId: input.tenantId,
    ...(input.bookingRequestId ? { bookingRequestId: input.bookingRequestId } : {}),
    ...(input.portfolioItemId ? { portfolioItemId: input.portfolioItemId } : {}),
    ...(input.city ? { city: input.city } : {}),
    ...(input.style ? { style: input.style } : {}),
    ...(utm.source ? { source: utm.source } : {}),
    ...(utm.medium ? { medium: utm.medium } : {}),
    ...(utm.campaign ? { campaign: utm.campaign } : {}),
    createdAt: input.now ?? new Date().toISOString(),
  };
  return normalizeAnalyticsEvent(input.name, createAnalyticsEvent(input.name, payload).payload);
}

export function redactAnalyticsPayload(payload: AnalyticsEventPayload): AnalyticsEventPayload {
  return {
    tenantId: payload.tenantId,
    ...(payload.artistId ? { artistId: payload.artistId } : {}),
    ...(payload.clientId ? { clientId: payload.clientId } : {}),
    ...(payload.bookingRequestId ? { bookingRequestId: payload.bookingRequestId } : {}),
    ...(payload.portfolioItemId ? { portfolioItemId: payload.portfolioItemId } : {}),
    ...(payload.city ? { city: payload.city } : {}),
    ...(payload.style ? { style: payload.style } : {}),
    ...(payload.source ? { source: payload.source } : {}),
    ...(payload.medium ? { medium: payload.medium } : {}),
    ...(payload.campaign ? { campaign: payload.campaign } : {}),
    createdAt: payload.createdAt,
  };
}

export function buildSeoAnalyticsAttributionContract(): SeoAnalyticsRuntimeReadinessPlan {
  return buildSeoAnalyticsRuntimeReadinessPlan({
    packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
    analyticsPackageTestsPassed: false,
    analyticsPackageTypecheckPassed: false,
    publicRouteUtmCaptureImplemented: true,
    analyticsIngestionApiImplemented: true,
    eventPersistenceAvailable: true,
    campaignTrackingPersistenceAvailable: true,
    portfolioAttributionCookieOrSessionConfigured: true,
    bookingRequestAttributionPersistenceAvailable: true,
    searchConsoleImportConfigured: false,
    searchConsoleCredentialsConfigured: false,
    dashboardReportingImplemented: true,
    tenantScopedReportingEnforced: true,
    attributionWindowConfigured: true,
    privacyRedactionConfigured: true,
    idempotencyStoreAvailable: true,
    playwrightClickThroughAttributionPassed: false,
    persistedBookingAttributionTestsPassed: false,
    searchConsoleImportTestsPassed: false,
    dashboardAnalyticsTestsPassed: true,
  });
}

export const seoAnalyticsAttributionContract = buildSeoAnalyticsAttributionContract();

