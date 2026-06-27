import { headers } from "next/headers";
import { DashboardPageHeader } from "../../components/DashboardPageHeader";
import { StatusPill } from "../../components/StatusPill";
import { dashboardProjectedClients } from "../../lib/demo";

type ClientRow = (typeof dashboardProjectedClients)[number];

function centsToUsd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

async function loadClientRows(): Promise<{ clients: ClientRow[]; source: "dashboard-api" | "demo-fallback" | "production-blocked"; boundary: string }> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const proto = requestHeaders.get("x-forwarded-proto") ?? "http";
  const demoFallback = (boundary: string) => ({
    clients: process.env.NODE_ENV === "production" ? [] : dashboardProjectedClients,
    source: process.env.NODE_ENV === "production" ? "production-blocked" as const : "demo-fallback" as const,
    boundary: process.env.NODE_ENV === "production" ? `${boundary} Production demo client rows are disabled.` : boundary,
  });

  if (!host) {
    return demoFallback("Dashboard API loader could not resolve the request host.");
  }

  const response = await fetch(`${proto}://${host}/api/clients`, {
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
    return demoFallback("Dashboard client API did not return rows.");
  }

  const payload = (await response.json().catch(() => null)) as { clients?: ClientRow[]; boundary?: string } | null;
  if (!Array.isArray(payload?.clients)) {
    return demoFallback("Dashboard client API response was not row-shaped.");
  }

  return {
    clients: payload.clients,
    source: "dashboard-api",
    boundary: payload.boundary ?? "Dashboard clients loaded through GET /api/clients.",
  };
}

export default async function ClientsPage() {
  const { clients, source, boundary } = await loadClientRows();

  return (
    <main>
      <DashboardPageHeader
        eyebrow="Client CRM"
        title="Client profiles"
        description="A tattoo-specific CRM surface for request history, consent, payments, notes, healed-photo follow-ups, and no-show risk. This page now loads through the tenant-scoped redacted client read API with an explicit demo fallback boundary."
      />
      <div className="card compact-card">
        <p className="eyebrow">Client loader</p>
        <h2>{source === "dashboard-api" ? "GET /api/clients" : source === "production-blocked" ? "Production blocked" : "Demo fallback"}</h2>
        <p>{boundary}</p>
      </div>

      <section className="card table-card">
        <div className="table-header five">
          <span>Client</span><span>Location</span><span>Tags</span><span>Value</span><span>Risk</span>
        </div>
        {clients.map((client) => (
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
