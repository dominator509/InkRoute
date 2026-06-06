interface IntegrationBoundaryCardProps {
  title: string;
  status: string;
  description: string;
  gapIds: string[];
}

export function IntegrationBoundaryCard({ title, status, description, gapIds }: IntegrationBoundaryCardProps) {
  return (
    <article className="card boundary-card">
      <div className="boundary-topline">
        <h3>{title}</h3>
        <span>{status}</span>
      </div>
      <p>{description}</p>
      <div className="gap-row" aria-label="Tracked gaps">
        {gapIds.map((gap) => (
          <code key={gap}>{gap}</code>
        ))}
      </div>
    </article>
  );
}
