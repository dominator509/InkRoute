import { DashboardPageHeader } from "../../components/DashboardPageHeader";
import { DisabledActionPanel } from "../../components/DisabledActionPanel";
import { StatusPill } from "../../components/StatusPill";
import { dashboardPortfolio } from "../../lib/demo";

export default function PortfolioManagerPage() {
  return (
    <main>
      <DashboardPageHeader
        eyebrow="Portfolio CMS"
        title="Portfolio manager"
        description="Manage portfolio metadata, style tags, freshness labels, placements, city context, attribution, and image SEO. Images are still placeholder paths."
      />

      <section className="card table-card">
        <div className="table-header six">
          <span>Piece</span><span>Styles</span><span>Placement</span><span>Freshness</span><span>Attribution</span><span>SEO</span>
        </div>
        {dashboardPortfolio.map((item) => (
          <div className="table-row six" key={item.id}>
            <span><strong>{item.title}</strong><small>{item.city ?? "No city"}</small></span>
            <span>{item.styles.map((style) => style.replace(/_/g, " ")).join(", ")}</span>
            <span>{item.placement.replace(/_/g, " ")}</span>
            <span><StatusPill label={item.freshness} tone={item.freshness === "healed" ? "success" : "info"} /></span>
            <span>{item.attributionCount} request signals<small>{item.attributionKey}</small></span>
            <span>{item.needsAltTextReview ? "Alt needs review" : "Alt text ready"}<small>{item.isPublic ? "public" : "hidden"}</small></span>
          </div>
        ))}
      </section>

      <DisabledActionPanel
        title="Image workflow actions"
        description="Upload, crop, reorder, publish, transform, and alt-text assistant actions require signed storage, image optimization, background jobs, and access control."
        actions={["Upload image", "Generate derivative", "Publish to website", "Request healed photo"]}
      />
    </main>
  );
}
