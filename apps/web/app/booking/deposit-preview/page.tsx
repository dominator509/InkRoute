import type { Metadata } from "next";
import { buildStripeCheckoutSessionDraft, calculateDepositPolicy, evaluateRefundPolicy, evaluateNoShowPolicy } from "@inkroute/payments";
import { CtaBand } from "../../../components/CtaBand";
import { SectionIntro } from "../../../components/SectionIntro";

export const metadata: Metadata = {
  title: "Deposit Policy Preview | InkRoute Suite",
  description: "A non-payment preview of InkRoute Suite deposit policy, refund, no-show, and Stripe Checkout handoff boundaries.",
  robots: { index: false, follow: false },
};

function centsToUsd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

const policy = calculateDepositPolicy({
  estimatedSessionHours: 5,
  city: "Seattle",
  cityDemandScore: 5,
  travelRiskTier: "high_demand_guest_spot",
  appointmentType: "guest_spot",
  clientNoShowCount: 0,
});

const sessionDraft = buildStripeCheckoutSessionDraft({
  tenantId: "inkroute-demo",
  bookingRequestId: "book_demo_serpent",
  amountCents: policy.depositAmountCents,
  currency: policy.currency,
  successUrl: "https://example.test/booking/deposit/success",
  cancelUrl: "https://example.test/booking/deposit/cancel",
  clientEmail: "client@example.test",
  artistDisplayName: "Mara Vale",
  description: "Demo Seattle guest-spot tattoo deposit preview.",
  policyVersion: policy.policyVersion,
});

const refund = evaluateRefundPolicy({
  amountPaidCents: policy.depositAmountCents,
  cancellationRequestedAt: "2026-07-08T10:00:00-07:00",
  appointmentStartsAt: "2026-07-11T15:00:00-07:00",
  nonRefundableWindowHours: policy.nonRefundableWindowHours,
  policyAllowsManualReview: true,
});

const noShow = evaluateNoShowPolicy({
  depositAmountCents: policy.depositAmountCents,
  appointmentStartsAt: "2026-07-11T15:00:00-07:00",
  markedAt: "2026-07-11T15:45:00-07:00",
  clientArrivedMinutesLate: 45,
});

export default function DepositPreviewPage() {
  return (
    <main>
      <section className="page-hero narrow">
        <p className="eyebrow">Payment boundary</p>
        <h1>Deposit policy preview</h1>
        <p>
          This page shows the Phase 7 payment policy and Stripe Checkout readiness contract. It calculates a demo deposit policy and renders the provider handoff fields while keeping live money movement disabled until Stripe credentials, webhook proof, persistence evidence, and legal/tax approval are complete.
        </p>
      </section>

      <section className="content-section">
        <SectionIntro
          eyebrow="Policy engine"
          title={`${centsToUsd(policy.depositAmountCents)} ${policy.decision.replace(/_/g, " ")}`}
          description={`${policy.reason} Risk score: ${policy.riskScore}. Due within ${policy.dueWithinHours} hours. Non-refundable window: ${policy.nonRefundableWindowHours} hours.`}
        />
        <div className="feature-grid three">
          {policy.breakdown.map((line) => (
            <article className="feature-card" key={line.label}>
              <span>{line.label}</span>
              <strong>{centsToUsd(line.amountCents)}</strong>
              <p>{line.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section split-section">
        <div className="panel-card">
          <p className="eyebrow">Checkout draft</p>
          <h2>Stripe handoff fields</h2>
          <dl className="detail-list">
            <div><dt>Mode</dt><dd>{sessionDraft.mode}</dd></div>
            <div><dt>Reference</dt><dd>{sessionDraft.clientReferenceId}</dd></div>
            <div><dt>Idempotency</dt><dd>{sessionDraft.idempotencyKey}</dd></div>
            <div><dt>Line item</dt><dd>{sessionDraft.lineItem.name} · {centsToUsd(sessionDraft.lineItem.amountCents)}</dd></div>
          </dl>
        </div>
        <div className="panel-card">
          <p className="eyebrow">Protection rules</p>
          <h2>Refund and no-show preview</h2>
          <dl className="detail-list">
            <div><dt>Refund decision</dt><dd>{refund.decision} · {centsToUsd(refund.refundableAmountCents)} refundable</dd></div>
            <div><dt>Refund note</dt><dd>{refund.reason}</dd></div>
            <div><dt>No-show decision</dt><dd>{noShow.decision} · {centsToUsd(noShow.forfeitedAmountCents)} at risk</dd></div>
            <div><dt>No-show note</dt><dd>{noShow.reason}</dd></div>
          </dl>
        </div>
      </section>

      <CtaBand
        eyebrow="Not a live payment page"
        title="Stripe remains credential-gated."
        description="Before launch, this needs Stripe SDK wiring, webhook signature verification, database persistence, idempotency, dashboard auth, receipts, tax exports, and attorney-reviewed policy language."
        href="/booking"
        label="Back to booking flow"
      />
    </main>
  );
}
