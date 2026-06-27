import { DashboardPageHeader } from "../../components/DashboardPageHeader";
import { IntegrationBoundaryCard } from "../../components/IntegrationBoundaryCard";
import { MetricCard } from "../../components/MetricCard";
import { PaymentActionPanel } from "../../components/PaymentActionPanel";
import { StatusPill } from "../../components/StatusPill";
import { dashboardPaymentPersistenceContract } from "../../lib/paymentPersistence";
import { dashboardPaymentOperationsContract } from "../../lib/paymentOperations";
import { dashboardProjectedPayments, dashboardWebhookPreview } from "../../lib/demo";

function centsToUsd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

const totalDepositExposure = dashboardProjectedPayments.reduce((sum, payment) => sum + payment.amountCents, 0);
const highRiskCount = dashboardProjectedPayments.filter((payment) => payment.riskScore >= 70).length;

export default function PaymentsPage() {
  return (
    <main>
      <DashboardPageHeader
        eyebrow="Payments and deposits"
        title="Deposit protection"
        description="Deposit policy estimates, checkout-session drafts, refund/no-show decisions, receipts, webhook interpretation, and audit boundaries. Tenant-scoped redacted payment read APIs now exist; Stripe write actions are still credential-gated."
      />

      <section className="metric-grid">
        <MetricCard label="Deposit exposure" value={centsToUsd(totalDepositExposure)} detail="Calculated by @inkroute/payments" />
        <MetricCard label="High-risk requests" value={String(highRiskCount)} detail="Manual review when score is high" />
        <MetricCard label="Policy version" value="phase7-demo-v1" detail="Persist as policySnapshot before production" />
        <MetricCard label="Webhook mode" value="Boundary" detail="Local verifier wired; endpoint-secret proof pending" />
      </section>

      <section className="card table-card">
        <div className="table-header five">
          <span>Client</span><span>Deposit</span><span>Risk</span><span>Lifecycle</span><span>Reconciliation keys</span>
        </div>
        {dashboardProjectedPayments.map((payment) => (
          <div className="table-row five" key={payment.id}>
            <span><strong>{payment.clientName}</strong><small>{payment.bookingId}</small></span>
            <span>{centsToUsd(payment.amountCents)}<small>Due {new Date(payment.dueAt).toLocaleDateString()}</small></span>
            <span><StatusPill label={`${payment.decision} · ${payment.riskScore}`} tone={payment.riskScore >= 70 ? "danger" : "warning"} /><small>{payment.policyVersion}</small></span>
            <span><StatusPill label={payment.status} tone={payment.status === "paid" ? "success" : "warning"} /><small>Refund: {payment.refundDecision} · no-show: {payment.noShowDecision}</small></span>
            <span><strong>{payment.receiptNumber}</strong><small>{payment.checkoutClientReferenceId}</small><small>{payment.checkoutIdempotencyKey}</small></span>
          </div>
        ))}
      </section>

      <section className="dashboard-grid two">
        <div className="card">
          <p className="eyebrow">Payment persistence contract</p>
          <h2>Tenant-scoped repository/service contract</h2>
          <p>{dashboardPaymentPersistenceContract.boundary}</p>
          <div className="stacked-list">
            {dashboardPaymentPersistenceContract.lifecyclePlans.map((plan) => (
              <div className="stacked-item" key={plan.action}>
                <strong>{plan.action}</strong>
                <span>{plan.targetStatus} · {plan.auditAction}</span>
                <small>{plan.writes.map((write) => write.model).join(", ")}</small>
              </div>
            ))}
          </div>
          <StatusPill label={dashboardPaymentPersistenceContract.readiness.status} tone="warning" />
        </div>
        <div className="card">
          <p className="eyebrow">Webhook interpretation boundary</p>
          <h2>Stripe events mapped behind signature verification</h2>
          <div className="stacked-list">
            {dashboardWebhookPreview.map((event) => (
              <div className="stacked-item" key={event.eventType}>
                <strong>{event.eventType}</strong>
                <span>{event.action} → {event.targetStatus}</span>
                <small>{event.note}</small>
              </div>
            ))}
          </div>
        </div>
        <IntegrationBoundaryCard
          title="Production payment boundary"
          status="Credential-gated"
          description="Create Stripe Checkout Sessions only from accepted bookings or signed deposit tokens; verify webhooks from the raw request body; persist Deposit, Payment, Refund, and PaymentAuditLog rows idempotently; and run legal/tax review before launch."
          gapIds={["GAP-004", "GAP-049", "GAP-050", "GAP-051"]}
        />
      </section>
      <section className="dashboard-card">
        <h2>Payment operation write contract</h2>
        <p>
          Refunds, no-show forfeitures, dispute evidence, receipts, and accounting exports now share a
          dashboard mutation contract with tenant authorization, idempotency, transactional writes, and
          redacted provider-result persistence.
        </p>
        <ul className="dashboard-list">
          {dashboardPaymentOperationsContract.supportedActions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
        <p className="dashboard-muted">
          Runtime evidence remains blocked until Stripe test-mode refunds, receipt delivery, tax review,
          tenant-denial tests, and dashboard E2E artifacts are attached.
        </p>
      </section>
      <PaymentActionPanel bookingId={dashboardProjectedPayments[0]?.bookingId ?? "booking_demo_deposit"} />
    </main>
  );
}


