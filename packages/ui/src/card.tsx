import type { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div className={clsx("rounded-3xl border border-stone-800 bg-stone-950/70 p-6 shadow-2xl", className)} {...props}>
      {children}
    </div>
  );
}
