import { DashboardPageHeader } from "../../components/DashboardPageHeader";
import { DisabledActionPanel } from "../../components/DisabledActionPanel";
import { IntegrationBoundaryCard } from "../../components/IntegrationBoundaryCard";
import { StatusPill } from "../../components/StatusPill";
import { dashboardRedactedDeliveryLogDrafts, dashboardRedactedMessageThreadDrafts, dashboardRedactedProviderWebhookPreviews } from "../../lib/demo";
import { messagingPrivacyContract } from "../../lib/messagingPrivacy";

function toneForStatus(status: string) {
  if (status === "delivered" || status === "sent") return "success" as const;
  if (status === "queued") return "warning" as const;
  if (status === "failed") return "danger" as const;
  return "neutral" as const;
}

export default function MessagesPage() {
  return (
    <main>
      <DashboardPageHeader
        eyebrow="Messaging"
        title="Client messaging and delivery logs"
        description="Draft client threads, provider webhook interpretations, and redacted delivery-log records. Tenant-scoped redacted message read APIs now exist; sending, inbound routing, and provider reconciliation remain gated."
      />

      <section className="dashboard-grid two">
        <div className="card">
          <p className="eyebrow">Thread drafts</p>
          <h2>Artist-client message previews</h2>
          <div className="stacked-list">
            {dashboardRedactedMessageThreadDrafts.map((thread) => (
              <div className="stacked-item" key={thread.subject}>
                <strong>{thread.subject}</strong>
                <span>{thread.channel} Â· {thread.direction} Â· {thread.status}</span>
                <p>{thread.bodyPreview}</p>
                <small>{thread.piiRedactionNote}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <p className="eyebrow">Delivery logs</p>
          <h2>Redacted delivery record drafts</h2>
          <div className="stacked-list">
            {dashboardRedactedDeliveryLogDrafts.map((log) => (
              <div className="stacked-item" key={log.idempotencyKey}>
                <strong>{log.notificationType.replace(/_/g, " ")}</strong>
                <span>{log.provider} Â· {log.channel} Â· {log.destinationHash}</span>
                <StatusPill label={log.status} tone={toneForStatus(log.status)} />
                <small>{log.redactionSummary}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card">
        <p className="eyebrow">Webhook interpretation previews</p>
        <h2>Email, SMS, and push provider callbacks</h2>
        <div className="table-card">
          <div className="table-header five">
            <span>Provider</span><span>Event</span><span>Status</span><span>Inbound</span><span>Notes</span>
          </div>
          {dashboardRedactedProviderWebhookPreviews.map((event) => (
            <div className="table-row five" key={`${event.provider}-${event.eventType}-${event.normalizedStatus}`}>
              <span><strong>{event.provider}</strong><small>signature: {event.requiresSignatureVerification ? "required" : "receipt polling"}</small></span>
              <span>{event.eventType}</span>
              <span><StatusPill label={event.normalizedStatus} tone={toneForStatus(event.normalizedStatus)} /></span>
              <span>{event.requiresInboundMessageHandling ? "Yes" : "No"}</span>
              <span>{event.notes.join(" ")}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-grid two">
        <div className="card">
          <p className="eyebrow">Messaging privacy contract</p>
          <h2>Redaction, role gates, and attachments</h2>
          <div className="stacked-list">
            <div className="stacked-item">
              <strong>Findings</strong>
              <span>{messagingPrivacyContract.redactPlan.redactionFindings.join(", ")}</span>
              <StatusPill label={messagingPrivacyContract.redactPlan.status} tone={toneForStatus(messagingPrivacyContract.redactPlan.status)} />
            </div>
            <div className="stacked-item">
              <strong>Assistant visibility</strong>
              <span>{messagingPrivacyContract.authorizeViewPlan.visibleFields.join(", ")}</span>
              <small>Attachments and provider payloads stay gated by role and policy.</small>
            </div>
          </div>
        </div>
        <div className="card">
          <p className="eyebrow">Retention workflows</p>
          <h2>Export, delete, retention, moderation</h2>
          <div className="stacked-list">
            {[messagingPrivacyContract.exportPlan, messagingPrivacyContract.deletePlan, messagingPrivacyContract.retentionPlan, messagingPrivacyContract.moderationPlan].map((plan) => (
              <div className="stacked-item" key={plan.action}>
                <strong>{plan.action.replace(/_/g, " ")}</strong>
                <span>{plan.requiredWrites.join(", ")}</span>
                <StatusPill label={plan.status} tone={toneForStatus(plan.status)} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <IntegrationBoundaryCard
        title="Message center boundary"
        status="Read APIs wired"
        description="Message thread reads now enforce message RBAC, tenant scope, no-store responses, message body/provider id redaction, and AuditLog rows. Production sends still require inbound email/SMS routing, attachments policy, spam/rate limiting, and delivery status reconciliation."
        gapIds={["GAP-064", "GAP-066", "GAP-067", "GAP-068"]}
      />

      <DisabledActionPanel
        title="Message actions"
        description="Thread reads now have authenticated redacted APIs. Sending, replying, assigning threads, marking read/unread, and syncing provider delivery state still require mutation APIs and provider workers."
        actions={["Reply to client", "Assign thread", "Queue follow-up", "Mark read", "Sync delivery status", "Export message audit"]}
      />
    </main>
  );
}

