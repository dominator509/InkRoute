import {
  bookingIntakePreview,
  demoPortfolioItems,
  demoTestimonials,
  demoTravelStops,
  inkrouteDemoArtist,
  publicFaqs,
} from "@inkroute/config";
import { Dialog, DialogPanel, DialogTitle, Field, FieldHint, FieldLabel, Input, NavBar, NavItem, Surface, Textarea } from "@inkroute/ui";
import {
  buildArtistPersonSchema,
  buildFaqSchema,
  buildPortfolioImageSchema,
  buildTravelEventSchema,
} from "@inkroute/seo";
import { CtaBand } from "../components/CtaBand";
import { JsonLdScript } from "../components/JsonLdScript";
import { PortfolioCard } from "../components/PortfolioCard";
import { SectionIntro } from "../components/SectionIntro";
import { TravelStopCard } from "../components/TravelStopCard";

const trustSignals = [
  { value: "3", label: "upcoming travel cities", detail: "Nomad Mode makes availability visible before the artist arrives." },
  { value: "82%", label: "demo readiness score", detail: "Future intake scoring flags missing placement, size, and budget details." },
  { value: "0", label: "live payments collected", detail: "Deposits stay disabled until Stripe provider proof is captured." },
];

const processSteps = [
  { title: "Find the right city", body: "Start with the travel schedule so the request is tied to a real guest spot or city waitlist." },
  { title: "Describe the tattoo clearly", body: "The intake asks for style, placement, size, budget, reference direction, and notes the artist can review quickly." },
  { title: "Artist reviews fit", body: "Future dashboard workflows will support accept, decline, needs-info, deposit request, and scheduling states." },
  { title: "Prepare and heal well", body: "Prep and aftercare automation are planned so clients receive clear instructions before and after the session." },
];

