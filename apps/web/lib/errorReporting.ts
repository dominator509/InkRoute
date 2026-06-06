import {
  buildAgenticBugFixWorkflow,
  buildAlertRoute,
  buildGithubIssueDraft,
  buildObservabilityReportDraft,
  observabilityProviderBoundaries,
  type ObservabilityEventInput,
} from "@inkroute/observability";
import { inkrouteDemoTenant } from "@inkroute/config";

export function buildPublicErrorReportPreview(input: Partial<ObservabilityEventInput>) {
  const report = buildObservabilityReportDraft({
    tenantId: input.tenantId ?? inkrouteDemoTenant.id,
    source: input.source ?? "web",
    runtime: input.runtime ?? "browser",
    environment: input.environment ?? "development",
    message: input.message ?? "Client-side public web error preview",
    route: input.route ?? "/booking",
    release: input.release ?? "phase11-demo",
    userAgent: input.userAgent,
    handled: input.handled ?? false,
    metadata: input.metadata ?? { boundary: "fallback-route-preview", clientEmail: "demo@example.test" },
    tags: { phase: "11", product: "public-web", ...(input.tags ?? {}) },
  });

  return {
    report,
    alertRoute: buildAlertRoute(report),
    issueDraft: buildGithubIssueDraft(report),
    workflow: buildAgenticBugFixWorkflow(report),
    providerBoundaries: observabilityProviderBoundaries.filter((boundary) => boundary.surface === "web" || boundary.surface === "all"),
  };
}
