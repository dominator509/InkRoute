import { DashboardPageHeader } from "../../components/DashboardPageHeader";
import { DeploymentReadinessActionPanel } from "../../components/DeploymentReadinessActionPanel";
import { StatusPill } from "../../components/StatusPill";
import {
  deploymentCommandCards,
  deploymentPlanPreview,
  exampleEnvironmentReadiness,
  handoffTasksPreview,
  launchChecklistPreview,
  launchChecklistSummary,
  providerMatrixPreview,
} from "../../lib/deploymentDemo";

function statusTone(status: string) {
  if (status === "implemented" || status === "pass") return "success" as const;
  if (status === "blocked" || status === "block") return "danger" as const;
  if (status === "warn" || status === "credential_gated" || status === "deployment_gated" || status === "manual") return "warning" as const;
  return "neutral" as const;
}

export default function DeploymentPage() {
  return (
    <main>
      <DashboardPageHeader
        eyebrow="Phase 15"
        title="Deployment, launch, and handoff control room"
        description="A deployment readiness control room for local setup, provider environments, CI/CD, mobile builds, launch evidence, agent handoff, and a no-store tenant-scoped readiness API. All live deployment actions remain disabled until providers, secrets, legal review, and runtime verification exist."
      />

      <section className="grid three">
        <article className="metric-card">
          <span>Production blockers</span>
          <strong>{deploymentPlanPreview.productionBlockers.length}</strong>
          <small>{deploymentPlanPreview.environment} deployment plan</small>
        </article>
        <article className="metric-card">
          <span>Launch checklist</span>
          <strong>{launchChecklistSummary.productionBlockingCount}</strong>
          <small>{launchChecklistSummary.itemCount} tracked items</small>
        </article>
        <article className="metric-card">
          <span>Env readiness</span>
          <strong>{exampleEnvironmentReadiness.blocking}</strong>
          <small>{exampleEnvironmentReadiness.summary}</small>
        </article>
      </section>

      <section className="grid two">
        <article className="card">
          <h2>Deployment steps</h2>
          <div className="stack">
            {deploymentPlanPreview.steps.map((step) => (
              <div className="list-row" key={step.id}>
                <div>
                  <strong>{step.label}</strong>
                  <span>{step.surface} · owner {step.owner}</span>
                  <small>{step.evidenceRequired}</small>
                  {step.command ? <code>{step.command}</code> : null}
                </div>
                <StatusPill label={step.status} tone={statusTone(step.status)} />
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <h2>Provider matrix</h2>
          <div className="stack">
            {providerMatrixPreview.map((provider) => (
              <div className="list-row" key={provider.id}>
                <div>
                  <strong>{provider.label}</strong>
                  <span>{provider.surfaces.join(", ")}</span>
                  <small>Evidence: {provider.setupEvidenceRequired.join(" · ")}</small>
                </div>
                <StatusPill label={provider.status} tone={statusTone(provider.status)} />
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid two">
        <article className="card">
          <h2>Production launch checklist</h2>
          <div className="stack">
            {launchChecklistPreview.map((item) => (
              <div className="list-row" key={item.id}>
                <div>
                  <strong>{item.description}</strong>
                  <span>{item.phase} · {item.area}</span>
                  <small>{item.evidenceRequired}</small>
                </div>
                <StatusPill label={item.status} tone={statusTone(item.status)} />
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <h2>Environment blockers</h2>
          <p className="muted">This demo intentionally uses placeholder values so production readiness remains blocked until real provider secrets are configured outside the repo.</p>
          <div className="stack">
            {exampleEnvironmentReadiness.results.filter((result) => result.status !== "pass").slice(0, 10).map((result) => (
              <div className="list-row" key={result.name}>
                <div>
                  <strong>{result.name}</strong>
                  <span>{result.message}</span>
                  <small>{result.gapIds.join(", ")}</small>
                </div>
                <StatusPill label={result.status} tone={statusTone(result.status)} />
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid two">
        <article className="card">
          <h2>Dependency-free deployment scripts</h2>
          <div className="stack">
            {deploymentCommandCards.map((card) => (
              <div className="list-row" key={card.command}>
                <div>
                  <strong>{card.label}</strong>
                  <code>{card.command}</code>
                  <small>{card.status}</small>
                </div>
                <StatusPill label="script contract" tone="info" />
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <h2>Agent handoff queue</h2>
          <div className="stack">
            {handoffTasksPreview.map((task) => (
              <div className="list-row" key={task.id}>
                <div>
                  <strong>{task.title}</strong>
                  <span>{task.target} · {task.priority}</span>
                  <small>{task.verification.join(" · ")}</small>
                </div>
                <StatusPill label={task.gapIds[0] ?? "handoff"} tone="warning" />
              </div>
            ))}
          </div>
        </article>
      </section>

      <DeploymentReadinessActionPanel />
    </main>
  );
}
