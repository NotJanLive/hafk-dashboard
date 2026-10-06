"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { Fragment, type KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type SelectMenuOption = {
  value: string;
  label: string;
  group?: string;
  disabled?: boolean;
  hint?: string;
  color?: string | null;
  prefix?: string;
};

function OptionLabel({ option }: { option: SelectMenuOption }) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      {option.color !== undefined && (
        <span className="size-3 shrink-0 rounded-full" style={{ background: option.color ?? "var(--faint)" }} />
      )}
      {option.prefix && <span className="-mr-1 text-faint">{option.prefix}</span>}
      <span className="truncate">{option.label}</span>
    </span>
  );
}

export function SelectMenu({
  value,
  onChange,
  options,
  placeholder = "Auswählen",
  searchPlaceholder = "Suchen …",
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectMenuOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected = options.find((option) => option.value === value);
  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return search ? options.filter((option) => option.label.toLowerCase().includes(search)) : options;
  }, [options, query]);
  const selectable = filtered.filter((option) => !option.disabled);
  const showSearch = options.length > 5;

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const openMenu = () => {
    setQuery("");
    setActive(
      Math.max(
        0,
        options.filter((option) => !option.disabled).findIndex((option) => option.value === value),
      ),
    );
    setOpen(true);
  };

  const choose = (option: SelectMenuOption) => {
    if (option.disabled) return;
    onChange(option.value);
    setOpen(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!open) {
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openMenu();
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, selectable.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = selectable[active];
      if (option) choose(option);
    }
  };

  return (
    <div ref={ref} className="relative" onKeyDown={onKeyDown}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className={cn(
          "flex h-10 w-full items-center gap-2 rounded-[10px] border border-border-strong bg-surface-2 pr-3 pl-1.5 text-left text-sm transition-colors hover:border-faint focus:border-primary focus:outline-none",
          open && "border-primary",
        )}
      >
        {selected ? (
          <span className="inline-flex h-7 min-w-0 items-center rounded-lg bg-surface-3 px-2.5 font-medium">
            <OptionLabel option={selected} />
          </span>
        ) : (
          <span className="px-1.5 text-faint">{placeholder}</span>
        )}
        <ChevronDown className={cn("ml-auto size-4 shrink-0 text-faint transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-30 mt-2 w-full min-w-64 overflow-hidden rounded-xl border border-border-strong bg-surface-2 shadow-2xl shadow-black/50">
          {showSearch && (
            <div className="flex items-center gap-2 border-b border-border px-3">
              <Search className="size-4 text-faint" />
              <input
                autoFocus
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                placeholder={searchPlaceholder}
                className="h-11 w-full bg-transparent text-sm placeholder:text-faint focus:outline-none"
              />
            </div>
          )}
          <ul id={listId} role="listbox" className="max-h-64 overflow-y-auto p-1.5">
            {filtered.length === 0 && <li className="px-3 py-6 text-center text-sm text-faint">Nichts gefunden</li>}
            {filtered.map((option, index) => {
              const showGroup = option.group && option.group !== filtered[index - 1]?.group;
              const selectableIndex = selectable.indexOf(option);
              const isSelected = option.value === value;
              return (
                <Fragment key={option.value}>
                  {showGroup && (
                    <li
                      role="presentation"
                      className="px-2.5 pt-2.5 pb-1 text-[11px] font-bold tracking-wide text-faint uppercase"
                    >
                      {option.group}
                    </li>
                  )}
                  <li role="option" aria-selected={isSelected} aria-disabled={option.disabled}>
                    <button
                      type="button"
                      disabled={option.disabled}
                      onClick={() => choose(option)}
                      onMouseEnter={() => selectableIndex >= 0 && setActive(selectableIndex)}
                      className={cn(
                        "flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium transition-colors",
                        isSelected ? "bg-primary-soft" : selectableIndex === active && "bg-surface-3",
                        option.disabled && "cursor-not-allowed opacity-50",
                      )}
                    >
                      <OptionLabel option={option} />
                      {option.hint && (
                        <span className="ml-auto shrink-0 rounded-md bg-surface-3 px-1.5 py-0.5 text-[11px] font-semibold text-faint">
                          {option.hint}
                        </span>
                      )}
                      {isSelected && <Check className="ml-auto size-4 shrink-0 text-primary-hover" />}
                    </button>
                  </li>
                </Fragment>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
