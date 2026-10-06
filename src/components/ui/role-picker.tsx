"use client";

import { Check, Plus, Search, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Role } from "@/lib/bot-api/types";
import { roleColor } from "@/lib/discord/cdn";
import { cn } from "@/lib/utils";

export function RolePicker({
  name,
  roles,
  defaultValue,
  max,
  onChange,
}: {
  name: string;
  roles: Role[];
  defaultValue: string[];
  max: number;
  onChange?: (roleIds: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>(defaultValue);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const byId = useMemo(() => new Map(roles.map((role) => [role.id, role])), [roles]);
  const assignable = roles.filter((role) => !role.managed);
  const filtered = assignable.filter((role) => role.name.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (
        event instanceof KeyboardEvent ? event.key === "Escape" : !containerRef.current?.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const toggle = (id: string) => {
    const next = selected.includes(id)
      ? selected.filter((value) => value !== id)
      : selected.length < max
        ? [...selected, id]
        : selected;
    setSelected(next);
    onChange?.(next);
  };

  return (
    <div ref={containerRef} className="relative">
      {selected.map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}

      <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-xl border border-border-strong bg-surface-2 p-2">
        {selected.map((id) => {
          const role = byId.get(id);
          return (
            <span
              key={id}
              className="inline-flex h-8 items-center gap-2 rounded-lg bg-surface-3 pr-1 pl-2.5 text-sm font-medium"
            >
              <span
                className="size-3 rounded-full"
                style={{ background: roleColor(role?.color ?? 0) ?? "var(--faint)" }}
              />
              {role?.name ?? "Gelöschte Rolle"}
              <button
                type="button"
                onClick={() => toggle(id)}
                className="rounded-md p-1 text-faint hover:bg-border-strong hover:text-text"
                aria-label={`${role?.name ?? id} entfernen`}
              >
                <X className="size-3.5" />
              </button>
            </span>
          );
        })}
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={listId}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-primary-hover hover:bg-primary-soft"
        >
          <Plus className="size-4" />
          Rolle hinzufügen
        </button>
      </div>

      {open && (
        <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-border-strong bg-surface-2 shadow-2xl shadow-black/50">
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="size-4 text-faint" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rollen durchsuchen …"
              className="h-11 w-full bg-transparent text-sm placeholder:text-faint focus:outline-none"
            />
          </div>
          <ul id={listId} role="listbox" aria-multiselectable className="max-h-64 overflow-y-auto p-1.5">
            {filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-faint">Keine Rollen gefunden</li>
            )}
            {filtered.map((role) => {
              const active = selected.includes(role.id);
              return (
                <li key={role.id} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={() => toggle(role.id)}
                    className={cn(
                      "flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium hover:bg-surface-3",
                      active && "bg-primary-soft",
                    )}
                  >
                    <span
                      className="size-3 rounded-full"
                      style={{ background: roleColor(role.color) ?? "var(--faint)" }}
                    />
                    <span className="flex-1 truncate">{role.name}</span>
                    {active && <Check className="size-4 text-primary-hover" />}
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="border-t border-border px-3 py-2 text-xs text-faint">
            {selected.length} von {max} ausgewählt
          </p>
        </div>
      )}
    </div>
  );
}
