import type { Metadata } from "next";
import { bookingFlowSteps } from "@inkroute/booking";
import { bookingIntakePreview } from "@inkroute/config";
import { BookingFlowClient } from "./BookingFlowClient";

export const metadata: Metadata = {
  title: "Tattoo Booking Request",
  description: "Guided multi-step tattoo booking request preview with city selection, tattoo intake, reference image metadata, readiness scoring, policy acknowledgements, and deposit boundaries.",
};

export default function BookingRequestPage() {
  return (
    <main>
      <section className="page-hero centered">
        <div className="container narrow">
          <p className="eyebrow">Phase 4 booking flow</p>
          <h1>Give the artist a complete request before inbox review.</h1>
          <p>This client-side booking flow is implemented as a non-persistent preview. It captures tattoo-specific intake, calculates a local readiness score, and clearly marks upload, payment, notification, and calendar boundaries.</p>
        </div>
      </section>

      <section className="section compact">
        <div className="container booking-shell phase-four-shell">
          <aside className="booking-sidebar">
            <p className="eyebrow">Built for tattoo intake</p>
            <h2>What this flow qualifies</h2>
            <ol className="check-list numbered">
              {bookingIntakePreview.map((item) => <li key={item}>{item}</li>)}
            </ol>
            <div className="form-boundary-note">
              <strong>Still scaffolded:</strong> no booking request is saved, no deposit is collected, no file is uploaded, and no notification is sent from this preview.
            </div>
          </aside>
          <div className="booking-lifecycle-card">
            <p className="eyebrow">Client path</p>
            <h2>{bookingFlowSteps.length} guided steps</h2>
            <div className="mini-step-grid">
              {bookingFlowSteps.map((step) => (
                <article key={step.id}>
                  <span>{step.eyebrow}</span>
                  <strong>{step.title}</strong>
                  <p>{step.summary}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section compact booking-flow-section">
        <div className="container">
          <BookingFlowClient />
        </div>
      </section>
    </main>
  );
}
