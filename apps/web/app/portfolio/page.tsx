import type { Metadata } from "next";
import { demoPortfolioItems } from "@inkroute/config";
import { buildPortfolioImageSchema } from "@inkroute/seo";
import { CtaBand } from "../../components/CtaBand";
import { JsonLdScript } from "../../components/JsonLdScript";
import { PortfolioCard } from "../../components/PortfolioCard";
import { SectionIntro } from "../../components/SectionIntro";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Explore demo blackwork, ornamental, fine-line, custom, and flash tattoo portfolio pieces with style, placement, freshness, and city metadata.",
};

const filters = ["All", "Blackwork", "Ornamental", "Fine line", "Flash", "Healed", "Fresh"];

export default function PortfolioPage() {
  return (
    <main>
      <JsonLdScript data={demoPortfolioItems.map(buildPortfolioImageSchema)} />
      <section className="page-hero centered">
        <div className="container narrow">
          <p className="eyebrow">Portfolio CMS preview</p>
          <h1>Work organized by style, placement, freshness, and city.</h1>
          <p>The Phase 3 gallery uses demo metadata and CSS image placeholders. Real upload/storage, image optimization, and CMS publishing remain gap-tracked.</p>
          <div className="filter-row" aria-label="Demo portfolio filters">
            {filters.map((filter) => <span className="tag" key={filter}>{filter}</span>)}
          </div>
        </div>
      </section>
      <section className="section compact">
        <div className="container">
          <SectionIntro eyebrow="Gallery" title="A portfolio that teaches clients what to request." />
        </div>
        <div className="container portfolio-grid dense">
          {demoPortfolioItems.map((item, index) => <PortfolioCard item={item} priority={index % 5 === 0} key={item.id} />)}
        </div>
      </section>
      <CtaBand title="Found a direction that fits? Send a request with the portfolio piece that inspired it." />
    </main>
  );
}
