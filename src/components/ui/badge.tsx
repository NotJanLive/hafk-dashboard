import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "warn" | "danger";

const tones: Record<Tone, string> = {
  neutral: "border-line-strong text-muted",
  accent: "border-transparent bg-accent-soft text-accent",
  warn: "border-transparent bg-warn-soft text-warn",
  danger: "border-transparent bg-danger-soft text-danger",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-md border px-1.5 font-mono text-[10.5px] font-medium tracking-wide uppercase",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
