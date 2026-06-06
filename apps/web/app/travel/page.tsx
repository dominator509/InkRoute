import type { Metadata } from "next";
import { buildSignedIcsFeedDraft } from "@inkroute/calendar";
import { demoSeoCityPages, demoTravelStops, inkrouteDemoArtist, inkrouteDemoTenant } from "@inkroute/config";
import { buildTravelEventSchema } from "@inkroute/seo";
import { CtaBand } from "../../components/CtaBand";
import { JsonLdScript } from "../../components/JsonLdScript";
import { SectionIntro } from "../../components/SectionIntro";
import { TravelStopCard } from "../../components/TravelStopCard";

export const metadata: Metadata = {
  title: "Travel Schedule",
  description: "View upcoming demo tattoo guest spots, city availability, waitlists, and Nomad Mode booking status for Mara Vale.",
};

export default function TravelSchedulePage() {
  const signedFeedDraft = buildSignedIcsFeedDraft({ tenantSlug: inkrouteDemoTenant.slug, artistSlug: inkrouteDemoArtist.slug });
  const demoIcsPath = `/api/public/${inkrouteDemoTenant.slug}/calendar/${inkrouteDemoArtist.slug}/travel.ics`;
  return (
    <main>
      <JsonLdScript data={demoTravelStops.map((stop) => buildTravelEventSchema(stop, inkrouteDemoArtist))} />
      <section className="page-hero">
        <div className="container grid two align-center">
          <div>
            <p className="eyebrow">Nomad Mode schedule</p>
            <h1>Upcoming cities with clear booking status.</h1>
            <p>Travel pages should reduce back-and-forth by showing city, date range, guest spot context, and whether requests are open, waitlist-only, or closed.</p>
          </div>
          <div className="panel-card large">
            <p className="eyebrow">Current demo cities</p>
            <h2>{demoTravelStops.length} stops published</h2>
            <p>Future dashboard and mobile updates will publish these records from the database in real time. Phase 8 also exposes a static demo ICS feed.</p>
            <div className="button-row">
              <a className="secondary-button" href={demoIcsPath}>Preview ICS feed</a>
            </div>
            <p className="fine-print">Signed feed draft: {signedFeedDraft.path}</p>
          </div>
        </div>
      </section>
      <section className="section compact">
        <div className="container grid two align-start">
          <SectionIntro eyebrow="Guest spots" title="Request by city before the artist arrives." />
          <div className="stack">
            {demoTravelStops.map((stop) => <TravelStopCard stop={stop} key={stop.id} />)}
          </div>
        </div>
      </section>
      <section className="section compact">
        <div className="container">
          <SectionIntro eyebrow="Local SEO structure" title="City pages are now statically generated from demo content." />
          <div className="grid three">
            {demoSeoCityPages.map((city) => (
              <a className="city-link-card" href={city.canonicalPath} key={city.slug}>
                <span className="eyebrow">{city.region}</span>
                <strong>{city.city}</strong>
                <p>{city.heroSummary}</p>
              </a>
            ))}
          </div>
        </div>
      </section>
      <CtaBand eyebrow="City waitlists" title="Travel demand should be captured before dates are announced." />
    </main>
  );
}
