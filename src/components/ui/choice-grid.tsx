import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type Choice<T extends string> = { value: T; label: string; description: string; icon: LucideIcon };

export function ChoiceGrid<T extends string>({
  options,
  value,
  onChange,
  columns = 3,
}: {
  options: Choice<T>[];
  value: T;
  onChange: (value: T) => void;
  columns?: 2 | 3;
}) {
  return (
    <div className={cn("grid gap-2", columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3")} role="radiogroup">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-xl border p-3 text-left transition-colors",
            value === option.value ? "border-primary bg-primary-soft" : "border-border-strong hover:bg-surface-2",
          )}
        >
          <option.icon className={cn("size-5", value === option.value ? "text-primary-hover" : "text-muted")} />
          <span className="mt-2 block text-sm font-bold">{option.label}</span>
          <span className="mt-0.5 block text-xs text-muted">{option.description}</span>
        </button>
      ))}
    </div>
  );
}
