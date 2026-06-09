import { DashboardPageHeader } from "../../components/DashboardPageHeader";
import { StatusPill } from "../../components/StatusPill";
import { dashboardProjectedClients } from "../../lib/demo";

function centsToUsd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

export default function ClientsPage() {
  return (
    <main>
      <DashboardPageHeader
        eyebrow="Client CRM"
        title="Client profiles"
        description="A tattoo-specific CRM surface for request history, consent, payments, notes, healed-photo follow-ups, and no-show risk. The dashboard API now exposes tenant-scoped redacted client read routes; this page still renders projected demo rows until UI loaders are connected."
      />

      <section className="card table-card">
        <div className="table-header five">
          <span>Client</span><span>Location</span><span>Tags</span><span>Value</span><span>Risk</span>
        </div>
        {dashboardProjectedClients.map((client) => (
          <a className="table-row five" href={`/clients/${client.id}`} key={client.id}>
            <span><strong>{client.preferredName}</strong><small>{client.email}</small></span>
            <span>{client.city}<small>{client.lastActivity}</small></span>
            <span>{client.tags.join(", ")}</span>
            <span>{centsToUsd(client.lifetimeValueCents)}</span>
            <span>{client.riskFlags.length > 0 ? client.riskFlags.join(", ") : <StatusPill label="clear" tone="success" />}</span>
          </a>
        ))}
      </section>
    </main>
  );
}
