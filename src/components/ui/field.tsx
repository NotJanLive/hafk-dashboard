import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

const control =
  "w-full rounded-[10px] border border-border-strong bg-surface-2 px-3 text-sm text-text placeholder:text-faint transition-colors hover:border-faint focus:border-primary focus:outline-none disabled:opacity-60";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(control, "h-10", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(control, "min-h-24 py-2.5 leading-relaxed", className)} {...props} />;
}

export function Field({
  label,
  hint,
  action,
  count,
  max,
  children,
  className,
  custom = false,
}: {
  label: string;
  hint?: string;
  action?: ReactNode;
  count?: number;
  max?: number;
  children: ReactNode;
  className?: string;
  custom?: boolean;
}) {
  const Wrapper = custom ? "div" : "label";
  return (
    <Wrapper className={cn("block", className)}>
      <span className="mb-1.5 flex min-h-6 items-center gap-3">
        <span className="mr-auto text-[13px] font-semibold text-muted">{label}</span>
        {action}
        {max !== undefined && (
          <span className={cn("text-xs tabular-nums", (count ?? 0) > max ? "font-semibold text-danger" : "text-faint")}>
            {count ?? 0}/{max}
          </span>
        )}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-faint">{hint}</span>}
    </Wrapper>
  );
}
