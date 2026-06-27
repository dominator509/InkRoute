import type { Metadata } from "next";
import { inkrouteDemoArtist, inkrouteDemoTenant } from "@inkroute/config";
import { CtaBand } from "../../components/CtaBand";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact page for a nomadic tattoo artist booking website, with tenant-scoped local persistence and provider-gated notification delivery.",
};

export default function ContactPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container grid two align-center">
          <div>
            <p className="eyebrow">Contact boundary</p>
            <h1>Keep general questions separate from serious booking requests.</h1>
            <p>General contact now posts to a tenant-scoped local persistence API with redacted audit metadata. Booking requests still belong in the guided flow, and notification delivery remains provider-gated.</p>
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
          <form className="demo-form" method="post" action={`/api/public/${inkrouteDemoTenant.slug}/contact`} aria-label="Tenant-scoped contact form">
            <label>
              Name
              <input name="name" placeholder="Your name" required minLength={2} />
            </label>
            <label>
              Email
              <input name="email" placeholder="you@example.com" required inputMode="email" />
            </label>
            <label>
              Subject
              <input name="subject" placeholder="General question, travel week, press, or collaboration" />
            </label>
            <label>
              Message
              <textarea name="message" placeholder="Keep sensitive medical, payment, or private reference details in the guided booking flow." required minLength={10} />
            </label>
            <button className="button" type="submit">Send contact request</button>
            <p className="muted">Submissions persist in local tenant runtime with redacted audit metadata. Email/SMS delivery remains provider-gated until sandbox evidence exists.</p>
          </form>
          <div className="stack">
            <div className="mini-row">Booking requests should use the guided request page.</div>
            <div className="mini-row">Sensitive details should not be sent through a generic contact form.</div>
            <div className="mini-row">Future notifications must create delivery logs and redact private content.</div>
          </div>
        </div>
      </section>
      <CtaBand title="Ready to request a tattoo? Use the guided flow instead of the contact form." />
    </main>
  );
}
