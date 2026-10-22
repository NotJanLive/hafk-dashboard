"use client";

import { ChevronsUpDown, History, House, type LucideIcon, Settings, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GuildIcon } from "@/components/ui/guild-icon";
import { MODULES } from "@/lib/modules";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon };

export function Sidebar({
  guild,
  setupCompleted,
}: {
  guild: { id: string; name: string; iconUrl: string | null };
  setupCompleted: boolean;
}) {
  const pathname = usePathname();
  const base = `/servers/${guild.id}`;
  const general: NavItem[] = setupCompleted
    ? [
        { href: base, label: "Übersicht", icon: House },
        { href: `${base}/settings`, label: "Einstellungen", icon: Settings },
        { href: `${base}/audit-log`, label: "Änderungsprotokoll", icon: History },
      ]
    : [{ href: `${base}/setup`, label: "Einrichtung", icon: Sparkles }];
  const isActive = (href: string) => (href === base ? pathname === base : pathname.startsWith(href));

  return (
    <>
      <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-[272px] shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
        <div className="p-4">
          <Link
            href="/servers"
            className="flex items-center gap-3 rounded-xl bg-surface p-2.5 ring-1 ring-border transition-colors hover:bg-surface-2"
            title="Server wechseln"
          >
            <GuildIcon name={guild.name} iconUrl={guild.iconUrl} size={36} />
            <span className="min-w-0 flex-1 truncate text-sm font-bold">{guild.name}</span>
            <ChevronsUpDown className="size-4 text-faint" />
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 pb-6" aria-label="Server-Navigation">
          <ul className="space-y-1">
            {general.map((item) => (
              <li key={item.href}>
                <NavLink item={item} active={isActive(item.href)} />
              </li>
            ))}
          </ul>

          <p className="mt-8 mb-2 px-3 text-xs font-bold tracking-wide text-faint uppercase">Module</p>
          <ul className="space-y-1">
            {MODULES.map((module) => (
              <li key={module.id}>
                {module.available && setupCompleted ? (
                  <>
                    <NavLink
                      item={{ href: `${base}/${module.id}`, label: module.name, icon: module.icon }}
                      active={pathname.startsWith(`${base}/${module.id}`)}
                    />
                    {module.pages && pathname.startsWith(`${base}/${module.id}`) && (
                      <SubNav base={`${base}/${module.id}`} pages={module.pages} pathname={pathname} />
                    )}
                  </>
                ) : (
                  <span
                    aria-disabled
                    title={module.description}
                    className="flex h-10 cursor-not-allowed items-center gap-3 rounded-lg px-3 text-sm font-medium text-faint"
                  >
                    <module.icon className="size-[18px]" />
                    <span className="flex-1 truncate">{module.name}</span>
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-semibold">
                      {module.available ? "Setup" : "Bald"}
                    </span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <nav
        className="sticky top-16 z-10 flex gap-1 overflow-x-auto border-b border-border bg-bg/95 px-4 py-2 backdrop-blur lg:hidden"
        aria-label="Server-Navigation"
      >
        {general.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={cn(
              "flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-muted",
              isActive(item.href) && "bg-primary-soft text-text",
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

function SubNav({
  base,
  pages,
  pathname,
}: {
  base: string;
  pages: { path: string; label: string }[];
  pathname: string;
}) {
  const active = (path: string) =>
    path === "" ? pathname === base || pathname === `${base}/setup` : pathname.startsWith(base + path);
  return (
    <ul className="mt-1 mb-2 ml-[21px] space-y-0.5 border-l border-border-strong pl-3">
      {pages.map((page) => (
        <li key={page.path}>
          <Link
            href={base + page.path}
            aria-current={active(page.path) ? "page" : undefined}
            className={cn(
              "flex h-8 items-center rounded-md px-2.5 text-[13px] font-semibold text-faint transition-colors hover:bg-surface-2 hover:text-text",
              active(page.path) && "bg-surface-2 text-text",
            )}
          >
            {page.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-text",
        active && "bg-primary-soft text-text hover:bg-primary-soft",
      )}
    >
      <item.icon className={cn("size-[18px]", active && "text-primary-hover")} />
      {item.label}
    </Link>
  );
}
