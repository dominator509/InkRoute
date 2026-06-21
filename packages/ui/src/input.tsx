import type { InputHTMLAttributes } from "react";
import clsx from "clsx";

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  id?: string;
};

export function Input({ className, type = "text", ...props }: InputProps) {
  return (
    <input
      type={type}
      className={clsx(
        "w-full rounded-xl border border-stone-700 bg-stone-950/40 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-500",
        "focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/40",
        className,
      )}
      {...props}
    />
  );
}
