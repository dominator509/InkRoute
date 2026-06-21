import type { Metadata } from "next";
import { publicLegalDocuments, publicPrivacyRequestDrafts, publicSensitiveFieldPolicies } from "../../lib/securityDemo";

export const metadata: Metadata = {
  title: "Privacy Policy Placeholder",
  description: "InkRoute Suite privacy policy placeholder for attorney review before production use.",
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  const document = publicLegalDocuments.find((item) => item.slug === "privacy");
  return (
    <main>
      <section className="page-hero container narrow">
        <p className="eyebrow">Legal placeholder · Not final</p>
        <h1>Privacy policy placeholder.</h1>
        <p>This page is a Phase 13 draft only. It is not legal advice, not attorney-reviewed, and must not be published as a production privacy policy until the live data flows, vendors, retention rules, and jurisdiction-specific requirements are reviewed.</p>
      </section>
      <section className="section compact container grid two align-start">
        <article className="panel-card">
          <p className="eyebrow">Document status</p>
          <h2>{document?.title ?? "Privacy Policy Placeholder"}</h2>
          <p>{document?.summary}</p>
          <ul className="feature-list">
            {document?.blockedProductionActions.map((action) => <li key={action}>{action}</li>)}
          </ul>
        </article>
        <article className="warning-card">
          <p className="eyebrow">Privacy requests</p>
          <h2>Access, export, deletion.</h2>
          <p>Privacy request intake is wired for demo-scope persistence and production fail-closed handling; production must still verify identity, separate legally retained records from deletable data, redact third-party information, and audit every worker action.</p>
          {publicPrivacyRequestDrafts.map((draft) => (
            <div className="pill-row" key={draft.id}><span className="pill">{draft.type}</span><span className="pill">{draft.status.replace(/_/g, " ")}</span></div>
          ))}
        </article>
      </section>
      <section className="section compact container">
        <div className="section-intro"><p className="eyebrow">Data classes</p><h2>What needs protection.</h2><p>These field policies are implementation guides for Codex/Jules, not a final privacy promise.</p></div>
        <div className="grid three">
          {publicSensitiveFieldPolicies.map((policy) => (
            <article className="panel-card" key={policy.field}>
              <p className="eyebrow">{policy.sensitivity}</p>
              <h2>{policy.field}</h2>
              <p>{policy.storageRequirement}</p>
              <p>{policy.logPolicy}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
