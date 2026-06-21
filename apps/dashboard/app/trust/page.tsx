import { DashboardPageHeader } from "../../components/DashboardPageHeader";
import { IntegrationBoundaryCard } from "../../components/IntegrationBoundaryCard";
import { MetricCard } from "../../components/MetricCard";
import { PrivacyRequestActionPanel } from "../../components/PrivacyRequestActionPanel";
import { StatusPill } from "../../components/StatusPill";
import {
  dashboardCsrfPlans,
  dashboardLegalDocuments,
  dashboardPrivacyDrafts,
  dashboardRateLimitRules,
  dashboardRedactionPreview,
  dashboardSecurityControls,
  dashboardSecurityHeaders,
  dashboardSecuritySummary,
  dashboardSensitiveFieldPolicies,
  dashboardTenantIsolationFixtures,
  dashboardUploadChecks,
} from "../../lib/securityDemo";

function statusTone(status: string) {
  if (status === "implemented") return "success" as const;
  if (status === "blocked" || status === "legal_review_required") return "danger" as const;
  if (status === "credential_gated" || status === "deployment_gated") return "warning" as const;
  return "info" as const;
}

export default function TrustPage() {
  return (
    <main>
      <DashboardPageHeader
        eyebrow="Phase 13 · Security and trust"
        title="Trust, privacy, and compliance control plane"
        description="Security hardening control plane for auth, tenant isolation, upload validation, CSRF/rate-limit contracts, privacy workflows, legal placeholders, no-store trust/privacy API boundaries, and production launch blockers. Guarded API seams are wired, while provider-backed production controls still require runtime evidence."
      />

      <section className="grid four">
        <MetricCard label="Security controls" value={`${dashboardSecuritySummary.total}`} detail={`${dashboardSecuritySummary.blockers} block production`} />
        <MetricCard label="Implemented" value={`${dashboardSecuritySummary.implemented}`} detail="No production-ready controls yet" />
        <MetricCard label="Local contracts" value={`${dashboardSecuritySummary.localContracts}`} detail="Dependency-light helper contracts" />
        <MetricCard label="Legal review" value={`${dashboardSecuritySummary.legal}`} detail="Attorney review required" />
      </section>

      <section className="grid two spacious">
        {dashboardSecurityControls.map((control) => (
          <IntegrationBoundaryCard
            key={control.id}
            title={control.label}
            status={control.status}
            description={`${control.currentImplementation} Next: ${control.nextAction}`}
            gapIds={control.gapIds}
          />
        ))}
      </section>

      <section className="grid two spacious">
        <article className="card spacious">
          <div className="section-heading-row">
            <h2>Sensitive field policies</h2>
            <StatusPill label="redaction contract" tone="warning" />
          </div>
          <div className="stack-list">
            {dashboardSensitiveFieldPolicies.map((policy) => (
              <div className="mini-card" key={policy.field}>
                <div className="section-heading-row">
                  <h3>{policy.field}</h3>
                  <StatusPill label={`${policy.sensitivity} · ${policy.redactionMode}`} tone={policy.sensitivity === "secret" || policy.sensitivity === "medical" ? "danger" : "warning"} />
                </div>
                <p>{policy.storageRequirement}</p>
                <small>{policy.logPolicy}</small>
                <div className="tag-row">{policy.gapIds.map((gap) => <code key={gap}>{gap}</code>)}</div>
              </div>
            ))}
          </div>
        </article>

        <article className="card spacious">
          <div className="section-heading-row">
            <h2>Redaction preview</h2>
            <StatusPill label="demo-safe" tone="info" />
          </div>
          <pre className="code-block">{JSON.stringify(dashboardRedactionPreview, null, 2)}</pre>
        </article>
      </section>

      <section className="card spacious">
        <div className="section-heading-row">
          <h2>Secure upload validation preview</h2>
          <StatusPill label="provider storage proof gated" tone="danger" />
        </div>
        <div className="grid three">
          {dashboardUploadChecks.map((check, index) => (
            <div className="mini-card" key={`${check.normalizedExtension}-${index}`}>
              <div className="section-heading-row">
                <h3>{check.storageVisibility}</h3>
                <StatusPill label={check.accepted ? "accepted preview" : "rejected preview"} tone={check.accepted ? "success" : "danger"} />
              </div>
              <p>Extension: .{check.normalizedExtension || "unknown"} · Max size: {Math.round(check.maxSizeBytes / 1024 / 1024)} MB</p>
              {check.reasons.length > 0 ? <ul className="compact-list">{check.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul> : <small>Shape-level validation passes, but production still needs signature checks, scanning, metadata stripping, private storage, and audit logs.</small>}
            </div>
          ))}
        </div>
      </section>

      <section className="grid two spacious">
        <article className="card">
          <div className="section-heading-row"><h2>Tenant isolation fixtures</h2><StatusPill label="fixture contract" tone="warning" /></div>
          <div className="stack-list">
            {dashboardTenantIsolationFixtures.map((fixture) => (
              <div className="list-row" key={fixture.id}>
                <div><strong>{fixture.description}</strong><span>{fixture.reason}</span></div>
                <StatusPill label={fixture.expectedDecision} tone={fixture.expectedDecision === "allow" ? "success" : "danger"} />
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <div className="section-heading-row"><h2>Rate limits and CSRF</h2><StatusPill label="edge store missing" tone="danger" /></div>
          <div className="stack-list">
            {dashboardRateLimitRules.map((rule) => (
              <div className="mini-row" key={rule.id}>
                <span><strong>{rule.routePattern}</strong><small>{rule.keyStrategy} · {rule.maxRequests}/{rule.windowSeconds}s</small></span>
                <StatusPill label={rule.status} tone="warning" />
                <span>{rule.gapIds.map((gap) => <code key={gap}>{gap}</code>)}</span>
              </div>
            ))}
          </div>
          <div className="stack-list spacious">
            {dashboardCsrfPlans.map((plan) => (
              <div className="boundary-note" key={plan.id}>
                <strong>{plan.routeFamily}</strong>
                <span>{plan.tokenPattern} · SameSite {plan.sameSiteRequirement} · {plan.appliesWhen}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid two spacious">
        <article className="card">
          <div className="section-heading-row"><h2>Security headers draft</h2><StatusPill label="deployment-gated" tone="warning" /></div>
          {dashboardSecurityHeaders.map((header) => (
            <div className="mini-card" key={header.name}>
              <div className="section-heading-row"><h3>{header.name}</h3><StatusPill label={header.status} tone={statusTone(header.status)} /></div>
              <code>{header.value}</code>
              <p>{header.rationale}</p>
            </div>
          ))}
        </article>

        <article className="card">
          <div className="section-heading-row"><h2>Privacy request drafts</h2><StatusPill label="legal review" tone="danger" /></div>
          {dashboardPrivacyDrafts.map((draft) => (
            <div className="mini-card" key={draft.id}>
              <div className="section-heading-row"><h3>{draft.type}</h3><StatusPill label={draft.status} tone="danger" /></div>
              <p>{draft.deadlinePolicy}</p>
              <small>{draft.affectedAreas.join(" · ")}</small>
            </div>
          ))}
        </article>
      </section>

      <section className="card spacious">
        <div className="section-heading-row"><h2>Legal placeholders</h2><StatusPill label="not legal advice" tone="danger" /></div>
        <div className="grid four">
          {dashboardLegalDocuments.map((doc) => (
            <div className="mini-card" key={doc.slug}>
              <h3>{doc.title}</h3>
              <p>{doc.summary}</p>
              <StatusPill label={doc.status} tone="danger" />
            </div>
          ))}
        </div>
      </section>

      <PrivacyRequestActionPanel />
    </main>
  );
}
