import type { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type ButtonVariant = "primary" | "secondary" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
}

export function Button({ children, className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2",
        variant === "primary" && "bg-stone-50 text-stone-950 hover:bg-white focus:ring-stone-300",
        variant === "secondary" && "border border-stone-700 text-stone-100 hover:border-stone-400",
        variant === "ghost" && "text-stone-300 hover:text-white",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
