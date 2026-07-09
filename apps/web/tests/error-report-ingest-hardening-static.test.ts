import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildAbuseMonitoringDecision,
  buildErrorReportIngestArtifactReview,
  buildErrorReportIngestEvidenceDecision,
  buildErrorReportIngestExecutionPlan,
  buildProviderForwardingDecision,
  buildRedactedErrorReportIngestArtifact,
  buildRequestCorrelation,
  enforceErrorReportBotProtection,
  errorReportBotHeaders,
  errorReportIngestDecisionRequiredEvidence,
  errorReportIngestArtifactPaths,
  errorReportIngestExecutionPolicy,
  errorReportIngestHardeningProofFiles,
  errorReportIngestHardeningCommands,
  errorReportIngestHardeningContract,
  errorReportIngestHardeningMatrix,
  errorReportIngestRequiredExternalEvidence,
} from "../lib/errorReportIngestHardening";

const routeSource = readFileSync(join(process.cwd(), "apps/web/app/api/public/[tenantSlug]/error-reports/route.ts"), "utf8");
const dashboardRouteSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/error-reports/route.ts"), "utf8");
const ciWorkflow = readFileSync(join(process.cwd(), ".github/workflows/ci.yml"), "utf8");
const unitManifest = readFileSync(join(process.cwd(), "testing/manifests/unit-test-manifest.json"), "utf8");
const gapTracker = readFileSync(join(process.cwd(), "GAP_TRACKER.md"), "utf8");
const prismaSchema = readFileSync(join(process.cwd(), "packages/db/prisma/schema.prisma"), "utf8");

