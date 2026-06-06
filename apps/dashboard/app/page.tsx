import { dashboardMetrics, demoTravelStops } from "@inkroute/config";
import { MetricCard } from "../components/MetricCard";
import { DashboardPageHeader } from "../components/DashboardPageHeader";
import { IntegrationBoundaryCard } from "../components/IntegrationBoundaryCard";
import { StatusPill } from "../components/StatusPill";
import { dashboardBookingRows, dashboardPayments, dashboardPortfolio, dashboardReviewQueue } from "../lib/demo";

function centsToUsd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

export default function DashboardHomePage() {
  const pendingDeposits = dashboardPayments.reduce((sum, payment) => payment.status === "pending" ? sum + payment.amountCents : sum, 0);
  const openRequests = dashboardBookingRows.filter((booking) => ["submitted", "needs_info", "accepted", "deposit_pending"].includes(booking.status)).length;
  const portfolioAttributionCount = dashboardPortfolio.reduce((sum, item) => sum + item.attributionCount, 0);

  return (
    <main>
      <DashboardPageHeader
        eyebrow="Phase 5 scaffolded dashboard"
        title="Artist command center"
        description="Static tenant dashboard surfaces for bookings, travel, clients, payments, content, SEO, errors, and release control. No live auth, Prisma, Stripe, storage, or notification provider is wired yet."
        actions={<a className="primary-link" href="/bookings">Review booking inbox</a>}
      />

      <section className="grid four" aria-label="Dashboard metrics">
        {dashboardMetrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
        <MetricCard label="Open review queue" value={String(openRequests)} detail="Static booking rows" />
        <MetricCard label="Pending deposits" value={centsToUsd(pendingDeposits)} detail="Stripe boundary only" />
        <MetricCard label="Portfolio attribution" value={String(portfolioAttributionCount)} detail="Demo image-to-request signals" />
        <MetricCard label="Approved reviews" value={String(dashboardReviewQueue.length)} detail="CMS moderation scaffold" />
      </section>

      <section className="grid two spacious">
        <article className="card">
          <div className="section-heading-row">
            <h2>Booking review queue</h2>
            <a href="/bookings">Open inbox</a>
          </div>
          <div className="stack">
            {dashboardBookingRows.slice(0, 3).map((booking) => (
              <a className="list-row" href={`/bookings/${booking.id}`} key={booking.id}>
                <div>
                  <strong>{booking.clientName}</strong>
                  <span>{booking.city} · {booking.style.replace(/_/g, " ")} · {booking.readinessScore}% ready</span>
                </div>
                <StatusPill label={booking.status} tone={booking.status === "needs_info" ? "warning" : "info"} />
              </a>
            ))}
          </div>
        </article>

        <article className="card">
          <div className="section-heading-row">
            <h2>Nomad Mode schedule</h2>
            <a href="/travel">Manage travel</a>
          </div>
          <div className="stack">
            {demoTravelStops.map((stop) => (
              <div className="list-row" key={stop.id}>
                <div>
                  <strong>{stop.city}, {stop.region}</strong>
                  <span>{new Date(stop.startsAt).toLocaleDateString()} → {new Date(stop.endsAt).toLocaleDateString()}</span>
                </div>
                <StatusPill label={stop.bookingStatus} tone={stop.bookingStatus === "open" ? "success" : "warning"} />
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid three spacious">
        <IntegrationBoundaryCard title="Auth and tenant session" status="Placeholder" description="Dashboard routes are public scaffold pages in this artifact. Auth.js/Supabase session enforcement and tenant membership checks are not implemented." gapIds={["GAP-003", "GAP-036"]} />
        <IntegrationBoundaryCard title="Database-backed actions" status="Externally dependent" description="All dashboard tables are static demo arrays. Prisma repositories, mutations, audit logs, and tenant isolation tests remain pending." gapIds={["GAP-002", "GAP-022", "GAP-037"]} />
        <IntegrationBoundaryCard title="Provider integrations" status="Credential-gated" description="Stripe, storage, notifications, calendar sync, Sentry, and release automation are represented as boundaries only." gapIds={["GAP-004", "GAP-005", "GAP-038"]} />
      </section>
    </main>
  );
}
