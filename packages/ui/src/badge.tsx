import type { HTMLAttributes } from "react";
import clsx from "clsx";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  label: string;
  tone?: BadgeTone;
}

export function Badge({ className, label, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={clsx("status-pill", tone !== "neutral" ? tone : "", className)}
      {...props}
    >
      {label.replace(/_/g, " ")}
    </span>
  );
}
