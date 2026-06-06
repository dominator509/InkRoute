import { DashboardPageHeader } from "../../../components/DashboardPageHeader";
import { DisabledActionPanel } from "../../../components/DisabledActionPanel";
import { Timeline } from "../../../components/Timeline";
import { clientTimeline, dashboardBookingRows, dashboardClients, dashboardPayments } from "../../../lib/demo";

interface ClientDetailPageProps {
  params: Promise<{ clientId: string }>;
}

function centsToUsd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function generateStaticParams() {
  return dashboardClients.map((client) => ({ clientId: client.id }));
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { clientId } = await params;
  const client = dashboardClients.find((row) => row.id === clientId);

  if (!client) {
    throw new Error(`Client ${clientId} was not found in the Phase 5 static demo data.`);
  }

  const matchingBookings = dashboardBookingRows.filter((booking) => booking.clientName === client.preferredName);
  const matchingPayments = dashboardPayments.filter((payment) => matchingBookings.some((booking) => booking.id === payment.bookingId));

  return (
    <main>
      <DashboardPageHeader
        eyebrow="Client detail"
        title={client.preferredName}
        description="Client timeline, booking history, risk flags, consent, and payment context will live here once private CRM APIs are implemented."
        actions={<a className="secondary-link" href="/clients">Back to clients</a>}
      />

      <section className="grid two">
        <article className="card detail-card">
          <h2>Profile</h2>
          <dl className="detail-list">
            <div><dt>Email</dt><dd>{client.email}</dd></div>
            <div><dt>City</dt><dd>{client.city}</dd></div>
            <div><dt>Tags</dt><dd>{client.tags.join(", ")}</dd></div>
            <div><dt>Lifetime value</dt><dd>{centsToUsd(client.lifetimeValueCents)}</dd></div>
          </dl>
        </article>
        <article className="card detail-card">
          <h2>Risk and privacy notes</h2>
          <ul className="compact-list">
            {(client.riskFlags.length > 0 ? client.riskFlags : ["No demo risk flags"]).map((flag) => <li key={flag}>{flag}</li>)}
            <li>Medical notes, consent signatures, and private reference images must not be exposed to public routes.</li>
          </ul>
        </article>
      </section>

      <section className="grid two spacious">
        <article className="card">
          <h2>Timeline</h2>
          <Timeline items={clientTimeline} />
        </article>
        <article className="card">
          <h2>Related records</h2>
          <div className="stack">
            {matchingBookings.map((booking) => <div className="list-row" key={booking.id}><strong>{booking.style.replace(/_/g, " ")} request</strong><span>{booking.status}</span></div>)}
            {matchingPayments.map((payment) => <div className="list-row" key={payment.id}><strong>Deposit estimate</strong><span>{centsToUsd(payment.amountCents)} · {payment.status}</span></div>)}
          </div>
        </article>
      </section>

      <DisabledActionPanel
        title="Private CRM actions"
        description="Client notes, consent re-send, healed-photo request, and message actions require authenticated APIs, retention policy, access logging, and notification providers."
        actions={["Add private note", "Send prep message", "Request healed photo", "Export client data"]}
      />
    </main>
  );
}