describe("GAP-081 error-report ingest hardening", () => {
  it("propagates request IDs and trace context through public ingest", () => {
    const headers = new Headers({ [errorReportBotHeaders.requestId]: "req-test-1", [errorReportBotHeaders.traceparent]: "00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01" });
    const correlation = buildRequestCorrelation(headers);
    expect(correlation.requestId).toBe("req-test-1");
    expect(correlation.traceparent).toContain("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    expect(routeSource).toContain("buildRequestCorrelation(request.headers)");
    expect(routeSource).toContain("requestId: correlation.requestId");
    expect(routeSource).toContain("traceparent: correlation.traceparent");
  });

  it("adds bot protection and abuse monitoring before provider forwarding", () => {
    expect(enforceErrorReportBotProtection(new Headers({ [errorReportBotHeaders.honeypot]: "bot" })).allowed).toBe(false);
    expect(enforceErrorReportBotProtection(new Headers(), { ERROR_REPORT_BOT_PROTECTION_TOKEN: "secret" } as NodeJS.ProcessEnv).allowed).toBe(false);
    expect(enforceErrorReportBotProtection(new Headers({ [errorReportBotHeaders.token]: "secret" }), { ERROR_REPORT_BOT_PROTECTION_TOKEN: "secret" } as NodeJS.ProcessEnv).allowed).toBe(true);
    expect(enforceErrorReportBotProtection(new Headers(), { NODE_ENV: "production" } as NodeJS.ProcessEnv)).toMatchObject({
      allowed: false,
      status: "blocked_missing_token",
    });
    expect(enforceErrorReportBotProtection(new Headers(), { NODE_ENV: "development" } as NodeJS.ProcessEnv)).toMatchObject({
      allowed: true,
      status: "monitor_only",
    });
    expect(routeSource).toContain("blocked_missing_token");
    expect(buildAbuseMonitoringDecision({ tenantId: "tenant_1", requestId: "req_1", rateLimitRemaining: 0, botStatus: "verified" }).status).toBe("watch_spike");
    expect(routeSource).toContain("BOT_PROTECTION_FAILED");
    expect(routeSource).toContain("buildAbuseMonitoringDecision");
  });

  it("persists database-path abuse and rate-limit decisions through AbuseEvent", () => {
    expect(prismaSchema).toContain("model AbuseEvent");
    expect(prismaSchema).toContain("limiterProvider        String?");
    expect(prismaSchema).toContain("limiterDecision        String");
    expect(prismaSchema).toContain("botChallengeRequired   Boolean");
    expect(prismaSchema).toContain("redactedMetadata       Json?");
    expect(routeSource).toContain("tx.abuseEvent.create");
    expect(routeSource).toContain('routePattern: "/api/public/[tenantSlug]/error-reports"');
    expect(routeSource).toContain('limiterProvider: "local-runtime-fallback"');
    expect(routeSource).toContain('limiterDecision: rateLimit.allowed ? "allowed" : "blocked"');
    expect(routeSource).toContain("botChallengeRequired: botProtection.status !== \"verified\"");
    expect(routeSource).toContain("buildSafePublicErrorReportPreview");
    expect(routeSource).toContain("stackHashStored: Boolean");
    expect(routeSource).toContain("stackHashEchoed: false");
    expect(routeSource).toContain("abuseEventId");
  });

  it("keeps provider forwarding credential gated and redacted only", () => {
    const blocked = buildProviderForwardingDecision({ requestId: "req_1" });
    const ready = buildProviderForwardingDecision({ requestId: "req_1", env: { SENTRY_DSN: "dsn", SENTRY_WEBHOOK_SECRET: "secret" } as NodeJS.ProcessEnv });
    expect(blocked.status).toBe("blocked_missing_credentials");
    expect(ready.status).toBe("ready_for_redacted_forwarding");
    expect(ready.sanitizedOnly).toBe(true);
    expect(routeSource).toContain("providerForwarding");
    expect(routeSource).toContain("SENTRY_WEBHOOK_SECRET");
  });

  it("retains dashboard tenant/RBAC and redacted metadata boundaries", () => {
    expect(dashboardRouteSource).toContain('assertPermission(actor, "error:read")');
    expect(dashboardRouteSource).toContain('assertPermission(actor, "error:write")');
    expect(dashboardRouteSource).toContain("redactedMetadata");
    expect(dashboardRouteSource).toContain('"Cache-Control": "no-store"');
    expect(dashboardRouteSource).toContain("noStoreHeaders");
    expect(dashboardRouteSource).toContain("{ status: 201, headers: noStoreHeaders }");
  });

  it("pins the error-report ingest hardening command and artifact matrix", () => {
    expect(errorReportIngestHardeningCommands).toEqual([
      "pnpm --filter @inkroute/observability typecheck",
      "pnpm --filter @inkroute/observability test",
      "pnpm vitest run apps/web/tests/error-report-ingest-hardening-static.test.ts apps/web/tests/observability-routes.test.ts apps/dashboard/tests/error-report-route-static.test.ts",
      "distributed error-report rate-limit provider integration tests",
      "live Postgres ErrorReport tenant-isolation fixtures",
      "provider forwarding replay/no-PII smoke",
      "redacted persistence no-PII artifact audit",
    ]);
    expect(errorReportIngestHardeningMatrix.map((entry) => entry.id)).toEqual([
      "observability-typecheck",
      "observability-tests",
      "route-static-contracts",
      "bot-protection",
      "request-correlation",
      "distributed-rate-limit",
      "postgres-tenant-isolation",
      "provider-forwarding",
      "provider-replay-no-pii",
      "redacted-persistence-no-pii",
      "ci-error-report-ingest-gate",
      "secret-safe-artifacts",
    ]);
  });

  it("builds a local execution plan without distributed provider, live Postgres, or forwarding", () => {
    const plan = buildErrorReportIngestExecutionPlan();

    expect(plan.id).toBe("gap-081-error-report-ingest-hardening");
    expect(plan.distributedRateLimitProviderAllowed).toBe(false);
    expect(plan.livePostgresAllowed).toBe(false);
    expect(plan.providerForwardingAllowed).toBe(false);
    expect(plan.policy).toBe(errorReportIngestExecutionPolicy);
    expect(plan.policy).toEqual({
      executeDistributedRateLimitProvider: false,
      executeLivePostgresFixtures: false,
      executeProviderForwarding: false,
      executeProviderReplay: false,
      executePersistenceNoPiiAudit: false,
      executeCi: false,
    });
    expect(plan.requiredCommands).toBe(errorReportIngestHardeningCommands);
    expect(plan.requiredArtifacts).toBe(errorReportIngestArtifactPaths);
    expect(plan.localContractArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/error-report-route-static-contracts.json",
        "coverage/error-report-bot-protection.json",
        "coverage/error-report-request-correlation.json",
      ]),
    );
    expect(plan.providerArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/error-report-distributed-rate-limit.json",
        "coverage/error-report-provider-forwarding-redacted.json",
        "coverage/error-report-provider-replay-no-pii-redacted.json",
      ]),
    );
    expect(plan.databaseArtifacts).toEqual(["coverage/error-report-postgres-tenant-isolation.json"]);
    expect(plan.privacyArtifacts).toEqual(["coverage/error-report-redacted-persistence-no-pii.json"]);
    expect(plan.secretSafeArtifactPath).toBe("coverage/error-report-secret-safe-artifacts.json");
    expect(plan.externalEvidenceRequired).toBe(errorReportIngestRequiredExternalEvidence);
    expect(plan.externalEvidenceRequired).toEqual([
      "distributed rate-limit provider execution",
      "live Postgres ErrorReport and AbuseEvent tenant-isolation fixtures",
      "redacted provider forwarding proof",
      "provider forwarding replay/no-PII smoke",
      "redacted persistence no-PII audit, CI evidence, and secret-safe artifacts",
    ]);
  });

  it("redacts error-report ingest artifacts before persistence", () => {
    const rawArtifact = {
      requestId: "req_123",
      traceparent: "00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01",
      provider: {
        authorization: "Bearer sentry-forwarding-token",
        headers: { cookie: "inkroute_session=private", "x-forwarded-for": "10.1.2.3" },
        idempotencyKey: "idem_error_report_private",
        providerEventId: "evt_error_report_private",
        replayBody: "client tester@example.com phone +1 555 010 6666 ip 10.1.2.3",
      },
      persistence: {
        errorReportId: "error_report_private",
        fingerprint: "fingerprint_private",
        rawBody: "stack trace with private booking note",
        sessionId: "session_private",
        tenantId: "tenant_1",
        userId: "user_private",
      },
      decision: "blocked_missing_credentials",
    };

    const redacted = buildRedactedErrorReportIngestArtifact(rawArtifact);
    const review = buildErrorReportIngestArtifactReview("error-report-provider-forwarding", rawArtifact);
    const serialized = JSON.stringify(review.redactedArtifact);

    expect(JSON.stringify(redacted)).not.toContain("sentry-forwarding-token");
    expect(serialized).not.toContain("req_123");
    expect(serialized).not.toContain("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    expect(serialized).not.toContain("inkroute_session");
    expect(serialized).not.toContain("idem_error_report_private");
    expect(serialized).not.toContain("evt_error_report_private");
    expect(serialized).not.toContain("tester@example.com");
    expect(serialized).not.toContain("+1 555 010 6666");
    expect(serialized).not.toContain("10.1.2.3");
    expect(serialized).not.toContain("error_report_private");
    expect(serialized).not.toContain("fingerprint_private");
    expect(serialized).not.toContain("private booking note");
    expect(serialized).not.toContain("session_private");
    expect(serialized).not.toContain("tenant_1");
    expect(serialized).not.toContain("user_private");
    expect(serialized).toContain("blocked_missing_credentials");
    expect(review.safeToPersist).toBe(true);
    expect(review.unsafeFindings).toEqual([]);
    expect(review.requiredArtifactPath).toBe("coverage/error-report-secret-safe-artifacts.json");
  });

  it("pins current error-report ingest hardening proof files for GAP-081", () => {
    expect(errorReportIngestHardeningProofFiles).toEqual(
      expect.arrayContaining([
      "packages/observability/package.json",
        "apps/web/lib/errorReportIngestHardening.ts",
        "apps/web/app/api/public/[tenantSlug]/error-reports/route.ts",
        "apps/dashboard/app/api/error-reports/route.ts",
        "apps/dashboard/tests/error-report-route-static.test.ts",
        "apps/web/tests/error-report-ingest-hardening-static.test.ts",
        "apps/web/tests/observability-routes.test.ts",
        "packages/db/prisma/schema.prisma",
        "packages/observability/src/index.ts",
        "packages/observability/tests/redaction-report.test.ts",
        "packages/validators/src/observability.ts",
        ".github/workflows/ci.yml",
        "testing/manifests/unit-test-manifest.json",
      ]),
    );
    for (const file of errorReportIngestHardeningProofFiles) {
      expect(readFileSync(join(process.cwd(), file), "utf8").length).toBeGreaterThan(0);
    }
  });

  it("tracks remaining live Postgres, distributed rate limit, and no-PII proof blockers", () => {
    expect(errorReportIngestHardeningContract.status).toBe("blocked");
    expect(errorReportIngestHardeningContract.requiredEvidence).toEqual(
      expect.arrayContaining([
        "public ingest tenant, validation, bot-protection, and distributed rate-limit evidence",
        "provider forwarding, webhook signature, replay, and no-PII payload evidence",
        "abuse monitoring, request ID, and trace propagation evidence",
      ]),
    );
    expect(errorReportIngestArtifactPaths).toContain("coverage/error-report-postgres-tenant-isolation.json");
    expect(errorReportIngestArtifactPaths).toContain("coverage/error-report-provider-replay-no-pii-redacted.json");
    expect(errorReportIngestArtifactPaths).toContain("coverage/error-report-secret-safe-artifacts.json");
    expect(errorReportIngestArtifactPaths).toContain("test-results/error-report-ingest");
  });

  it("classifies GAP-081 error-report ingest evidence as blocked until every hardening artifact is captured", () => {
    const blocked = buildErrorReportIngestEvidenceDecision({
      observabilityTypecheckPassed: true,
      observabilityTestsPassed: true,
      routeStaticContractsPassed: true,
      botProtectionVerified: true,
      requestCorrelationVerified: true,
      distributedRateLimitVerified: false,
      postgresTenantIsolationVerified: false,
      providerForwardingVerified: false,
      providerReplayNoPiiVerified: false,
      redactedPersistenceNoPiiVerified: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactReviewPassed: false,
      capturedArtifacts: ["coverage/error-report-ingest-hardening.json"],
    });

    expect(blocked.status).toBe("blocked");
    expect(blocked.blockers).toEqual(
      expect.arrayContaining([
        "Distributed error-report rate-limit provider evidence is required.",
        "Live Postgres ErrorReport tenant-isolation evidence is required.",
        "Redacted provider forwarding evidence is required.",
        "Provider forwarding replay/no-PII evidence is required.",
        "Redacted persistence no-PII artifact audit evidence is required.",
      ]),
    );
    expect(blocked.missingArtifacts).toContain("coverage/error-report-distributed-rate-limit.json");
    expect(blocked.requiredCommands).toBe(errorReportIngestHardeningCommands);
    expect(blocked.requiredEvidence).toBe(errorReportIngestDecisionRequiredEvidence);

    const complete = buildErrorReportIngestEvidenceDecision({
      observabilityTypecheckPassed: true,
      observabilityTestsPassed: true,
      routeStaticContractsPassed: true,
      botProtectionVerified: true,
      requestCorrelationVerified: true,
      distributedRateLimitVerified: true,
      postgresTenantIsolationVerified: true,
      providerForwardingVerified: true,
      providerReplayNoPiiVerified: true,
      redactedPersistenceNoPiiVerified: true,
      ciEvidenceCaptured: true,
      secretSafeArtifactReviewPassed: true,
      capturedArtifacts: errorReportIngestArtifactPaths,
    });

    expect(complete.status).toBe("complete");
    expect(complete.blockers).toEqual([]);
    expect(complete.missingArtifacts).toEqual([]);
    expect(complete.redactedSummary).toContain("CI-safe redacted artifacts captured");
  });

  it("keeps CI, manifest, and tracker evidence tied to GAP-081", () => {
    expect(ciWorkflow).toContain("Run Phase 11 error-report ingest hardening contracts");
    expect(ciWorkflow).toContain("error-report-ingest-hardening-static.test.ts");
    expect(ciWorkflow).toContain("error-report-ingest-hardening-artifacts");
    expect(ciWorkflow).toContain("coverage/error-report-ci-evidence.json");
    expect(unitManifest).toContain("errorReportIngestHardeningMatrix");
    expect(gapTracker).toContain("errorReportIngestDecisionRequiredEvidence");
    expect(gapTracker).toContain("Error-report ingest evidence classifier wired and runtime-matrix gated");
  });
});
