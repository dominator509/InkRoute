import type { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";
import { inkrouteTheme } from "./tokens";

type SurfaceTone = "solid" | "soft" | "accent" | "danger";

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  tone?: SurfaceTone;
}

export function Surface({ children, className, tone = "solid", ...props }: SurfaceProps) {
  return (
    <div
      className={clsx(
        "border p-5 shadow-2xl shadow-black/20",
        inkrouteTheme.radius.panel,
        tone === "solid" && inkrouteTheme.color.panel,
        tone === "soft" && inkrouteTheme.color.panelSoft,
        tone === "accent" && inkrouteTheme.color.accentSoft,
        tone === "danger" && inkrouteTheme.color.danger,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface SectionHeaderProps extends HTMLAttributes<HTMLDivElement> {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function SectionHeader({ actions, className, description, eyebrow, title, ...props }: SectionHeaderProps) {
  return (
    <div className={clsx("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)} {...props}>
      <div className="space-y-2">
        {eyebrow ? <p className={inkrouteTheme.typography.eyebrow}>{eyebrow}</p> : null}
        <h2 className={inkrouteTheme.typography.title}>{title}</h2>
        {description ? <p className={inkrouteTheme.typography.body}>{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
