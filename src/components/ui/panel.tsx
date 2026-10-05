import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Top-level content surface. Content inside is separated by lines, never by nested cards. */
export function Panel({
  title,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("overflow-hidden rounded-xl border border-line bg-surface", className)}>
      {title && (
        <header className="flex h-11 items-center justify-between gap-3 border-b border-line px-5">
          <h2 className="label">{title}</h2>
          {actions}
        </header>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function PageHeader({
  label,
  title,
  meta,
  actions,
}: {
  label: string;
  title: string;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="label">{label}</p>
        <h1 className="mt-2 truncate text-2xl font-bold tracking-tight md:text-[28px]">{title}</h1>
        {meta && <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">{meta}</div>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

/** A labelled row inside a panel: label/description on the left, control or value on the right. */
export function FieldRow({
  label,
  description,
  htmlFor,
  children,
}: {
  label: string;
  description?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-3 border-b border-line px-5 py-5 last:border-b-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:gap-8">
      <div>
        <label htmlFor={htmlFor} className="text-sm font-semibold">
          {label}
        </label>
        {description && <p className="mt-1 text-[13px] leading-relaxed text-muted">{description}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