export default function HomePage() {
  const featuredPortfolio = demoPortfolioItems.filter((item) => item.isFeatured);
  const homepageSchema = [
    buildArtistPersonSchema(inkrouteDemoArtist),
    ...featuredPortfolio.map(buildPortfolioImageSchema),
    ...demoTravelStops.map((stop) => buildTravelEventSchema(stop, inkrouteDemoArtist)),
    buildFaqSchema(publicFaqs.slice(0, 4)),
  ];

  return (
    <main>
      <JsonLdScript data={homepageSchema} />

      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Nomadic tattoo booking · Phase 3 public site</p>
            <h1>Blackwork and ornamental tattooing, booked city by city.</h1>
            <p className="hero-lede">
              {inkrouteDemoArtist.displayName} is a demo nomadic artist profile built to show how InkRoute Suite turns portfolio trust, travel availability, and tattoo-specific intake into higher-quality booking requests.
            </p>
            <div className="hero-actions">
              <a className="button" href="/booking">Start a request</a>
              <a className="button secondary" href="/portfolio">Explore work</a>
            </div>
            <NavBar label="Public booking shortcuts" className="mt-5">
              <NavItem href="/portfolio" active>Portfolio</NavItem>
              <NavItem href="/travel">Travel</NavItem>
              <NavItem href="/faq">FAQ</NavItem>
            </NavBar>
            <dl className="hero-facts" aria-label="Artist highlights">
              <div><dt>Home base</dt><dd>{inkrouteDemoArtist.homeBaseCity}</dd></div>
              <div><dt>Specialties</dt><dd>Blackwork · Ornamental · Fine line</dd></div>
              <div><dt>Availability</dt><dd>Seattle and Oakland open</dd></div>
            </dl>
          </div>
          <div className="hero-visual" aria-label="Editorial tattoo portfolio preview">
            <div className="hero-visual-main">Portfolio proof</div>
            <div className="hero-visual-card floating one">Healed labels</div>
            <div className="hero-visual-card floating two">City availability</div>
          </div>
        </div>
      </section>

      <section className="section compact" aria-labelledby="trust-heading">
        <div className="container">
          <SectionIntro
            eyebrow="Why this converts"
            title="Built around the way tattoo clients actually decide."
            body="Clients need to trust the work, understand the travel schedule, and know what information to send before requesting a tattoo."
          />
          <div className="stat-grid">
            {trustSignals.map((signal) => (
              <Surface className="stat-card" key={signal.label}>
                <strong>{signal.value}</strong>
                <span>{signal.label}</span>
                <p>{signal.detail}</p>
              </Surface>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="portfolio-heading">
        <div className="container split-heading">
          <SectionIntro
            eyebrow="Featured portfolio"
            title="Proof before the pitch."
            body="Portfolio metadata is structured around style, placement, freshness, city, and future attribution tracking."
          />
          <a className="text-link" href="/portfolio">View full gallery</a>
        </div>
        <div className="container portfolio-grid">
          {featuredPortfolio.map((item, index) => (
            <PortfolioCard item={item} priority={index === 0} key={item.id} />
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="nomad-heading">
        <div className="container grid two align-start">
          <div className="sticky-copy">
            <p className="eyebrow">Nomad Mode</p>
            <h2 id="nomad-heading">Travel dates that feel current, specific, and bookable.</h2>
            <p>
              The public site now renders real static demo travel stops with city pages and booking CTAs. The real-time dashboard/mobile publishing path remains API/database-gated.
            </p>
            <a className="button secondary" href="/travel">See all travel dates</a>
          </div>
          <div className="stack">
            {demoTravelStops.map((stop) => (
              <TravelStopCard stop={stop} key={stop.id} />
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="intake-heading">
        <div className="container grid two align-center">
          <div className="panel-card large">
            <p className="eyebrow">Tattoo Readiness Score</p>
            <h2 id="intake-heading">Better intake means better consults.</h2>
            <p>
              The Phase 3 booking page is static, but the planned request lifecycle is already shaped around tattoo-specific information quality.
            </p>
            <div className="stack" aria-label="Shared UI form primitive adoption preview">
              <Field>
                <FieldLabel htmlFor="style-preview" required>Style direction</FieldLabel>
                <Input id="style-preview" name="style-preview" defaultValue="Blackwork floral sleeve" readOnly aria-describedby="style-preview-hint" />
                <FieldHint id="style-preview-hint">Shared Field/Input primitives keep labels and hints wired before the live form posts.</FieldHint>
              </Field>
              <Field>
                <FieldLabel htmlFor="notes-preview">Artist notes</FieldLabel>
                <Textarea id="notes-preview" defaultValue="Client wants healed-work examples and Seattle travel dates." aria-describedby="notes-preview-hint" />
                <FieldHint id="notes-preview-hint">Demo-safe copy only; no medical, payment, or private client data.</FieldHint>
              </Field>
            </div>
          </div>
          <ol className="check-list">
            {bookingIntakePreview.map((item) => <li key={item}>{item}</li>)}
          </ol>
        </div>
      </section>

      <Dialog aria-labelledby="booking-dialog-title">
        <DialogPanel>
          <DialogTitle id="booking-dialog-title">Booking dialog shell</DialogTitle>
          <p>Shared Dialog primitives are reserved for the live booking confirmation flow once mutations are enabled.</p>
        </DialogPanel>
      </Dialog>

      <section className="section" aria-labelledby="process-heading">
        <div className="container">
          <SectionIntro eyebrow="Client journey" title="A calmer path from inspiration to appointment." align="center" />
          <div className="grid four">
            {processSteps.map((step, index) => (
              <article className="process-card" key={step.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="reviews-heading">
        <div className="container split-heading">
          <SectionIntro eyebrow="Trust signals" title="Testimonials with context, not generic praise." />
          <a className="text-link" href="/faq">Read client FAQ</a>
        </div>
        <div className="container grid three">
          {demoTestimonials.map((review) => (
            <article className="review-card" key={review.id}>
              <p className="stars" aria-label={`${review.rating} out of 5 stars`}>★★★★★</p>
              <blockquote>“{review.quote}”</blockquote>
              <p className="muted">{review.displayName} · {review.city}</p>
              <p className="eyebrow">{review.context}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="faq-heading">
        <div className="container grid two align-start">
          <SectionIntro
            eyebrow="Client clarity"
            title="Answer the questions that usually become DMs."
            body="FAQ schema is rendered from shared demo data. Final policy language still requires legal and artist review."
          />
          <div className="accordion-list">
            {publicFaqs.slice(0, 4).map((faq) => (
              <details className="faq-item" key={faq.question}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </main>
  );
}
