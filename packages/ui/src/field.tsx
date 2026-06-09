import type { HTMLAttributes, LabelHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

export interface FieldProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Field({ children, className, ...props }: FieldProps) {
  return (
    <div className={clsx("space-y-2", className)} {...props}>
      {children}
    </div>
  );
}

export interface FieldLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
  required?: boolean;
}

export function FieldLabel({ children, className, required = false, ...props }: FieldLabelProps) {
  return (
    <label className={clsx("block text-sm font-semibold text-stone-100", className)} {...props}>
      {children}
      {required ? <span aria-hidden="true" className="ml-1 text-amber-200">*</span> : null}
    </label>
  );
}

export interface FieldHintProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

export function FieldHint({ children, className, ...props }: FieldHintProps) {
  return (
    <p className={clsx("text-xs leading-5 text-stone-500", className)} {...props}>
      {children}
    </p>
  );
}

export interface FieldErrorProps extends HTMLAttributes<HTMLParagraphElement> {
  children?: ReactNode;
}

export function FieldError({ children, className, ...props }: FieldErrorProps) {
  if (!children) return null;

  return (
    <p className={clsx("text-xs font-semibold leading-5 text-rose-200", className)} role="alert" {...props}>
      {children}
    </p>
  );
}
