import type { Metadata } from "next";
import { inkrouteDemoArtist } from "@inkroute/config";
import { buildArtistPersonSchema } from "@inkroute/seo";
import { CtaBand } from "../../components/CtaBand";
import { JsonLdScript } from "../../components/JsonLdScript";

export const metadata: Metadata = {
  title: "About Mara Vale",
  description: "Learn about Mara Vale, a demo nomadic tattoo artist profile for blackwork, ornamental, and fine-line booking workflows.",
};

export default function AboutPage() {
  return (
    <main>
      <JsonLdScript data={buildArtistPersonSchema(inkrouteDemoArtist)} />
      <section className="page-hero">
        <div className="container grid two align-center">
          <div>
            <p className="eyebrow">Artist story</p>
            <h1>Quiet precision for clients who want the idea handled carefully.</h1>
            <p>
              {inkrouteDemoArtist.bio} This public profile is demo content, but the structure reflects how a working artist can present trust, style fit, city availability, and safety boundaries without sending clients into a generic booking tool.
            </p>
          </div>
          <div className="editorial-panel" aria-label="Artist studio mood board">
            <span>Blackwork studies, healed-line references, travel notes, and private studio cues.</span>
          </div>
        </div>
      </section>

      <section className="section compact">
        <div className="container grid three">
          <article className="panel-card">
            <p className="eyebrow">Style</p>
            <h2>Blackwork, ornamental, fine line.</h2>
            <p>Designed with strong placement notes, realistic scale, and healed readability in mind.</p>
          </article>
          <article className="panel-card">
            <p className="eyebrow">Workflow</p>
            <h2>Appointment-first, not walk-in first.</h2>
            <p>Clients submit context before the artist reviews fit, schedule, deposit needs, and next steps.</p>
          </article>
          <article className="panel-card">
            <p className="eyebrow">Travel</p>
            <h2>City-by-city clarity.</h2>
            <p>Nomad Mode is built for guest spots, waitlists, flash windows, and private studio instructions.</p>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="container grid two align-start">
          <div className="section-intro">
            <p className="eyebrow">Client promise</p>
            <h2>Premium does not mean mysterious.</h2>
            <p>The client should understand what kind of work is a fit, what information matters, and how the artist will communicate before money changes hands.</p>
          </div>
          <div className="stack">
            {["Clear booking expectations", "Style-specific portfolio proof", "Private handling for sensitive intake", "Aftercare and healed-photo follow-up planned"].map((item) => (
              <div className="mini-row" key={item}>{item}</div>
            ))}
          </div>
        </div>
      </section>
      <CtaBand title="Tell the artist what you want before the city fills." />
    </main>
  );
}
