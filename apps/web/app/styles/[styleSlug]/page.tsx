import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { demoPortfolioItems, demoSeoStylePages, publicFaqs } from "@inkroute/config";
import { buildFaqSchema, buildPortfolioImageSchema } from "@inkroute/seo";
import { CtaBand } from "../../../components/CtaBand";
import { JsonLdScript } from "../../../components/JsonLdScript";
import { PortfolioCard } from "../../../components/PortfolioCard";
import { canonicalUrlForPath } from "../../../lib/canonicalRuntime";

interface StylePageProps {
  params: Promise<{ styleSlug: string }>;
}

export function generateStaticParams() {
  return demoSeoStylePages.map((page) => ({ styleSlug: page.slug }));
}

export async function generateMetadata({ params }: StylePageProps): Promise<Metadata> {
  const { styleSlug } = await params;
  const page = demoSeoStylePages.find((stylePage) => stylePage.slug === styleSlug);
  if (!page) {
    return { title: "Style not found" };
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

export default async function StyleLandingPage({ params }: StylePageProps) {
  const { styleSlug } = await params;
  const page = demoSeoStylePages.find((stylePage) => stylePage.slug === styleSlug);
  if (!page) notFound();

  const stylePortfolio = demoPortfolioItems.filter((item) => item.styles.includes(page.style));
  const schema = [
    ...stylePortfolio.map(buildPortfolioImageSchema),
    buildFaqSchema(publicFaqs.filter((faq) => faq.category === "booking" || faq.category === "prep")),
  ];

  return (
    <main>
      <JsonLdScript data={schema} />
      <section className="page-hero centered">
        <div className="container narrow">
          <p className="eyebrow">Style landing page</p>
          <h1>{page.title}</h1>
          <p>{page.heroSummary}</p>
          <div className="filter-row" aria-label="Session fit tags">
            {page.sessionFit.map((fit) => <span className="tag" key={fit}>{fit}</span>)}
          </div>
        </div>
      </section>
      <section className="section compact">
        <div className="container grid two align-start">
          <div className="section-intro">
            <p className="eyebrow">Booking guidance</p>
            <h2>What to include in a {page.label.toLowerCase()} request.</h2>
            <p>Tell the artist about placement, approximate size, reference direction, whether you want custom or flash, and your preferred travel city.</p>
          </div>
          <div className="panel-card">
            <p className="eyebrow">Best session fit</p>
            <ul className="plain-list">
              {page.sessionFit.map((fit) => <li key={fit}>{fit}</li>)}
            </ul>
          </div>
        </div>
      </section>
      <section className="section compact">
        <div className="container portfolio-grid dense">
          {stylePortfolio.map((item) => <PortfolioCard item={item} key={item.id} />)}
        </div>
      </section>
      <CtaBand title={`Send a ${page.label.toLowerCase()} request with enough context to review.`} />
    </main>
  );
}


