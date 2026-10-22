"use client";

import { Check, Search, Shield, User, UserPlus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AccessTarget, MemberResult, Role } from "@/lib/bot-api/types";
import { roleColor } from "@/lib/discord/cdn";
import { cn } from "@/lib/utils";

type Mode = "role" | "user";

export function TargetPicker({
  roles,
  value,
  onChange,
  max = 50,
  search,
  guildId,
}: {
  roles: Role[];
  value: AccessTarget[];
  onChange: (targets: AccessTarget[]) => void;
  max?: number;
  search: (guildId: string, query: string) => Promise<MemberResult[]>;
  guildId: string;
}) {
  const [mode, setMode] = useState<Mode | null>(null);
  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<MemberResult[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const byId = useMemo(() => new Map(roles.map((role) => [role.id, role])), [roles]);
  const assignable = roles.filter((role) => !role.managed && role.id !== guildId);
  const filteredRoles = assignable.filter((role) => role.name.toLowerCase().includes(query.trim().toLowerCase()));
  const has = (type: AccessTarget["type"], id: string) =>
    value.some((target) => target.type === type && target.id === id);

  useEffect(() => {
    if (!mode) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !ref.current?.contains(event.target as Node)) {
        setMode(null);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [mode]);

  useEffect(() => {
    if (mode !== "user") return;
    const trimmed = query.trim();
    if (!trimmed) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const result = await search(guildId, trimmed);
      if (!cancelled) {
        setMembers(result.filter((member) => !member.bot));
        setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, mode, guildId, search]);

  const toggle = (target: AccessTarget) => {
    if (has(target.type, target.id)) {
      onChange(value.filter((current) => !(current.type === target.type && current.id === target.id)));
    } else if (value.length < max) {
      onChange([...value, target]);
    }
  };

  const open = (next: Mode) => {
    setQuery("");
    setMembers([]);
    setMode(mode === next ? null : next);
  };

  return (
    <div ref={ref} className="relative">
      <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-xl border border-border-strong bg-surface-2 p-2">
        {value.map((target) => {
          const role = target.type === "ROLE" ? byId.get(target.id) : null;
          return (
            <span
              key={`${target.type}:${target.id}`}
              className="inline-flex h-8 items-center gap-2 rounded-lg bg-surface-3 pr-1 pl-2 text-sm font-medium"
            >
              {target.type === "ROLE" ? (
                <span
                  className="size-3 rounded-full"
                  style={{ background: roleColor(role?.color ?? 0) ?? "var(--faint)" }}
                />
              ) : target.avatarUrl ? (
                <img src={target.avatarUrl} alt="" className="size-5 rounded-full" />
              ) : (
                <User className="size-4 text-faint" />
              )}
              {target.type === "ROLE" ? (role?.name ?? target.name ?? "Gelöschte Rolle") : (target.name ?? target.id)}
              <button
                type="button"
                onClick={() => toggle(target)}
                className="rounded-md p-1 text-faint hover:bg-border-strong hover:text-text"
                aria-label="Entfernen"
              >
                <X className="size-3.5" />
              </button>
            </span>
          );
        })}
        <button
          type="button"
          onClick={() => open("role")}
          aria-expanded={mode === "role"}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-primary-hover hover:bg-primary-soft"
        >
          <Shield className="size-4" />
          Rolle
        </button>
        <button
          type="button"
          onClick={() => open("user")}
          aria-expanded={mode === "user"}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-primary-hover hover:bg-primary-soft"
        >
          <UserPlus className="size-4" />
          Person
        </button>
      </div>

      {mode && (
        <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-border-strong bg-surface-2 shadow-2xl shadow-black/50">
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="size-4 text-faint" />
            <input
              autoFocus
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                if (mode === "user") setLoading(Boolean(event.target.value.trim()));
              }}
              placeholder={mode === "role" ? "Rollen durchsuchen …" : "Name oder Discord-ID eingeben …"}
              className="h-11 w-full bg-transparent text-sm placeholder:text-faint focus:outline-none"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto p-1.5">
            {mode === "role" &&
              (filteredRoles.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-faint">Keine Rollen gefunden</li>
              ) : (
                filteredRoles.map((role) => {
                  const active = has("ROLE", role.id);
                  return (
                    <li key={role.id}>
                      <button
                        type="button"
                        onClick={() => toggle({ type: "ROLE", id: role.id, name: role.name, avatarUrl: null })}
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
                })
              ))}
            {mode === "user" &&
              (!query.trim() ? (
                <li className="px-3 py-6 text-center text-sm text-faint">Tippe einen Namen oder eine ID ein.</li>
              ) : loading ? (
                <li className="px-3 py-6 text-center text-sm text-faint">Suche …</li>
              ) : members.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-faint">Niemand gefunden</li>
              ) : (
                members.map((member) => {
                  const active = has("USER", member.id);
                  return (
                    <li key={member.id}>
                      <button
                        type="button"
                        onClick={() =>
                          toggle({ type: "USER", id: member.id, name: member.name, avatarUrl: member.avatarUrl })
                        }
                        className={cn(
                          "flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm hover:bg-surface-3",
                          active && "bg-primary-soft",
                        )}
                      >
                        <img src={member.avatarUrl} alt="" className="size-7 rounded-full" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{member.name}</span>
                          <span className="block truncate text-xs text-faint">@{member.username}</span>
                        </span>
                        {active && <Check className="size-4 text-primary-hover" />}
                      </button>
                    </li>
                  );
                })
              ))}
          </ul>
          <p className="border-t border-border px-3 py-2 text-xs text-faint">
            {value.length} von {max} ausgewählt
          </p>
        </div>
      )}
    </div>
  );
}
