import { describe, expect, it } from "vitest";
import {
  buildAgenticBugFixWorkflow,
  buildAlertEscalationPlan,
  buildAlertRoute,
  buildAlertRuntimeDeliveryReadinessPlan,
  buildErrorReportIngestHardeningPlan,
  buildGithubIssueAutomationPlan,
  buildGithubIssueDraft,
  buildGithubIssueRuntimeDispatchPlan,
  buildMobileCrashRuntimeReadinessPlan,
  buildObservabilityAutomatedCoverageReadinessPlan,
  buildObservabilityReportDraft,
  buildObservabilityRuntimeReadinessPlan,
  buildObservabilityRuntimeVerificationPlan,
  buildOpenTelemetryRuntimeReadinessPlan,
  buildProviderWebhookReconciliationPlan,
  buildReleaseIncidentLinkagePlan,
  buildReleaseIncidentRuntimeReadinessPlan,
  buildSentrySdkConfigurationPlan,
  buildSentrySdkRuntimeImplementationPlan,
  buildStackHash,
  buildTelemetryPipelinePlan,
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

  it("plans ready runtime alert delivery with worker, schedule, acknowledgement, and live provider proof", () => {
    const plan = buildAlertRuntimeDeliveryReadinessPlan({
      packageScripts: ["test", "typecheck"],
      observabilityTestsPassed: true,
      observabilityTypecheckPassed: true,
      slackCredentialsConfigured: true,
      emailCredentialsConfigured: true,
      pagerCredentialsConfigured: true,
      durableAlertWorkerConfigured: true,
      retryBackoffConfigured: true,
      deadLetterQueueConfigured: true,
      onCallScheduleIntegrated: true,
      quietHoursPolicyConfigured: true,
      acknowledgementStateStored: true,
      sanitizedPayloadsVerified: true,
      dashboardOnlySuppressionVerified: true,
      liveCriticalPagerDeliveryVerified: true,
      liveHighSlackDeliveryVerified: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.missingScripts).toEqual([]);
    expect(plan.requiredEvidence).toEqual([]);
    expect(plan.blockers).toEqual([]);
    expect(plan.requiredCommands).toContain("live synthetic critical pager delivery");
    expect(plan.requiredControls).toContain("Deliver alerts through a durable worker with retry, backoff, and dead-letter handling.");
  });

  it("blocks runtime alert delivery until provider credentials, worker delivery, schedules, acknowledgements, and live proof exist", () => {
    const plan = buildAlertRuntimeDeliveryReadinessPlan({
      packageScripts: ["test"],
      observabilityTestsPassed: true,
      observabilityTypecheckPassed: false,
      slackCredentialsConfigured: false,
      emailCredentialsConfigured: false,
      pagerCredentialsConfigured: false,
      durableAlertWorkerConfigured: false,
      retryBackoffConfigured: false,
      deadLetterQueueConfigured: false,
      onCallScheduleIntegrated: false,
      quietHoursPolicyConfigured: false,
      acknowledgementStateStored: false,
      sanitizedPayloadsVerified: false,
      dashboardOnlySuppressionVerified: false,
      liveCriticalPagerDeliveryVerified: false,
      liveHighSlackDeliveryVerified: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredEvidence).toEqual([
      "Slack, email, and pager provider credential evidence",
      "durable alert worker retry/backoff and dead-letter evidence",
      "on-call schedule, quiet-hours policy, and acknowledgement-state evidence",
      "sanitized payload and dashboard-only suppression evidence",
      "live synthetic critical pager and high-severity Slack delivery evidence",
    ]);
    expect(plan.blockers).toEqual(
      expect.arrayContaining([
        "Missing @inkroute/observability typecheck script.",
        "@inkroute/observability typecheck must pass.",
        "Slack alert credentials must be configured in secrets.",
        "Durable alert worker delivery must be configured.",
        "On-call schedule integration must drive alert ownership.",
        "Alert acknowledgement state must be stored durably.",
        "Live synthetic critical pager delivery proof is required.",
      ]),
    );
  });

  it("builds privacy-safe telemetry correlation records with request and trace propagation", () => {
    const report = buildObservabilityReportDraft({
      tenantId: "tenant_telemetry",
      source: "api",
      runtime: "server",
      environment: "production",
      message: "Stripe webhook rejected for avery@example.com",
      route: "/api/webhooks/stripe",
      handled: false,
      statusCode: 500,
      metadata: { token: "sk_live_secret", bookingId: "booking_telemetry" },
    });
    const plan = buildTelemetryPipelinePlan({
      serviceName: "api",
      environment: "production",
      requestId: "req-payment-1",
      traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
      spanId: "00f067aa0ba902b7",
      route: "/api/webhooks/stripe",
      tenantId: "tenant_telemetry",
      errorReport: report,
      otlpEndpointConfigured: true,
      structuredLoggingEnabled: true,
      requestIdPropagationEnabled: true,
      traceContextPropagationEnabled: true,
      attributes: {
        clientEmail: "avery@example.com",
        authorization: "Bearer sk_live_secret",
        bookingId: "booking_telemetry",
      },
    });

    expect(plan.status).toBe("ready");
    expect(plan.sampleRate).toBe(0.1);
    expect(plan.exporter.requiredEnv).toContain("OTEL_EXPORTER_OTLP_ENDPOINT");
    expect(plan.logRecord).toMatchObject({
      serviceName: "api",
      environment: "production",
      requestId: "req-payment-1",
      traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
      spanId: "00f067aa0ba902b7",
      route: "/api/webhooks/stripe",
      tenantId: "tenant_telemetry",
      errorFingerprint: report.fingerprint,
      stackHash: report.stackHash,
      severity: "critical",
    });
    expect(plan.propagationHeaders["x-request-id"]).toBe("req-payment-1");
    expect(plan.propagationHeaders.traceparent).toContain("4bf92f3577b34da6a3ce929d0e0e4736");
    expect(JSON.stringify(plan.logRecord.attributes)).not.toContain("avery@example.com");
    expect(JSON.stringify(plan.logRecord.attributes)).not.toContain("sk_live_secret");
    expect(plan.logRecord.attributes.bookingId).toBe("booking_telemetry");
  });

  it("blocks telemetry export without OTLP wiring or when payload risk is too high", () => {
    const report = buildObservabilityReportDraft({
      source: "api",
      runtime: "server",
      environment: "production",
      message: "tenant isolation incident",
      route: "/api/private",
      handled: false,
      statusCode: 500,
    });
    const plan = buildTelemetryPipelinePlan({
      serviceName: "api",
      environment: "production",
      route: "/api/private",
      errorReport: { ...report, redactionLevel: "blocked_high_risk_payload" },
      otlpEndpointConfigured: false,
      structuredLoggingEnabled: false,
      requestIdPropagationEnabled: false,
      traceContextPropagationEnabled: false,
      sampleRate: 2,
      attributes: { medicalNotes: "client diagnosis details", route: "/api/private" },
    });

    expect(plan.status).toBe("blocked");
    expect(plan.sampleRate).toBe(1);
    expect(plan.blockers).toEqual(
      expect.arrayContaining([
        "OTLP exporter endpoint must be configured before external trace/log export.",
        "Structured logging must be enabled before request/error correlation is ready.",
        "Request ID propagation must be enabled across routes, workers, and provider callbacks.",
        "Trace context propagation must be enabled before distributed traces are useful.",
        "High-risk payloads must remain local/dashboard-only and cannot be exported to external telemetry sinks.",
      ]),
    );
    expect(plan.logRecord.attributes.medicalNotes).toBe("[redacted:sensitive-field]");
    expect(plan.privacyGuards.join(" ")).toContain("Do not export blocked_high_risk_payload");
  });

  it("plans ready OpenTelemetry runtime instrumentation with middleware, correlation, backend, and privacy proof", () => {
    const plan = buildOpenTelemetryRuntimeReadinessPlan({
      packageScripts: ["test", "typecheck"],
      observabilityTestsPassed: true,
      observabilityTypecheckPassed: true,
      otelSdkInstalled: true,
      otlpExporterInstalled: true,
      webMiddlewareInstrumented: true,
      dashboardMiddlewareInstrumented: true,
      apiRoutesInstrumented: true,
      workerRuntimeInstrumented: true,
      requestIdPropagationConfigured: true,
      traceContextPropagationConfigured: true,
      errorReportTraceCorrelationConfigured: true,
      structuredRuntimeLoggingConfigured: true,
      otlpEndpointConfigured: true,
      serviceMetadataConfigured: true,
      samplingPolicyConfigured: true,
      highRiskExportSuppressionVerified: true,
      liveTraceBackendIngestionVerified: true,
      liveLogBackendIngestionVerified: true,
      noPiiTelemetryVerified: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.missingScripts).toEqual([]);
    expect(plan.requiredEvidence).toEqual([]);
    expect(plan.blockers).toEqual([]);
    expect(plan.requiredCommands).toContain("live OTLP trace/log backend ingestion proof");
    expect(plan.requiredControls).toContain("Suppress blocked_high_risk_payload events from all external OTLP sinks.");
  });

  it("blocks OpenTelemetry runtime readiness until SDKs, middleware, correlation, export suppression, and live backend proof exist", () => {
    const plan = buildOpenTelemetryRuntimeReadinessPlan({
      packageScripts: ["test"],
      observabilityTestsPassed: true,
      observabilityTypecheckPassed: false,
      otelSdkInstalled: false,
      otlpExporterInstalled: false,
      webMiddlewareInstrumented: false,
      dashboardMiddlewareInstrumented: false,
      apiRoutesInstrumented: false,
      workerRuntimeInstrumented: false,
      requestIdPropagationConfigured: false,
      traceContextPropagationConfigured: false,
      errorReportTraceCorrelationConfigured: false,
      structuredRuntimeLoggingConfigured: false,
      otlpEndpointConfigured: false,
      serviceMetadataConfigured: false,
      samplingPolicyConfigured: false,
      highRiskExportSuppressionVerified: false,
      liveTraceBackendIngestionVerified: false,
      liveLogBackendIngestionVerified: false,
      noPiiTelemetryVerified: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredEvidence).toEqual([
      "OpenTelemetry SDK, OTLP exporter, endpoint, service metadata, and sampling evidence",
      "web, dashboard, API, and worker instrumentation middleware evidence",
      "request ID, trace context, ErrorReport correlation, and structured logging evidence",
      "blocked high-risk export suppression and no-PII telemetry evidence",
      "live OTLP trace and structured log backend ingestion evidence",
    ]);
    expect(plan.blockers).toEqual(
      expect.arrayContaining([
        "Missing @inkroute/observability typecheck script.",
        "@inkroute/observability typecheck must pass.",
        "OpenTelemetry SDK packages must be installed.",
        "Public web middleware must propagate OpenTelemetry request and trace context.",
        "ErrorReport persistence must store request ID, trace ID, fingerprint, and stackHash correlation.",
        "blocked_high_risk_payload telemetry export suppression must be verified.",
        "Live trace ingestion must be verified in the OTLP backend.",
      ]),
    );
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

  it("blocks GitHub issue automation until token, labels, assignees, template, and human approval are configured", () => {
    const report = buildObservabilityReportDraft({
      source: "webhook",
      runtime: "provider-webhook",
      environment: "preview",
      message: "Payment webhook failed for client avery@example.com",
      route: "/api/webhooks/stripe",
      handled: false,
      metadata: { token: "sk_live_secret" },
    });
    const plan = buildGithubIssueAutomationPlan({
      report,
      githubTokenConfigured: false,
      repositoryConfigured: false,
      labelsConfigured: ["bug"],
      assigneesConfigured: [],
      humanApproved: false,
      issueTemplateConfigured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.blockers).toEqual(
      expect.arrayContaining([
        "GitHub token must be configured before issue creation.",
        "GitHub repository target must be configured before issue creation.",
        "Missing configured GitHub labels: severity:critical, surface:webhook.",
        "Human approval is required before creating an agentic issue.",
        "Privacy-safe issue template must be configured before issue creation.",
        "At least one triage assignee must be configured.",
      ]),
    );
    expect(plan.createIssueRequest).toBeUndefined();
    expect(plan.draft.body).not.toContain("avery@example.com");
    expect(plan.draft.body).not.toContain("sk_live_secret");
  });

  it("builds a ready sanitized GitHub issue create request after human approval", () => {
    const previousRepository = process.env.GITHUB_REPOSITORY;
    process.env.GITHUB_REPOSITORY = "dominator509/InkRoute";
    const report = buildObservabilityReportDraft({
      source: "api",
      runtime: "server",
      environment: "production",
      message: "tenant isolation error for client avery@example.com",
      route: "/api/private",
      release: "ops-2026.06.08.2",
      handled: false,
      statusCode: 500,
      metadata: { authorization: "Bearer sk_live_secret", bookingId: "booking_issue_test" },
    });
    const plan = buildGithubIssueAutomationPlan({
      report,
      githubTokenConfigured: true,
      repositoryConfigured: true,
      labelsConfigured: ["bug", "severity:critical", "surface:api"],
      assigneesConfigured: ["codex-triage"],
      humanApproved: true,
      issueTemplateConfigured: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.createIssueRequest).toMatchObject({
      repository: "dominator509/InkRoute",
      labels: ["bug", "severity:critical", "surface:api"],
      assignees: ["codex-triage"],
    });
    expect(plan.reportLink).toMatchObject({
      errorReportFingerprint: report.fingerprint,
      stackHash: report.stackHash,
      route: "/api/private",
      release: "ops-2026.06.08.2",
    });
    expect(plan.createIssueRequest?.body).toContain("[redacted:email]");
    expect(plan.createIssueRequest?.body).not.toContain("avery@example.com");
    expect(plan.createIssueRequest?.body).not.toContain("sk_live_secret");

    if (previousRepository === undefined) {
      delete process.env.GITHUB_REPOSITORY;
    } else {
      process.env.GITHUB_REPOSITORY = previousRepository;
    }
  });

  it("plans ready GitHub issue runtime dispatch with dashboard approval, persistence, and live repo proof", () => {
    const plan = buildGithubIssueRuntimeDispatchPlan({
      packageScripts: ["test", "typecheck"],
      observabilityTestsPassed: true,
      observabilityTypecheckPassed: true,
      githubTokenConfigured: true,
      repositoryConfigured: true,
      labelsConfigured: true,
      assigneesConfigured: true,
      privacyTemplateConfigured: true,
      dashboardApprovalUiWired: true,
      humanApprovalAuditStored: true,
      githubApiCreateIssueWired: true,
      reportIssueLinkPersistenceConfigured: true,
      dashboardStatusSyncConfigured: true,
      highRiskDashboardOnlyBlockingVerified: true,
      sanitizedIssueBodyVerified: true,
      liveSyntheticIssueCreationVerified: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.missingScripts).toEqual([]);
    expect(plan.requiredEvidence).toEqual([]);
    expect(plan.blockers).toEqual([]);
    expect(plan.requiredCommands).toContain("live synthetic GitHub issue creation proof");
    expect(plan.requiredControls).toContain("Dispatch GitHub issues only from sanitized createIssueRequest payloads after explicit human approval.");
  });

  it("blocks GitHub issue runtime dispatch until approval UI, API dispatch, persisted links, privacy gates, and live proof exist", () => {
    const plan = buildGithubIssueRuntimeDispatchPlan({
      packageScripts: ["test"],
      observabilityTestsPassed: true,
      observabilityTypecheckPassed: false,
      githubTokenConfigured: false,
      repositoryConfigured: false,
      labelsConfigured: false,
      assigneesConfigured: false,
      privacyTemplateConfigured: false,
      dashboardApprovalUiWired: false,
      humanApprovalAuditStored: false,
      githubApiCreateIssueWired: false,
      reportIssueLinkPersistenceConfigured: false,
      dashboardStatusSyncConfigured: false,
      highRiskDashboardOnlyBlockingVerified: false,
      sanitizedIssueBodyVerified: false,
      liveSyntheticIssueCreationVerified: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredEvidence).toEqual([
      "GitHub token, repository, labels, assignees, and privacy template evidence",
      "dashboard approval UI, human approval audit, and GitHub API dispatch evidence",
      "ErrorReport issue-link persistence and dashboard status sync evidence",
      "high-risk dashboard-only blocking and sanitized issue body evidence",
      "live synthetic GitHub issue creation evidence",
    ]);
    expect(plan.blockers).toEqual(
      expect.arrayContaining([
        "Missing @inkroute/observability typecheck script.",
        "@inkroute/observability typecheck must pass.",
        "GitHub token must be configured in secrets before live issue dispatch.",
        "Dashboard approval UI/actions must be wired before GitHub issue dispatch.",
        "GitHub API issue creation must be wired behind human approval.",
        "Created issue URL/number must persist back to ErrorReport records.",
        "Live synthetic GitHub issue creation proof is required before closing GAP-085.",
      ]),
    );
  });

  it("plans ready observability automated coverage across package, route, rendered UI, browser, and mobile surfaces", () => {
    const plan = buildObservabilityAutomatedCoverageReadinessPlan({
      packageScripts: ["test", "typecheck"],
      observabilityPackageTestsPassed: true,
      webRouteTestsPassed: true,
      webUiStaticTestsPassed: true,
      webTypecheckPassed: true,
      globalErrorRenderedComponentTestsAdded: true,
      dashboardErrorsPageSmokePassed: true,
      playwrightDashboardTriageCovered: true,
      mobileSimulatorCrashReportUiTested: true,
      mobileDeviceCrashReportUiTested: true,
      sentryWebhookSignatureTestsCovered: true,
      publicIngestPersistenceTestsCovered: true,
      ciArtifactsCaptured: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.missingScripts).toEqual([]);
    expect(plan.requiredEvidence).toEqual([]);
    expect(plan.blockers).toEqual([]);
    expect(plan.requiredCommands).toContain("Playwright dashboard observability triage smoke");
    expect(plan.requiredControls).toContain("Render global-error boundaries rather than relying only on static source checks before closure.");
  });

  it("blocks observability automated coverage until rendered global-error, dashboard browser, mobile UI, and CI artifact proof exist", () => {
    const plan = buildObservabilityAutomatedCoverageReadinessPlan({
      packageScripts: ["test"],
      observabilityPackageTestsPassed: true,
      webRouteTestsPassed: true,
      webUiStaticTestsPassed: true,
      webTypecheckPassed: false,
      globalErrorRenderedComponentTestsAdded: false,
      dashboardErrorsPageSmokePassed: false,
      playwrightDashboardTriageCovered: false,
      mobileSimulatorCrashReportUiTested: false,
      mobileDeviceCrashReportUiTested: false,
      sentryWebhookSignatureTestsCovered: true,
      publicIngestPersistenceTestsCovered: true,
      ciArtifactsCaptured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredEvidence).toEqual([
      "package, route, UI static, and web typecheck evidence",
      "rendered global-error, dashboard errors smoke, and Playwright triage evidence",
      "mobile simulator and physical-device crash-report UI evidence",
      "CI screenshots, logs, and artifact evidence",
    ]);
    expect(plan.blockers).toEqual(
      expect.arrayContaining([
        "Missing @inkroute/observability typecheck script.",
        "@inkroute/web typecheck must pass.",
        "Rendered component tests for web/dashboard global-error boundaries must be added.",
        "Dashboard errors page smoke test must pass in a rendered browser/runtime context.",
        "Mobile physical-device crash-report UI proof must be captured.",
        "CI artifacts/screenshots/logs must be captured for observability route, UI, browser, and mobile coverage.",
      ]),
    );
  });

  it("links release-tagged reports to rollback incidents and tenant-safe communications", () => {
    const matchingReport = buildObservabilityReportDraft({
      tenantId: "tenant_release",
      source: "api",
      runtime: "server",
      environment: "production",
      message: "Release regression exposed booking failure for avery@example.com",
      route: "/api/public/demo/booking-requests",
      release: "release-2026.06.08.1",
      handled: false,
      statusCode: 500,
      metadata: { authorization: "Bearer sk_live_secret", clientEmail: "avery@example.com" },
    });
    const otherReleaseReport = buildObservabilityReportDraft({
      tenantId: "tenant_release",
      source: "web",
      runtime: "server",
      environment: "production",
      message: "Previous release warning",
      route: "/old",
      release: "release-older",
    });
    const plan = buildReleaseIncidentLinkagePlan({
      releaseId: "rel_release_2026_06_08_1_production",
      releaseVersion: "release-2026.06.08.1",
      environment: "production",
      tenantId: "tenant_release",
      reports: [matchingReport, otherReleaseReport],
      rollbackRequested: true,
      sentryReleaseConfigured: true,
      incidentProviderConfigured: true,
      tenantCommunicationOwner: "release-owner",
    });

    expect(plan.status).toBe("ready");
    expect(plan.incidentStatus).toBe("rollback_required");
    expect(plan.releaseTags).toMatchObject({ release: "release-2026.06.08.1", environment: "production", tenantId: "tenant_release" });
    expect(plan.dashboardFilters).toMatchObject({ release: "release-2026.06.08.1", environment: "production", tenantId: "tenant_release" });
    expect(plan.linkedReports).toHaveLength(1);
    expect(plan.linkedReports[0]).toMatchObject({
      fingerprint: matchingReport.fingerprint,
      route: "/api/public/demo/booking-requests",
      release: "release-2026.06.08.1",
    });
    expect(plan.rollbackIncidentNote).toContain(matchingReport.fingerprint);
    expect(plan.tenantCommunicationDraft).toContain("[redacted:email]");
    expect(plan.tenantCommunicationDraft).not.toContain("avery@example.com");
    expect(JSON.stringify(plan)).not.toContain("sk_live_secret");
  });

  it("blocks release incident workflows without Sentry tags, provider wiring, and communication owner", () => {
    const report = buildObservabilityReportDraft({
      tenantId: "tenant_release",
      source: "mobile",
      runtime: "react-native",
      environment: "production",
      message: "native crash after release",
      route: "apps/mobile/Home",
      release: "release-2026.06.08.2",
      handled: false,
    });
    const plan = buildReleaseIncidentLinkagePlan({
      releaseId: "rel_release_2026_06_08_2_production",
      releaseVersion: "release-2026.06.08.2",
      environment: "production",
      tenantId: "tenant_release",
      reports: [report],
      rollbackRequested: false,
      sentryReleaseConfigured: false,
      incidentProviderConfigured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.incidentStatus).toBe("active_incident");
    expect(plan.blockers).toEqual(
      expect.arrayContaining([
        "Sentry release tags must be configured before release-level error correlation is ready.",
        "Incident provider/workflow must be configured before release incidents can be opened.",
        "Tenant communication owner must be assigned before rollback or high-severity incident messaging.",
      ]),
    );
  });

  it("plans ready release incident runtime linkage with Sentry evidence, persistence, provider incidents, and sanitized handoffs", () => {
    const plan = buildReleaseIncidentRuntimeReadinessPlan({
      packageScripts: ["test", "typecheck"],
      observabilityTestsPassed: true,
      observabilityTypecheckPassed: true,
      sentryReleaseTagsConfigured: true,
      sentrySourceMapsUploaded: true,
      liveSentryReleaseEvidenceCaptured: true,
      errorReportReleaseLinkPersistenceConfigured: true,
      releaseRecordIncidentLinkPersistenceConfigured: true,
      incidentProviderConfigured: true,
      providerIncidentCreationVerified: true,
      rollbackCommunicationHandoffPersisted: true,
      tenantCommunicationOwnerConfigured: true,
      dashboardReleaseFiltersVerified: true,
      tenantScopedIncidentIsolationVerified: true,
      sanitizedPayloadsVerified: true,
      liveProviderEvidenceCaptured: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.missingScripts).toEqual([]);
    expect(plan.requiredEvidence).toEqual([]);
    expect(plan.blockers).toEqual([]);
    expect(plan.requiredCommands).toContain("Sentry release/source-map correlation smoke");
    expect(plan.requiredCommands).toContain("rollback communication handoff persistence smoke");
  });

  it("blocks release incident runtime linkage until Sentry, persistence, provider, dashboard, tenant isolation, and sanitized evidence exist", () => {
    const plan = buildReleaseIncidentRuntimeReadinessPlan({
      packageScripts: ["test"],
      observabilityTestsPassed: true,
      observabilityTypecheckPassed: false,
      sentryReleaseTagsConfigured: false,
      sentrySourceMapsUploaded: false,
      liveSentryReleaseEvidenceCaptured: false,
      errorReportReleaseLinkPersistenceConfigured: false,
      releaseRecordIncidentLinkPersistenceConfigured: false,
      incidentProviderConfigured: false,
      providerIncidentCreationVerified: false,
      rollbackCommunicationHandoffPersisted: false,
      tenantCommunicationOwnerConfigured: false,
      dashboardReleaseFiltersVerified: false,
      tenantScopedIncidentIsolationVerified: false,
      sanitizedPayloadsVerified: false,
      liveProviderEvidenceCaptured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredEvidence).toEqual([
      "Sentry release tag, source-map/debug-symbol, and live release evidence",
      "ErrorReport, ReleaseRecord, incident link, and rollback communication persistence evidence",
      "tenant incident provider configuration, creation, and live provider evidence",
      "tenant owner, dashboard filter, tenant isolation, and sanitized payload evidence",
    ]);
    expect(plan.blockers).toEqual(
      expect.arrayContaining([
        "Missing @inkroute/observability typecheck script.",
        "@inkroute/observability typecheck must pass.",
        "Sentry release tags must be configured for web, dashboard, API, worker, and mobile surfaces.",
        "ErrorReport-to-release link persistence must be configured.",
        "Tenant incident workflow provider must be configured.",
        "Rollback communication handoff must be persisted in the database.",
        "Live incident/provider evidence must be captured before closing GAP-093.",
      ]),
    );
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

  it("plans ready Sentry SDK implementation across web, dashboard, and mobile runtime surfaces", () => {
    const plan = buildSentrySdkRuntimeImplementationPlan({
      packageScripts: ["test", "typecheck"],
      observabilityTestsPassed: true,
      observabilityTypecheckPassed: true,
      webSentryPackageInstalled: true,
      dashboardSentryPackageInstalled: true,
      mobileSentryPackageInstalled: true,
      webInstrumentationFilesImplemented: true,
      dashboardInstrumentationFilesImplemented: true,
      mobileInstrumentationFilesImplemented: true,
      sentryDsnConfigured: true,
      sentryAuthTokenConfigured: true,
      sentryOrgConfigured: true,
      sentryProjectConfigured: true,
      releaseTagsConfigured: true,
      beforeSendRedactionConfigured: true,
      tenantSafeTagsConfigured: true,
      nextSourceMapUploadConfigured: true,
      expoSourceMapUploadConfigured: true,
      reactNativeDebugSymbolsConfigured: true,
      ciReleaseArtifactUploadConfigured: true,
      liveWebSyntheticCaptureVerified: true,
      liveDashboardSyntheticCaptureVerified: true,
      liveMobileSyntheticCaptureVerified: true,
      providerIssueEvidenceCaptured: true,
      noPiiProviderPayloadVerified: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.missingScripts).toEqual([]);
    expect(plan.requiredEvidence).toEqual([]);
    expect(plan.blockers).toEqual([]);
    expect(plan.requiredControls).toContain("Run beforeSend redaction and tenant-safe tag filtering before every provider submission.");
    expect(plan.requiredCommands).toContain("Sentry source-map/debug-symbol resolution check");
  });

  it("blocks Sentry SDK implementation until packages, instrumentation, credentials, artifacts, live proof, and no-PII evidence exist", () => {
    const plan = buildSentrySdkRuntimeImplementationPlan({
      packageScripts: ["test"],
      observabilityTestsPassed: true,
      observabilityTypecheckPassed: false,
      webSentryPackageInstalled: false,
      dashboardSentryPackageInstalled: false,
      mobileSentryPackageInstalled: false,
      webInstrumentationFilesImplemented: false,
      dashboardInstrumentationFilesImplemented: false,
      mobileInstrumentationFilesImplemented: false,
      sentryDsnConfigured: false,
      sentryAuthTokenConfigured: false,
      sentryOrgConfigured: false,
      sentryProjectConfigured: false,
      releaseTagsConfigured: false,
      beforeSendRedactionConfigured: false,
      tenantSafeTagsConfigured: false,
      nextSourceMapUploadConfigured: false,
      expoSourceMapUploadConfigured: false,
      reactNativeDebugSymbolsConfigured: false,
      ciReleaseArtifactUploadConfigured: false,
      liveWebSyntheticCaptureVerified: false,
      liveDashboardSyntheticCaptureVerified: false,
      liveMobileSyntheticCaptureVerified: false,
      providerIssueEvidenceCaptured: false,
      noPiiProviderPayloadVerified: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredEvidence).toEqual([
      "Sentry package installation evidence for web, dashboard, and mobile",
      "Sentry instrumentation and config file evidence across app surfaces",
      "Sentry credential and CI secret configuration evidence",
      "source-map, debug-symbol, and CI release artifact upload evidence",
      "live synthetic capture, provider issue, and no-PII payload evidence",
    ]);
    expect(plan.blockers).toEqual(
      expect.arrayContaining([
        "Missing @inkroute/observability typecheck script.",
        "@inkroute/observability typecheck must pass.",
        "@sentry/nextjs must be installed for the public web app.",
        "Dashboard Sentry instrumentation/config files must be implemented.",
        "Next.js source-map upload must be configured for web and dashboard.",
        "Live mobile synthetic Sentry capture must be verified.",
        "Sentry provider payloads must be proven free of raw PII, medical, payment, token, and private URL values.",
      ]),
    );
  });

  it("plans ready hardened public error-report ingest with persistence, audit, abuse, and tenant controls", () => {
    const plan = buildErrorReportIngestHardeningPlan({
      packageScripts: ["test", "typecheck"],
      routeTestsPassed: true,
      webTypecheckPassed: true,
      tenantScopeResolved: true,
      payloadValidationEnabled: true,
      botProtectionConfigured: true,
      distributedRateLimitConfigured: true,
      abuseMonitoringConfigured: true,
      requestIdPropagationConfigured: true,
      providerForwardingControlsConfigured: true,
      dbBackedPersistenceConfigured: true,
      auditLogPersistenceConfigured: true,
      localFallbackRedactionVerified: true,
      dashboardTenantRbacVerified: true,
      providerWebhookSignatureVerified: true,
      livePostgresTenantIsolationVerified: true,
      noPiiPersistenceVerified: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.missingScripts).toEqual([]);
    expect(plan.requiredEvidence).toEqual([]);
    expect(plan.blockers).toEqual([]);
    expect(plan.requiredCommands).toContain("live Postgres tenant-isolation ingest proof");
    expect(plan.requiredControls).toContain("Use production bot protection plus durable distributed rate limiting for public ingest endpoints.");
  });

  it("blocks public error-report ingest hardening until production abuse controls, provider gates, live DB isolation, and no-PII proof exist", () => {
    const plan = buildErrorReportIngestHardeningPlan({
      packageScripts: ["test"],
      routeTestsPassed: true,
      webTypecheckPassed: false,
      tenantScopeResolved: true,
      payloadValidationEnabled: true,
      botProtectionConfigured: false,
      distributedRateLimitConfigured: false,
      abuseMonitoringConfigured: false,
      requestIdPropagationConfigured: false,
      providerForwardingControlsConfigured: false,
      dbBackedPersistenceConfigured: true,
      auditLogPersistenceConfigured: false,
      localFallbackRedactionVerified: true,
      dashboardTenantRbacVerified: false,
      providerWebhookSignatureVerified: false,
      livePostgresTenantIsolationVerified: false,
      noPiiPersistenceVerified: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredEvidence).toEqual([
      "public ingest tenant, validation, bot-protection, and distributed rate-limit evidence",
      "redacted ErrorReport, AuditLog, and local fallback persistence evidence",
      "dashboard RBAC and live Postgres tenant-isolation evidence",
      "provider forwarding, webhook signature, replay, and no-PII payload evidence",
      "abuse monitoring, request ID, and trace propagation evidence",
    ]);
    expect(plan.blockers).toEqual(
      expect.arrayContaining([
        "Missing @inkroute/web typecheck script.",
        "@inkroute/web typecheck must pass without unrelated booking-contract failures.",
        "Production bot protection must guard public error-report ingest.",
        "Durable distributed rate limiting must replace process-local fallback limits.",
        "Provider forwarding controls must enforce signature, replay, tenant, and redaction gates.",
        "Live Postgres tenant-isolation proof is required before closing GAP-081.",
        "Persisted reports, audit logs, provider payloads, and dashboard views must be proven free of raw PII.",
      ]),
    );
  });

  it("plans ready provider webhook reconciliation with durable delivery storage and live Sentry proof", () => {
    const plan = buildProviderWebhookReconciliationPlan({
      packageScripts: ["test", "typecheck"],
      routeTestsPassed: true,
      webTypecheckPassed: true,
      webhookSecretConfigured: true,
      signatureVerificationEnabled: true,
      timingSafeComparisonEnabled: true,
      replayProtectionConfigured: true,
      durableDeliveryPersistenceConfigured: true,
      idempotencyConstraintConfigured: true,
      tenantIssueOwnershipLookupConfigured: true,
      errorReportStatusMutationConfigured: true,
      reconciliationAuditLogsConfigured: true,
      sanitizedProviderPayloadsVerified: true,
      liveSentryWebhookProofCaptured: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.missingScripts).toEqual([]);
    expect(plan.requiredEvidence).toEqual([]);
    expect(plan.blockers).toEqual([]);
    expect(plan.requiredCommands).toContain("provider action ErrorReport reconciliation smoke");
    expect(plan.requiredControls).toContain("Persist provider deliveries durably with unique idempotency keys before mutating ErrorReport state.");
  });

  it("blocks provider webhook reconciliation until signature, replay, persistence, status mutation, audit, and live proof exist", () => {
    const plan = buildProviderWebhookReconciliationPlan({
      packageScripts: ["test"],
      routeTestsPassed: true,
      webTypecheckPassed: false,
      webhookSecretConfigured: false,
      signatureVerificationEnabled: true,
      timingSafeComparisonEnabled: true,
      replayProtectionConfigured: false,
      durableDeliveryPersistenceConfigured: false,
      idempotencyConstraintConfigured: false,
      tenantIssueOwnershipLookupConfigured: false,
      errorReportStatusMutationConfigured: false,
      reconciliationAuditLogsConfigured: false,
      sanitizedProviderPayloadsVerified: false,
      liveSentryWebhookProofCaptured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredEvidence).toEqual([
      "webhook secret, signature, timing-safe comparison, and replay-protection evidence",
      "durable provider-delivery persistence and idempotency constraint evidence",
      "tenant ownership lookup, ErrorReport status mutation, and reconciliation audit evidence",
      "sanitized provider payload and live Sentry webhook replay evidence",
    ]);
    expect(plan.blockers).toEqual(
      expect.arrayContaining([
        "Missing @inkroute/web typecheck script.",
        "@inkroute/web typecheck must pass.",
        "SENTRY_WEBHOOK_SECRET must be configured before accepting provider deliveries.",
        "Provider webhook replay protection must be configured.",
        "Durable provider-delivery persistence must be configured.",
        "Provider action reconciliation must mutate ErrorReport status transactionally.",
        "Live Sentry webhook delivery and replay proof must be captured.",
      ]),
    );
  });

  it("blocks mobile crash runtime readiness until SDK/fallback capture, redaction, artifacts, forced crashes, and ErrorReport sync are proven", () => {
    const plan = buildMobileCrashRuntimeReadinessPlan({
      packageScripts: ["test"],
      observabilityTestsPassed: true,
      observabilityTypecheckPassed: false,
      mobileTypecheckPassed: false,
      sentryExpoSdkConfigured: false,
      fallbackReporterConfigured: false,
      sentryDsnConfigured: false,
      releaseTagsConfigured: false,
      beforeSendRedactionConfigured: false,
      piiRedactionTestsPassed: false,
      sourceMapsUploaded: false,
      debugSymbolsUploaded: false,
      forcedCrashSimulatorVerified: false,
      forcedCrashDeviceVerified: false,
      errorReportPersistenceConfigured: false,
      sanitizedDashboardSyncVerified: false,
      offlineCrashBufferingVerified: false,
      noPiiProviderPayloadVerified: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toContain("Expo physical-device forced crash smoke test");
    expect(plan.requiredEvidence).toEqual(expect.arrayContaining([
      "mobile crash capture SDK or fallback reporter configuration evidence",
      "Expo source-map and React Native debug-symbol upload evidence",
      "mobile crash privacy redaction and offline buffering evidence",
    ]));
    expect(plan.blockers).toContain("Either Sentry Expo/React Native SDK or a privacy-safe fallback reporter must be configured.");
    expect(plan.blockers).toContain("Provider payloads and dashboard summaries must be proven free of raw PII, medical, payment, token, and private URL values.");
  });

  it("summarizes observability runtime readiness across Sentry, OTel, persistence, alerts, and privacy gates", () => {
    const plan = buildObservabilityRuntimeReadinessPlan({
      packageScripts: ["test"],
      packageTestsPassed: true,
      packageTypecheckPassed: false,
      sentryWebConfigured: true,
      sentryDashboardConfigured: false,
      sentryMobileConfigured: false,
      sentryReleaseArtifactsConfigured: false,
      sourceMapsVerified: false,
      mobileDebugSymbolsVerified: false,
      forcedWebErrorVerified: true,
      forcedDashboardErrorVerified: false,
      forcedMobileCrashVerified: false,
      forcedApiErrorVerified: false,
      otelExporterConfigured: false,
      structuredLoggingConfigured: false,
      requestTracePropagationVerified: false,
      errorReportPersistenceConfigured: false,
      dashboardTriagePersistenceVerified: false,
      providerWebhookSignatureVerified: false,
      alertRoutingConfigured: false,
      redactionTestsPassed: true,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toContain("pnpm --filter @inkroute/observability typecheck");
    expect(plan.requiredControls).toContain("Persist only sanitized ErrorReport summaries and keep raw provider payloads out of dashboard triage.");
    expect(plan.blockers).toContain("Sentry Next.js SDK must be configured for the dashboard app.");
    expect(plan.blockers).toContain("OpenTelemetry exporter endpoint and service metadata must be configured.");
    expect(plan.blockers).toContain("Sanitized ErrorReport persistence must be configured before dashboard viewing is production-ready.");
  });

  it("summarizes observability runtime verification across forced errors, fallback UX, screenshots, sanitized logs, local persistence, dashboard triage, and provider proof", () => {
    const plan = buildObservabilityRuntimeVerificationPlan({
      packageScripts: ["test", "typecheck"],
      packageTestsPassed: true,
      packageTypecheckPassed: true,
      webBuildPassed: true,
      dashboardBuildPassed: true,
      mobileTypecheckPassed: true,
      routeSmokeTestsPassed: true,
      forcedWebErrorUxVerified: true,
      forcedDashboardErrorUxVerified: true,
      forcedApiErrorVerified: true,
      forcedWebhookErrorVerified: true,
      forcedMobileErrorUxVerified: true,
      browserScreenshotsCaptured: true,
      simulatorOrDeviceScreenshotsCaptured: true,
      sanitizedLogOutputCaptured: true,
      localFallbackPersistenceVerified: true,
      dashboardTriageDisplayVerified: true,
      sentrySdkConfigured: true,
      liveSentryProviderProofCaptured: true,
      providerWebhookProofCaptured: true,
      noPiiLeakageVerified: true,
      runtimeEvidenceAttached: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
    expect(plan.requiredControls).toContain("Use safe synthetic errors only; never trigger destructive or production-impacting failures.");
    expect(plan.requiredCommands).toContain("Sentry/provider live runtime proof");
  });

  it("blocks observability runtime verification until forced-error UX, screenshots, logs, persistence, provider proof, and no-PII evidence exist", () => {
    const plan = buildObservabilityRuntimeVerificationPlan({
      packageScripts: ["test"],
      packageTestsPassed: true,
      packageTypecheckPassed: false,
      webBuildPassed: true,
      dashboardBuildPassed: true,
      mobileTypecheckPassed: true,
      routeSmokeTestsPassed: true,
      forcedWebErrorUxVerified: false,
      forcedDashboardErrorUxVerified: false,
      forcedApiErrorVerified: false,
      forcedWebhookErrorVerified: false,
      forcedMobileErrorUxVerified: false,
      browserScreenshotsCaptured: false,
      simulatorOrDeviceScreenshotsCaptured: false,
      sanitizedLogOutputCaptured: false,
      localFallbackPersistenceVerified: false,
      dashboardTriageDisplayVerified: false,
      sentrySdkConfigured: false,
      liveSentryProviderProofCaptured: false,
      providerWebhookProofCaptured: false,
      noPiiLeakageVerified: false,
      runtimeEvidenceAttached: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredEvidence).toEqual([
      "browser forced-error fallback UX screenshot evidence",
      "mobile simulator/device forced-error UX evidence",
      "API/webhook forced-error envelope, sanitized log, and local persistence evidence",
      "dashboard triage and no-PII leakage evidence",
      "Sentry/provider runtime proof and attached closeout evidence",
    ]);
    expect(plan.blockers).toContain("Forced public web error fallback UX must be verified in a browser.");
    expect(plan.blockers).toContain("Forced webhook error response envelope and provider-gated behavior must be verified.");
    expect(plan.blockers).toContain("Forced-error screenshots, logs, persistence, and provider payloads must be proven free of raw PII.");
    expect(plan.blockers).toContain("Runtime verification screenshots, logs, and provider evidence must be attached to closeout.");
  });
});
