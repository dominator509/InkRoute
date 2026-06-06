import type { Metadata } from "next";
import { publicLegalDocuments } from "../../lib/securityDemo";

export const metadata: Metadata = {
  title: "Terms of Service Placeholder",
  description: "InkRoute Suite terms of service placeholder for attorney review before production use.",
  robots: { index: false, follow: false },
};

export default function TermsPage() {
  const document = publicLegalDocuments.find((item) => item.slug === "terms");
  return (
    <main>
      <section className="page-hero container narrow">
        <p className="eyebrow">Terms placeholder · Not final</p>
        <h1>Terms built for review.</h1>
        <p>These terms are a product scaffold, not a production agreement. InkRoute needs attorney-reviewed terms before accepting deposits, opening SaaS signups, collecting consent signatures, or launching live booking.</p>
      </section>
      <section className="section compact container grid two align-start">
        <article className="panel-card large">
          <p className="eyebrow">Document summary</p>
          <h2>{document?.title ?? "Terms of Service Placeholder"}</h2>
          <p>{document?.summary}</p>
        </article>
        <article className="warning-card">
          <p className="eyebrow">Blocked actions</p>
          <h2>Do not enable yet.</h2>
          <ul className="feature-list">
            {document?.blockedProductionActions.map((action) => <li key={action}>{action}</li>)}
          </ul>
        </article>
      </section>
    </main>
  );
}
