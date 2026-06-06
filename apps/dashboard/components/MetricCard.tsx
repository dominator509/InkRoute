interface MetricCardProps {
  label: string;
  value: string;
  detail: string;
}

export function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <article className="card metric-card">
      <p className="muted-label">{label}</p>
      <strong>{value}</strong>
      <span>{detail}</span>
    </article>
  );
}
