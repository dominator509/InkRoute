import type { Metadata } from "next";
import { inkrouteDemoArtist } from "@inkroute/config";
import { CtaBand } from "../../components/CtaBand";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact page demo for a nomadic tattoo artist booking website, with live form submission and rate limiting still planned.",
};

export default function ContactPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container grid two align-center">
          <div>
            <p className="eyebrow">Contact boundary</p>
            <h1>Keep general questions separate from serious booking requests.</h1>
            <p>The public contact page is static in Phase 3. Live submission, rate limiting, spam protection, and notification delivery are still gap-tracked.</p>
          </div>
          <aside className="panel-card large">
            <p className="eyebrow">Artist</p>
            <h2>{inkrouteDemoArtist.displayName}</h2>
            <p>{inkrouteDemoArtist.shortBio}</p>
            <a className="text-link" href={inkrouteDemoArtist.instagramUrl}>Instagram placeholder</a>
          </aside>
        </div>
      </section>
      <section className="section compact">
        <div className="container contact-grid">
          <form className="demo-form" aria-label="Static contact form preview">
            <label>
              Name
              <input name="name" placeholder="Your name" disabled />
            </label>
            <label>
              Email
              <input name="email" placeholder="you@example.com" disabled />
            </label>
            <label>
              Message
              <textarea name="message" placeholder="Static preview only" disabled />
            </label>
            <p className="muted">Disabled intentionally: contact API, validation, rate limiting, and email delivery are not wired.</p>
          </form>
          <div className="stack">
            <div className="mini-row">Booking requests should use the guided request page.</div>
            <div className="mini-row">Sensitive details should not be sent through a generic contact form.</div>
            <div className="mini-row">Future notifications should create delivery logs and redact private content.</div>
          </div>
        </div>
      </section>
      <CtaBand title="Ready to request a tattoo? Use the guided flow instead of the contact form." />
    </main>
  );
}
