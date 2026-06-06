import type { Metadata } from "next";
import { publicLegalDocuments } from "../../lib/securityDemo";

export const metadata: Metadata = {
  title: "Consent and Medical Disclaimer Placeholder",
  description: "InkRoute Suite consent, medical acknowledgment, and aftercare disclaimer placeholder.",
  robots: { index: false, follow: false },
};

export default function ConsentDisclaimerPage() {
  const consent = publicLegalDocuments.find((item) => item.slug === "consent-medical-disclaimer");
  const sms = publicLegalDocuments.find((item) => item.slug === "sms-consent");
  return (
    <main>
      <section className="page-hero container narrow">
        <p className="eyebrow">Consent placeholder · Legal review required</p>
        <h1>Medical and consent language is not final.</h1>
        <p>InkRoute can help collect intake, consent, and aftercare acknowledgments only after final workflows and language are reviewed by qualified counsel and configured for the artist or studio jurisdiction.</p>
      </section>
      <section className="section compact container grid two align-start">
        {[consent, sms].map((document) => document ? (
          <article className="warning-card" key={document.slug}>
            <p className="eyebrow">{document.audience}</p>
            <h2>{document.title}</h2>
            <p>{document.summary}</p>
            <ul className="feature-list">
              {document.blockedProductionActions.map((action) => <li key={action}>{action}</li>)}
            </ul>
          </article>
        ) : null)}
      </section>
    </main>
  );
}
