import { getAvailableBookingActions } from "@inkroute/booking";
import { DashboardPageHeader } from "../../../components/DashboardPageHeader";
import { DisabledActionPanel } from "../../../components/DisabledActionPanel";
import { StatusPill } from "../../../components/StatusPill";
import { Timeline } from "../../../components/Timeline";
import { bookingStatusActionSummary, clientTimeline, dashboardProjectedBookingRows, dashboardProjectedPayments } from "../../../lib/demo";

interface BookingDetailPageProps {
  params: Promise<{ bookingId: string }>;
}

function centsToUsd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function generateStaticParams() {
  return dashboardProjectedBookingRows.map((booking) => ({ bookingId: booking.id }));
}

export default async function BookingDetailPage({ params }: BookingDetailPageProps) {
  const { bookingId } = await params;
  const booking = dashboardProjectedBookingRows.find((row) => row.id === bookingId);

  if (!booking) {
    throw new Error(`Booking ${bookingId} was not found in the Phase 5 static demo data.`);
  }

  const payment = dashboardProjectedPayments.find((item) => item.bookingId === booking.id);
  const actions = getAvailableBookingActions(booking.status).map((action) => action.action.replace(/_/g, " "));

  return (
    <main>
      <DashboardPageHeader
        eyebrow="Booking detail"
        title={`${booking.clientName} · ${booking.city}`}
        description="Static booking detail page showing the target review experience for artists, assistants, and studio managers. Mutations are disabled until API, auth, and audit logging exist."
        actions={<a className="secondary-link" href="/bookings">Back to inbox</a>}
      />

      <section className="grid two">
        <article className="card detail-card">
          <div className="section-heading-row">
            <h2>Request brief</h2>
            <StatusPill label={booking.status} tone="info" />
          </div>
          <dl className="detail-list">
            <div><dt>Style</dt><dd>{booking.style.replace(/_/g, " ")}</dd></div>
            <div><dt>Placement</dt><dd>{booking.placement.replace(/_/g, " ")}</dd></div>
            <div><dt>Size</dt><dd>{booking.sizeEstimate}</dd></div>
            <div><dt>Budget</dt><dd>{booking.budgetRange}</dd></div>
            <div><dt>Readiness</dt><dd>{booking.readinessScore}%</dd></div>
            <div><dt>Attribution</dt><dd>{booking.portfolioAttribution}</dd></div>
          </dl>
          <p>{booking.ideaSummary}</p>
        </article>

        <article className="card detail-card">
          <h2>Deposit and risk preview</h2>
          <dl className="detail-list">
            <div><dt>Deposit estimate</dt><dd>{payment ? centsToUsd(payment.amountCents) : "Not calculated"}</dd></div>
            <div><dt>Status</dt><dd>{payment?.status ?? "missing"}</dd></div>
            <div><dt>Provider</dt><dd>{payment?.provider ?? "not wired"}</dd></div>
          </dl>
          <ul className="compact-list">
            {booking.notes.map((note) => <li key={note}>{note}</li>)}
          </ul>
        </article>
      </section>

      <DisabledActionPanel
        title="Lifecycle actions"
        description="These buttons show intended artist actions but are disabled because mutations, RBAC, tenant checks, state event writes, notification queues, and audit logs are not implemented."
        actions={actions.length > 0 ? actions : ["Archive"]}
      />

      <section className="grid two spacious">
        <article className="card">
          <h2>Client timeline</h2>
          <Timeline items={clientTimeline} />
        </article>
        <article className="card">
          <h2>Allowed state transitions</h2>
          <div className="stack small-stack">
            {bookingStatusActionSummary.slice(0, 8).map((item) => (
              <div className="list-row" key={`${item.label}-${item.action}`}>
                <div><strong>{item.label}</strong><span>{item.action.replace(/_/g, " ")} · {item.actor}</span></div>
                <StatusPill label={item.requiresAudit ? "audit required" : "no audit"} tone="warning" />
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
