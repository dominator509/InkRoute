import { headers } from "next/headers";
import { DashboardPageHeader } from "../../../components/DashboardPageHeader";
import { ClientDetailActionPanel } from "../../../components/ClientDetailActionPanel";
import { Timeline } from "../../../components/Timeline";
import { clientTimeline, dashboardProjectedBookingRows, dashboardProjectedClients, dashboardProjectedPayments } from "../../../lib/demo";

interface ClientDetailPageProps {
  params: Promise<{ clientId: string }>;
}

function centsToUsd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

type ClientDetailRow = (typeof dashboardProjectedClients)[number] & {
  relatedBookings?: Array<{ id: string; status: string; style: string; updatedAt: string; paidPaymentCount: number }>;
};

export function generateStaticParams() {
  return dashboardProjectedClients.map((client) => ({ clientId: client.id }));
}

async function loadClientDetail(clientId: string): Promise<{ client: ClientDetailRow | null; source: "dashboard-api" | "demo-fallback" | "production-blocked"; boundary: string }> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const proto = requestHeaders.get("x-forwarded-proto") ?? "http";
  const demoClient = dashboardProjectedClients.find((row) => row.id === clientId) ?? null;
  const demoFallback = (boundary: string) => ({
    client: process.env.NODE_ENV === "production" ? null : demoClient,
    source: process.env.NODE_ENV === "production" ? "production-blocked" as const : "demo-fallback" as const,
    boundary: process.env.NODE_ENV === "production" ? `${boundary} Production demo client detail rows are disabled.` : boundary,
  });

  if (!host) {
    return demoFallback("Dashboard API loader could not resolve the request host.");
  }

  const response = await fetch(`${proto}://${host}/api/clients/${clientId}`, {
    cache: "no-store",
    headers: {
      ...(requestHeaders.get("x-tenant-id") ? { "x-tenant-id": requestHeaders.get("x-tenant-id") as string } : {}),
      ...(requestHeaders.get("x-dashboard-tenant-id") ? { "x-dashboard-tenant-id": requestHeaders.get("x-dashboard-tenant-id") as string } : {}),
      ...(requestHeaders.get("x-user-id") ? { "x-user-id": requestHeaders.get("x-user-id") as string } : {}),
      ...(requestHeaders.get("x-dashboard-user-id") ? { "x-dashboard-user-id": requestHeaders.get("x-dashboard-user-id") as string } : {}),
      ...(requestHeaders.get("x-user-role") ? { "x-user-role": requestHeaders.get("x-user-role") as string } : {}),
      ...(requestHeaders.get("x-dashboard-role") ? { "x-dashboard-role": requestHeaders.get("x-dashboard-role") as string } : {}),
    },
  }).catch(() => null);

  if (!response?.ok) {
    return demoFallback("Dashboard client detail API did not return a row.");
  }

  const payload = (await response.json().catch(() => null)) as { client?: ClientDetailRow; boundary?: string } | null;
  if (!payload?.client) {
    return demoFallback("Dashboard client detail API response was not row-shaped.");
  }

  return {
    client: payload.client,
    source: "dashboard-api",
    boundary: payload.boundary ?? `Dashboard client loaded through GET /api/clients/${clientId}.`,
  };
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { clientId } = await params;
  const { client, source, boundary } = await loadClientDetail(clientId);

  if (!client) {
    return (
      <main>
        <DashboardPageHeader
          eyebrow="Client detail"
          title="Client unavailable"
          description={boundary}
          actions={<a className="secondary-link" href="/clients">Back to clients</a>}
        />
      </main>
    );
  }

  const matchingBookings = client.relatedBookings?.map((booking) => ({ id: booking.id, style: booking.style, status: booking.status })) ?? dashboardProjectedBookingRows.filter((booking) => booking.clientName === client.preferredName);
  const matchingPayments = dashboardProjectedPayments.filter((payment) => matchingBookings.some((booking) => booking.id === payment.bookingId));

  return (
    <main>
      <DashboardPageHeader
        eyebrow="Client detail"
        title={client.preferredName}
        description={`Client timeline, booking history, risk flags, consent, and payment context load through the redacted tenant-scoped read API with sensitive-read access logging at GET /api/clients/${client.id}.`}
        actions={<a className="secondary-link" href="/clients">Back to clients</a>}
      />
      <div className="card compact-card">
        <p className="eyebrow">Client detail loader</p>
        <h2>{source === "dashboard-api" ? `GET /api/clients/${client.id}` : source === "production-blocked" ? "Production blocked" : "Demo fallback"}</h2>
        <p>{boundary}</p>
      </div>

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

      <ClientDetailActionPanel clientId={client.id} />
    </main>
  );
}
