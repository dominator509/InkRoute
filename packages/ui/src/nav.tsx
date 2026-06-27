import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";
import { inkrouteTheme } from "./tokens";

export interface NavBarProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  label?: string;
}

export function NavBar({ children, className, label = "Primary navigation", ...props }: NavBarProps) {
  return (
    <nav aria-label={label} className={clsx("flex flex-wrap items-center gap-2", className)} {...props}>
      {children}
    </nav>
  );
}

export interface NavItemProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  active?: boolean;
  children: ReactNode;
}

export function NavItem({ active = false, children, className, ...props }: NavItemProps) {
  return (
    <a
      aria-current={active ? "page" : undefined}
      className={clsx(
        "inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition",
        inkrouteTheme.focusRing,
        active ? "bg-stone-50 text-stone-950" : "text-stone-300 hover:bg-stone-900 hover:text-stone-50",
        className,
      )}
      {...props}
    >
      {children}
    </a>
  );
}
