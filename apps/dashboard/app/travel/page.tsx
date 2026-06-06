import { demoTravelStops } from "@inkroute/config";
import { DashboardPageHeader } from "../../components/DashboardPageHeader";
import { DisabledActionPanel } from "../../components/DisabledActionPanel";
import { StatusPill } from "../../components/StatusPill";
import { dashboardBookingRows, dashboardTravelPublishPlans } from "../../lib/demo";

export default function TravelScheduleManagerPage() {
  return (
    <main>
      <DashboardPageHeader
        eyebrow="Nomad Mode"
        title="Travel schedule manager"
        description="Manage city stops, guest spots, waitlists, flash availability, calendar blocks, and public schedule revalidation. This Phase 8 surface remains static and non-mutating."
      />

      <section className="grid three">
        {demoTravelStops.map((stop) => {
          const matchingRequests = dashboardBookingRows.filter((booking) => booking.city.startsWith(stop.city));
          const publishPlan = dashboardTravelPublishPlans.find((plan) => plan.travelStopId === stop.id);
          return (
            <article className="card travel-admin-card" key={stop.id}>
              <div className="section-heading-row">
                <h2>{stop.city}, {stop.region}</h2>
                <StatusPill label={stop.bookingStatus} tone={stop.bookingStatus === "open" ? "success" : "warning"} />
              </div>
              <p>{stop.publicNotes}</p>
              <dl className="detail-list single">
                <div><dt>Dates</dt><dd>{new Date(stop.startsAt).toLocaleDateString()} → {new Date(stop.endsAt).toLocaleDateString()}</dd></div>
                <div><dt>Studio</dt><dd>{stop.studioName ?? "Not listed"}</dd></div>
                <div><dt>Requests</dt><dd>{matchingRequests.length}</dd></div>
                <div><dt>Timezone</dt><dd>{stop.timezone}</dd></div>
              </dl>
              {publishPlan ? (
                <div className="boundary-note">
                  <strong>Publish path: {publishPlan.publicPath}</strong>
                  <span>Tags: {publishPlan.revalidationTags.join(", ")}</span>
                  <span>Waitlist notification candidate: {publishPlan.waitlistNotificationCandidate ? "yes" : "no"}</span>
                </div>
              ) : null}
            </article>
          );
        })}
      </section>

      <section className="grid two spacious">
        <article className="card">
          <h2>Real-time public update architecture</h2>
          <p>Dashboard and mobile travel edits should eventually publish through one audited mutation path.</p>
          <ol className="compact-list">
            <li>Validate city, timezone, dates, booking status, studio label, and public notes.</li>
            <li>Persist travel schedule, availability windows, and audit log rows in one transaction.</li>
            <li>Recompute city waitlist eligibility and consent-filtered notification candidates.</li>
            <li>Revalidate public travel, city SEO, sitemap, and structured-data cache tags.</li>
            <li>Write calendar block snapshots and queue provider sync when credentials exist.</li>
          </ol>
        </article>
        <article className="card">
          <h2>Publish actions by stop</h2>
          <div className="stack">
            {dashboardTravelPublishPlans.map((plan) => (
              <div className="boundary-note" key={plan.travelStopId}>
                <strong>{plan.cityLabel}</strong>
                <span>{plan.publishActions.join(" → ")}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <DisabledActionPanel
        title="Travel publishing actions"
        description="City updates should persist to Postgres, update waitlists, create audit logs, create or update calendar blocks, and trigger public site cache revalidation before production."
        actions={["Add city", "Publish guest spot", "Open waitlist", "Generate availability", "Trigger public revalidation", "Queue calendar sync"]}
      />
    </main>
  );
}
