import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/card";
import { botApi } from "@/lib/bot-api/client";
import { requireConfiguredGuild } from "@/lib/dal";
import { TicketWizard } from "./ticket-wizard";

export const metadata: Metadata = { title: "Ticket-Assistent" };

export default async function TicketSetupPage(props: PageProps<"/servers/[guildId]/tickets/setup">) {
  const { guildId } = await props.params;
  const { user, guild } = await requireConfiguredGuild(guildId);
  const [categories, emojis] = await Promise.all([
    botApi.tickets.categories(guild.id, user.id),
    botApi.emojis(guild.id, user.id).catch(() => []),
  ]);

  return (
    <>
      <PageHeader
        title="Ticket-Assistent"
        description="In fünf kurzen Schritten zum fertigen Ticketsystem. Alles bleibt danach frei anpassbar."
      />
      <TicketWizard
        guildId={guild.id}
        channels={guild.channels}
        roles={guild.roles}
        emojis={emojis}
        guildInfo={{ name: guild.name, iconUrl: guild.iconUrl }}
        existingCategories={categories.length}
      />
    </>
  );
}
