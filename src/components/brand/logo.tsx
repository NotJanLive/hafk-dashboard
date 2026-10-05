import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-7 shrink-0", className)}>
      <rect x="1" y="1" width="22" height="22" rx="6.5" fill="var(--accent)" />
      <path
        d="M8 6.5v11M16 6.5v11M8 12h8"
        stroke="var(--accent-ink)"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="16" cy="12" r="1.9" fill="var(--accent)" stroke="var(--accent-ink)" strokeWidth="1.6" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="font-mono text-[15px] font-bold tracking-tight text-text">HAFK</span>
        <span className="label mt-1 !text-[9.5px]">control</span>
      </span>
    </span>
  );
}
