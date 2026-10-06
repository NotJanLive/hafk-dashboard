import { FilePlus2, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/card";
import { botApi } from "@/lib/bot-api/client";
import { requireConfiguredGuild } from "@/lib/dal";
import { cn } from "@/lib/utils";
import { SentList, TemplateList } from "./embed-lists";

export const metadata: Metadata = { title: "Embeds" };

export default async function EmbedsPage(props: PageProps<"/servers/[guildId]/embeds">) {
  const { guildId } = await props.params;
  const { tab } = await props.searchParams;
  const { user, guild } = await requireConfiguredGuild(guildId);
  const showTemplates = tab === "templates";
  const [sent, templates] = await Promise.all([
    botApi.embeds.sent(guild.id, user.id),
    botApi.embeds.templates(guild.id, user.id),
  ]);
  const base = `/servers/${guild.id}/embeds`;

  return (
    <>
      <PageHeader
        title="Embeds"
        description="Gestalte eingebettete Nachrichten, speichere Vorlagen und bearbeite bereits gesendete Nachrichten."
        actions={
          <>
            <ButtonLink href={`${base}/templates/new`} variant="secondary">
              <FilePlus2 />
              Neue Vorlage
            </ButtonLink>
            <ButtonLink href={`${base}/new`}>
              <Plus />
              Neues Embed
            </ButtonLink>
          </>
        }
      />

      <nav className="mb-6 flex gap-1 border-b border-border" aria-label="Embed-Bereiche">
        {[
          { href: base, label: `Gesendete Nachrichten (${sent.length})`, active: !showTemplates },
          { href: `${base}?tab=templates`, label: `Vorlagen (${templates.length})`, active: showTemplates },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors",
              item.active ? "border-primary text-text" : "border-transparent text-muted hover:text-text",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {showTemplates ? (
        <TemplateList guildId={guild.id} templates={templates} />
      ) : (
        <SentList guildId={guild.id} messages={sent} />
      )}

      <p className="mt-6 text-sm text-faint">
        Tipp: Mit <code className="rounded bg-surface-2 px-1">/embed create</code> kannst du Embeds auch direkt in
        Discord anlegen.
      </p>
    </>
  );
}
