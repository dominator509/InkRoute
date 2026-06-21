import type { Metadata } from "next";
import { publicRateLimitRules, publicSecurityHeaderDrafts, publicTrustControls, publicTrustSummary, publicUploadPolicies } from "../../lib/securityDemo";

export const metadata: Metadata = {
  title: "Trust and Security Placeholder",
  description: "InkRoute Suite public trust center showing local security contracts and production blockers.",
  robots: { index: false, follow: false },
};

export default function PublicTrustPage() {
  return (
    <main>
      <section className="page-hero container narrow">
        <p className="eyebrow">Phase 13 · Trust control center</p>
        <h1>Trust center preview.</h1>
        <p>This public trust page documents the local security contracts and production blockers without claiming production readiness. Auth, tenant isolation, secure uploads, privacy workflows, legal docs, and live provider controls remain gap-tracked.</p>
      </section>
      <section className="section compact container">
        <div className="stat-grid four">
          <article className="stat-card"><strong>{publicTrustSummary.total}</strong><span>Controls</span><p>{publicTrustSummary.blockers} still block production.</p></article>
          <article className="stat-card"><strong>{publicTrustSummary.implemented}</strong><span>Implemented</span><p>No production-ready security control is claimed.</p></article>
          <article className="stat-card"><strong>{publicTrustSummary.localContracts}</strong><span>Local contracts</span><p>Helper contracts and route boundaries exist.</p></article>
          <article className="stat-card"><strong>{publicTrustSummary.legal}</strong><span>Legal review</span><p>Policies and consent require attorney review.</p></article>
        </div>
      </section>
      <section className="section compact container grid three">
        {publicTrustControls.map((control) => (
          <article className="panel-card" key={control.id}>
            <p className="eyebrow">{control.area}</p>
            <h2>{control.label}</h2>
            <p>{control.currentImplementation}</p>
            <p>{control.nextAction}</p>
          </article>
        ))}
      </section>
      <section className="section compact container grid two align-start">
        <article className="panel-card">
          <p className="eyebrow">Upload policy draft</p>
          <h2>Private first.</h2>
          <pre className="code-preview">{JSON.stringify(publicUploadPolicies, null, 2)}</pre>
        </article>
        <article className="panel-card">
          <p className="eyebrow">Public abuse controls</p>
          <h2>Rate-limit plan.</h2>
          {publicRateLimitRules.map((rule) => <p key={rule.id}>{rule.routePattern}: {rule.maxRequests}/{rule.windowSeconds}s · {rule.status}</p>)}
          <p className="eyebrow">Security headers</p>
          {publicSecurityHeaderDrafts.map((header) => <p key={header.name}>{header.name}: {header.status}</p>)}
        </article>
      </section>
    </main>
  );
}
