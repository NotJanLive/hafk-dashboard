import { cn } from "@/lib/utils";

/** Visual on/off switch. Interactive once modules can be toggled; until then rendered disabled. */
export function Switch({ checked, disabled, label }: { checked: boolean; disabled?: boolean; label: string }) {
  return (
    <span
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      aria-label={label}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-primary" : "bg-surface-3",
        disabled && "opacity-50",
      )}
    >
      <span
        className={cn(
          "size-5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </span>
  );
}
