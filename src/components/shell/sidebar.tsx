"use client";

import { ArrowLeftRight, LayoutGrid, ScrollText, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { Logo } from "@/components/brand/logo";
import { GuildIcon } from "@/components/ui/guild-icon";
import { Led, type LedState } from "@/components/ui/led";
import { MODULES } from "@/lib/modules";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: ComponentType<{ className?: string }>; led?: LedState };

export function Sidebar({
  guild,
  setupCompleted,
}: {
  guild: { id: string; name: string; iconUrl: string | null };
  setupCompleted: boolean;
}) {
  const pathname = usePathname();
  const base = `/servers/${guild.id}`;
  const general: NavItem[] = [
    { href: base, label: "Übersicht", icon: LayoutGrid },
    {
      href: `${base}/settings`,
      label: "Einstellungen",
      icon: SlidersHorizontal,
      led: setupCompleted ? undefined : "warn",
    },
    { href: `${base}/audit-log`, label: "Audit-Log", icon: ScrollText },
  ];
  const isActive = (href: string) => (href === base ? pathname === base : pathname.startsWith(href));

  return (
    <>
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface md:flex">
        <div className="flex h-14 items-center border-b border-line px-5">
          <Link href="/servers" aria-label="Zur Serverauswahl">
            <Logo />
          </Link>
        </div>

        <Link
          href="/servers"
          className="group mx-3 mt-3 flex items-center gap-3 rounded-lg border border-line bg-surface-2 p-2.5 transition-colors hover:border-line-strong"
        >
          <GuildIcon name={guild.name} iconUrl={guild.iconUrl} size={32} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{guild.name}</span>
            <span className="block font-mono text-[10.5px] text-faint">{guild.id}</span>
          </span>
          <ArrowLeftRight className="size-3.5 text-faint group-hover:text-text" />
        </Link>

        <nav className="mt-5 flex-1 overflow-y-auto px-3 pb-6" aria-label="Server-Navigation">
          <p className="label px-2.5 pb-2">Allgemein</p>
          <ul className="space-y-0.5">
            {general.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "relative flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm text-muted transition-colors hover:bg-surface-3 hover:text-text",
                    isActive(item.href) &&
                      "bg-surface-3 font-semibold text-text before:absolute before:top-2 before:bottom-2 before:-left-3 before:w-[3px] before:rounded-r before:bg-accent",
                  )}
                >
                  <item.icon className="size-4" />
                  <span className="flex-1">{item.label}</span>
                  {item.led && <Led state={item.led} pulse={false} label="Setup offen" />}
                </Link>
              </li>
            ))}
          </ul>

          <p className="label mt-7 px-2.5 pb-2">Module</p>
          <ul className="space-y-0.5">
            {MODULES.map((module) => (
              <li key={module.id}>
                <span
                  aria-disabled
                  className="flex h-9 cursor-not-allowed items-center gap-3 rounded-lg px-2.5 text-sm text-faint"
                  title={module.description}
                >
                  <Led state="off" />
                  <span className="flex-1 truncate">{module.name}</span>
                  <span className="font-mono text-[10px] uppercase">bald</span>
                </span>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Compact navigation for small screens. */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-surface/95 backdrop-blur md:hidden"
        aria-label="Server-Navigation"
      >
        {general.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={cn(
              "flex h-14 flex-1 flex-col items-center justify-center gap-1 text-[11px] text-muted",
              isActive(item.href) && "text-accent",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
