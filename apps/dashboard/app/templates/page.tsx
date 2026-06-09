import { DashboardPageHeader } from "../../components/DashboardPageHeader";
import { DisabledActionPanel } from "../../components/DisabledActionPanel";
import { IntegrationBoundaryCard } from "../../components/IntegrationBoundaryCard";
import { StatusPill } from "../../components/StatusPill";
import { dashboardNotificationSchedulerContract } from "../../lib/notificationScheduler";`nimport {`n  dashboardNotificationAutomationSequence,
  dashboardNotificationPlans,
  dashboardProviderBoundaryMatrix,`n  dashboardRedactedProviderSendDrafts,
  dashboardTemplates,
} from "../../lib/demo";

function toneForStatus(status: string) {
  if (status === "allowed" || status === "ready_to_queue") return "success" as const;
  if (status === "requires_provider" || status === "requires_review") return "warning" as const;
  if (status === "blocked" || status === "requires_destination") return "danger" as const;
  return "neutral" as const;
}

export default function TemplatesPage() {
  return (
    <main>
      <DashboardPageHeader
        eyebrow="Notifications"
        title="Template, consent, and delivery command center"
        description="Email, SMS, push, and in-app notification templates with consent-aware delivery plans, automation sequences, provider boundaries, and a tenant-scoped redacted template API. No provider sends are enabled."
      />

      <section className="grid two">
        {dashboardTemplates.map((template) => (
          <article className="card" key={`${template.key}-${template.channel}`}>
            <div className="section-heading-row">
              <h2>{template.key.replace(/_/g, " ")}</h2>
              <StatusPill label={template.channel} tone="info" />
            </div>
            <p>{template.preview}</p>
            <small>{template.complianceNote}</small>
          </article>
        ))}
      </section>

      <section className="dashboard-grid two">
        <div className="card">
          <p className="eyebrow">Consent routing preview</p>
          <h2>Channel decisions before provider handoff</h2>
          <div className="stacked-list">
            {dashboardNotificationPlans.map((plan) => (
              <div className="stacked-item" key={plan.template.key}>
                <strong>{plan.template.key.replace(/_/g, " ")}</strong>
                <span>{plan.template.subject}</span>
                <div className="gap-row">
                  {plan.candidates.map((candidate) => (
                    <StatusPill key={`${plan.template.key}-${candidate.channel}`} label={`${candidate.channel}: ${candidate.status}`} tone={toneForStatus(candidate.status)} />
                  ))}
                </div>
                <small>{plan.complianceNotes[0]}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <p className="eyebrow">Automation lifecycle</p>
          <h2>Booking, deposit, prep, aftercare, travel, and review sequence</h2>
          <div className="stacked-list">
            {dashboardNotificationAutomationSequence.slice(0, 10).map((step) => (
              <div className="stacked-item" key={step.id}>
                <strong>{step.templateKey.replace(/_/g, " ")}</strong>
                <span>{step.trigger} Â· offset {step.scheduledOffsetMinutes} min Â· {step.recommendedChannels.join(", ")}</span>
                <StatusPill label={step.status} tone={toneForStatus(step.status)} />
                <small>{step.reason}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="dashboard-grid two">
        <div className="card">
          <p className="eyebrow">Provider send drafts</p>
          <h2>Disabled send payload previews</h2>
          <div className="stacked-list">
            {dashboardRedactedProviderSendDrafts.map((draft) => (
              <div className="stacked-item" key={`${draft.provider}-${draft.channel}`}>
                <strong>{draft.provider} Â· {draft.channel}</strong>
                <span>{draft.toMasked} Â· env: {draft.credentialEnvVar}</span>
                <small>{draft.disabledReason}</small>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <p className="eyebrow">Provider matrix</p>
          <h2>What must exist before live delivery</h2>
          <div className="stacked-list">
            {dashboardProviderBoundaryMatrix.map((boundary) => (
              <div className="stacked-item" key={`${boundary.provider}-${boundary.channel}`}>
                <strong>{boundary.provider} Â· {boundary.channel}</strong>
                <span>{boundary.credentialEnvVars.join(", ")}</span>
                <small>{boundary.productionRequirement}</small>
                <code>{boundary.gapId}</code>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="dashboard-grid two">
        <div className="card">
          <p className="eyebrow">Queue scheduler contract</p>
          <h2>Database-backed worker plans</h2>
          <div className="stacked-list">
            <div className="stacked-item">
              <strong>Schedule sequence</strong>
              <span>{dashboardNotificationSchedulerContract.schedulePlan.scheduledJobs.length} jobs planned through NotificationJob writes</span>
              <StatusPill label={dashboardNotificationSchedulerContract.schedulePlan.status} tone={toneForStatus(dashboardNotificationSchedulerContract.schedulePlan.status)} />
            </div>
            <div className="stacked-item">
              <strong>Process due job</strong>
              <span>{dashboardNotificationSchedulerContract.processPlan.writes.map((write) => write.model).join(", ")}</span>
              <StatusPill label={dashboardNotificationSchedulerContract.processPlan.status} tone={toneForStatus(dashboardNotificationSchedulerContract.processPlan.status)} />
            </div>
            <div className="stacked-item">
              <strong>Retry and dead letter</strong>
              <span>{dashboardNotificationSchedulerContract.retryPlan.retryDelaySeconds ?? 0}s retry delay; dead-letter writes require durable repository</span>
              <StatusPill label={dashboardNotificationSchedulerContract.deadLetterPlan.status} tone={toneForStatus(dashboardNotificationSchedulerContract.deadLetterPlan.status)} />
            </div>
          </div>
        </div>
        <div className="card">
          <p className="eyebrow">Scheduler readiness gates</p>
          <h2>Worker promotion blockers</h2>
          <div className="stacked-list">
            {dashboardNotificationSchedulerContract.runtimeReadiness.blockers.slice(0, 6).map((blocker) => (
              <div className="stacked-item" key={blocker}>
                <strong>{blocker}</strong>
                <small>GAP-065</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <IntegrationBoundaryCard
        title="Notification provider boundary"
        status="Credential-gated"
        description="Phase 9 renders templates and delivery plans only. Production still needs provider SDKs, verified webhooks, queue workers, suppression lists, delivery logs, token registration, audit logging, and SMS/legal review."
        gapIds={["GAP-061", "GAP-062", "GAP-063", "GAP-064", "GAP-065", "GAP-066"]}
      />

      <DisabledActionPanel
        title="Notification actions"
        description="GET /api/templates now exposes coded template metadata plus redacted queue/delivery summaries. Template saving, test sends, scheduled delivery, queue retries, suppression changes, and provider delivery reconciliation still require write APIs and provider credentials."
        actions={["Save template", "Send test email", "Send SMS preview", "Queue aftercare sequence", "Register push token", "Sync provider status"]}
      />
    </main>
  );
}

