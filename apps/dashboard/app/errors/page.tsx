import { DashboardPageHeader } from "../../components/DashboardPageHeader";
import { ErrorAutomationActionPanel } from "../../components/ErrorAutomationActionPanel";
import { IntegrationBoundaryCard } from "../../components/IntegrationBoundaryCard";
import { MetricCard } from "../../components/MetricCard";
import { StatusPill } from "../../components/StatusPill";
import {
  dashboardAgentWorkflowPreview,
  dashboardAlertRoutes,
  dashboardIssueDraftPreview,
  dashboardMobileSentryChecklist,
  dashboardNextSentryChecklist,
  dashboardObservabilityReports,
  dashboardObservabilitySummaries,
  dashboardProviderBoundaries,
  dashboardReleaseIncidentLinkagePreview,
} from "../../lib/errorDemo";

function severityTone(severity: string) {
  if (severity === "critical" || severity === "high") return "danger" as const;
  if (severity === "medium") return "warning" as const;
  return "neutral" as const;
}

function statusTone(status: string) {
  if (status === "open") return "warning" as const;
  if (status === "resolved") return "success" as const;
  return "info" as const;
}

export default function ErrorReportsPage() {
  return (
    <main>
      <DashboardPageHeader
        eyebrow="Observability"
        title="Error and crash reporting"
        description="Triage web, dashboard, mobile, API, and webhook failures with redacted context, alert routing, provider boundaries, an agentic bug-fix workflow, and a tenant-scoped no-store error-report API. Live capture providers remain credential-gated."
      />

      <section className="metrics-grid">
        <MetricCard label="Open reports" value={String(dashboardObservabilitySummaries.open)} detail="Static Phase 11 triage queue" />
        <MetricCard label="High/Critical" value={String(dashboardObservabilitySummaries.high + dashboardObservabilitySummaries.critical)} detail="Would notify after alert setup" />
        <MetricCard label="Alertable" value={String(dashboardObservabilitySummaries.alertable)} detail="Routing contract wired; provider delivery gated" />
        <MetricCard label="Provider status" value="0 live" detail="Sentry/Otel/GitHub gated" />
      </section>

      <section className="card table-card">
        <div className="table-header six">
          <span>Report</span><span>Surface</span><span>Severity</span><span>Status</span><span>Release</span><span>Redaction</span>
        </div>
        {dashboardObservabilityReports.map((error) => (
          <div className="table-row six" key={error.id}>
            <span><strong>{error.redactedMessage}</strong><small>{error.route ?? "No route captured"} - {error.fingerprint}</small></span>
            <span>{error.source}<small>{error.runtime}</small></span>
            <span><StatusPill label={error.severity} tone={severityTone(error.severity)} /></span>
            <span><StatusPill label={error.status} tone={statusTone(error.status)} /></span>
            <span>{error.release ?? "unreleased"}<small>{new Date(error.createdAt).toLocaleString()}</small></span>
            <span>{error.redactionLevel}<small>{error.stackHash}</small></span>
          </div>
        ))}
      </section>

      <section className="grid two">
        <article className="card">
          <p className="eyebrow">Alert routing preview</p>
          <h2>What would notify</h2>
          <div className="stack-list">
            {dashboardAlertRoutes.map(({ report, route }) => (
              <div className="mini-card" key={report.id}>
                <strong>{report.source} - {report.severity}</strong>
                <p>{route.reason}</p>
                <StatusPill label={route.shouldNotifyNow ? `${route.channel} now` : "dashboard only"} tone={route.shouldNotifyNow ? "warning" : "neutral"} />
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <p className="eyebrow">Agentic bug-fix handoff</p>
          <h2>Sanitized workflow</h2>
          <div className="stack-list">
            {dashboardAgentWorkflowPreview.map((step) => (
              <div className="mini-card" key={step.order}>
                <strong>{step.order}. {step.title}</strong>
                <p>{step.instruction}</p>
                <StatusPill label={`${step.owner} - ${step.status}`} tone={step.status === "blocked" ? "warning" : "info"} />
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid two">
        <article className="card">
          <p className="eyebrow">GitHub issue draft</p>
          <h2>{dashboardIssueDraftPreview.title}</h2>
          <p>{dashboardIssueDraftPreview.blockedReason}</p>
          <form
            action="/api/observability/github-issues"
            className="stack-list"
            data-provider-dispatch="credential-gated"
            method="post"
          >
            <input name="tenantId" type="hidden" value={dashboardObservabilityReports[0]?.tenantId ?? "demo-tenant"} />
            <input name="source" type="hidden" value={dashboardObservabilityReports[0]?.source ?? "dashboard"} />
            <input name="message" type="hidden" value={dashboardObservabilityReports[0]?.redactedMessage ?? "Redacted dashboard issue automation request"} />
            <input name="route" type="hidden" value={dashboardObservabilityReports[0]?.route ?? "/dashboard/errors"} />
            <input name="release" type="hidden" value={dashboardObservabilityReports[0]?.release ?? "unknown"} />
            <input name="environment" type="hidden" value="preview" />
            <input name="humanApproved" type="hidden" value="true" />
            <button className="primary-link" type="submit">
              Approve sanitized GitHub issue draft
            </button>
            <p className="muted">
              Requires dashboard RBAC, database audit persistence, configured GitHub issue secrets, and
              GITHUB_ISSUE_DISPATCH_ENABLED before provider dispatch.
            </p>
          </form>
          <div className="tag-row">
            {dashboardIssueDraftPreview.labels.map((label) => <span className="tag" key={label}>{label}</span>)}
          </div>
          <pre className="code-preview">{dashboardIssueDraftPreview.body.slice(0, 720)}…</pre>
        </article>

        <article className="card">
          <p className="eyebrow">Sentry setup checklist</p>
          <h2>Credential-gated SDK work</h2>
          <ul className="feature-list">
            {dashboardNextSentryChecklist.slice(0, 3).map((item) => <li key={item}>{item}</li>)}
            {dashboardMobileSentryChecklist.slice(0, 2).map((item) => <li key={item}>{item}</li>)}
          </ul>
        </article>
      </section>

      <section className="card">
        <p className="eyebrow">Release incident linkage</p>
        <h2>{dashboardReleaseIncidentLinkagePreview.incidentStatus.replace(/_/g, " ")}</h2>
        <p className="muted">
          Release {dashboardReleaseIncidentLinkagePreview.releaseTags.release} links {dashboardReleaseIncidentLinkagePreview.linkedReports.length} redacted report(s)
          through dashboard filters, rollback notes, and tenant-safe communication drafts. Provider actions remain blocked until Sentry release tags and incident workflow credentials are configured.
        </p>
        <div className="stack-list">
          {dashboardReleaseIncidentLinkagePreview.linkedReports.map((report) => (
            <div className="mini-card" key={report.fingerprint}>
              <strong>{report.source} - {report.severity}</strong>
              <p>{report.route} - {report.redactedMessage}</p>
              <StatusPill label={report.release} tone="info" />
            </div>
          ))}
          {dashboardReleaseIncidentLinkagePreview.blockers.map((blocker) => (
            <div className="mini-card" key={blocker}>
              <strong>Blocked provider step</strong>
              <p>{blocker}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid two">
        {dashboardProviderBoundaries.map((boundary) => (
          <IntegrationBoundaryCard
            key={boundary.id}
            title={`${boundary.provider}: ${boundary.id}`}
            status={`${boundary.status} - ${boundary.surface}`}
            description={`${boundary.riskNote} Required env: ${boundary.requiredEnv.join(", ") || "none"}. Blocks production: ${boundary.blocksProduction ? "yes" : "no"}.`}
            gapIds={["GAP-079", "GAP-080", "GAP-081"]}
          />
        ))}
      </section>

      <ErrorAutomationActionPanel />
    </main>
  );
}
