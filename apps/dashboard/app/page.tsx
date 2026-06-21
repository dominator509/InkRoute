import { dashboardMetrics, demoTravelStops } from "@inkroute/config";
import { Dialog, DialogPanel, DialogTitle, Field, FieldHint, FieldLabel, Input, NavBar, NavItem, Surface } from "@inkroute/ui";
import { MetricCard } from "../components/MetricCard";
import { DashboardPageHeader } from "../components/DashboardPageHeader";
import { IntegrationBoundaryCard } from "../components/IntegrationBoundaryCard";
import { StatusPill } from "../components/StatusPill";
import { dashboardProjectedBookingRows, dashboardProjectedPayments, dashboardProjectedPortfolio, dashboardReviewQueue } from "../lib/demo";

function centsToUsd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

export default function DashboardHomePage() {
  const pendingDeposits = dashboardProjectedPayments.reduce((sum, payment) => payment.status === "pending" ? sum + payment.amountCents : sum, 0);
  const openRequests = dashboardProjectedBookingRows.filter((booking) => ["submitted", "needs_info", "accepted", "deposit_pending"].includes(booking.status)).length;
  const portfolioAttributionCount = dashboardProjectedPortfolio.reduce((sum, item) => sum + item.attributionCount, 0);

  return (
    <main>
      <DashboardPageHeader
        eyebrow="Phase 5 dashboard contract"
        title="Artist command center"
        description="Tenant dashboard surfaces for bookings, travel, clients, payments, content, reviews, SEO, errors, and release control. Reviews now have a redacted tenant-scoped read API; provider-backed runtime actions remain gated."
        actions={<a className="primary-link" href="/bookings">Review booking inbox</a>}
      />
      <NavBar label="Dashboard shared UI navigation" className="spacious">
        <NavItem href="/bookings" active>Bookings</NavItem>
        <NavItem href="/travel">Travel</NavItem>
        <NavItem href="/releases">Releases</NavItem>
        <NavItem href="/errors">Errors</NavItem>
      </NavBar>

      <section className="grid four" aria-label="Dashboard metrics">
        {dashboardMetrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
        <MetricCard label="Open review queue" value={String(openRequests)} detail="Static booking rows" />
        <MetricCard label="Pending deposits" value={centsToUsd(pendingDeposits)} detail="Stripe contract wired; sandbox proof gated" />
        <MetricCard label="Portfolio attribution" value={String(portfolioAttributionCount)} detail="Demo image-to-request signals" />
        <MetricCard label="Approved reviews" value={String(dashboardReviewQueue.length)} detail="GET /api/reviews redacted read seam" />
      </section>

      <section className="grid two spacious">
        <Surface className="card">
          <div className="section-heading-row">
            <h2>Booking review queue</h2>
            <a href="/bookings">Open inbox</a>
          </div>
          <div className="stack">
            {dashboardProjectedBookingRows.slice(0, 3).map((booking) => (
              <a className="list-row" href={`/bookings/${booking.id}`} key={booking.id}>
                <div>
                  <strong>{booking.clientName}</strong>
                  <span>{booking.city} · {booking.style.replace(/_/g, " ")} · {booking.readinessScore}% ready</span>
                </div>
                <StatusPill label={booking.status} tone={booking.status === "needs_info" ? "warning" : "info"} />
              </a>
            ))}
          </div>
        </Surface>

        <Surface className="card">
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
        </Surface>
      </section>

      <Surface className="card spacious" aria-labelledby="shared-ui-form-heading">
        <div className="section-heading-row">
          <h2 id="shared-ui-form-heading">Shared UI adoption controls</h2>
          <StatusPill label="source-wired" tone="info" />
        </div>
        <div className="grid two">
          <Field>
            <FieldLabel htmlFor="release-filter-preview">Release filter</FieldLabel>
            <Input id="release-filter-preview" name="release-filter-preview" defaultValue="0.11.0-phase12" readOnly aria-describedby="release-filter-preview-hint" />
            <FieldHint id="release-filter-preview-hint">Shared Field/Input primitives are wired before provider-backed filtering is enabled.</FieldHint>
          </Field>
          <Field>
            <FieldLabel htmlFor="tenant-filter-preview">Tenant scope</FieldLabel>
            <Input id="tenant-filter-preview" name="tenant-filter-preview" defaultValue="demo-tenant" readOnly aria-describedby="tenant-filter-preview-hint" />
            <FieldHint id="tenant-filter-preview-hint">Demo-safe values only; no secrets or private customer data.</FieldHint>
          </Field>
        </div>
      </Surface>

      <Dialog aria-labelledby="provider-dialog-title">
        <DialogPanel>
          <DialogTitle id="provider-dialog-title">Provider action dialog shell</DialogTitle>
          <p>Shared Dialog primitives are reserved for release, payment, and observability provider confirmations.</p>
        </DialogPanel>
      </Dialog>

      <section className="grid three spacious">
        <IntegrationBoundaryCard title="Auth and tenant session" status="Guard contract wired" description="Dashboard middleware, protected layout, and API guard seams are wired with no-store boundaries. Provider-backed sessions plus persisted TenantMember and CustomRole lookups remain evidence-gated." gapIds={["GAP-003", "GAP-036"]} />
        <IntegrationBoundaryCard title="Database-backed actions" status="Route contracts wired" description="Dashboard read/write API seams now require a database connection and no-store tenant boundaries. Visible dashboard tables still use demo projections until seeded repository smoke, RBAC/redaction, AuditLog, and tenant-isolation evidence land." gapIds={["GAP-002", "GAP-022", "GAP-037"]} />
        <IntegrationBoundaryCard title="Provider integrations" status="Credential-gated" description="Stripe, storage, notifications, calendar sync, Sentry, and release automation have local contracts wired; provider execution proof remains credential-gated." gapIds={["GAP-004", "GAP-005", "GAP-038"]} />
      </section>
    </main>
  );
}
