import Image from "next/image";
import { getPortfolioImageDerivative } from "@inkroute/config";
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

function buildDerivativeBlurDataUrl(title: string): string {
  const safeTitle = title.replace(/[<&>"]/g, "").slice(0, 42);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='40' viewBox='0 0 32 40'><rect width='32' height='40' fill='#17120f'/><path d='M4 31 C13 24 11 15 23 8' stroke='#b07c55' stroke-width='3' fill='none' stroke-linecap='round'/><text x='4' y='36' fill='#f7efe6' font-size='3' font-family='serif'>${safeTitle}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export function PortfolioCard({ item, priority = false }: PortfolioCardProps) {
  const tags = [item.freshness.replace("_", " "), placementLabel[item.placement] ?? item.placement, item.city].filter(Boolean);
  const image = getPortfolioImageDerivative(item);

  return (
    <article className={priority ? "portfolio-card featured" : "portfolio-card"} aria-label={`${item.title} portfolio item`}>
      <div
        className="portfolio-art"
        data-storage-visibility={image.storageVisibility}
        data-private-original-available={String(image.privateOriginalAvailable)}
        data-cache-control={image.cacheControl}
      >
        <Image
          className="portfolio-image"
          src={image.src}
          alt={image.altText}
          width={image.width}
          height={image.height}
          sizes={image.sizes}
          priority={priority}
          placeholder="blur"
          blurDataURL={buildDerivativeBlurDataUrl(item.title)}
          unoptimized
        />
        <span>{item.title}</span>
      </div>
      <div className="portfolio-card-body">
        <p className="eyebrow">{tags.join(" ? ")}</p>
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
