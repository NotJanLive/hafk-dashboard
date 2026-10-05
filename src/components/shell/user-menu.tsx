"use client";

import { ChevronDown, LayoutGrid, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { SessionUser } from "@/lib/auth/session";
import { userAvatarUrl } from "@/lib/discord/cdn";

export function UserMenu({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !ref.current?.contains(event.target as Node)) {
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

  const name = user.globalName ?? user.username;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex items-center gap-2.5 rounded-full py-1 pr-3 pl-1 transition-colors hover:bg-surface-2"
      >
        <Image
          src={userAvatarUrl(user.id, user.avatar, 64)}
          alt=""
          width={32}
          height={32}
          className="size-8 rounded-full bg-surface-3"
        />
        <span className="hidden max-w-40 truncate text-sm font-semibold sm:block">{name}</span>
        <ChevronDown className="size-4 text-faint" />
      </button>

      {open && (
        <div className="absolute top-full right-0 z-30 mt-2 w-56 overflow-hidden rounded-xl border border-border-strong bg-surface-2 p-1.5 shadow-2xl shadow-black/50">
          <p className="truncate px-3 pt-2 pb-2.5 text-xs text-faint">Angemeldet als @{user.username}</p>
          <Link
            href="/servers"
            onClick={() => setOpen(false)}
            className="flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm font-medium hover:bg-surface-3"
          >
            <LayoutGrid className="size-4 text-muted" />
            Meine Server
          </Link>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-sm font-medium text-danger hover:bg-danger-soft"
            >
              <LogOut className="size-4" />
              Abmelden
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
