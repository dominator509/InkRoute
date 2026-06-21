import type { Metadata } from "next";
import { bookingIntegrationBoundaries, demoTravelStops } from "@inkroute/config";

export const metadata: Metadata = {
  title: "Booking Confirmation Preview",
  description: "Static confirmation preview for an InkRoute booking request after validation and persistence.",
  robots: { index: false, follow: false },
};

export default function BookingConfirmationPreviewPage() {
  const nextCity = demoTravelStops.find((stop) => stop.bookingStatus === "open") ?? { city: "Seattle", region: "WA" };

  return (
    <main>
      <section className="page-hero centered">
        <div className="container narrow">
          <p className="eyebrow">Confirmation preview</p>
          <h1>Your request preview is ready for artist review.</h1>
          <p>This page is static. A production confirmation is generated only after a tenant-scoped booking request is validated, persisted or locally recorded, audited, and notification delivery is queued.</p>
        </div>
      </section>
      <section className="section compact">
        <div className="container confirmation-grid">
          <article className="panel-card confirmation-card">
            <p className="eyebrow">Request status</p>
            <h2>Submitted preview</h2>
            <p>Confirmed submissions surface a booking request identifier from the public booking API when persistence succeeds; local fallback and provider follow-up evidence remain runtime-gated.</p>
            <dl className="booking-summary-list">
              <div><dt>Example city</dt><dd>{nextCity.city}, {nextCity.region}</dd></div>
              <div><dt>Artist action</dt><dd>Review request → accept, decline, or ask for more info</dd></div>
              <div><dt>Deposit action</dt><dd>Policy engine and deposit-session boundaries are wired; live Stripe checkout remains credential-gated. <a className="text-link" href="/booking/deposit-preview">View deposit preview</a></dd></div>
              <div><dt>Calendar action</dt><dd>Provider calendar execution remains evidence-gated after appointment creation and conflict-policy checks pass.</dd></div>
            </dl>
          </article>
          <aside className="panel-card confirmation-card">
            <p className="eyebrow">Not live yet</p>
            <h2>Provider boundaries</h2>
            <div className="stack">
              {bookingIntegrationBoundaries.map((boundary) => (
                <div className="confirmation-boundary" key={boundary.label}>
                  <strong>{boundary.label}</strong>
                  <span>{boundary.status}</span>
                  <p>{boundary.detail}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
