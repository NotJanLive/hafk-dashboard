import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/card";
import { botApi } from "@/lib/bot-api/client";
import { requireConfiguredGuild } from "@/lib/dal";
import { BlacklistManager } from "./blacklist-manager";

export const metadata: Metadata = { title: "Ticket-Sperren" };

export default async function BlacklistPage(props: PageProps<"/servers/[guildId]/tickets/blacklist">) {
  const { guildId } = await props.params;
  const { user, guild } = await requireConfiguredGuild(guildId);
  const entries = await botApi.tickets.blacklist(guild.id, user.id);

  return (
    <>
      <PageHeader
        title="Sperren"
        description="Personen oder Rollen vom Ticketsystem ausschließen, dauerhaft oder auf Zeit."
      />
      <BlacklistManager guildId={guild.id} roles={guild.roles} entries={entries} />
    </>
  );
}
