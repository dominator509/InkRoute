import { DashboardPageHeader } from "../../components/DashboardPageHeader";
import { DisabledActionPanel } from "../../components/DisabledActionPanel";
import { StatusPill } from "../../components/StatusPill";
import {
  featureFlagDefinitions,
  featureFlagPreview,
  mobileOtaPlanPreview,
  productionFlagPreview,
  releaseAuditDrafts,
  releaseBoundaryCards,
  releaseCandidatePreview,
  releaseHealthChecks,
  releaseNotesPreview,
  releaseWorkflowPlan,
  rollbackPlanPreview,
} from "../../lib/releaseDemo";

function gateTone(status: string) {
  if (status === "pass") return "success" as const;
  if (status === "warn" || status === "not_run") return "warning" as const;
  return "danger" as const;
}

export default function ReleasesPage() {
  return (
    <main>
      <DashboardPageHeader
        eyebrow="Release operations"
        title="Releases, flags, rollback, and mobile updates"
        description="Phase 12 turns release planning into a coded control-plane scaffold: release candidates, feature-flag decisions, migration gates, rollback drafts, CI/CD guardrails, EAS Update boundaries, and no-store tenant-scoped release/feature-flag APIs. Actions stay disabled until CI secrets and production environments exist."
      />

      <section className="grid three">
        <article className="metric-card">
          <span>Candidate</span>
          <strong>{releaseCandidatePreview.version}</strong>
          <small>{releaseCandidatePreview.channel} · {releaseCandidatePreview.risk} risk</small>
        </article>
        <article className="metric-card">
          <span>Production blocked</span>
          <strong>{releaseCandidatePreview.productionBlocked ? "Yes" : "No"}</strong>
          <small>{releaseCandidatePreview.gates.length} release gates attached</small>
        </article>
        <article className="metric-card">
          <span>Mobile OTA</span>
          <strong>{mobileOtaPlanPreview.compatibility}</strong>
          <small>{mobileOtaPlanPreview.channel} channel · runtime {mobileOtaPlanPreview.runtimeVersion}</small>
        </article>
      </section>

      <section className="grid two">
        <article className="card">
          <h2>Release gates</h2>
          <div className="stack">
            {releaseCandidatePreview.gates.map((gate) => (
              <div className="list-row" key={gate.id}>
                <div>
                  <strong>{gate.label}</strong>
                  <span>{gate.evidence}</span>
                  <small>{gate.nextAction}</small>
                </div>
                <StatusPill label={gate.status} tone={gateTone(gate.status)} />
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <h2>Health checks</h2>
          <div className="stack">
            {releaseHealthChecks.map((check) => (
              <div className="list-row" key={check.id}>
                <div>
                  <strong>{check.label}</strong>
                  <span>{check.detail}</span>
                  <small>{check.remediation}</small>
                </div>
                <StatusPill label={check.status} tone={gateTone(check.status)} />
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid two">
        <article className="card">
          <h2>Feature flag decisions</h2>
          <p className="muted">Preview and production decisions are evaluated with deterministic helper logic so risky features can remain hidden behind kill switches and tenant scopes.</p>
          <div className="stack">
            {featureFlagPreview.map((decision) => {
              const productionDecision = productionFlagPreview.find((item) => item.key === decision.key);
              return (
                <div className="list-row" key={decision.key}>
                  <div>
                    <strong>{decision.key}</strong>
                    <span>{decision.reason} · {decision.scope}</span>
                    <small>Production: {productionDecision?.enabled ? "enabled" : "disabled"}</small>
                  </div>
                  <StatusPill label={decision.enabled ? "preview on" : "preview off"} tone={decision.enabled ? "success" : "neutral"} />
                </div>
              );
            })}
          </div>
        </article>

        <article className="card">
          <h2>Feature flag catalog</h2>
          <div className="stack">
            {featureFlagDefinitions.map((flag) => (
              <div className="list-row" key={flag.key}>
                <div>
                  <strong>{flag.key}</strong>
                  <span>{flag.description}</span>
                  <small>Owner: {flag.owner} · default {flag.defaultEnabled ? "enabled" : "disabled"}</small>
                </div>
                <StatusPill label={flag.killSwitch ? "kill switch" : flag.scope} tone={flag.killSwitch ? "danger" : "neutral"} />
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid two">
        <article className="card">
          <h2>EAS Update preview</h2>
          <p className="muted">Mobile OTA remains deployment-gated until a real Expo project, native build, and runtime compatibility policy are verified.</p>
          <div className="callout-block">
            <strong>{mobileOtaPlanPreview.commandPreview}</strong>
            <span>{mobileOtaPlanPreview.rollbackPlan}</span>
          </div>
          <div className="stack">
            {mobileOtaPlanPreview.gates.map((gate) => (
              <div className="list-row" key={gate.id}>
                <div>
                  <strong>{gate.label}</strong>
                  <span>{gate.evidence}</span>
                  <small>{gate.nextAction}</small>
                </div>
                <StatusPill label={gate.status} tone={gateTone(gate.status)} />
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <h2>Rollback draft</h2>
          <div className="stack">
            <div><strong>Web</strong><p className="muted">{rollbackPlanPreview.web}</p></div>
            <div><strong>Dashboard</strong><p className="muted">{rollbackPlanPreview.dashboard}</p></div>
            <div><strong>Mobile</strong><p className="muted">{rollbackPlanPreview.mobile}</p></div>
            <div><strong>Database</strong><p className="muted">{rollbackPlanPreview.database}</p></div>
          </div>
        </article>
      </section>

      <section className="grid two">
        <article className="card">
          <h2>CI/CD guardrail plan</h2>
          <div className="stack">
            <div><strong>Concurrency</strong><p className="muted">{releaseWorkflowPlan.concurrencyGroup}</p></div>
            <div><strong>Environments</strong><p className="muted">{releaseWorkflowPlan.environments.join(" → ")}</p></div>
            <div><strong>Required checks</strong><p className="muted">{releaseWorkflowPlan.requiredChecks.join(" · ")}</p></div>
            <div><strong>Deployment-gated steps</strong><p className="muted">{releaseWorkflowPlan.deploymentGatedSteps.join(" · ")}</p></div>
          </div>
        </article>

        <article className="card">
          <h2>Release notes preview</h2>
          <pre className="code-block">{releaseNotesPreview}</pre>
        </article>
      </section>

      <section className="grid three">
        {releaseBoundaryCards.map((boundary) => (
          <article className="card" key={boundary.title}>
            <h2>{boundary.title}</h2>
            <StatusPill label={boundary.status} tone={boundary.status === "scaffolded" ? "warning" : "neutral"} />
            <p className="muted">{boundary.detail}</p>
          </article>
        ))}
      </section>

      <section className="card">
        <h2>Audit drafts</h2>
        <div className="stack">
          {releaseAuditDrafts.map((audit) => (
            <div className="list-row" key={`${audit.action}-${audit.createdAt}`}>
              <div>
                <strong>{audit.action.replace(/_/g, " ")}</strong>
                <span>Actor {audit.actorId} · {audit.createdAt}</span>
                <small>{Object.entries(audit.redactedPayload).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join("/") : value}`).join(" · ")}</small>
              </div>
              <StatusPill label="draft" tone="warning" />
            </div>
          ))}
        </div>
      </section>

      <DisabledActionPanel
        title="Release actions"
        description="GET /api/releases and GET /api/feature-flags now have tenant mismatch denial, no-store responses, and read audit logging. Deploying Vercel builds, publishing EAS updates, uploading Sentry artifacts, and rolling back still require protected environments and provider credentials."
        actions={["Create release", "Approve production", "Toggle flag", "Publish mobile OTA", "Rollback"]}
      />
    </main>
  );
}
