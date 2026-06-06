import { getAvailableBookingActions } from "@inkroute/booking";
import { DashboardPageHeader } from "../../components/DashboardPageHeader";
import { StatusPill } from "../../components/StatusPill";
import { dashboardBookingRows } from "../../lib/demo";

function statusTone(status: string) {
  if (status === "accepted" || status === "deposit_paid" || status === "scheduled") return "success" as const;
  if (status === "needs_info" || status === "deposit_pending") return "warning" as const;
  if (status === "declined" || status === "cancelled" || status === "no_show") return "danger" as const;
  return "info" as const;
}

export default function BookingInboxPage() {
  return (
    <main>
      <DashboardPageHeader
        eyebrow="Booking operations"
        title="Booking inbox"
        description="Review tattoo requests by readiness, travel city, status, portfolio attribution, and next lifecycle actions. Rows are static demo data until dashboard APIs are wired."
      />

      <section className="card table-card" aria-label="Booking requests">
        <div className="table-header six">
          <span>Client</span>
          <span>City</span>
          <span>Request</span>
          <span>Readiness</span>
          <span>Status</span>
          <span>Next actions</span>
        </div>
        {dashboardBookingRows.map((booking) => {
          const actions = getAvailableBookingActions(booking.status).slice(0, 3);
          return (
            <a className="table-row six" href={`/bookings/${booking.id}`} key={booking.id}>
              <span><strong>{booking.clientName}</strong><small>{booking.clientEmail}</small></span>
              <span>{booking.city}<small>{booking.preferredWindow}</small></span>
              <span>{booking.style.replace(/_/g, " ")} · {booking.placement.replace(/_/g, " ")}<small>{booking.sizeEstimate}</small></span>
              <span><strong>{booking.readinessScore}%</strong><small>{booking.portfolioAttribution}</small></span>
              <span><StatusPill label={booking.status} tone={statusTone(booking.status)} /></span>
              <span>{actions.length > 0 ? actions.map((action) => action.action.replace(/_/g, " ")).join(", ") : "No next action"}<small>Disabled in scaffold</small></span>
            </a>
          );
        })}
      </section>

      <section className="card spacious">
        <h2>Production action boundary</h2>
        <p>Accept, decline, request more info, schedule, no-show, and archive actions must call tenant-scoped API routes, create `BookingStateEvent` rows, enforce RBAC, redact sensitive notes from logs, and write audit entries before this can be used with real clients.</p>
      </section>
    </main>
  );
}
