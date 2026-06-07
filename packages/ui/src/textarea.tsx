import type { HTMLAttributes } from "react";
import clsx from "clsx";

type TextareaProps = HTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={clsx(
        "w-full min-h-28 rounded-xl border border-stone-700 bg-stone-950/40 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-500",
        "focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/40",
        className,
      )}
      {...props}
    />
  );
}
