import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  alertRuntimeDeliveryRequiredCommands,
  alertRuntimeDeliveryRequiredControls,
  alertRuntimeDeliveryRequiredEvidence,
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
  buildObservabilityLaunchEvidencePlan,
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
  demoErrorReports,
  errorReportIngestHardeningRequiredEvidence,
  errorReportIngestHardeningRequiredCommands,
  errorReportIngestHardeningRequiredControls,
  githubIssueRuntimeDispatchRequiredCommands,
  githubIssueRuntimeDispatchRequiredControls,
  githubIssueRuntimeDispatchRequiredEvidence,
  mobileCrashRuntimeRequiredCommands,
  mobileCrashRuntimeRequiredEvidence,
  observabilityAutomatedCoverageRequiredCommands,
  observabilityAutomatedCoverageRequiredControls,
  observabilityAutomatedCoverageRequiredEvidence,
  observabilityLaunchRequiredCommands,
  observabilityLaunchRequiredControls,
  observabilityLaunchRequiredEvidence,
  observabilityRuntimeReadinessRequiredCommands,
  observabilityRuntimeReadinessRequiredControls,
  observabilityRuntimeVerificationRequiredCommands,
  observabilityRuntimeVerificationRequiredControls,
  observabilityRuntimeVerificationRequiredEvidence,
  openTelemetryRuntimeRequiredCommands,
  openTelemetryRuntimeRequiredControls,
  openTelemetryRuntimeRequiredEvidence,
  providerWebhookReconciliationRequiredCommands,
  providerWebhookReconciliationRequiredControls,
  providerWebhookReconciliationRequiredEvidence,
  redactMetadata,
  redactSensitiveText,
  releaseIncidentRuntimeRequiredCommands,
  releaseIncidentRuntimeRequiredEvidence,
  sentrySdkRuntimeRequiredCommands,
  sentrySdkRuntimeRequiredControls,
  sentrySdkRuntimeRequiredEvidence,
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
    const workflow = buildAgenticBugFixWorkflow(report);
    expect(workflow.length).toBeGreaterThan(3);
    expect(workflow[0]).toMatchObject({ title: "Classify and redact", status: "local-contract" });
  });

  it("keeps demo error report copy aligned with local fallback and external persistence gates", () => {
    const bookingReport = demoErrorReports.find((report) => report.route === "/api/public/inkroute-demo/booking-requests");
    const serializedReport = JSON.stringify(bookingReport);

    expect(bookingReport?.message).toContain("local fallback");
    expect(serializedReport).toContain("provider-backed persistence evidence remains gated");
    expect(serializedReport).not.toContain("501");
    expect(serializedReport).not.toContain("intentionally not implemented");
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
    expect(plan.requiredCommands).toBe(alertRuntimeDeliveryRequiredCommands);
    expect(plan.requiredControls).toBe(alertRuntimeDeliveryRequiredControls);
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
    expect(plan.requiredEvidence).toBe(alertRuntimeDeliveryRequiredEvidence);
    expect(plan.requiredCommands).toBe(alertRuntimeDeliveryRequiredCommands);
    expect(plan.requiredControls).toBe(alertRuntimeDeliveryRequiredControls);
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
     errorFingerprint: report.fingerprint,
      stackHash: report.stackHash,
      severity: "critical",
    });
    expect("tenantId" in plan.logRecord).toBe(false);
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
    expect(plan.requiredCommands).toBe(openTelemetryRuntimeRequiredCommands);
    expect(plan.requiredControls).toBe(openTelemetryRuntimeRequiredControls);
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
    expect(plan.requiredEvidence).toBe(openTelemetryRuntimeRequiredEvidence);
    expect(plan.requiredCommands).toBe(openTelemetryRuntimeRequiredCommands);
    expect(plan.requiredControls).toBe(openTelemetryRuntimeRequiredControls);
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
    expect(issue.blockedReason).toBe(
      "GitHub issue creation is provider-gated until repo token, project labels, assignees, privacy template, and human approval are configured.",
    );
    expect(issue.blockedReason).not.toContain("scaffolded only");
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
    expect(plan.requiredCommands).toBe(githubIssueRuntimeDispatchRequiredCommands);
    expect(plan.requiredControls).toBe(githubIssueRuntimeDispatchRequiredControls);
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
    expect(plan.requiredEvidence).toBe(githubIssueRuntimeDispatchRequiredEvidence);
    expect(plan.requiredCommands).toBe(githubIssueRuntimeDispatchRequiredCommands);
    expect(plan.requiredControls).toBe(githubIssueRuntimeDispatchRequiredControls);
    expect(plan.blockers).toEqual(
      expect.arrayContaining([
        "Missing @inkroute/observability typecheck script.",
        "@inkroute/observability typecheck must pass.",
        "GitHub token must be configured in secrets before live issue dispatch.",
        "Rendered dashboard approval UI/action evidence must be captured before GitHub issue dispatch.",
        "GitHub create-issue provider adapter smoke evidence must be captured behind human approval.",
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
    expect(plan.requiredCommands).toBe(observabilityAutomatedCoverageRequiredCommands);
    expect(plan.requiredControls).toBe(observabilityAutomatedCoverageRequiredControls);
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
    const allMissingEvidencePlan = buildObservabilityAutomatedCoverageReadinessPlan({
      packageScripts: [],
      observabilityPackageTestsPassed: false,
      webRouteTestsPassed: false,
      webUiStaticTestsPassed: false,
      webTypecheckPassed: false,
      globalErrorRenderedComponentTestsAdded: false,
      dashboardErrorsPageSmokePassed: false,
      playwrightDashboardTriageCovered: false,
      mobileSimulatorCrashReportUiTested: false,
      mobileDeviceCrashReportUiTested: false,
      sentryWebhookSignatureTestsCovered: false,
      publicIngestPersistenceTestsCovered: false,
      ciArtifactsCaptured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toBe(observabilityAutomatedCoverageRequiredCommands);
    expect(plan.requiredControls).toBe(observabilityAutomatedCoverageRequiredControls);
    expect(plan.requiredEvidence).toEqual([
      observabilityAutomatedCoverageRequiredEvidence[0],
      observabilityAutomatedCoverageRequiredEvidence[1],
      observabilityAutomatedCoverageRequiredEvidence[2],
      observabilityAutomatedCoverageRequiredEvidence[4],
    ]);
    expect(allMissingEvidencePlan.requiredEvidence).toBe(observabilityAutomatedCoverageRequiredEvidence);
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
    expect(plan.releaseTags).toMatchObject({ release: "release-2026.06.08.1", environment: "production" });
    expect("tenantId" in plan.releaseTags).toBe(false);
    expect(plan.dashboardFilters).toMatchObject({ release: "release-2026.06.08.1", environment: "production" });
    expect("tenantId" in plan.dashboardFilters).toBe(false);
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
    expect(plan.requiredCommands).toBe(releaseIncidentRuntimeRequiredCommands);
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
    expect(plan.requiredEvidence).toBe(releaseIncidentRuntimeRequiredEvidence);
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
    expect(plan.requiredCommands).toBe(sentrySdkRuntimeRequiredCommands);
    expect(plan.requiredControls).toBe(sentrySdkRuntimeRequiredControls);
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
    expect(plan.requiredEvidence).toBe(sentrySdkRuntimeRequiredEvidence);
    expect(plan.requiredCommands).toBe(sentrySdkRuntimeRequiredCommands);
    expect(plan.requiredControls).toBe(sentrySdkRuntimeRequiredControls);
    expect(plan.blockers).toEqual(
      expect.arrayContaining([
        "Missing @inkroute/observability typecheck script.",
        "@inkroute/observability typecheck must pass.",
        "@sentry/nextjs must be installed for the public web app.",
        "Dashboard Sentry instrumentation/config file evidence must be captured before Sentry SDK readiness.",
        "Next.js source-map upload must be configured for web and dashboard.",
        "Live mobile synthetic Sentry capture must be verified.",
        "Sentry provider payloads must be proven free of raw PII, medical, payment, token, and private URL values.",
      ]),
    );
    expect(plan.blockers).toContain("Public web Sentry instrumentation/config file evidence must be captured before Sentry SDK readiness.");
    expect(plan.blockers).toContain("Mobile Sentry/Expo instrumentation file evidence must be captured before Sentry SDK readiness.");
    expect(plan.blockers).not.toContain("Public web Sentry instrumentation/config files must be implemented.");
    expect(plan.blockers).not.toContain("Dashboard Sentry instrumentation/config files must be implemented.");
    expect(plan.blockers).not.toContain("Mobile Sentry/Expo instrumentation files must be implemented.");
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
    expect(plan.requiredCommands).toBe(errorReportIngestHardeningRequiredCommands);
    expect(plan.requiredControls).toBe(errorReportIngestHardeningRequiredControls);
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
    expect(plan.requiredEvidence).toBe(errorReportIngestHardeningRequiredEvidence);
    expect(plan.requiredCommands).toBe(errorReportIngestHardeningRequiredCommands);
    expect(plan.requiredControls).toBe(errorReportIngestHardeningRequiredControls);
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
    expect(plan.requiredCommands).toBe(providerWebhookReconciliationRequiredCommands);
    expect(plan.requiredControls).toBe(providerWebhookReconciliationRequiredControls);
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
    expect(plan.requiredEvidence).toBe(providerWebhookReconciliationRequiredEvidence);
    expect(plan.requiredCommands).toBe(providerWebhookReconciliationRequiredCommands);
    expect(plan.requiredControls).toBe(providerWebhookReconciliationRequiredControls);
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
    const source = readFileSync(resolve(__dirname, "../src/index.ts"), "utf8");
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
    const allMissingEvidencePlan = buildMobileCrashRuntimeReadinessPlan({
      packageScripts: [],
      observabilityTestsPassed: false,
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
    expect(plan.requiredCommands).toBe(mobileCrashRuntimeRequiredCommands);
    expect(plan.requiredEvidence).toEqual([
      mobileCrashRuntimeRequiredEvidence[0],
      mobileCrashRuntimeRequiredEvidence[1],
      mobileCrashRuntimeRequiredEvidence[2],
      mobileCrashRuntimeRequiredEvidence[3],
      mobileCrashRuntimeRequiredEvidence[4],
    ]);
    expect(allMissingEvidencePlan.requiredEvidence).toBe(mobileCrashRuntimeRequiredEvidence);
    expect(plan.blockers).toContain("Either Sentry Expo/React Native SDK or a privacy-safe fallback reporter must be configured.");
    expect(plan.blockers).toContain("Provider payloads and dashboard summaries must be proven free of raw PII, medical, payment, token, and private URL values.");
    expect(source).toContain("Mobile fallback crash reporting is wired; live Expo/Sentry capture remains gated");
    expect(source).not.toContain("Mobile crash reporting is not connected to Expo runtime");
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
    expect(plan.requiredCommands).toBe(observabilityRuntimeReadinessRequiredCommands);
    expect(plan.requiredControls).toBe(observabilityRuntimeReadinessRequiredControls);
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
    expect(plan.requiredCommands).toBe(observabilityRuntimeVerificationRequiredCommands);
    expect(plan.requiredControls).toBe(observabilityRuntimeVerificationRequiredControls);
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
    expect(plan.requiredCommands).toBe(observabilityRuntimeVerificationRequiredCommands);
    expect(plan.requiredControls).toBe(observabilityRuntimeVerificationRequiredControls);
    expect(plan.requiredEvidence).toBe(observabilityRuntimeVerificationRequiredEvidence);
    expect(plan.blockers).toContain("Forced public web error fallback UX must be verified in a browser.");
    expect(plan.blockers).toContain("Forced webhook error response envelope and provider-gated behavior must be verified.");
    expect(plan.blockers).toContain("Forced-error screenshots, logs, persistence, and provider payloads must be proven free of raw PII.");
    expect(plan.blockers).toContain("Runtime verification screenshots, logs, and provider evidence must be attached to closeout.");
  });

  it("summarizes observability launch evidence across SDKs, telemetry, artifacts, forced captures, persistence, webhooks, alerts, redaction, and CI", () => {
    const plan = buildObservabilityLaunchEvidencePlan({
      packageScripts: ["test", "typecheck"],
      observabilityTypecheckPassed: true,
      observabilityTestsPassed: true,
      webBuildPassed: true,
      dashboardBuildPassed: true,
      mobileTypecheckPassed: true,
      sentryWebSdkConfigured: true,
      sentryDashboardSdkConfigured: true,
      sentryMobileSdkConfigured: true,
      openTelemetryExporterConfigured: true,
      structuredLoggingConfigured: true,
      sourceMapsUploaded: true,
      mobileDebugSymbolsUploaded: true,
      forcedWebCaptureVerified: true,
      forcedDashboardCaptureVerified: true,
      forcedApiCaptureVerified: true,
      forcedWebhookCaptureVerified: true,
      forcedMobileCrashVerified: true,
      errorReportPersistenceConfigured: true,
      dashboardTenantTriageReadsVerified: true,
      sentryWebhookSignatureReplayVerified: true,
      alertRoutingVerified: true,
      releaseIncidentLinkageVerified: true,
      redactionNoPiiVerified: true,
      ciEvidenceCaptured: true,
      secretSafeArtifactsCaptured: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
    expect(plan.requiredCommands).toBe(observabilityLaunchRequiredCommands);
    expect(plan.requiredControls).toBe(observabilityLaunchRequiredControls);
  });

  it("blocks observability launch evidence until live SDKs, OTel, source maps, forced captures, persistence, webhook signatures, alerts, redaction, CI, and secret-safe artifacts exist", () => {
    const plan = buildObservabilityLaunchEvidencePlan({
      packageScripts: ["test"],
      observabilityTypecheckPassed: false,
      observabilityTestsPassed: true,
      webBuildPassed: false,
      dashboardBuildPassed: false,
      mobileTypecheckPassed: false,
      sentryWebSdkConfigured: false,
      sentryDashboardSdkConfigured: false,
      sentryMobileSdkConfigured: false,
      openTelemetryExporterConfigured: false,
      structuredLoggingConfigured: false,
      sourceMapsUploaded: false,
      mobileDebugSymbolsUploaded: false,
      forcedWebCaptureVerified: false,
      forcedDashboardCaptureVerified: false,
      forcedApiCaptureVerified: false,
      forcedWebhookCaptureVerified: false,
      forcedMobileCrashVerified: false,
      errorReportPersistenceConfigured: false,
      dashboardTenantTriageReadsVerified: false,
      sentryWebhookSignatureReplayVerified: false,
      alertRoutingVerified: false,
      releaseIncidentLinkageVerified: false,
      redactionNoPiiVerified: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactsCaptured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toBe(observabilityLaunchRequiredCommands);
    expect(plan.requiredControls).toBe(observabilityLaunchRequiredControls);
    expect(plan.requiredEvidence).toBe(observabilityLaunchRequiredEvidence);
    expect(plan.blockers).toContain("Sentry web SDK must be configured for public web runtime.");
    expect(plan.blockers).toContain("OpenTelemetry exporter and service metadata must be configured.");
    expect(plan.blockers).toContain("Dashboard triage reads must be tenant-isolated and backed by persisted ErrorReport rows.");
    expect(plan.blockers).toContain("Observability artifacts must prove secrets, tokens, raw provider payloads, and raw PII are redacted.");
  });
});
