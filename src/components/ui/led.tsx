import { cn } from "@/lib/utils";

export type LedState = "on" | "warn" | "error" | "off";

const colors: Record<LedState, string> = {
  on: "bg-accent shadow-[0_0_8px_var(--accent)]",
  warn: "bg-warn shadow-[0_0_8px_var(--warn)]",
  error: "bg-danger shadow-[0_0_8px_var(--danger)]",
  off: "bg-line-strong",
};

/** Status light, the recurring visual element of the dashboard. */
export function Led({
  state,
  pulse = state === "on",
  label,
  className,
}: {
  state: LedState;
  pulse?: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn("relative inline-flex size-2 shrink-0", className)}
      role={label ? "img" : undefined}
      aria-label={label}
    >
      {pulse && <span className={cn("animate-led absolute inset-0 rounded-full", colors[state])} />}
      <span className={cn("relative size-2 rounded-full", colors[state])} />
    </span>
  );
}
