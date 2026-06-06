import { DashboardPageHeader } from "../../components/DashboardPageHeader";
import { DisabledActionPanel } from "../../components/DisabledActionPanel";
import { IntegrationBoundaryCard } from "../../components/IntegrationBoundaryCard";
import { MetricCard } from "../../components/MetricCard";
import { StatusPill } from "../../components/StatusPill";
import { dashboardPayments, dashboardWebhookPreview } from "../../lib/demo";

function centsToUsd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

const totalDepositExposure = dashboardPayments.reduce((sum, payment) => sum + payment.amountCents, 0);
const highRiskCount = dashboardPayments.filter((payment) => payment.riskScore >= 70).length;

export default function PaymentsPage() {
  return (
    <main>
      <DashboardPageHeader
        eyebrow="Payments and deposits"
        title="Deposit protection"
        description="Deposit policy estimates, checkout-session drafts, refund/no-show decisions, receipts, webhook interpretation, and audit boundaries. Stripe is still credential-gated."
      />

      <section className="metric-grid">
        <MetricCard label="Deposit exposure" value={centsToUsd(totalDepositExposure)} detail="Calculated by @inkroute/payments" />
        <MetricCard label="High-risk requests" value={String(highRiskCount)} detail="Manual review when score is high" />
        <MetricCard label="Policy version" value="phase7-demo-v1" detail="Persist as policySnapshot before production" />
        <MetricCard label="Webhook mode" value="Boundary" detail="Signature verification not wired" />
      </section>

      <section className="card table-card">
        <div className="table-header five">
          <span>Client</span><span>Deposit</span><span>Risk</span><span>Lifecycle</span><span>Reconciliation keys</span>
        </div>
        {dashboardPayments.map((payment) => (
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
          <p className="eyebrow">Webhook interpretation scaffold</p>
          <h2>Stripe events mapped before SDK wiring</h2>
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

      <DisabledActionPanel
        title="Stripe actions"
        description="Checkout/session creation, webhook reconciliation, refund processing, no-show forfeiture, receipts, and payment audit logs require Stripe credentials, database persistence, idempotency, and production policy review."
        actions={["Create deposit session", "Record manual payment", "Refund deposit", "Forfeit no-show deposit", "Export tax report"]}
      />
    </main>
  );
}
