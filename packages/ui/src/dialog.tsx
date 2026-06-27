import type { DialogHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

export interface DialogProps extends DialogHTMLAttributes<HTMLDialogElement> {
  children: ReactNode;
}

export function Dialog({ children, className, ...props }: DialogProps) {
  return (
    <dialog
      className={clsx(
        "max-w-xl rounded-3xl border border-stone-800 bg-stone-950 p-0 text-stone-50 shadow-2xl backdrop:bg-stone-950/70",
        className,
      )}
      {...props}
    >
      {children}
    </dialog>
  );
}

export interface DialogPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function DialogPanel({ children, className, ...props }: DialogPanelProps) {
  return (
    <div className={clsx("space-y-5 p-6", className)} {...props}>
      {children}
    </div>
  );
}

export interface DialogTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

export function DialogTitle({ children, className, ...props }: DialogTitleProps) {
  return (
    <h2 className={clsx("text-xl font-black tracking-tight text-stone-50", className)} {...props}>
      {children}
    </h2>
  );
}
