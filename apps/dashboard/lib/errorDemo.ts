import { inkrouteDemoTenant } from "@inkroute/config";
import {
  buildAgenticBugFixWorkflow,
  buildAlertRoute,
  buildGithubIssueDraft,
  buildObservabilityReportDraft,
  buildReleaseIncidentLinkagePlan,
  buildSentrySetupChecklist,
  demoErrorReports,
  observabilityProviderBoundaries,
  type ObservabilityReportDraft,
} from "@inkroute/observability";

export const dashboardObservabilityReports: ObservabilityReportDraft[] = [
  ...demoErrorReports,
  buildObservabilityReportDraft(
    {
      tenantId: inkrouteDemoTenant.id,
      source: "api",
      runtime: "server",
      environment: "development",
      message: "Payment webhook preview returned 501 before Stripe signature verification",
      route: "/api/webhooks/stripe",
      release: "phase7-payments",
      statusCode: 501,
      metadata: { stripeSignature: "demo-signature", clientEmail: "noa@example.test", action: "checkout.session.completed" },
      tags: { phase: "7", provider: "stripe" },
    },
    "2026-06-04T12:00:00-07:00",
  ),
  buildObservabilityReportDraft(
    {
      tenantId: inkrouteDemoTenant.id,
      source: "webhook",
      runtime: "provider-webhook",
      environment: "development",
      message: "Email webhook signature verification is not implemented",
      route: "/api/webhooks/email",
      release: "phase9-notifications",
      statusCode: 501,
      metadata: { email: "client@example.test", providerPayload: "redaction preview" },
      tags: { phase: "9", provider: "email" },
    },
    "2026-06-05T09:30:00-07:00",
  ),
];

export const dashboardObservabilitySummaries = {
  total: dashboardObservabilityReports.length,
  critical: dashboardObservabilityReports.filter((report) => report.severity === "critical").length,
  high: dashboardObservabilityReports.filter((report) => report.severity === "high").length,
  open: dashboardObservabilityReports.filter((report) => report.status === "open").length,
  alertable: dashboardObservabilityReports.filter((report) => report.alertRecommended).length,
};

export const dashboardAlertRoutes = dashboardObservabilityReports.map((report) => ({ report, route: buildAlertRoute(report) }));
export const dashboardAgentWorkflowPreview = buildAgenticBugFixWorkflow(dashboardObservabilityReports[0]!);
export const dashboardIssueDraftPreview = buildGithubIssueDraft(dashboardObservabilityReports[0]!);
export const dashboardReleaseIncidentLinkagePreview = buildReleaseIncidentLinkagePlan({
  releaseId: "rel_phase7_payments_preview",
  releaseVersion: "phase7-payments",
  environment: "development",
  tenantId: inkrouteDemoTenant.id,
  reports: dashboardObservabilityReports,
  rollbackRequested: true,
  sentryReleaseConfigured: false,
  incidentProviderConfigured: false,
  tenantCommunicationOwner: "release-owner",
});
export const dashboardProviderBoundaries = observabilityProviderBoundaries;
export const dashboardNextSentryChecklist = buildSentrySetupChecklist("nextjs");
export const dashboardMobileSentryChecklist = buildSentrySetupChecklist("react-native");
