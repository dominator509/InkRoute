import type { Metadata } from "next";
import { publicFaqs } from "@inkroute/config";
import { buildFaqSchema } from "@inkroute/seo";
import { CtaBand } from "../../components/CtaBand";
import { JsonLdScript } from "../../components/JsonLdScript";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Tattoo booking FAQ demo covering requests, travel, prep, sensitive notes, deposits, and aftercare automation boundaries.",
};

export default function FAQPage() {
  return (
    <main>
      <JsonLdScript data={buildFaqSchema(publicFaqs)} />
      <section className="page-hero centered">
        <div className="container narrow">
          <p className="eyebrow">Client FAQ</p>
          <h1>Less uncertainty before the request.</h1>
          <p>These answers are demo copy. Production policy, medical, deposit, refund, SMS, privacy, and consent language must be reviewed before launch.</p>
        </div>
      </section>
      <section className="section compact">
        <div className="container faq-page-list">
          {publicFaqs.map((faq) => (
            <details className="faq-item" key={faq.question} open={faq.category === "booking"}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
              <span className="tag">{faq.category}</span>
            </details>
          ))}
        </div>
      </section>
      <CtaBand />
    </main>
  );
}
