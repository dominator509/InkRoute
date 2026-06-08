import { describe, expect, it } from "vitest";
import {
  buildAgenticBugFixWorkflow,
  buildAlertEscalationPlan,
  buildAlertRoute,
  buildGithubIssueDraft,
  buildObservabilityReportDraft,
  buildSentrySdkConfigurationPlan,
  buildStackHash,
  classifyErrorSeverity,
  redactMetadata,
  redactSensitiveText,
} from "../src/index";

describe("observability redaction and triage", () => {
  it("redacts sensitive text before report persistence", () => {
    const redacted = redactSensitiveText("Client email avery@example.com token sk_live_secret appears in a crash");

    expect(redacted.text).not.toContain("avery@example.com");
    expect(redacted.text).not.toContain("sk_live_secret");
    expect(redacted.redactionLevel).not.toBe("none_detected");
  });

  it("builds stable hashes and agentic bug-fix workflows", () => {
    const report = buildObservabilityReportDraft({
      tenantId: "tenant_1",
      source: "api",
      runtime: "server",
      environment: "preview",
      message: "Stripe webhook rejected",
      route: "/api/webhooks/stripe",
      handled: false,
      statusCode: 500,
      metadata: { email: "client@example.com", bookingId: "booking_1" },
    });

    expect(report.severity).toBe("critical");
    expect(report.redactedMetadata.email).not.toBe("client@example.com");
    expect(buildStackHash({ message: "Stripe webhook rejected", route: "/api/webhooks/stripe", source: "api" })).toHaveLength(12);
    expect(buildAgenticBugFixWorkflow(report).length).toBeGreaterThan(3);
  });

  it("redacts nested metadata and high-risk keys", () => {
    const redacted = redactMetadata({
      authorization: "Bearer sk_live_secret",
      nested: {
        clientEmail: "avery@example.com",
        notes: ["Call 206-555-0199 before session"],
      },
      bookingId: "booking_1",
    });

    expect(redacted.metadata.authorization).toBe("[redacted:sensitive-field]");
    expect(redacted.metadata.bookingId).toBe("booking_1");
    expect(JSON.stringify(redacted.metadata)).not.toContain("avery@example.com");
    expect(JSON.stringify(redacted.metadata)).not.toContain("206-555-0199");
    expect(redacted.redactionLevel).toBe("sensitive_context_removed");
  });

  it("classifies severity for privacy, API, mobile, and handled reports", () => {
    expect(classifyErrorSeverity({ source: "web", message: "privacy export leaked pii", handled: true })).toBe("critical");
    expect(classifyErrorSeverity({ source: "api", message: "validation failed", handled: false })).toBe("high");
    expect(classifyErrorSeverity({ source: "mobile", message: "native crash on launch", handled: true })).toBe("high");
    expect(classifyErrorSeverity({ source: "dashboard", message: "handled empty state", handled: true })).toBe("low");
  });

  it("routes alerts by severity and redaction risk", () => {
    expect(buildAlertRoute({ severity: "medium", source: "web", alertRecommended: false, redactionLevel: "none_detected" })).toMatchObject({
      channel: "dashboard",
      shouldNotifyNow: false,
    });
    expect(buildAlertRoute({ severity: "critical", source: "api", alertRecommended: true, redactionLevel: "standard_redaction" })).toMatchObject({
      channel: "pager",
      escalationMinutes: 15,
    });
    expect(buildAlertRoute({ severity: "critical", source: "api", alertRecommended: true, redactionLevel: "blocked_high_risk_payload" })).toMatchObject({
      channel: "dashboard",
      shouldNotifyNow: true,
    });
  });

  it("builds a ready critical alert escalation plan with sanitized pager payloads", () => {
    const report = buildObservabilityReportDraft({
      source: "api",
      runtime: "server",
      environment: "production",
      message: "Payment privacy failure for avery@example.com",
      route: "/api/payments/webhook",
      release: "ops-2026.06.08.1",
      handled: false,
      metadata: { token: "sk_live_secret", bookingId: "booking_alert_test" },
    });
    const plan = buildAlertEscalationPlan({
      report,
      slackWebhookConfigured: true,
      emailProviderConfigured: true,
      pagerProviderConfigured: true,
      onCallOwner: "release-owner",
    });

    expect(plan.status).toBe("ready");
    expect(plan.provider).toBe("pager");
    expect(plan.route.escalationMinutes).toBe(15);
    expect(plan.sanitizedPayload.message).toContain("[redacted:email]");
    expect(plan.sanitizedPayload.message).not.toContain("avery@example.com");
    expect(JSON.stringify(plan.sanitizedPayload)).not.toContain("sk_live_secret");
    expect(plan.escalationRunbook.join(" ")).toContain("release-owner");
  });

  it("blocks high-severity Slack escalation when provider config and quiet-hours policy are missing", () => {
    const report = buildObservabilityReportDraft({
      source: "mobile",
      runtime: "react-native",
      environment: "production",
      message: "native crash on launch",
      route: "apps/mobile/Home",
      handled: false,
    });
    const plan = buildAlertEscalationPlan({
      report,
      slackWebhookConfigured: false,
      emailProviderConfigured: false,
      pagerProviderConfigured: true,
      quietHoursActive: true,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.provider).toBe("slack");
    expect(plan.blockers).toEqual(
      expect.arrayContaining([
        "Slack webhook is required for high-severity alert delivery.",
        "On-call owner must be assigned before production alert routing is ready.",
        "Quiet-hours policy must defer non-critical external alerts to dashboard triage.",
      ]),
    );
  });

  it("suppresses external alert delivery for blocked high-risk payloads", () => {
    const report = buildObservabilityReportDraft({
      source: "api",
      runtime: "server",
      environment: "production",
      message: "tenant isolation critical incident",
      route: "/api/private",
      handled: false,
      statusCode: 500,
    });
    const plan = buildAlertEscalationPlan({
      report: { ...report, redactionLevel: "blocked_high_risk_payload" },
      slackWebhookConfigured: false,
      emailProviderConfigured: false,
      pagerProviderConfigured: false,
      onCallOwner: "privacy-lead",
    });

    expect(plan.status).toBe("ready");
    expect(plan.provider).toBe("dashboard");
    expect(plan.suppressExternalDelivery).toBe(true);
    expect(plan.route.channel).toBe("dashboard");
    expect(plan.escalationRunbook.join(" ")).toContain("dashboard-only review");
  });

  it("builds sanitized GitHub issue drafts without raw sensitive values", () => {
    const report = buildObservabilityReportDraft({
      source: "webhook",
      runtime: "provider-webhook",
      environment: "preview",
      message: "Payment webhook failed for client avery@example.com",
      route: "/api/webhooks/stripe",
      handled: false,
      metadata: { token: "sk_live_secret" },
    });
    const issue = buildGithubIssueDraft(report);

    expect(issue.blocked).toBe(true);
    expect(issue.labels).toContain("severity:critical");
    expect(issue.body).toContain("[redacted:email]");
    expect(issue.body).not.toContain("avery@example.com");
    expect(issue.body).not.toContain("sk_live_secret");
  });

  it("plans a ready Sentry Next.js runtime with redaction and source-map gates", () => {
    const plan = buildSentrySdkConfigurationPlan({
      surface: "web-nextjs",
      dsnConfigured: true,
      authTokenConfigured: true,
      orgConfigured: true,
      projectConfigured: true,
      release: "web-2026.06.08.1",
      environment: "production",
      sourceMapsEnabled: true,
      beforeSendRedactionEnabled: true,
      tenantTaggingEnabled: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.requiredPackages).toEqual(["@sentry/nextjs"]);
    expect(plan.providerBoundaryIds).toEqual(["sentry-nextjs"]);
    expect(plan.configFiles).toContain("apps/web/sentry.server.config.ts");
    expect(plan.sourceMapUploadRequired).toBe(true);
    expect(plan.debugSymbolsRequired).toBe(false);
    expect(plan.beforeSendPipeline).toContain("redactSensitiveText");
    expect(plan.releaseTags).toMatchObject({
      release: "web-2026.06.08.1",
      environment: "production",
      surface: "web-nextjs",
    });
    expect(plan.sampleRate).toBe(0.25);
    expect(plan.tracesSampleRate).toBe(0.1);
  });

  it("blocks mobile Sentry readiness until credentials, redaction, tenant tags, and debug symbols are present", () => {
    const plan = buildSentrySdkConfigurationPlan({
      surface: "mobile-expo",
      dsnConfigured: false,
      authTokenConfigured: false,
      orgConfigured: true,
      projectConfigured: false,
      release: "",
      environment: "preview",
      sourceMapsEnabled: false,
      debugSymbolsEnabled: false,
      beforeSendRedactionEnabled: false,
      tenantTaggingEnabled: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.requiredPackages).toEqual(["@sentry/react-native"]);
    expect(plan.providerBoundaryIds).toEqual(["sentry-react-native"]);
    expect(plan.requiredEnv).toContain("EXPO_PUBLIC_SENTRY_DSN");
    expect(plan.debugSymbolsRequired).toBe(true);
    expect(plan.blockers).toEqual(
      expect.arrayContaining([
        "Sentry DSN is not configured for this runtime surface.",
        "SENTRY_AUTH_TOKEN is required for release artifact upload.",
        "SENTRY_PROJECT is required for release artifact upload.",
        "Sentry release tag is required before runtime capture can be enabled.",
        "beforeSend redaction must call redactSensitiveText and redactMetadata before event submission.",
        "Tenant-safe tags must be emitted without customer PII or medical/payment data.",
        "Expo JavaScript source-map upload must be enabled for mobile releases.",
        "React Native debug symbol upload must be enabled and verified through EAS.",
      ]),
    );
  });
});
