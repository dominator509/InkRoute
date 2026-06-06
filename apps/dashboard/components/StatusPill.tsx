interface StatusPillProps {
  key?: string;
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}

export function StatusPill({ label, tone = "neutral" }: StatusPillProps) {
  return <span className={`status-pill ${tone}`}>{label.replace(/_/g, " ")}</span>;
}
