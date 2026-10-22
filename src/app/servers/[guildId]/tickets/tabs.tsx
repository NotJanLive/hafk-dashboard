"use client";

import { Ban, BarChart3, FolderKanban, LayoutPanelTop, Settings2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function TicketTabs({ guildId }: { guildId: string }) {
  const pathname = usePathname();
  const base = `/servers/${guildId}/tickets`;
  const tabs = [
    { href: base, label: "Übersicht", icon: BarChart3 },
    { href: `${base}/categories`, label: "Kategorien", icon: FolderKanban },
    { href: `${base}/panels`, label: "Panels", icon: LayoutPanelTop },
    { href: `${base}/settings`, label: "Einstellungen", icon: Settings2 },
    { href: `${base}/blacklist`, label: "Sperren", icon: Ban },
  ];
  const active = (href: string) => (href === base ? pathname === base : pathname.startsWith(href));

  return (
    <nav
      className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1 lg:hidden"
      aria-label="Tickets"
    >
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={active(tab.href) ? "page" : undefined}
          className={cn(
            "flex h-9 shrink-0 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-text",
            active(tab.href) && "bg-primary-soft text-text hover:bg-primary-soft",
          )}
        >
          <tab.icon className={cn("size-4", active(tab.href) && "text-primary-hover")} />
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
