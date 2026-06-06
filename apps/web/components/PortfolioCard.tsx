import type { PortfolioItem } from "@inkroute/types";

const styleLabel: Record<string, string> = {
  blackwork: "Blackwork",
  fine_line: "Fine line",
  traditional: "Traditional",
  neo_traditional: "Neo-traditional",
  realism: "Realism",
  ornamental: "Ornamental",
  japanese: "Japanese",
  lettering: "Lettering",
  flash: "Flash",
  custom: "Custom",
};

const placementLabel: Record<string, string> = {
  arm: "Arm",
  forearm: "Forearm",
  upper_arm: "Upper arm",
  leg: "Leg",
  calf: "Calf",
  thigh: "Thigh",
  back: "Back",
  chest: "Chest",
  ribs: "Ribs",
  neck: "Neck",
  hand: "Hand",
  foot: "Foot",
  shoulder: "Shoulder",
  sternum: "Sternum",
  stomach: "Stomach",
  head: "Head",
  other: "Other",
};

interface PortfolioCardProps {
  item: PortfolioItem;
  priority?: boolean;
}

export function PortfolioCard({ item, priority = false }: PortfolioCardProps) {
  const tags = [item.freshness.replace("_", " "), placementLabel[item.placement] ?? item.placement, item.city].filter(Boolean);

  return (
    <article className={priority ? "portfolio-card featured" : "portfolio-card"} aria-label={`${item.title} portfolio item`}>
      <div className="portfolio-art" role="img" aria-label={item.altText}>
        <span>{item.title}</span>
      </div>
      <div className="portfolio-card-body">
        <p className="eyebrow">{tags.join(" · ")}</p>
        <h3>{item.title}</h3>
        <p>{item.caption}</p>
        <div className="tag-row" aria-label="Tattoo style tags">
          {item.styles.map((style) => (
            <span className="tag" key={style}>{styleLabel[style] ?? style}</span>
          ))}
        </div>
      </div>
    </article>
  );
}
