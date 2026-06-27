import { DashboardPageHeader } from "../../components/DashboardPageHeader";
import { IntegrationBoundaryCard } from "../../components/IntegrationBoundaryCard";
import { MetricCard } from "../../components/MetricCard";
import { SeoPublicationActionPanel } from "../../components/SeoPublicationActionPanel";
import { StatusPill } from "../../components/StatusPill";
import { dashboardSeoEnginePreview, dashboardSeoRouteRecords } from "../../lib/seoDemo";

export default function SeoManagerPage() {
  const { sitemap, audits, internalLinks, cityBriefs, styleBriefs, imageSeo, revalidationPlan, searchConsole, homepageMetadata } = dashboardSeoEnginePreview;
  const warningCount = audits.reduce((total, audit) => total + audit.issues.length, 0);

  return (
    <main>
      <DashboardPageHeader
        eyebrow="SEO engine"
        title="City, style, schema, sitemap, and attribution control center"
        description="Preview the Phase 10 SEO engine for city pages, tattoo style pages, canonical metadata, structured data, internal links, sitemap entries, image SEO, Search Console setup, and publish revalidation boundaries. Tenant-scoped SEO read APIs now exist; publishing/provider actions remain gated."
      />

      <section className="metric-grid">
        <MetricCard label="Tracked public routes" value={String(dashboardSeoRouteRecords.length)} detail="Static demo route inventory" />
        <MetricCard label="Sitemap entries" value={String(sitemap.indexableCount)} detail={`${sitemap.noindexCount} omitted/noindex`} />
        <MetricCard label="Audit issues" value={String(warningCount)} detail="Static heuristic checks plus routed publication evidence gates" />
        <MetricCard label="Internal links" value={String(internalLinks.length)} detail="City/style conversion paths" />
      </section>

      <section className="card table-card">
        <div className="table-header five">
          <span>Path</span><span>Kind</span><span>Title</span><span>Score</span><span>Status</span>
        </div>
        {dashboardSeoRouteRecords.map((route) => {
          const audit = audits.find((item) => item.path === route.path);
          return (
            <div className="table-row five" key={route.path}>
              <span>{route.path}</span>
              <span>{route.kind}</span>
              <span>{route.title}</span>
              <span>{audit?.score ?? 0}</span>
              <span><StatusPill label={route.indexMode === "index" ? "indexable" : "noindex"} tone={route.indexMode === "index" ? "success" : "warning"} /></span>
            </div>
          );
        })}
      </section>

      <section className="grid two spacious">
        <article className="card">
          <h2>City content briefs</h2>
          <div className="stack">
            {cityBriefs.map((brief) => (
              <div className="list-row" key={brief.slug}>
                <div>
                  <strong>{brief.h1}</strong>
                  <span>{brief.primaryKeyword} Â· {brief.schemaTypes.join(", ")}</span>
                </div>
                <StatusPill label={`${brief.recommendedSections.length} sections`} tone="info" />
              </div>
            ))}
          </div>
        </article>
        <article className="card">
          <h2>Style content briefs</h2>
          <div className="stack">
            {styleBriefs.map((brief) => (
              <div className="list-row" key={brief.slug}>
                <div>
                  <strong>{brief.h1}</strong>
                  <span>{brief.secondaryKeywords.slice(0, 2).join(" Â· ")}</span>
                </div>
                <StatusPill label={`${brief.analyticsEvents.length} events`} tone="success" />
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid two spacious">
        <article className="card">
          <h2>Internal link opportunities</h2>
          <div className="stack">
            {internalLinks.slice(0, 8).map((link) => (
              <div className="list-row" key={`${link.fromPath}-${link.toPath}-${link.anchorText}`}>
                <div>
                  <strong>{link.anchorText}</strong>
                  <span>{link.fromPath} â†’ {link.toPath}</span>
                </div>
                <StatusPill label={link.priority} tone={link.priority === "high" ? "success" : "info"} />
              </div>
            ))}
          </div>
        </article>
        <article className="card">
          <h2>Image SEO queue</h2>
          <div className="stack">
            {imageSeo.slice(0, 6).map((image) => (
              <div className="list-row" key={image.imageUrl}>
                <div>
                  <strong>{image.filenameHint}</strong>
                  <span>{image.altText}</span>
                </div>
                <StatusPill label="ImageObject" tone="info" />
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid two spacious">
        <article className="card">
          <h2>Homepage metadata draft</h2>
          <p><strong>{homepageMetadata.title}</strong></p>
          <p>{homepageMetadata.description}</p>
          <p className="muted-label">Canonical</p>
          <code>{homepageMetadata.canonicalUrl}</code>
        </article>
        <article className="card">
          <h2>Publish/revalidation plan</h2>
          <p>{revalidationPlan.reason}</p>
          <p className="muted-label">Tags</p>
          <code>{revalidationPlan.tags.slice(0, 6).join(" | ")}</code>
        </article>
      </section>

      <section className="grid two spacious">
        <IntegrationBoundaryCard
          title="Search Console integration"
          status={searchConsole.status}
          description={`${searchConsole.propertyType} property using ${searchConsole.verificationMethod}. ${searchConsole.nextAction}`}
          gapIds={["GAP-075"]}
        />
        <IntegrationBoundaryCard
          title="SEO publishing runtime"
          status="externally dependent"
          description="Production publishing must persist tenant SEO rows, validate duplicate canonicals, revalidate public routes, submit sitemap updates, and log audit records."
          gapIds={["GAP-071", "GAP-072", "GAP-073", "GAP-074", "GAP-076"]}
        />
      </section>
      <SeoPublicationActionPanel />
    </main>
  );
}

