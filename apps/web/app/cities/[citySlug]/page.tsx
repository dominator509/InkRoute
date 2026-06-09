import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { demoPortfolioItems, demoSeoCityPages, demoTravelStops, inkrouteDemoArtist, publicFaqs } from "@inkroute/config";
import { buildFaqSchema, buildPortfolioImageSchema, buildTravelEventSchema } from "@inkroute/seo";
import { CtaBand } from "../../../components/CtaBand";
import { JsonLdScript } from "../../../components/JsonLdScript";
import { PortfolioCard } from "../../../components/PortfolioCard";
import { TravelStopCard } from "../../../components/TravelStopCard";
import { formatCityDateRange } from "../../../lib/format";`r`nimport { canonicalUrlForPath } from "../../../lib/canonicalRuntime";

interface CityPageProps {
  params: Promise<{ citySlug: string }>;
}

export function generateStaticParams() {
  return demoSeoCityPages.map((page) => ({ citySlug: page.slug }));
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { citySlug } = await params;
  const page = demoSeoCityPages.find((cityPage) => cityPage.slug === citySlug);
  if (!page) {
    return { title: "City not found" };
  }

  return {
    title: page.title,
    description: page.metaDescription,
    alternates: { canonical: canonicalUrlForPath(page.canonicalPath) },
    openGraph: {
      title: page.title,
      description: page.metaDescription,
      type: "website",
    },
  };
}

export default async function CityLandingPage({ params }: CityPageProps) {
  const { citySlug } = await params;
  const page = demoSeoCityPages.find((cityPage) => cityPage.slug === citySlug);
  if (!page) notFound();

  const stop = demoTravelStops.find((travelStop) => travelStop.city === page.city && travelStop.region === page.region);
  const cityPortfolio = demoPortfolioItems.filter((item) => item.city === page.city || item.city === "Portland" || item.styles.some((style) => page.bestFor.join(" ").includes(style.replace("_", " "))));
  const schema = [
    ...(stop ? [buildTravelEventSchema(stop, inkrouteDemoArtist)] : []),
    ...cityPortfolio.slice(0, 3).map(buildPortfolioImageSchema),
    buildFaqSchema(publicFaqs.filter((faq) => faq.category === "travel" || faq.category === "booking")),
  ];

  return (
    <main>
      <JsonLdScript data={schema} />
      <section className="page-hero">
        <div className="container grid two align-center">
          <div>
            <p className="eyebrow">City landing page Â· {page.city}, {page.region}</p>
            <h1>{page.title}</h1>
            <p>{page.heroSummary}</p>
            <div className="hero-actions">
              <a className="button" href="/booking">Request {page.city}</a>
              <a className="button secondary" href="/travel">All travel dates</a>
            </div>
          </div>
          <aside className="panel-card large">
            <p className="eyebrow">Best fit</p>
            <h2>{page.bestFor.length} focus areas</h2>
            <ul className="plain-list">
              {page.bestFor.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </aside>
        </div>
      </section>
      {stop ? (
        <section className="section compact">
          <div className="container grid two align-start">
            <div className="section-intro">
              <p className="eyebrow">Travel window</p>
              <h2>{formatCityDateRange(stop.startsAt, stop.endsAt, stop.timezone)}</h2>
              <p>Booking status is currently <strong>{stop.bookingStatus}</strong>. The real app should source this from the tenant travel schedule API.</p>
            </div>
            <TravelStopCard stop={stop} />
          </div>
        </section>
      ) : null}
      <section className="section compact">
        <div className="container split-heading">
          <div className="section-intro">
            <p className="eyebrow">Relevant work</p>
            <h2>Portfolio examples for {page.city} clients.</h2>
          </div>
          <a className="text-link" href="/portfolio">Full portfolio</a>
        </div>
        <div className="container portfolio-grid dense">
          {cityPortfolio.slice(0, 4).map((item) => <PortfolioCard item={item} key={item.id} />)}
        </div>
      </section>
      <CtaBand title={`Request ${page.city} before the travel week fills.`} />
    </main>
  );
}

