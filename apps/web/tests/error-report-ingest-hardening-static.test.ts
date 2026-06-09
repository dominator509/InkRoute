import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildAbuseMonitoringDecision,
  buildProviderForwardingDecision,
  buildRequestCorrelation,
  enforceErrorReportBotProtection,
  errorReportBotHeaders,
  errorReportIngestArtifactPaths,
  errorReportIngestHardeningContract,
} from "../lib/errorReportIngestHardening";

const routeSource = readFileSync(join(process.cwd(), "apps/web/app/api/public/[tenantSlug]/error-reports/route.ts"), "utf8");
const dashboardRouteSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/error-reports/route.ts"), "utf8");

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
    expect(buildAbuseMonitoringDecision({ tenantId: "tenant_1", requestId: "req_1", rateLimitRemaining: 0, botStatus: "verified" }).status).toBe("watch_spike");
    expect(routeSource).toContain("BOT_PROTECTION_FAILED");
    expect(routeSource).toContain("buildAbuseMonitoringDecision");
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
    expect(errorReportIngestArtifactPaths).toContain("test-results/error-report-ingest");
  });
});
