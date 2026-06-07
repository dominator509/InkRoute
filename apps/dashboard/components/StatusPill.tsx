import { Badge } from "@inkroute/ui";

interface StatusPillProps {
  key?: string;
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}

export function StatusPill({ label, tone = "neutral" }: StatusPillProps) {
  return <Badge label={label} tone={tone} />;
}
