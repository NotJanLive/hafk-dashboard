import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/card";
import { botApi } from "@/lib/bot-api/client";
import { requireConfiguredGuild } from "@/lib/dal";
import { TicketSettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Ticket-Einstellungen" };

export default async function TicketSettingsPage(props: PageProps<"/servers/[guildId]/tickets/settings">) {
  const { guildId } = await props.params;
  const { user, guild } = await requireConfiguredGuild(guildId);
  const settings = await botApi.tickets.settings(guild.id, user.id);

  return (
    <>
      <PageHeader
        title="Einstellungen"
        description="Team, Transkripte und was beim Schließen eines Tickets passiert."
      />
      <TicketSettingsForm guildId={guild.id} channels={guild.channels} roles={guild.roles} settings={settings} />
    </>
  );
}
